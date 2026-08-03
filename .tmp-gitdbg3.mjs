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
  await wait(900); // auto-init + refresh

  const log = await ev(`(async () => {
    const raw = window.__POCKETIDE.gitPanel.git.rawFs;
    const calls = [];
    const mk = (name, fn) => async (...a) => {
      const p = String(a[0]);
      let res, err;
      try { res = await fn.apply(raw, a); }
      catch (e) { err = String(e && e.message ? e.message : e); }
      let info = '';
      if (name === 'readFile' && res) info = 'len=' + (typeof res === 'string' ? res.length : res.length) + ' head=' + JSON.stringify(String(res).slice(0, 20));
      if (name === 'writeFile') { const c = a[1]; info = 'len=' + (typeof c === 'string' ? c.length : c.length) + ' head=' + JSON.stringify(String(c).slice(0, 20)); }
      if (name === 'readdir') info = 'names=' + JSON.stringify(res);
      if (name === 'stat') info = 'type=' + (res && res.type);
      calls.push(name + ' ' + p + (err ? ' ERR:' + err : ' ' + info));
      return res;
    };
    raw._log = calls;
    raw.readFile = mk('readFile', raw.readFile.bind(raw));
    raw.writeFile = mk('writeFile', raw.writeFile.bind(raw));
    raw.readdir = mk('readdir', raw.readdir.bind(raw));
    raw.stat = mk('stat', raw.stat.bind(raw));
    raw.unlink = mk('unlink', raw.unlink.bind(raw));
    const g = window.__POCKETIDE.gitPanel.git;
    try { await window.git.statusMatrix({ fs: g.fs, dir: '/' }); } catch (e) { calls.push('ERROR: ' + String(e && e.message ? e.message : e)); }
    return JSON.stringify(calls);
  })()`);
  console.log(log);
  ws.close();
  process.exit(0);
}
main().catch(e => { console.error('HARNESS ERROR:', e); process.exit(2); });
