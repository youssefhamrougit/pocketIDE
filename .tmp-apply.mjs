import fs from 'fs';

let app = fs.readFileSync('app.js', 'utf8');

// 1. Replace the old SyntaxHighlighter object
const hlStart = app.indexOf('const SyntaxHighlighter = {');
const editorHeader = '// ============================================================\n// Custom Textarea Editor';
const editorIdx = app.indexOf(editorHeader);
if (hlStart === -1 || editorIdx === -1) { console.error('marker A missing'); process.exit(1); }
const hlEnd = app.lastIndexOf('};', editorIdx);
if (hlEnd === -1 || hlEnd < hlStart) { console.error('marker B missing'); process.exit(1); }
const newHl = fs.readFileSync('.tmp-highlight.js', 'utf8').trimEnd();
app = app.slice(0, hlStart) + newHl + '\n' + app.slice(hlEnd + 2);

// 2. Insert Autocomplete + Problems before the editor header
const autoProbs = fs.readFileSync('.tmp-auto-problems.js', 'utf8').trimEnd();
const editorIdx2 = app.indexOf(editorHeader);
if (editorIdx2 === -1) { console.error('editor header missing'); process.exit(1); }
app = app.slice(0, editorIdx2) + autoProbs + '\n\n' + app.slice(editorIdx2);

// 3. Insert git modules before the PocketIDE header
const appHeader = '// ============================================================\n// PocketIDE - Main Application';
const appIdx = app.indexOf(appHeader);
if (appIdx === -1) { console.error('app header missing'); process.exit(1); }
const gitMod = fs.readFileSync('.tmp-git.js', 'utf8').trimEnd();
app = app.slice(0, appIdx) + gitMod + '\n\n' + app.slice(appIdx);

fs.writeFileSync('app.js', app);
console.log('splice OK — new app.js length:', app.length);
