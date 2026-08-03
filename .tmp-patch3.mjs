import fs from 'fs';
let s = fs.readFileSync('.tmp-cdptest2.mjs', 'utf8');

// 1. line 66: '\\\\n' (4 backslashes) -> '\\n' (2 backslashes) so the browser gets real newlines
s = s.split('\\\\n').join('\\n');

// 2. accept inserts the builtin label 'console.log' (no parens)
if (!s.includes("afterAccept.startsWith('console.log')")) {
  s = s.replace("afterAccept.startsWith('console.log(')", "afterAccept.startsWith('console.log')");
}

// 3. only main.cpp is persisted through the file system; check that
s = s.replace("changes.includes('demo.js')", "changes.includes('main.cpp')");

fs.writeFileSync('.tmp-cdptest2.mjs', s);
console.log('patched; remaining 4-backslash count:', (s.match(/\\\\n/g) || []).length);
