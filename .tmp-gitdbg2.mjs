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
  await wait(800);

  // dump git object contents
  const dump = await ev(`(() => {
    const out = [];
    const keys = Object.keys(localStorage).filter(k => k.startsWith('pocketide_git_')).sort();
    for (const k of keys) {
      const raw = localStorage.getItem(k);
      let info;
      try {
        const bin = atob(raw);
        info = { key: k.replace('pocketide_git_default_',''), len: bin.length, head: JSON.stringify(bin.slice(0, 40)) };
      } catch (e) { info = { key: k, len: raw.length, head: 'not-b64' }; }
      out.push(info);
    }
    return JSON.stringify(out);
  })()`);
  console.log('GIT OBJECTS:', dump);

  // manual wrap/unwrap roundtrip through the fs
  const rt = await ev(`(async () => {
    const fs = window.__POCKETIDE.gitPanel.git.fs.promises;
    const obj = window.Buffer.from('tree 7\\0' + '1234567');
    try {
      await fs.writeFile('/.git/objects/aa/bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', obj);
      const read = await fs.readFile('/.git/objects/aa/bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb');
      return JSON.stringify({ written: obj.length, readLen: read.length, eq: window.Buffer.compare(obj, read) === 0, readHead: JSON.stringify(read.slice(0, 12).toString()) });
    } catch (e) { return 'EXC: ' + String(e); }
  })()`);
  console.log('WRITE/READ ROUNDTRIP:', rt);
  ws.close();
  process.exit(0);
}
main().catch(e => { console.error('HARNESS ERROR:', e); process.exit(2); });
