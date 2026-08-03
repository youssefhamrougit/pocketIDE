import fs from 'fs';
let s = fs.readFileSync('.tmp-cdptest2.mjs', 'utf8');
const needle = 'json/new?' + '${encodeURIComponent(URL)}`' + ')).json();';
const repl = 'json/new?' + '${encodeURIComponent(URL)}`' + ', { method: \'PUT\' })).json();';
if (!s.includes(needle)) { console.error('needle not found'); process.exit(1); }
s = s.replace(needle, repl);
fs.writeFileSync('.tmp-cdptest2.mjs', s);
console.log('patched');
