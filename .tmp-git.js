// ============================================================
// Git Integration — fully offline via vendored isomorphic-git.
//
// GitFS maps the project's workspace files onto the SAME
// localStorage the editor uses, so git and the file tree always
// agree. The .git/ metadata lives in its own namespace.
// ============================================================

const GitFS = class GitFS {
  constructor(projectId) {
    this.projectId = projectId || 'default';
    this.gitNs = 'pocketide_git_' + this.projectId + '_';
    this.fileNs = 'pocketide_files_' + this.projectId + '_';
  }

  _rel(path) {
    return (path || '').replace(/^\/+/, '').replace(/\/+/g, '/');
  }

  _key(path) {
    const p = this._rel(path);
    if (p === '.git' || p.startsWith('.git/')) return this.gitNs + p;
    return this.fileNs + p;
  }

  _isGitKey(key) { return key.startsWith(this.gitNs); }

  _bytesToB64(bytes) {
    let bin = '';
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    }
    return btoa(bin);
  }

  _b64ToBytes(b64) {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }

  async readFile(path, opts) {
    const key = this._key(path);
    const raw = localStorage.getItem(key);
    if (raw === null) {
      const err = new Error('ENOENT: no such file or directory, open ' + path);
      err.code = 'ENOENT';
      throw err;
    }
    let bytes;
    if (this._isGitKey(key)) {
      bytes = this._b64ToBytes(raw);
    } else {
      try { bytes = new TextEncoder().encode(JSON.parse(raw).content || ''); }
      catch { bytes = new Uint8Array(0); }
    }
    if (opts && opts.encoding === 'utf8') return new TextDecoder().decode(bytes);
    return bytes;
  }

  async writeFile(path, contents, opts) {
    const key = this._key(path);
    const bytes = typeof contents === 'string'
      ? new TextEncoder().encode(contents)
      : new Uint8Array(contents && contents.buffer ? contents : contents);
    if (this._isGitKey(key)) {
      localStorage.setItem(key, this._bytesToB64(bytes));
    } else {
      const data = { content: new TextDecoder().decode(bytes), path: this._rel(path), updatedAt: new Date().toISOString() };
      localStorage.setItem(key, JSON.stringify(data));
    }
  }

  async unlink(path) {
    localStorage.removeItem(this._key(path));
  }

  async mkdir() { /* dirs are implicit */ }

  async rmdir(path) {
    const key = this._key(path);
    const toRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(key + '/')) toRemove.push(k);
    }
    toRemove.forEach(k => localStorage.removeItem(k));
  }

  async stat(path) {
    const key = this._key(path);
    if (localStorage.getItem(key) !== null) {
      return { type: 'file', mode: 0o100644, size: this._sizeOf(key), ino: 0, mtimeMs: Date.now(), ctimeMs: Date.now(), uid: 0, gid: 0, dev: 0 };
    }
    if (this._hasChildren(key)) {
      return { type: 'dir', mode: 0o040000, size: 0, ino: 0, mtimeMs: Date.now(), ctimeMs: Date.now(), uid: 0, gid: 0, dev: 0 };
    }
    const err = new Error('ENOENT: no such file or directory, stat ' + path);
    err.code = 'ENOENT';
    throw err;
  }

  async lstat(path) { return this.stat(path); }

  async readdir(path) {
    const key = this._key(path);
    const prefix = key === '' ? '' : key + '/';
    const names = new Set();
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k) continue;
      if (!k.startsWith(this.fileNs) && !k.startsWith(this.gitNs)) continue;
      let rel = k.substring(k.startsWith(this.gitNs) ? this.gitNs.length : this.fileNs.length);
      if (rel === '') continue;
      if (path === '/' || path === '' || key === '') {
        // top level: first path segment (plus '.git' if git metadata exists)
        const seg = rel.split('/')[0];
        if (seg) names.add(seg);
        if (k.startsWith(this.gitNs)) names.add('.git');
      } else if (rel.startsWith(prefix)) {
        const rest = rel.substring(prefix.length);
        const seg = rest.split('/')[0];
        if (seg) names.add(seg);
      } else if (rel.startsWith(key + '/')) {
        const rest = rel.substring(key.length + 1);
        const seg = rest.split('/')[0];
        if (seg) names.add(seg);
      }
    }
    // a directory must exist even if empty
    if (names.size === 0 && key !== '' && key !== '.git' && !this._hasChildren(key)) {
      const err = new Error('ENOENT: no such file or directory, scandir ' + path);
      err.code = 'ENOENT';
      throw err;
    }
    return Array.from(names).sort();
  }

  _hasChildren(key) {
    const prefix = key === '' ? '' : key + '/';
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(prefix)) return true;
    }
    return false;
  }

  _sizeOf(key) {
    const raw = localStorage.getItem(key);
    if (!raw) return 0;
    if (this._isGitKey(key)) return this._b64ToBytes(raw).length;
    try { return new TextEncoder().encode(JSON.parse(raw).content || '').length; }
    catch { return raw.length; }
  }

  readlink() { const e = new Error('ENOSYS'); e.code = 'ENOSYS'; throw e; }
  symlink() { const e = new Error('ENOSYS'); e.code = 'ENOSYS'; throw e; }
};

class GitIntegration {
  constructor(projectId) {
    this.projectId = projectId || 'default';
    this.dir = '/';
    this.rawFs = new GitFS(this.projectId);
    this.fs = { promises: this.rawFs };
    this.initialized = false;
    this.author = { name: 'PocketIDE User', email: 'user@pocketide.local' };
  }

  async isRepo() {
    try { await this.rawFs.stat('/.git'); return true; }
    catch { return false; }
  }

  async initRepo() {
    await window.git.init({ fs: this.fs, dir: this.dir, defaultBranch: 'main' });
    this.initialized = true;
  }

  async getStatus() {
    if (!this.initialized) return [];
    try {
      const matrix = await window.git.statusMatrix({ fs: this.fs, dir: this.dir });
      return this.parseStatusMatrix(matrix);
    } catch (e) { console.warn('git status failed:', e); return []; }
  }

  parseStatusMatrix(matrix) {
    const items = [];
    for (const row of matrix) {
      const filepath = row[0];
      if (filepath.startsWith('.git/')) continue;
      const head = row[1], workdir = row[2], stage = row[3];
      let status = null;
      if (head === 0 && workdir === 2 && stage === 0) status = '??';      // untracked
      else if (head === 0 && (stage === 2 || workdir === 2)) status = 'A'; // added/staged new
      else if (workdir === 3 || (head !== 0 && workdir === 0 && stage === 0)) status = 'D';
      else if (head !== 0 && workdir !== head) status = 'M';
      else if (stage === 1 && workdir === 0) status = 'M';                // staged modification
      if (status) items.push({ path: filepath, status });
    }
    return items;
  }

  async stageAll() {
    const matrix = await window.git.statusMatrix({ fs: this.fs, dir: this.dir });
    for (const row of matrix) {
      const filepath = row[0];
      if (filepath.startsWith('.git/')) continue;
      try { await window.git.add({ fs: this.fs, dir: this.dir, filepath }); }
      catch (e) { console.warn('git add failed:', filepath, e); }
    }
  }

  async commit(message) {
    return await window.git.commit({ fs: this.fs, dir: this.dir, message, author: this.author });
  }

  async getLog(depth = 8) {
    if (!this.initialized) return [];
    try {
      const commits = await window.git.log({ fs: this.fs, dir: this.dir, depth });
      return commits.map(c => ({
        oid: c.oid,
        message: String(c.commit.message).split('\n')[0],
        date: c.commit.committer.timestamp * 1000,
      }));
    } catch { return []; }
  }

  async currentBranch() {
    try { return await window.git.currentBranch({ fs: this.fs, dir: this.dir, fullname: false }); }
    catch { return null; }
  }
}

// ============================================================
// GitPanel — sidebar UI (branch, changes, commit, history)
// ============================================================

class GitPanel {
  constructor(app) {
    this.app = app;
    this.git = null;
    this.busy = false;
    this.branch = 'main';
  }

  init() {
    const ids = ['git-init-btn', 'git-commit-btn', 'git-stage-all', 'git-commit-message', 'git-branch-name', 'git-changes', 'git-log'];
    this.el = {};
    ids.forEach(id => { this.el[id] = document.getElementById(id); });
    const on = (id, fn) => { const el = this.el[id]; if (el) el.addEventListener('click', fn); };
    on('git-init-btn', () => this.initRepo());
    on('git-stage-all', () => this.stageAll());
    on('git-commit-btn', () => this.commit());
    const msg = this.el['git-commit-message'];
    if (msg) {
      msg.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this.commit();
      });
    }
    // Auto-init a repo when the local project has files — git should just work.
    this.ensureGit().then(async (git) => {
      if (!git.initialized && this.app.fileList.length > 0 && !this.app.isNativeMode()) {
        try { await git.initRepo(); this.app.gitInitialized = true; } catch (e) { /* stored in git.errors */ }
      }
      this.refresh();
    });
  }

  async ensureGit() {
    const projectId = this.app.currentProjectId;
    if (!this.git) {
      this.git = new GitIntegration(projectId);
      this.git.initialized = await this.git.isRepo();
    }
    return this.git;
  }

  async initRepo() {
    if (this.busy) return;
    this.busy = true;
    try {
      const git = await this.ensureGit();
      await git.initRepo();
      this.app.gitInitialized = true;
      await this.refresh();
    } catch (e) { console.warn('git init failed:', e); }
    this.busy = false;
  }

  async stageAll() {
    if (this.busy) return;
    this.busy = true;
    try {
      const git = await this.ensureGit();
      await git.stageAll();
      await this.refresh();
    } catch (e) { console.warn('git stage failed:', e); }
    this.busy = false;
  }

  async commit() {
    if (this.busy) return;
    const msg = this.el['git-commit-message'];
    const message = msg ? msg.value.trim() : '';
    if (!message) { if (msg) msg.focus(); return; }
    this.busy = true;
    try {
      const git = await this.ensureGit();
      if (!git.initialized) await git.initRepo();
      await git.stageAll();
      await git.commit(message);
      if (msg) msg.value = '';
      await this.refresh();
    } catch (e) { console.warn('git commit failed:', e); }
    this.busy = false;
  }

  async refresh() {
    if (this.busy) return;
    try {
      const git = await this.ensureGit();
      this.branch = (await git.currentBranch()) || 'main';
      const branchEl = this.el['git-branch-name'];
      if (branchEl) branchEl.textContent = git.initialized ? this.branch : 'no repo yet';
      const statusBranch = document.getElementById('status-branch');
      if (statusBranch) statusBranch.textContent = git.initialized ? this.branch : 'local';
      const initBtn = this.el['git-init-btn'];
      if (initBtn) initBtn.style.display = git.initialized ? 'none' : 'inline-block';
      if (!git.initialized) {
        this.renderChanges([]);
        this.renderLog([]);
        return;
      }
      const changes = await git.getStatus();
      const log = await git.getLog(8);
      this.renderChanges(changes);
      this.renderLog(log);
    } catch (e) { console.warn('git refresh failed:', e); }
  }

  renderChanges(changes) {
    const box = this.el['git-changes'];
    if (!box) return;
    if (!changes.length) {
      box.innerHTML = '<div class="git-empty">No changes — everything committed</div>';
      return;
    }
    const map = { 'A': 'A+', 'M': 'M~', 'D': 'D-', '??': '??' };
    const cls = { 'A': 'st-added', 'M': 'st-modified', 'D': 'st-deleted', '??': 'st-untracked' };
    box.innerHTML = '';
    changes.forEach(c => {
      const row = document.createElement('div');
      row.className = 'git-change';
      const st = document.createElement('span');
      st.className = 'gc-status ' + (cls[c.status] || '');
      st.textContent = map[c.status] || c.status;
      const p = document.createElement('span');
      p.className = 'gc-path';
      p.textContent = c.path;
      row.appendChild(st);
      row.appendChild(p);
      box.appendChild(row);
    });
  }

  renderLog(log) {
    const box = this.el['git-log'];
    if (!box) return;
    if (!log.length) {
      box.innerHTML = '<div class="git-empty">No commits yet</div>';
      return;
    }
    box.innerHTML = '';
    log.forEach(c => {
      const row = document.createElement('div');
      row.className = 'git-commit';
      const msg = document.createElement('span');
      msg.className = 'gc-msg';
      msg.textContent = c.message;
      const meta = document.createElement('span');
      meta.className = 'gc-meta';
      const d = new Date(c.date);
      const stamp = isNaN(d.getTime()) ? '' : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
      meta.textContent = (stamp ? stamp + ' · ' : '') + c.oid.slice(0, 7);
      row.appendChild(msg);
      row.appendChild(meta);
      box.appendChild(row);
    });
  }
}
