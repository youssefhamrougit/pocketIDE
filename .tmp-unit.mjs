import fs from 'fs';

const app = fs.readFileSync('app.js', 'utf8');
const marker = '// ============================================================\n// Custom Textarea Editor';
const idx = app.indexOf(marker);
if (idx === -1) { console.error('marker missing'); process.exit(1); }
const moduleCode = app.slice(0, idx);
eval(moduleCode + '\nglobalThis.__T = { LanguageDetector, SyntaxHighlighter, Autocomplete, AutocompleteBox, Problems };');
const { LanguageDetector, SyntaxHighlighter, Autocomplete, AutocompleteBox, Problems } = globalThis.__T;

let pass = 0, fail = 0;
const ok = (cond, label) => { if (cond) { pass++; } else { fail++; console.error('FAIL:', label); } };

// ---- invariant: highlight() output, when unescaped + tags stripped, equals the input ----
const strip = (html) => {
  return html
    .replace(/<[^>]*>/g, '')   // strip markup tags FIRST
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'");
};
const samples = {
  'test.js': `const a = 1 < 2 && x > y; // comment
function greet(name) { return \`Hello, \${name}!\`; }
const b = "a < b > c";`,
  'test.cpp': `#include <iostream>
int main() { std::cout << "hi" << std::endl; return 0; }`,
  'test.py': `def greet(name):
    print(f"Hello, {name}!")  # comment
if x > 1 and y < 2:
    pass`,
  'test.html': `<!DOCTYPE html>
<!-- comment with <div> inside -->
<div class="box" data-x="1">text <span>hi</span></div>`,
  'test.css': `.btn { color: #ff0000; background: url('x.png'); }
@media (max-width: 768px) { .btn { display: none; } }`,
  'test.sql': `SELECT * FROM users WHERE age > 18 AND name = 'bob'; -- comment`,
  'test.json': `{"name": "x < y", "n": 1, "ok": true}`,
  'test.md': `# Title
- item one
**bold** and \`code\``,
  'test.rs': `fn main() { let x = 1; println!("x = {}", x); }`,
  'test.go': `package main
import "fmt"
func main() { fmt.Println(1 < 2) }`,
  'test.sh': `#!/bin/bash
echo "hello < world"`,
  'test.yml': `name: test
count: 3`,
  'test.kt': `fun main() { val x = 1 < 2; println(x) }`,
  'test.swift': `let x = 1
if x < 2 { print("ok") }`,
  'test.dart': `void main() { var x = 1 < 2; print(x); }`,
  'test.php': `<?php $x = 1 < 2; echo $x; ?>`,
  'test.rb': `x = 1
if x < 2
  puts "ok"
end`,
  'test.java': `public class T { public static void main(String[] a) { int x = 1 < 2 ? 1 : 0; } }`,
  'test.cs': `class T { static void Main() { int x = 1 < 2 ? 1 : 0; } }`,
  'test.vue': `<template><div class="a">hi</div></template>`,
  'test.lua': `local x = 1 < 2`,
  'test.txt': `plain < text > with & stuff`,
};
for (const [file, code] of Object.entries(samples)) {
  const lang = LanguageDetector.detect(file).name;
  const out = SyntaxHighlighter.highlight(code, file);
  const back = strip(out);
  ok(back === code, `${file} (${lang}) roundtrip preserved`);
  ok(!/<span class="hl-[^"]*">[^<]*<span/.test(out), `${file} no nested spans`);
  if (!['HTML', 'XML', 'SVG', 'Vue'].includes(lang)) ok(!out.includes('&lt;span'), `${file} no escaped-span corruption`);
}

// ---- highlighting specifics ----
const jsOut = SyntaxHighlighter.highlight('const a = 1 < 2;', 'a.js');
ok(jsOut.includes('hl-keyword') && jsOut.includes('hl-number'), 'JS keyword+number tokens');
ok(jsOut.includes('&lt;'), 'JS < escaped');
const cppOut = SyntaxHighlighter.highlight('#include <iostream>\nint main(){ std::cout << 1; }', 'a.cpp');
ok(cppOut.includes('hl-keyword'), 'C++ preprocessor token');
ok(cppOut.includes('hl-type'), 'C++ std/cout type token');

// ---- Problems ----
const p1 = Problems.check('function f() { return;', 'a.js');
ok(p1.some(p => p.severity === 'warning' && /Unclosed '\{'/.test(p.message)), 'JS unclosed brace');
const p2 = Problems.check('const s = "abc;', 'a.js');
ok(p2.some(p => p.severity === 'error' && /Unterminated string/.test(p.message)), 'JS unterminated string');
const p3 = Problems.check('def foo()\n    pass', 'a.py');
ok(p3.some(p => /missing a trailing ':'/.test(p.message)), 'Python missing colon');
const p4 = Problems.check('{"a": 1,}', 'a.json');
ok(p4.some(p => p.severity === 'error' && /Invalid JSON/.test(p.message)), 'JSON parse error');
const p5 = Problems.check('<div><span></div>', 'a.html');
ok(p5.some(p => /does not match/.test(p.message)), 'HTML tag mismatch');
const p6 = Problems.check('const x = 1; // fine', 'a.js');
ok(p6.length === 0, 'clean JS has no problems');

// ---- Autocomplete ----
const ac1 = Autocomplete.suggest('a.js', 'cons', new Set(['conspiracy']));
ok(ac1.some(s => s.label === 'console.log'), 'JS suggest console.log');
const ac2 = Autocomplete.suggest('a.cpp', 'mai', new Set());
ok(ac2.some(s => s.label === 'main'), 'C++ suggest main');
const ac3 = Autocomplete.suggest('a.py', 'pr', new Set());
ok(ac3.some(s => s.label === 'print'), 'Python suggest print');
const ac4 = Autocomplete.suggest('a.html', 'div', new Set());
ok(ac4.some(s => s.label === 'div'), 'HTML suggest div');
const ac5 = Autocomplete.suggest('a.js', 'my', new Set(['myVar', 'myFunc']));
ok(ac5.some(s => s.label === 'myVar' && s.kind === 'id'), 'doc-word suggestion');
const ac6 = Autocomplete.suggest('a.txt', 'my', new Set(['myVar']));
ok(ac6.some(s => s.label === 'myVar'), 'plain text doc-word only');

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
