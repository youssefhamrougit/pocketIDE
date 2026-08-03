import fs from 'fs';
let s = fs.readFileSync('.tmp-cdptest2.mjs', 'utf8');

// roundtrip: highlight layer has a trailing '\n'
let needle = "return s.textContent === document.querySelector('.editor-textarea').value; })()`";
let repl = "return s.textContent === document.querySelector('.editor-textarea').value + '\\n'; })()`";
if (!s.includes(needle)) { console.error('roundtrip needle missing'); process.exit(1); }
s = s.replace(needle, repl);

// Enter: navigate down once so console.log (not const) is selected
needle = "await ev(`document.querySelector('.editor-textarea').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }))`);";
repl = "await ev(`document.querySelector('.editor-textarea').dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }))`);\n  await wait(120);\n  await ev(`document.querySelector('.editor-textarea').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }))`);";
if (!s.includes(needle)) { console.error('enter needle missing'); process.exit(1); }
s = s.replace(needle, repl);

fs.writeFileSync('.tmp-cdptest2.mjs', s);
console.log('patched');
