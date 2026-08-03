/* CDP functional test — mobile viewport, fresh localStorage */
const PORT = 9223;
const URL = process.argv[2] || 'http://localhost:8899/index.html';
const results = [];
const ok = (cond, label) => { results.push([cond ? 'PASS' : 'FAIL', label]); if (!cond) console.error('FAIL:', label); };
const J = JSON.stringify; // embed JS values safely in eval expressions

const CPP = 'int main() {\n  int x = 1 < 2;\n  if (x > 0) return 0;\n  return x < 5 ? 1 : 2;\n}\n';
const BADJS = 'function f() {\n  return "oops;\n}';

async function main() {
  const tabs = await (await fetch(`http://127.0.0.1:${PORT}/json/new?${encodeURIComponent(URL)}`, { method: 'PUT' })).json();
  const ws = new WebSocket(tabs.webSocketDebuggerUrl);
  let id = 0;
  const pending = new Map();
  const consoleErrors = [];
  const send = (method, params = {}) => new Promise((resolve) => {
    const mid = ++id;
    pending.set(mid, resolve);
    ws.send(JSON.stringify({ id: mid, method, params }));
  });
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
    else if (msg.method === 'Runtime.exceptionThrown') consoleErrors.push('EXCEPTION: ' + (msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text));
    else if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') consoleErrors.push('CONSOLE.ERROR: ' + (msg.params.args || []).map(a => a.value || a.description).join(' '));
  };
  await new Promise((r) => { ws.onopen = r; });
  await send('Runtime.enable');
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  const ev = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
    if (r.result && r.result.exceptionDetails) { consoleErrors.push('EVAL EXCEPTION: ' + JSON.stringify(r.result.exceptionDetails).slice(0, 200)); return undefined; }
    return r.result?.result?.value;
  };
  const wait = (ms) => new Promise(r => setTimeout(r, ms));
  const waitFor = async (expr, ms = 5000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await ev(expr)) return true; await wait(120); } return false; };

  await send('Page.navigate', { url: URL });
  await waitFor(`document.readyState === 'complete' && !!window.__POCKETIDE`, 8000);
  await wait(400);
  await ev(`localStorage.clear(); location.reload();`);
  await waitFor(`document.readyState === 'complete' && !!window.__POCKETIDE`, 8000);
  await wait(600);

  // 1. Welcome + empty project
  ok(await ev(`!!document.querySelector('#editor-welcome')`), 'welcome screen present');
  ok(await ev(`document.getElementById('btn-welcome-new-file') !== null`), 'Create New File button present');
  ok(await ev(`document.getElementById('btn-welcome-import') !== null`), 'Import Files button present');
  ok(await ev(`document.querySelectorAll('#file-tree .tree-item').length === 0`), 'starts with empty project (no sample files)');

  // 2. Create main.cpp
  await ev(`document.getElementById('btn-welcome-new-file').click()`);
  ok(await waitFor(`document.getElementById('modal-overlay').style.display === 'flex'`), 'new-file modal opens');
  ok(await ev(`document.querySelectorAll('.modal-chip').length >= 10`), 'extension chips shown');
  await ev(`document.getElementById('modal-input').value = 'main.cpp'; document.getElementById('modal-confirm').click();`);
  ok(await waitFor(`document.querySelectorAll('#tabs-container .tab').length === 1`), 'main.cpp tab opened');
  await wait(300);
  ok(await ev(`document.getElementById('status-language').textContent === 'C++'`), 'status bar shows C++');

  // 3. Type < > — no corruption, roundtrip preserved
  const setCode = (code) => `(() => { const e = window.__POCKETIDE.editor; e.textarea.focus(); e.textarea.value = ${J(code)}; e.textarea.setSelectionRange(e.textarea.value.length, e.textarea.value.length); e.textarea.dispatchEvent(new Event('input', { bubbles: true })); })()`;
  await ev(setCode(CPP));
  await wait(250);
  const hl = await ev(`document.querySelector('.editor-highlight-layer').innerHTML`);
  ok(!/&lt;span|&lt;\/span/.test(hl || ''), 'no span corruption after typing < >');
  const round = await ev(`(() => { const h = document.querySelector('.editor-highlight-layer'); const s = document.createElement('div'); s.innerHTML = h.innerHTML.replace(/<[^>]*>/g,'').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&'); const v = document.querySelector('.editor-textarea').value; return s.textContent === v + ${J('\n')}; })()`);
  ok(round, 'highlight layer matches source (roundtrip)');
  ok((hl || '').includes('hl-keyword'), 'C++ keywords highlighted');
  ok((hl || '').includes('hl-number'), 'numbers highlighted');

  // 4. Autocomplete in a .js file
  await ev(`window.__POCKETIDE.editor.setFilename('demo.js')`);
  await ev(setCode('cons'));
  ok(await waitFor(`document.querySelector('.ac-box') && document.querySelector('.ac-box').style.display === 'block'`), 'autocomplete dropdown opens');
  const acItems = await ev(`Array.from(document.querySelectorAll('.ac-item .ac-label')).map(x => x.textContent).join(',')`);
  ok(acItems.includes('console.log') && !acItems.startsWith('cons,'), 'dropdown suggests console.log (no self-word): ' + acItems);
  await ev(`document.querySelector('.editor-textarea').dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }))`);
  await wait(120);
  await ev(`document.querySelector('.editor-textarea').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }))`);
  await wait(200);
  const afterAccept = await ev(`window.__POCKETIDE.editor.getValue()`);
  ok(afterAccept === 'console.log', 'Enter accepts suggestion: ' + afterAccept);

  // 5. Problem detector
  await ev(setCode(BADJS));
  ok(await waitFor(`document.getElementById('status-problems').style.display === 'inline-flex'`, 5000), 'problems badge appears');
  const count = await ev(`document.getElementById('status-problems').querySelector('.sb-count').textContent`);
  ok(parseInt(count) > 0, 'problems count > 0 (' + count + ')');
  await ev(`document.getElementById('status-problems').click()`);
  await wait(300);
  ok(await ev(`document.getElementById('sidebar-view-problems').classList.contains('active')`), 'problems sidebar view activates');
  const probCount = await ev(`document.querySelectorAll('#problems-list .problem-item').length`);
  ok(parseInt(probCount) > 0, 'problems listed (' + probCount + ')');
  ok(await ev(`document.querySelector('#problems-list .problem-item.error') !== null`), 'has an error-severity problem');

  // 6. Git
  await ev(`document.querySelector('.sidebar-tab[data-view="git"]').click()`);
  await wait(700);
  const branch = await ev(`document.getElementById('git-branch-name').textContent`);
  ok(branch === 'main', 'git branch shows main: ' + branch);
  const changes = await ev(`Array.from(document.querySelectorAll('#git-changes .gc-path')).map(x => x.textContent).join(',')`);
  ok(changes.includes('main.cpp'), 'git changes include main.cpp: ' + changes);
  await ev(`document.getElementById('git-commit-message').value = 'first commit'; document.getElementById('git-commit-btn').click()`);
  await wait(1000);
  const logMsg = await ev(`(document.querySelector('#git-log .gc-msg') || {}).textContent`);
  ok(logMsg === 'first commit', 'commit appears in history: ' + logMsg);
  const changesAfter = await ev(`document.querySelectorAll('#git-changes .git-change').length`);
  ok(changesAfter === 0, 'changes cleared after commit');

  // 7. Mobile action bar + tabs
  ok(await ev(`getComputedStyle(document.getElementById('mobile-action-bar')).display !== 'none'`), 'mobile action bar visible');
  ok(await ev(`!!document.getElementById('btn-mab-save')`), 'mobile Save button present');
  ok(await ev(`getComputedStyle(document.querySelector('.sidebar-tab[data-view="explorer"]')).display !== 'none'`), 'sidebar tabs visible');

  // 8. Theme toggle
  const before = await ev(`document.documentElement.getAttribute('data-theme')`);
  await ev(`document.getElementById('btn-theme-toggle').click()`);
  const after = await ev(`document.documentElement.getAttribute('data-theme')`);
  ok(before !== after, 'theme toggle works');

  console.log('--- console errors (if any) ---');
  consoleErrors.forEach(e => console.log(e));
  ok(consoleErrors.length === 0, 'zero console errors (' + consoleErrors.length + ')');

  console.log('\n==== RESULTS ====');
  results.forEach(([s, l]) => console.log(s.padEnd(5), l));
  const fails = results.filter(r => r[0] === 'FAIL').length;
  console.log(`\n${results.length - fails}/${results.length} passed`);
  ws.close();
  process.exit(fails ? 1 : 0);
}
main().catch(e => { console.error('TEST HARNESS ERROR:', e); process.exit(2); });
