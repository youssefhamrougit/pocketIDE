const PORT = 9223;
const URL = 'http://localhost:8899/index.html';

async function main() {
  const tabs = await (await fetch(`http://127.0.0.1:${PORT}/json/new?${encodeURIComponent(URL)}`, { method: 'PUT' })).json();
  const ws = new WebSocket(tabs.webSocketDebuggerUrl);
  let id = 0;
  const pending = new Map();
  const send = (method, params = {}) => new Promise((resolve) => {
    const mid = ++id;
    pending.set(mid, resolve);
    ws.send(JSON.stringify({ id: mid, method, params }));
  });
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
  };
  await new Promise((r) => { ws.onopen = r; });
  await send('Runtime.enable');
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  const ev = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
    if (r.result?.result?.exceptionDetails) return 'EXC: ' + (r.result.result.exceptionDetails.exception?.description || r.result.result.exceptionDetails.text);
    return r.result?.result?.value;
  };
  const wait = (ms) => new Promise(r => setTimeout(r, ms));
  const waitFor = async (expr, ms = 6000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await ev(expr)) return true; await wait(120); } return false; };

  await send('Page.navigate', { url: URL });
  await waitFor(`document.readyState === 'complete' && !!window.__POCKETIDE`, 8000);
  await wait(400);
  await ev(`localStorage.clear(); location.reload();`);
  await waitFor(`document.readyState === 'complete' && !!window.__POCKETIDE`, 8000);
  await wait(500);
  await ev(`document.getElementById('btn-welcome-new-file').click()`);
  await waitFor(`document.getElementById('modal-overlay').style.display === 'flex'`);
  await ev(`document.getElementById('modal-input').value = 'main.cpp'; document.getElementById('modal-confirm').click();`);
  await wait(500);
  await ev(`document.querySelector('.sidebar-tab[data-view="git"]').click()`);
  await wait(900);

  const res = await ev(`(async () => {
    const g = window.__POCKETIDE.gitPanel.git;
    const out = {};
    try { await window.git.add({ fs: g.fs, dir: '/', filepath: 'main.cpp' }); out.add = 'ok'; }
    catch (e) { out.add = String(e && e.message || e); }
    try { const oid = await window.git.commit({ fs: g.fs, dir: '/', message: 'first', author: { name: 'PocketIDE User', email: 'user@pocketide.local' } }); out.commit = oid; }
    catch (e) { out.commit = String(e && e.message || e); }
    try { out.log = await window.git.log({ fs: g.fs, dir: '/', depth: 5 }); } catch (e) { out.log = String(e); }
    out.keys = Object.keys(localStorage).filter(k => k.startsWith('pocketide_git_')).length;
    return JSON.stringify(out);
  })()`);
  console.log(res);
  ws.close();
  process.exit(0);
}
main().catch(e => { console.error('HARNESS ERROR:', e); process.exit(2); });
