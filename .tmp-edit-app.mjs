import fs from 'fs';

let a = fs.readFileSync('app.js', 'utf8');

const rep = (oldS, newS, label) => {
  if (!a.includes(oldS)) { console.error('NOT FOUND:', label); process.exit(1); }
  a = a.replace(oldS, newS);
  console.log('ok:', label);
};

// 1. Constructor — extra state
rep(`    /** Clipboard for copy/cut/paste: { action: 'copy'|'cut', paths: string[] } */
    this._fileClipboard = null;
    this.init();`,
`    /** Clipboard for copy/cut/paste: { action: 'copy'|'cut', paths: string[] } */
    this._fileClipboard = null;
    /** Git panel + problem-detection state */
    this.gitPanel = null;
    this.gitInitialized = false;
    this.problems = [];
    this._problemsTimer = null;
    this.init();`, 'constructor state');

// 2. init() — wire git + problems
rep(`    this.setupKeyboardShortcuts();
    this.setupSidebarResize();
    this.setupUIControls();

    this.loadProjectFiles(this.currentProjectId);`,
`    this.setupKeyboardShortcuts();
    this.setupSidebarResize();
    this.setupUIControls();
    this.initGit();
    this.initProblemsUI();

    this.loadProjectFiles(this.currentProjectId);`, 'init hooks');

// 3. editor change — schedule problem check
rep(`    this.editor.on('change', () => {
      const tab = this.tabManager.getActiveTab();
      if (!tab) return;
      const currentContent = this.editor.getValue();
      this.fileContents.set(tab.path, currentContent);
      const saved = this.savedContents.get(tab.path) || '';
      this.tabManager.setTabDirty(tab.path, currentContent !== saved);
    });`,
`    this.editor.on('change', () => {
      const tab = this.tabManager.getActiveTab();
      if (!tab) return;
      const currentContent = this.editor.getValue();
      this.fileContents.set(tab.path, currentContent);
      const saved = this.savedContents.get(tab.path) || '';
      this.tabManager.setTabDirty(tab.path, currentContent !== saved);
      this._scheduleProblemCheck();
    });`, 'change -> problems');

// 4. saveFile — refresh git
rep(`      Storage.writeFile(this.currentProjectId, path, savedContent);
    }
    console.log(\`Saved: \${path}\`);`,
`      Storage.writeFile(this.currentProjectId, path, savedContent);
    }
    if (this.gitPanel) this.gitPanel.refresh();
    console.log(\`Saved: \${path}\`);`, 'save -> git refresh');

// 5. importFiles — refresh git
rep(`    Promise.all(tasks).then(() => {
      this._loadNativeFiles();
      this.loadProjectFiles(this.currentProjectId);
      if (quotaError) alert('Storage is full — some files could not be saved. Delete old files to free up space.');
      else if (imported > 0) console.log(\`Imported \${imported} of \${imported + skipped} file(s)\`);
    });`,
`    Promise.all(tasks).then(() => {
      this._loadNativeFiles();
      this.loadProjectFiles(this.currentProjectId);
      if (this.gitPanel) this.gitPanel.refresh();
      if (quotaError) alert('Storage is full — some files could not be saved. Delete old files to free up space.');
      else if (imported > 0) console.log(\`Imported \${imported} of \${imported + skipped} file(s)\`);
    });`, 'import -> git refresh');

// 6. closeMobileSidebar — append new methods
rep(`  closeMobileSidebar() {
    if (window.innerWidth > 768) return;
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    this.sidebarVisible = false;
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('visible');
    document.body.style.overflow = '';
  }`,
`  closeMobileSidebar() {
    if (window.innerWidth > 768) return;
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    this.sidebarVisible = false;
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('visible');
    document.body.style.overflow = '';
  }

  // --- Git ---
  initGit() {
    if (typeof window.git === 'undefined') return;
    this.gitPanel = new GitPanel(this);
    this.gitPanel.init();
  }

  // --- Problems ---
  initProblemsUI() {
    const badge = document.getElementById('status-problems');
    if (badge) badge.addEventListener('click', () => this.switchSidebarView('problems'));
    const mabProblems = document.getElementById('btn-mab-problems');
    if (mabProblems) mabProblems.addEventListener('click', () => this.switchSidebarView('problems'));
  }

  _scheduleProblemCheck() {
    clearTimeout(this._problemsTimer);
    this._problemsTimer = setTimeout(() => this._runProblemCheck(), 350);
  }

  _runProblemCheck() {
    const tab = this.tabManager.getActiveTab();
    if (!tab) { this.problems = []; this._renderProblems(); return; }
    this.problems = Problems.check(this.editor.getValue(), tab.path);
    this._renderProblems();
  }

  _renderProblems() {
    const count = this.problems.length;
    const badge = document.getElementById('status-problems');
    if (badge) {
      badge.style.display = count ? 'inline-flex' : 'none';
      const cnt = badge.querySelector('.sb-count');
      if (cnt) cnt.textContent = count;
      const dot = badge.querySelector('.sb-dot');
      if (dot) {
        dot.className = 'sb-dot ' + (this.problems.some(p => p.severity === 'error') ? 'err' : this.problems.some(p => p.severity === 'warning') ? 'warn' : 'info');
      }
    }
    const tabBadge = document.getElementById('sidebar-problems-count');
    if (tabBadge) {
      tabBadge.textContent = count;
      tabBadge.hidden = count === 0;
    }
    const list = document.getElementById('problems-list');
    if (!list) return;
    if (count === 0) {
      list.innerHTML = '<div class="problems-empty"><svg class="icon-svg"><use href="#i-check"/></svg> No problems found</div>';
      return;
    }
    list.innerHTML = '';
    this.problems.forEach(p => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'problem-item ' + p.severity;
      const sev = document.createElement('span');
      sev.className = 'problem-sev';
      const loc = document.createElement('span');
      loc.className = 'problem-loc';
      loc.textContent = \`\${p.line}:\${p.col}\`;
      const msg = document.createElement('span');
      msg.className = 'problem-msg';
      msg.textContent = p.message;
      item.appendChild(sev);
      item.appendChild(loc);
      item.appendChild(msg);
      item.addEventListener('click', () => {
        if (this.editor) this.editor.setCursor(p.line, Math.max(1, p.col));
        this.closeMobileSidebar();
        if (this.editor) this.editor.focus();
      });
      list.appendChild(item);
    });
  }

  // --- Sidebar views (Files / Git / Problems) ---
  switchSidebarView(view) {
    const tabs = document.querySelectorAll('.sidebar-tab');
    const views = document.querySelectorAll('.sidebar-view');
    tabs.forEach(t => t.classList.toggle('active', t.dataset.view === view));
    views.forEach(v => v.classList.toggle('active', v.id === 'sidebar-view-' + view));
    if (window.innerWidth <= 768) {
      this.sidebarVisible = true;
      const sidebar = document.getElementById('sidebar');
      const overlay = document.getElementById('sidebar-overlay');
      if (sidebar) sidebar.classList.add('open');
      if (overlay) overlay.classList.add('visible');
      document.body.style.overflow = 'hidden';
    }
    if (view === 'git' && this.gitPanel) this.gitPanel.refresh();
    if (view === 'problems') this._renderProblems();
  }`, 'new methods');

// 7. bottom-sheet new-file — chips + placeholder
rep(`        case 'new-file':
          this.fileTree.showInputModal('New File', 'Enter file name:', '', (name) => {
            if (this.isNativeMode()) {
              this.fileSystem.writeFile(name, '').then(() => this._loadNativeFiles());
              this.openFile(name, '');
            } else {
              Storage.writeFile(this.currentProjectId, name, '');
              this.loadProjectFiles(this.currentProjectId);
              this.openFile(name, '');
            }
          });
          break;`,
`        case 'new-file':
          this.fileTree.showInputModal('New File', 'e.g. main.py, index.cpp', '', (name) => {
            if (this.isNativeMode()) {
              this.fileSystem.writeFile(name, '').then(() => this._loadNativeFiles());
              this.openFile(name, '');
            } else {
              Storage.writeFile(this.currentProjectId, name, '');
              this.loadProjectFiles(this.currentProjectId);
              this.openFile(name, '');
            }
          }, { chips: true });
          break;`, 'bottom-sheet chips');

// 8. setupUIControls — sidebar tabs + mobile action bar
rep(`    // Unsaved changes warning on beforeunload
    window.addEventListener('beforeunload', (e) => {`,
`    // Sidebar view tabs (Files / Git / Problems)
    const sidebarTabBar = document.getElementById('sidebar-tab-bar');
    if (sidebarTabBar) {
      sidebarTabBar.addEventListener('click', (e) => {
        const tab = e.target.closest('.sidebar-tab');
        if (tab) this.switchSidebarView(tab.dataset.view);
      });
    }

    // Mobile quick-action bar (touch buttons for the Ctrl+ shortcuts)
    const mabNew = document.getElementById('btn-mab-new');
    if (mabNew) {
      mabNew.addEventListener('click', () => {
        this.fileTree.showInputModal('New File', 'e.g. main.py, index.cpp', '', (name) => {
          if (this.isNativeMode()) {
            this.fileSystem.writeFile(name, '').then(() => this._loadNativeFiles());
            this.openFile(name, '');
          } else {
            Storage.writeFile(this.currentProjectId, name, '');
            this.loadProjectFiles(this.currentProjectId);
            this.openFile(name, '');
          }
        }, { chips: true });
      });
    }
    const mabSave = document.getElementById('btn-mab-save');
    if (mabSave) {
      mabSave.addEventListener('click', () => {
        const tab = this.tabManager.getActiveTab();
        if (tab) this.saveFile(tab.path, this.editor.getValue());
      });
    }
    const mabClose = document.getElementById('btn-mab-close');
    if (mabClose) {
      mabClose.addEventListener('click', () => {
        const tab = this.tabManager.getActiveTab();
        if (tab) this.tabManager.closeTab(tab.id);
      });
    }

    // Unsaved changes warning on beforeunload
    window.addEventListener('beforeunload', (e) => {`, 'tab bar + action bar');

// 9. Storage — empty default project (no sample files)
const sfStart = a.indexOf('      const sampleFiles = {');
const sfLine = `      Object.entries(sampleFiles).forEach(([path, content]) => this.writeFile('default', path, content));`;
const sfEnd = a.indexOf(sfLine);
if (sfStart === -1 || sfEnd === -1) { console.error('sampleFiles block not found'); process.exit(1); }
a = a.slice(0, sfStart) + a.slice(sfEnd + sfLine.length + 1);
rep(`description: 'A sample project to get started'`, `description: 'Start with a clean workspace'`, 'empty default project');

// 10. Storage — remove dead deleteProject + _removePrefix
rep(`  deleteProject(projectId) {
    const projects = this.listProjects().filter(p => p.id !== projectId);
    localStorage.setItem(this._key('projects'), JSON.stringify(projects));
    this._removePrefix(this._key(\`files_\${projectId}_\`));
  },

`, ``, 'remove deleteProject');
rep(`
  _removePrefix(prefix) {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) keys.push(key);
    }
    keys.forEach(k => localStorage.removeItem(k));
  },
`, ``, 'remove _removePrefix');

// 11. FileTree — remove dead setTree
rep(`  setTree(nodes) { this.nodes = nodes; this.render(); }
`, ``, 'remove setTree');

// 12. TextEditor — remove dead getSelection + replaceSelection
rep(`  getSelection() {
    const start = this.textarea.selectionStart;
    const end = this.textarea.selectionEnd;
    return this.textarea.value.substring(start, end);
  }

  replaceSelection(text) {
    const start = this.textarea.selectionStart;
    const end = this.textarea.selectionEnd;
    this.textarea.value = this.textarea.value.substring(0, start) + text + this.textarea.value.substring(end);
    this.textarea.selectionStart = this.textarea.selectionEnd = start + text.length;
    this.content = this.textarea.value;
    this._updateHighlight();
    this._updateLineNumbers();
    this._emit('change', this.content);
  }

`, ``, 'remove getSelection/replaceSelection');

// 13. TextEditor — create autocomplete box
rep(`    this._bindEvents();
    this._syncScroll();
    this._updateLineNumbers();
  }`,
`    this._bindEvents();
    this._syncScroll();
    this._updateLineNumbers();
    this.ac = new AutocompleteBox();
  }`, 'create ac box');

// 14. TextEditor — keydown autocomplete handling
rep(`    this.textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {`,
`    this.textarea.addEventListener('keydown', (e) => {
      if (this.ac && this.ac.isOpen()) {
        if (e.key === 'ArrowDown') { e.preventDefault(); this.ac.next(); return; }
        if (e.key === 'ArrowUp') { e.preventDefault(); this.ac.prev(); return; }
        if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); this.ac.accept(); return; }
        if (e.key === 'Escape') { this.ac.close(); return; }
      }
      if (e.key === 'Tab') {`, 'keydown ac');

// 15. TextEditor — input triggers autocomplete
rep(`    this.textarea.addEventListener('input', () => {
      this.content = this.textarea.value;
      this._updateHighlight();
      this._updateLineNumbers();
      this._emit('change', this.content);
    });`,
`    this.textarea.addEventListener('input', () => {
      this.content = this.textarea.value;
      this._updateHighlight();
      this._updateLineNumbers();
      this._emit('change', this.content);
      this._maybeAutocomplete();
    });`, 'input ac');

// 16. TextEditor — blur closes ac (delayed so tap completes)
rep(`    this.textarea.addEventListener('blur', () => {
      this.editorWrapper.classList.remove('focused');
    });`,
`    this.textarea.addEventListener('blur', () => {
      this.editorWrapper.classList.remove('focused');
      if (this.ac) setTimeout(() => this.ac.close(), 200);
    });`, 'blur ac');

// 17. TextEditor — setValue closes ac
rep(`  setValue(text) {
    text = text || '';
    if (this.textarea.value !== text) {`,
`  setValue(text) {
    text = text || '';
    if (this.ac) this.ac.close();
    if (this.textarea.value !== text) {`, 'setValue ac');

// 18. TextEditor — add doc-words + autocomplete methods after _updateLineNumbers
rep(`  setValue(text) {`, `  _collectDocWords() {
    const words = new Set();
    const re = /[A-Za-z_$][\\w$]*/g;
    let m;
    while ((m = re.exec(this.content))) words.add(m[0]);
    return words;
  }

  _maybeAutocomplete() {
    if (!this.ac) return;
    const ta = this.textarea;
    const pos = ta.selectionStart;
    const before = ta.value.slice(0, pos);
    const m = before.match(/[A-Za-z_$][\\w$]*$/);
    if (!m || m[0].length === 0) { this.ac.close(); return; }
    const prefix = m[0];
    const suggestions = Autocomplete.suggest(this.filename, prefix, this._collectDocWords());
    if (!suggestions.length) { this.ac.close(); return; }
    this.ac.show({ editor: this, prefix, suggestions });
  }

  setValue(text) {`, 'ac helper methods');

fs.writeFileSync('app.js', a);
console.log('ALL EDITS APPLIED');
