/**
 * PocketIDE - Standalone HTML/CSS/JS Edition
 * All-in-one: custom textarea editor, file tree, tabs, themes, localStorage storage
 * No build step, no npm packages, no backend server needed
 */

// ============================================================
// Theme Manager
// ============================================================

const ThemeManager = {
  currentTheme: 'dark',

  themeVariables: {
    dark: {
      '--bg-primary': '#1e1e1e',
      '--bg-secondary': '#252526',
      '--bg-tertiary': '#2d2d2d',
      '--bg-hover': '#3c3c3c',
      '--bg-active': '#37373d',
      '--text-primary': '#cccccc',
      '--text-secondary': '#969696',
      '--text-muted': '#6a6a6a',
      '--border-color': '#3c3c3c',
      '--accent-color': '#007acc',
      '--accent-hover': '#1a8ad4',
      '--tab-active-bg': '#1e1e1e',
      '--tab-inactive-bg': '#2d2d2d',
      '--tab-border': '#252526',
      '--scrollbar-bg': '#1e1e1e',
      '--scrollbar-thumb': '#424242',
      '--status-bg': '#007acc',
      '--status-text': '#ffffff',
      '--sidebar-width': '260px',
      '--icon-filter': 'none',
      '--editor-bg': '#1e1e1e',
      '--editor-text': '#d4d4d4',
      '--editor-gutter': '#252526',
      '--editor-line-num': '#858585',
      '--editor-cursor': '#aeafad',
      '--editor-selection': '#264f78',
    },
    light: {
      '--bg-primary': '#ffffff',
      '--bg-secondary': '#f3f3f3',
      '--bg-tertiary': '#ececec',
      '--bg-hover': '#e8e8e8',
      '--bg-active': '#dcdcdc',
      '--text-primary': '#333333',
      '--text-secondary': '#666666',
      '--text-muted': '#999999',
      '--border-color': '#e0e0e0',
      '--accent-color': '#0066b8',
      '--accent-hover': '#005a9e',
      '--tab-active-bg': '#ffffff',
      '--tab-inactive-bg': '#ececec',
      '--tab-border': '#e0e0e0',
      '--scrollbar-bg': '#f3f3f3',
      '--scrollbar-thumb': '#c1c1c1',
      '--status-bg': '#0066b8',
      '--status-text': '#ffffff',
      '--sidebar-width': '260px',
      '--icon-filter': 'invert(0.5)',
      '--editor-bg': '#ffffff',
      '--editor-text': '#333333',
      '--editor-gutter': '#f5f5f5',
      '--editor-line-num': '#999999',
      '--editor-cursor': '#333333',
      '--editor-selection': '#add6ff',
    },
  },

  apply(themeName) {
    this.currentTheme = themeName === 'light' ? 'light' : 'dark';
    const vars = this.themeVariables[this.currentTheme];
    const root = document.documentElement;
    Object.entries(vars).forEach(([key, value]) => root.style.setProperty(key, value));
    root.setAttribute('data-theme', this.currentTheme);

    const btn = document.getElementById('btn-theme-toggle');
    if (btn) {
      const use = btn.querySelector('use');
      if (use) use.setAttribute('href', this.currentTheme === 'dark' ? '#i-moon' : '#i-sun');
      btn.title = this.currentTheme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme';
    }
  },

  toggle() {
    const next = this.currentTheme === 'dark' ? 'light' : 'dark';
    this.apply(next);
    return next;
  },
};

// ============================================================
// Language Detection
// ============================================================

const LanguageDetector = {
  registry: {
    js:     { name: 'JavaScript' },
    jsx:    { name: 'JSX' },
    ts:     { name: 'TypeScript' },
    tsx:    { name: 'TSX' },
    py:     { name: 'Python' },
    cpp:    { name: 'C++' }, cc: { name: 'C++' }, cxx: { name: 'C++' },
    c:      { name: 'C' },
    h:      { name: 'C/C++ Header' }, hpp: { name: 'C++ Header' },
    cs:     { name: 'C#' },
    scss:   { name: 'SCSS' }, sass: { name: 'Sass' },
    sql:    { name: 'SQL' },
    vue:    { name: 'Vue' },
    html:   { name: 'HTML' },
    htm:    { name: 'HTML' },
    css:    { name: 'CSS' },
    json:   { name: 'JSON' },
    md:     { name: 'Markdown' },
    mdown:  { name: 'Markdown' },
    markdown: { name: 'Markdown' },
    mjs:    { name: 'JavaScript' },
    cjs:    { name: 'JavaScript' },
    mts:    { name: 'TypeScript' },
    cts:    { name: 'TypeScript' },
    txt:    { name: 'Plain Text' },
    sh:     { name: 'Shell' },
    bash:   { name: 'Shell' },
    yml:    { name: 'YAML' },
    yaml:   { name: 'YAML' },
    toml:   { name: 'TOML' },
    xml:    { name: 'XML' },
    svg:    { name: 'SVG' },
    rs:     { name: 'Rust' },
    go:     { name: 'Go' },
    java:   { name: 'Java' },
    rb:     { name: 'Ruby' },
    php:    { name: 'PHP' },
    swift:  { name: 'Swift' },
    kt:     { name: 'Kotlin' },
    dart:   { name: 'Dart' },
  },

  detect(filename) {
    if (!filename) return { name: 'Plain Text' };
    const ext = filename.split('.').pop().toLowerCase();
    return this.registry[ext] || { name: 'Plain Text' };
  },

  getLanguageName(filename) {
    return this.detect(filename).name;
  },
};

// ============================================================
// Syntax Highlighting (lightweight, regex-based)
// ============================================================

const SyntaxHighlighter = {
  // ------------------------------------------------------------
  // Single-pass tokenizer.
  //
  // Walks the RAW source once with one combined regex per
  // language and escapes text as it is emitted. It never runs
  // patterns over already-escaped HTML, so typing < > & can
  // never corrupt the editor markup (the old regex pipeline
  // matched inside its own <span> tags — that's what caused
  // the "bad stuff" when typing < or >).
  // ------------------------------------------------------------

  _escape(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  },

  _compile(rules, flags) {
    const src = rules.map(r => `(${r[0].source})`).join('|');
    const re = new RegExp(src, 'g' + (flags || ''));
    return { re, classes: rules.map(r => r[1]) };
  },

  highlight(code, filename) {
    if (!code) return '';
    if (code.length > 250000) return this._escape(code);
    const lang = LanguageDetector.detect(filename).name;
    const def = this.defs[lang];
    if (!def) return this._escape(code);

    const re = def.re;
    const classes = def.classes;
    re.lastIndex = 0;
    const out = [];
    let last = 0;
    let m;
    while ((m = re.exec(code)) !== null) {
      if (m.index > last) out.push(this._escape(code.slice(last, m.index)));
      let cls = '';
      for (let i = 1; i < m.length; i++) {
        if (m[i] !== undefined) { cls = classes[i - 1]; break; }
      }
      out.push(cls ? `<span class="${cls}">${this._escape(m[0])}</span>` : this._escape(m[0]));
      last = re.lastIndex;
      if (m[0].length === 0) re.lastIndex++;
    }
    if (last < code.length) out.push(this._escape(code.slice(last)));
    return out.join('');
  },

  // ---- shared token fragments (no capture groups inside) ----
  frag: {
    strDQ: /"(?:[^"\\\n]|\\.)*"/,
    strSQ: /'(?:[^'\\\n]|\\.)*'/,
    strBQ: /`(?:[^`\\]|\\.)*`/,
    strPY3: /"""[\s\S]*?"""|'''[\s\S]*?'''/,
    lcmt: /\/\/[^\n]*/,
    bcmt: /\/\*[\s\S]*?\*\//,
    hcmt: /#[^\n]*/,
    sqlcmt: /--[^\n]*/,
    htmlcmt: /<!--[\s\S]*?-->/,
    numC: /\b\d[\d_]*(?:\.\d+)?(?:[eE][+-]?\d+)?(?:[uUlLfF]{0,2})?\b|\b0[xX][0-9a-fA-F]+\b|\b0[bB][01]+\b/,
    numJS: /\b\d[\d_]*(?:\.\d+)?(?:[eE][+-]?\d+)?\b|\b0[xX][0-9a-fA-F]+\b|\b0[bB][01]+\b|\b0[oO][0-7]+\b/,
    numDec: /\b\d[\d_]*(?:\.\d+)?(?:[eE][+-]?\d+)?\b/,
    fnCallJS: /[A-Za-z_$][\w$]*(?=\s*\()/,
    fnCall: /[A-Za-z_][\w]*(?=\s*\()/,
  },

  defs: {},
};

// ---------------- JavaScript family ----------------
const JS_RULES = [
  [/(?:"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`)/, 'hl-string'],
  [/\/\/[^\n]*|\/\*[\s\S]*?\*\//, 'hl-comment'],
  [/\b(?:as|async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|export|extends|finally|for|from|function|get|if|import|in|instanceof|let|new|of|return|set|static|super|switch|this|throw|try|typeof|var|void|while|with|yield|true|false|null|undefined)\b/, 'hl-keyword'],
  [/\b(?:Math|JSON|console|window|document|globalThis|Array|Object|String|Number|Boolean|Date|RegExp|Map|Set|WeakMap|WeakSet|Promise|Error|TypeError|SyntaxError|ReferenceError|RangeError|Symbol|BigInt|Intl|Proxy|Reflect|parseInt|parseFloat|isNaN|isFinite|fetch|setTimeout|setInterval|clearTimeout|clearInterval|requestAnimationFrame|URL|URLSearchParams|Blob|FormData|AbortController|structuredClone|queueMicrotask)\b/, 'hl-builtin'],
  [/\b\d[\d_]*(?:\.\d+)?(?:[eE][+-]?\d+)?\b|\b0[xX][0-9a-fA-F]+\b|\b0[bB][01]+\b|\b0[oO][0-7]+\b/, 'hl-number'],
  [/\b[A-Z][A-Z0-9_]+\b/, 'hl-constant'],
  [/\b[A-Z][a-zA-Z0-9]+\b(?=\s*[.\\(]|\s*$)/, 'hl-class'],
  [/===|!==|==|!=|<=|>=|=>|<<|>>|>>>|&&=|\|\|=|\?\?|\.\.\.|\*\*|&&|\|\||[=+\-*/%<>!&|^~?:]/, 'hl-operator'],
  [/[A-Za-z_$][\w$]*(?=\s*\()/, 'hl-func'],
];
const TS_RULES = JS_RULES.slice(0, 2).concat([
  [/\b(?:interface|type|enum|namespace|declare|readonly|abstract|implements|private|protected|public|keyof|infer|satisfies|string|number|boolean|any|unknown|never|void|object|bigint|symbol|is|asserts|module)\b/, 'hl-keyword'],
], JS_RULES.slice(2));
const JSX_RULES = JS_RULES.slice(0, 2).concat([
  [/<\/?[A-Za-z][\w.-]*/, 'hl-tag'],
  [/[A-Za-z_:][\w:.-]*(?=\s*=)/, 'hl-attr'],
], JS_RULES.slice(2));
const TSX_RULES = TS_RULES.slice(0, 2).concat([
  [/<\/?[A-Za-z][\w.-]*/, 'hl-tag'],
  [/[A-Za-z_:][\w:.-]*(?=\s*=)/, 'hl-attr'],
], TS_RULES.slice(2));

SyntaxHighlighter.defs['JavaScript'] = SyntaxHighlighter._compile(JS_RULES);
SyntaxHighlighter.defs['TypeScript'] = SyntaxHighlighter._compile(TS_RULES);
SyntaxHighlighter.defs['JSX'] = SyntaxHighlighter._compile(JSX_RULES);
SyntaxHighlighter.defs['TSX'] = SyntaxHighlighter._compile(TSX_RULES);

// ---------------- C family ----------------
const C_KEYWORDS = /\b(?:alignas|alignof|and|and_eq|asm|auto|bitand|bitor|bool|break|case|catch|char|char8_t|char16_t|char32_t|class|compl|concept|const|consteval|constexpr|constinit|const_cast|continue|co_await|co_return|co_yield|decltype|default|delete|do|double|dynamic_cast|else|enum|explicit|export|extern|false|float|for|friend|goto|if|inline|int|long|mutable|namespace|new|noexcept|not|not_eq|nullptr|operator|or|or_eq|private|protected|public|register|reinterpret_cast|requires|return|short|signed|sizeof|static|static_assert|static_cast|struct|switch|template|this|thread_local|throw|true|try|typedef|typeid|typename|union|unsigned|using|virtual|void|volatile|wchar_t|while|xor|xor_eq)\b/;
const C_TYPES = /\b(?:string|vector|map|set|list|pair|tuple|optional|variant|string_view|size_t|ssize_t|ptrdiff_t|int8_t|int16_t|int32_t|int64_t|uint8_t|uint16_t|uint32_t|uint64_t|FILE|std|cout|cin|cerr|endl|printf|scanf|malloc|calloc|realloc|free|strlen|strcpy|memcpy|memset|abs|fabs|sqrt|pow|rand|srand)\b/;
const C_RULES = [
  [/"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'/, 'hl-string'],
  [/\/\/[^\n]*|\/\*[\s\S]*?\*\//, 'hl-comment'],
  [/(?:(?:^|(?<=\n))[ \t]*#[^\n]*)/, 'hl-keyword'],
  [C_KEYWORDS, 'hl-keyword'],
  [C_TYPES, 'hl-type'],
  [/\b\d[\d_]*(?:\.\d+)?(?:[eE][+-]?\d+)?(?:[uUlLfF]{0,2})?\b|\b0[xX][0-9a-fA-F]+\b|\b0[bB][01]+\b/, 'hl-number'],
  [/\b[A-Z][A-Z0-9_]+\b/, 'hl-constant'],
  [/\b(?:class|struct)\s+([A-Z][a-zA-Z0-9]+)/, 'hl-class'],
  [/[=+\-*/%<>!&|^~?:]+|&&|\|\||<<|>>|<=|>=|==|!=|\+=|\-=|\*=|\/=|%=|&=|\|=|\^=|<<=|>>=|\?\?|\.\.\./, 'hl-operator'],
  [/[A-Za-z_][\w]*(?=\s*\()/, 'hl-func'],
];
SyntaxHighlighter.defs['C++'] = SyntaxHighlighter._compile(C_RULES);
SyntaxHighlighter.defs['C'] = SyntaxHighlighter._compile(C_RULES);
SyntaxHighlighter.defs['C/C++ Header'] = SyntaxHighlighter._compile(C_RULES);
SyntaxHighlighter.defs['C++ Header'] = SyntaxHighlighter._compile(C_RULES);
SyntaxHighlighter.defs['C#'] = SyntaxHighlighter._compile([
  [/@"(?:[^"]|"")*"|"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'/, 'hl-string'],
  [/\/\/[^\n]*|\/\*[\s\S]*?\*\//, 'hl-comment'],
  [/\b(?:abstract|as|base|bool|break|byte|case|catch|char|checked|class|const|continue|decimal|default|delegate|do|double|else|enum|event|explicit|extern|false|finally|fixed|float|for|foreach|goto|if|implicit|in|int|interface|internal|is|lock|long|namespace|new|null|object|operator|out|override|params|private|protected|public|readonly|ref|return|sbyte|sealed|short|sizeof|stackalloc|static|string|struct|switch|this|throw|true|try|typeof|uint|ulong|unchecked|unsafe|ushort|using|virtual|void|volatile|while|async|await|record|init|required|var|dynamic)\b/, 'hl-keyword'],
  [/\b(?:List|Dictionary|HashSet|Queue|Stack|IEnumerable|IList|ICollection|IDictionary|Exception|ArgumentException|ArgumentNullException|InvalidOperationException|Console|Math|String|DateTime|Task|Thread|Action|Func|Object|Array)\b/, 'hl-type'],
  [/\b\d[\d_]*(?:\.\d+)?(?:[eE][+-]?\d+)?[fFdDmM]?\b|\b0[xX][0-9a-fA-F]+\b/, 'hl-number'],
  [/\b[A-Z][A-Z0-9_]+\b/, 'hl-constant'],
  [/\b[A-Z][a-zA-Z0-9]+\b(?=\s*[.\\(]|\s*$)/, 'hl-class'],
  [/[=+\-*/%<>!&|^~]+|==|!=|<=|>=|=>|\+=|\-=|\*=|\/=|%=|&=|\|=|\^=|<<|>>|&&|\|\||\?\?/, 'hl-operator'],
  [/[A-Za-z_][\w]*(?=\s*\()/, 'hl-func'],
]);

// ---------------- Python ----------------
SyntaxHighlighter.defs['Python'] = SyntaxHighlighter._compile([
  [/"""[\s\S]*?"""|'''[\s\S]*?'''|"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'/, 'hl-string'],
  [/#[^\n]*/, 'hl-comment'],
  [/@[A-Za-z_][\w.]*/, 'hl-decorator'],
  [/\b(?:and|as|assert|async|await|break|case|class|continue|def|del|elif|else|except|finally|for|from|global|if|import|in|is|lambda|match|nonlocal|not|or|pass|raise|return|try|while|with|yield|True|False|None|self|cls)\b/, 'hl-keyword'],
  [/\b(?:print|len|range|type|str|int|float|bool|list|dict|set|tuple|object|super|isinstance|issubclass|enumerate|zip|map|filter|sorted|reversed|sum|min|max|abs|round|pow|divmod|open|input|repr|format|bytes|bytearray|memoryview|frozenset|complex|hash|id|callable|hasattr|getattr|setattr|delattr|vars|dir|help|Exception|ValueError|TypeError|KeyError|IndexError|AttributeError|NameError|StopIteration|FileNotFoundError|RuntimeError|ZeroDivisionError|ArithmeticError|__init__|__name__|__main__|__file__)\b/, 'hl-builtin'],
  [/\b\d[\d_]*(?:\.\d+)?(?:[eE][+-]?\d+)?j?\b|\b0[xX][0-9a-fA-F]+\b|\b0[bB][01]+\b|\b0[oO][0-7]+\b/, 'hl-number'],
  [/\b[A-Z][A-Z0-9_]+\b/, 'hl-constant'],
  [/\bclass\s+([A-Z][a-zA-Z0-9]+)/, 'hl-class'],
  [/[=+\-*/%<>!&|^~@]+|==|!=|<=|>=|\+=|\-=|\*=|\/=|%=|&=|\|=|\^=|<<|>>|\*\*|\.\.\.|->/, 'hl-operator'],
  [/[A-Za-z_][\w]*(?=\s*\()/, 'hl-func'],
]);

// ---------------- HTML / XML / SVG / Vue ----------------
const HTML_RULES = [
  [/<!--[\s\S]*?-->/, 'hl-comment'],
  [/<!DOCTYPE[^>]*>/i, 'hl-keyword'],
  [/<\/?[A-Za-z][\w.-]*/, 'hl-tag'],
  [/&(?:#[xX]?\d+|[A-Za-z][A-Za-z0-9]+);/, 'hl-attr'],
  [/"[^"\n]*"|'[^'\n]*'/, 'hl-string'],
  [/[A-Za-z_:][\w:.-]*(?=\s*=)/, 'hl-attr'],
];
SyntaxHighlighter.defs['HTML'] = SyntaxHighlighter._compile(HTML_RULES);
SyntaxHighlighter.defs['XML'] = SyntaxHighlighter._compile(HTML_RULES);
SyntaxHighlighter.defs['SVG'] = SyntaxHighlighter._compile(HTML_RULES);
SyntaxHighlighter.defs['Vue'] = SyntaxHighlighter._compile(HTML_RULES);

// ---------------- CSS / SCSS / Sass ----------------
const CSS_RULES = [
  [/\/\*[\s\S]*?\*\//, 'hl-comment'],
  [/"[^"\n]*"|'[^'\n]*'/, 'hl-string'],
  [/@[\w-]+/, 'hl-keyword'],
  [/#[0-9a-fA-F]{3,8}\b/, 'hl-number'],
  [/#[A-Za-z_][\w-]*/, 'hl-builtin'],
  [/\.[A-Za-z_][\w-]*/, 'hl-builtin'],
  [/\b\d[\d.]*(?:px|em|rem|vh|vw|vmin|vmax|%|s|ms|deg|fr|ch|ex|pt|cm|mm|dvh|svh|lvh)?\b/, 'hl-number'],
  [/[\w-]+(?=\s*:)/, 'hl-attr'],
];
SyntaxHighlighter.defs['CSS'] = SyntaxHighlighter._compile(CSS_RULES);
SyntaxHighlighter.defs['SCSS'] = SyntaxHighlighter._compile(CSS_RULES);
SyntaxHighlighter.defs['Sass'] = SyntaxHighlighter._compile(CSS_RULES);

// ---------------- SQL ----------------
SyntaxHighlighter.defs['SQL'] = SyntaxHighlighter._compile([
  [/--[^\n]*|\/\*[\s\S]*?\*\//, 'hl-comment'],
  [/'[^'\n]*'|"[^"\n]*"/, 'hl-string'],
  [/\b(?:select|from|where|insert|into|values|update|set|delete|create|table|drop|alter|join|left|right|inner|outer|full|cross|on|as|and|or|not|null|group|by|order|having|limit|offset|union|all|distinct|primary|key|foreign|references|index|view|procedure|function|trigger|begin|commit|rollback|cascade|case|when|then|else|end|exists|between|like|in|is|asc|desc|add|column|default|check|constraint|database|schema|grant|revoke|transaction|with|recursive|over|partition|rank|row_number|count|sum|avg|min|max|if|while|loop|declare|return|call|show|use|describe)\b/i, 'hl-keyword'],
  [/\b\d[\d_]*(?:\.\d+)?\b/, 'hl-number'],
  [/[A-Za-z_][\w]*(?=\s*\()/, 'hl-func'],
]);

// ---------------- JSON ----------------
SyntaxHighlighter.defs['JSON'] = SyntaxHighlighter._compile([
  [/"(?:[^"\\\n]|\\.)*"(?=\s*:)/, 'hl-attr'],
  [/"(?:[^"\\\n]|\\.)*"/, 'hl-string'],
  [/\b(?:true|false|null)\b/, 'hl-keyword'],
  [/\b-?\d[\d_]*(?:\.\d+)?(?:[eE][+-]?\d+)?\b/, 'hl-number'],
]);

// ---------------- Markdown ----------------
SyntaxHighlighter.defs['Markdown'] = SyntaxHighlighter._compile([
  [/^#{1,6}[^\n]*/, 'hl-keyword'],
  [/^(\*{3,}|-{3,}|_{3,})[^\n]*/, 'hl-number'],
  [/\[[^\]\n]+\]\([^)\s]+\)/, 'hl-string'],
  [/`[^`\n]+`/, 'hl-builtin'],
  [/^[ \t]*(?:[-*+]|\d+[.)])\s+[^\n]*/, 'hl-number'],
  [/^>[^\n]*/, 'hl-keyword'],
  [/\*\*[^*\n]+\*\*|__[^_\n]+__/, 'hl-string'],
  [/\*[^*\n]+\*|_[^_\n]+_/, 'hl-string'],
], 'm');

// ---------------- Shell ----------------
SyntaxHighlighter.defs['Shell'] = SyntaxHighlighter._compile([
  [/#[^\n]*/, 'hl-comment'],
  [/"[^"\n]*"|'[^'\n]*'|`[^`\n]*`/, 'hl-string'],
  [/\b(?:if|then|else|elif|fi|for|while|until|do|done|case|esac|function|in|select|time|export|local|readonly|return|exit|echo|cd|ls|mkdir|rm|cp|mv|sudo|grep|sed|awk|cat|touch|chmod|chown|source|alias|unset|set|shift|exec|wait|let|declare|read|printf|pwd|curl|wget|git|node|npm|npx|yarn|python|python3|pip|pip3|make|tar|zip|unzip|find|head|tail|sort|uniq|wc|cut|tr|paste|file|which|man|history|kill|jobs|bg|fg|true|false)\b/, 'hl-keyword'],
  [/\b\d[\d_]*(?:\.\d+)?\b/, 'hl-number'],
]);

// ---------------- YAML / TOML ----------------
SyntaxHighlighter.defs['YAML'] = SyntaxHighlighter._compile([
  [/#[^\n]*/, 'hl-comment'],
  [/"[^"\n]*"|'[^'\n]*'/, 'hl-string'],
  [/[A-Za-z_][\w-]*(?=\s*:)/, 'hl-attr'],
  [/&[\w-]+|\*[\w-]+/, 'hl-builtin'],
  [/\b(?:true|false|null|yes|no|on|off|~)\b/, 'hl-keyword'],
  [/\b\d[\d_]*(?:\.\d+)?\b/, 'hl-number'],
]);
SyntaxHighlighter.defs['TOML'] = SyntaxHighlighter._compile([
  [/#[^\n]*/, 'hl-comment'],
  [/"[^"\n]*"|'[^'\n]*'/, 'hl-string'],
  [/\[\[?[^\]]+\]\]?/, 'hl-keyword'],
  [/[A-Za-z_][\w-]*(?=\s*=)/, 'hl-attr'],
  [/\b(?:true|false)\b/, 'hl-keyword'],
  [/\b\d[\d_]*(?:\.\d+)?\b/, 'hl-number'],
]);

// ---------------- Rust ----------------
SyntaxHighlighter.defs['Rust'] = SyntaxHighlighter._compile([
  [/"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\u\{[0-9a-fA-F]+\}|\\[nrt'"\\])'/, 'hl-string'],
  [/\/\/[^\n]*|\/\*[\s\S]*?\*\//, 'hl-comment'],
  [/'[A-Za-z_]\w*/, 'hl-type'],
  [/\b(?:as|async|await|break|const|continue|crate|dyn|else|enum|extern|false|fn|for|if|impl|in|let|loop|match|mod|move|mut|pub|ref|return|self|Self|static|struct|super|trait|true|type|unsafe|use|where|while|yield|box)\b/, 'hl-keyword'],
  [/\b(?:u8|u16|u32|u64|u128|usize|i8|i16|i32|i64|i128|isize|f32|f64|bool|char|str|String|Vec|Option|Some|None|Result|Ok|Err|Box|Rc|Arc|HashMap|BTreeMap|HashSet|Iterator)\b/, 'hl-type'],
  [/\b\d[\d_]*(?:\.\d+)?(?:[eE][+-]?\d+)?[fFiIuU]?\b|\b0[xX][0-9a-fA-F]+\b|\b0[bB][01]+\b/, 'hl-number'],
  [/[A-Za-z_][\w]*(?=\s*\()/, 'hl-func'],
]);

// ---------------- Go ----------------
SyntaxHighlighter.defs['Go'] = SyntaxHighlighter._compile([
  [/"(?:[^"\\\n]|\\.)*"|`[^`\n]*`/, 'hl-string'],
  [/\/\/[^\n]*|\/\*[\s\S]*?\*\//, 'hl-comment'],
  [/\b(?:break|default|func|interface|select|case|defer|go|map|struct|chan|else|goto|package|switch|const|fallthrough|if|range|type|continue|for|import|return|var|true|false|nil|iota)\b/, 'hl-keyword'],
  [/\b(?:string|bool|byte|rune|int|int8|int16|int32|int64|uint|uint8|uint16|uint32|uint64|uintptr|float32|float64|complex64|complex128|error|any)\b/, 'hl-type'],
  [/\b\d[\d_]*(?:\.\d+)?(?:[eE][+-]?\d+)?\b|\b0[xX][0-9a-fA-F]+\b/, 'hl-number'],
  [/[A-Za-z_][\w]*(?=\s*\()/, 'hl-func'],
]);

// ---------------- Java ----------------
SyntaxHighlighter.defs['Java'] = SyntaxHighlighter._compile([
  [/"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'/, 'hl-string'],
  [/\/\/[^\n]*|\/\*[\s\S]*?\*\//, 'hl-comment'],
  [/@[A-Za-z_][\w.]*/, 'hl-keyword'],
  [/\b(?:abstract|assert|boolean|break|byte|case|catch|char|class|const|continue|default|do|double|else|enum|extends|final|finally|float|for|goto|if|implements|import|instanceof|int|interface|long|native|new|package|private|protected|public|return|short|static|strictfp|super|switch|synchronized|this|throw|throws|transient|try|void|volatile|while|true|false|null|var|record|sealed|permits|yield)\b/, 'hl-keyword'],
  [/\b(?:String|Integer|Long|Double|Float|Boolean|Character|Byte|Short|Object|System|Math|List|ArrayList|Map|HashMap|Set|HashSet|Collection|Arrays|Collections|Exception|RuntimeException|IllegalArgumentException|NullPointerException|IOException|File|Scanner|PrintStream|StringBuilder|Thread|Runnable)\b/, 'hl-type'],
  [/\b\d[\d_]*(?:\.\d+)?[fFdDlL]?\b|\b0[xX][0-9a-fA-F]+\b/, 'hl-number'],
  [/[A-Za-z_][\w]*(?=\s*\()/, 'hl-func'],
]);

// ---------------- Ruby ----------------
SyntaxHighlighter.defs['Ruby'] = SyntaxHighlighter._compile([
  [/"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'/, 'hl-string'],
  [/#[^\n]*/, 'hl-comment'],
  [/:[A-Za-z_]\w*/, 'hl-builtin'],
  [/\b(?:alias|and|begin|break|case|class|def|defined|do|else|elsif|end|ensure|false|for|if|in|module|next|nil|not|or|redo|rescue|retry|return|self|super|then|true|undef|unless|until|when|while|yield|require|require_relative|include|extend|attr_reader|attr_writer|attr_accessor)\b/, 'hl-keyword'],
  [/\b\d[\d_]*(?:\.\d+)?\b|\b0[xX][0-9a-fA-F]+\b/, 'hl-number'],
  [/[A-Za-z_][\w]*[!?]?(?=\s*\()/, 'hl-func'],
]);

// ---------------- PHP ----------------
SyntaxHighlighter.defs['PHP'] = SyntaxHighlighter._compile([
  [/"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'/, 'hl-string'],
  [/\/\/[^\n]*|\/\*[\s\S]*?\*\/|#[^\n]*/, 'hl-comment'],
  [/\$[A-Za-z_]\w*/, 'hl-builtin'],
  [/\b(?:abstract|and|array|as|break|callable|case|catch|class|clone|const|continue|declare|default|do|echo|else|elseif|empty|enddeclare|endfor|endforeach|endif|endswitch|endwhile|enum|exit|extends|final|finally|fn|for|foreach|function|global|goto|if|implements|include|include_once|instanceof|insteadof|interface|isset|list|match|namespace|new|or|print|private|protected|public|readonly|require|require_once|return|static|switch|throw|trait|try|unset|use|var|while|xor|yield|true|false|null|void)\b/, 'hl-keyword'],
  [/\b\d[\d_]*(?:\.\d+)?\b|\b0[xX][0-9a-fA-F]+\b/, 'hl-number'],
  [/[A-Za-z_][\w]*(?=\s*\()/, 'hl-func'],
]);

// ---------------- Swift ----------------
SyntaxHighlighter.defs['Swift'] = SyntaxHighlighter._compile([
  [/"(?:[^"\\\n]|\\.)*"/, 'hl-string'],
  [/\/\/[^\n]*|\/\*[\s\S]*?\*\//, 'hl-comment'],
  [/\b(?:associatedtype|class|deinit|enum|extension|fileprivate|func|import|init|inout|internal|let|open|operator|private|protocol|public|rethrows|static|struct|subscript|typealias|var|break|case|continue|default|defer|do|else|fallthrough|for|guard|if|in|repeat|return|switch|where|while|as|catch|is|super|self|Self|throw|throws|try|true|false|nil|any|some|await|async|actor|nonisolated|convenience|dynamic|final|lazy|mutating|optional|override|required|weak)\b/, 'hl-keyword'],
  [/\b(?:Int|UInt|Float|Double|Bool|String|Character|Array|Dictionary|Set|Optional|Error|Void|Any|NSObject|UIView|UIViewController|URL|Data|Date)\b/, 'hl-type'],
  [/\b\d[\d_]*(?:\.\d+)?(?:[eE][+-]?\d+)?\b|\b0[xX][0-9a-fA-F]+\b/, 'hl-number'],
  [/[A-Za-z_][\w]*(?=\s*\()/, 'hl-func'],
]);

// ---------------- Kotlin ----------------
SyntaxHighlighter.defs['Kotlin'] = SyntaxHighlighter._compile([
  [/"""[\s\S]*?"""|"(?:[^"\\\n]|\\.)*"/, 'hl-string'],
  [/\/\/[^\n]*|\/\*[\s\S]*?\*\//, 'hl-comment'],
  [/\b(?:as|break|class|continue|do|else|false|for|fun|if|in|interface|is|null|object|package|return|super|this|throw|true|try|typealias|typeof|val|var|when|while|by|catch|constructor|delegate|dynamic|field|file|finally|get|import|init|param|property|receiver|set|setparam|where|actual|abstract|annotation|companion|const|crossinline|data|enum|expect|external|final|infix|inline|inner|internal|lateinit|noinline|open|operator|out|override|private|protected|public|reified|sealed|suspend|tailrec|vararg)\b/, 'hl-keyword'],
  [/\b(?:String|Int|Long|Double|Float|Boolean|Char|Byte|Short|Unit|Any|Nothing|List|MutableList|Map|MutableMap|Set|MutableSet|Array|Pair|Triple)\b/, 'hl-type'],
  [/\b\d[\d_]*(?:\.\d+)?(?:[eE][+-]?\d+)?[fFdDlL]?\b|\b0[xX][0-9a-fA-F]+\b/, 'hl-number'],
  [/[A-Za-z_][\w]*(?=\s*\()/, 'hl-func'],
]);

// ---------------- Dart ----------------
SyntaxHighlighter.defs['Dart'] = SyntaxHighlighter._compile([
  [/"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'/, 'hl-string'],
  [/\/\/[^\n]*|\/\*[\s\S]*?\*\//, 'hl-comment'],
  [/\b(?:abstract|as|assert|async|await|break|case|catch|class|const|continue|default|deferred|do|dynamic|else|enum|export|extends|extension|external|factory|false|final|finally|for|Function|get|hide|if|implements|import|in|interface|is|late|library|mixin|new|null|on|operator|part|required|rethrow|return|set|show|static|super|switch|sync|this|throw|true|try|typedef|var|void|while|with|yield)\b/, 'hl-keyword'],
  [/\b(?:int|double|num|bool|String|Object|dynamic|List|Map|Set|Iterable|Future|Stream|void|Never|Null)\b/, 'hl-type'],
  [/\b\d[\d_]*(?:\.\d+)?(?:[eE][+-]?\d+)?\b|\b0[xX][0-9a-fA-F]+\b/, 'hl-number'],
  [/[A-Za-z_][\w]*(?=\s*\()/, 'hl-func'],
]);


// ============================================================
// Autocomplete — file-type-aware suggestions dropdown
// ============================================================

const Autocomplete = {
  aliases: {
    'JSX': 'JavaScript', 'TSX': 'TypeScript', 'TypeScript': 'JavaScript',
    'C': 'C++', 'C#': 'C#', 'C/C++ Header': 'C++', 'C++ Header': 'C++',
    'SCSS': 'CSS', 'Sass': 'CSS', 'XML': 'HTML', 'SVG': 'HTML', 'Vue': 'HTML',
  },

  data: {
    'JavaScript': {
      keywords: ['const','let','var','function','return','if','else','for','while','do','switch','case','break','continue','class','extends','new','this','async','await','try','catch','finally','throw','import','from','export','default','typeof','instanceof','in','of','null','undefined','true','false','delete','void','yield','static','super','get','set','arrow'],
      builtins: ['console.log','console.error','console.warn','console.table','document.getElementById','document.querySelector','document.querySelectorAll','document.createElement','window.addEventListener','window.setInterval','fetch','JSON.parse','JSON.stringify','Math.random','Math.floor','Math.max','Math.min','Math.round','Date.now','setTimeout','setInterval','clearTimeout','Promise.resolve','Promise.all','Array.from','Array.isArray','Object.keys','Object.values','Object.entries','Object.assign','parseInt','parseFloat','isNaN','String','Number','Boolean'],
      snippets: {
        'for': 'for (let i = 0; i < ${n}; i++) {\n  ${0}\n}',
        'forof': 'for (const ${item} of ${items}) {\n  ${0}\n}',
        'if': 'if (${cond}) {\n  ${0}\n}',
        'else': '} else {\n  ${0}\n}',
        'fn': 'function ${name}(${params}) {\n  ${0}\n}',
        'arrow': '(${params}) => {\n  ${0}\n}',
        'log': 'console.log(${0});',
        'try': 'try {\n  ${0}\n} catch (err) {\n  console.error(err);\n}',
        'fetch': 'fetch(${url})\n  .then(res => res.json())\n  .then(data => {\n    ${0}\n  });',
      },
    },
    'Python': {
      keywords: ['def','class','return','if','elif','else','for','while','in','not','and','or','try','except','finally','with','as','import','from','lambda','yield','pass','break','continue','global','nonlocal','assert','raise','del','is','None','True','False','async','await','match','case','self'],
      builtins: ['print','len','range','type','str','int','float','bool','list','dict','set','tuple','object','super','isinstance','enumerate','zip','map','filter','sorted','sum','min','max','abs','round','open','input','repr','format','bytes','hash','id','vars','dir','ValueError','TypeError','KeyError','IndexError','Exception','__init__','__name__','__main__'],
      snippets: {
        'def': 'def ${name}(${params}):\n    ${0}\n',
        'class': 'class ${Name}:\n    def __init__(self, ${args}):\n        ${0}\n',
        'if': 'if ${cond}:\n    ${0}\n',
        'for': 'for ${item} in ${items}:\n    ${0}\n',
        'while': 'while ${cond}:\n    ${0}\n',
        'main': 'if __name__ == "__main__":\n    ${0}\n',
        'try': 'try:\n    ${0}\nexcept ${Exception} as e:\n    print(e)\n',
      },
    },
    'C++': {
      keywords: ['int','char','float','double','bool','void','auto','const','static','struct','class','public','private','protected','namespace','using','return','if','else','for','while','do','switch','case','break','continue','new','delete','this','nullptr','true','false','template','typename','typedef','enum','union','virtual','override','inline','extern','sizeof','unsigned','signed','long','short','string','vector','map','set','include','main'],
      builtins: ['std::cout','std::cin','std::endl','std::string','std::vector','std::map','std::set','printf','scanf','malloc','free','sizeof','abs','sqrt','pow','max','min','strlen','strcpy','memcpy','memset','fopen','fclose','fread','fwrite'],
      snippets: {
        'main': 'int main() {\n  ${0}\n  return 0;\n}',
        'for': 'for (int i = 0; i < ${n}; i++) {\n  ${0}\n}',
        'if': 'if (${cond}) {\n  ${0}\n}',
        'while': 'while (${cond}) {\n  ${0}\n}',
        'class': 'class ${Name} {\npublic:\n  ${Name}() {}\n  ${0}\n};',
        'fn': '${type} ${name}(${params}) {\n  ${0}\n}',
        'cout': 'std::cout << ${0} << std::endl;',
      },
    },
    'C#': {
      keywords: ['namespace','using','class','public','private','protected','internal','static','void','int','string','bool','double','float','var','const','readonly','return','if','else','for','foreach','while','switch','case','break','continue','new','this','base','null','true','false','try','catch','finally','throw','async','await','record','enum','interface','delegate','event','get','set','in','out','ref'],
      builtins: ['Console.WriteLine','Console.ReadLine','Console.Write','Math.Max','Math.Min','Math.Abs','Math.Pow','Math.Sqrt','DateTime.Now','string.Format','List','Dictionary','HashSet','Task.Run','String.IsNullOrEmpty','String.Join','Convert.ToInt32','Enumerable.Range','LINQ','Where','Select','ToList','FirstOrDefault'],
      snippets: {
        'main': 'static void Main(string[] args) {\n  ${0}\n}',
        'class': 'public class ${Name} {\n  ${0}\n}',
        'for': 'for (int i = 0; i < ${n}; i++) {\n  ${0}\n}',
        'foreach': 'foreach (var ${item} in ${items}) {\n  ${0}\n}',
        'if': 'if (${cond}) {\n  ${0}\n}',
        'wl': 'Console.WriteLine(${0});',
      },
    },
    'HTML': {
      keywords: ['div','span','p','a','img','ul','ol','li','table','tr','td','th','form','input','button','select','option','textarea','label','header','footer','nav','main','section','article','aside','h1','h2','h3','h4','h5','h6','br','hr','script','style','link','meta','title','body','head','html','class','id','href','src','style'],
      builtins: ['<div class=""></div>','<a href=""></a>','<img src="" alt=""/>','<input type="text" />','<button></button>','<ul><li></li></ul>','<table>','<form>','<script>','<link rel="stylesheet" href="">'],
      snippets: {
        'doctype': '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8" />\n  <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n  <title>${0}</title>\n</head>\n<body>\n\n</body>\n</html>',
        'div': '<div class="${cls}">\n  ${0}\n</div>',
        'a': '<a href="${url}">${0}</a>',
        'img': '<img src="${src}" alt="${alt}" />',
        'script': '<script>\n  ${0}\n</script>',
        'link': '<link rel="stylesheet" href="${href}" />',
      },
    },
    'CSS': {
      keywords: ['color','background','background-color','margin','padding','border','border-radius','font-size','font-family','font-weight','display','position','top','right','bottom','left','width','height','min-width','max-width','min-height','max-height','overflow','flex','flex-direction','justify-content','align-items','gap','grid','grid-template-columns','gap','opacity','z-index','transition','transform','box-shadow','text-align','text-decoration','line-height','cursor','pointer','hover','active','focus','media'],
      builtins: ['rgba','rgb','hsl','calc','var','clamp','min','max','linear-gradient','radial-gradient','translate','scale','rotate','bold','italic','underline','center','flex-start','flex-end','space-between','space-around','relative','absolute','fixed','sticky'],
      snippets: {
        'flex': 'display: flex;\njustify-content: center;\nalign-items: center;',
        'media': '@media (max-width: 768px) {\n  ${0}\n}',
        'hover': '.${sel}:hover {\n  ${0}\n}',
        'font': 'font-family: ${family}, sans-serif;\nfont-size: ${size}px;\ncolor: ${color};',
      },
    },
    'SQL': {
      keywords: ['select','from','where','insert','into','values','update','set','delete','create','table','drop','alter','join','left','right','inner','outer','on','as','and','or','not','null','group','by','order','having','limit','offset','union','all','distinct','primary','key','foreign','references','index','view','count','sum','avg','min','max','between','like','in','is','exists','case','when','then','else','end','begin','commit','rollback'],
      builtins: ['COUNT(*)','SUM(column)','AVG(column)','MIN(column)','MAX(column)','NOW()','UPPER(col)','LOWER(col)','LENGTH(col)','COALESCE(col, 0)','DISTINCT col','ORDER BY col DESC','GROUP BY col','LIMIT 10'],
      snippets: {
        'selectall': 'SELECT * FROM ${table}\nWHERE ${cond}\nLIMIT 100;',
        'insert': 'INSERT INTO ${table} (${cols})\nVALUES (${vals});',
        'update': 'UPDATE ${table}\nSET ${col} = ${val}\nWHERE ${cond};',
        'delete': 'DELETE FROM ${table}\nWHERE ${cond};',
        'createtable': 'CREATE TABLE ${name} (\n  id INTEGER PRIMARY KEY,\n  ${0}\n);',
        'join': 'SELECT *\nFROM ${a}\nJOIN ${b} ON ${a}.${key} = ${b}.${key}\nWHERE ${cond};',
      },
    },
    'JSON': {
      keywords: ['true','false','null'],
      builtins: ['"id":','"name":','"type":','"value":','"data":','"items":[]','"status":','"message":','"createdAt":','"updatedAt":'],
      snippets: {
        'obj': '{\n  "${0}": \n}',
        'arr': '[\n  ${0}\n]',
        'item': '{\n  "id": 1,\n  "name": "${0}"\n}',
      },
    },
    'Markdown': {
      keywords: ['#','##','###','####','-','1.','*','**','`','>','[link](url)','![alt](img)'],
      builtins: ['**bold**','*italic*','`code`','[text](url)','![alt](image)','- item','1. item','> quote','```code```'],
      snippets: {
        'heading': '## ${0}',
        'link': '[${text}](${url})',
        'code': '```${lang}\n${0}\n```',
      },
    },
    'Shell': {
      keywords: ['echo','if','then','else','elif','fi','for','while','until','do','done','case','esac','function','return','exit','export','local','readonly','cd','ls','mkdir','rm','cp','mv','cat','touch','chmod','grep','sed','awk','find','curl','wget','git','node','npm','sudo','true','false','source','alias','set','unset'],
      builtins: ['$HOME','$PATH','$USER','$PWD','$0','$1','$@','$?','$#','$(command)','`command`','2>&1','> file','>> file','|'],
      snippets: {
        'if': 'if [ ${cond} ]; then\n  ${0}\nfi',
        'for': 'for ${i} in ${items}; do\n  ${0}\ndone',
        'fn': '${name}() {\n  ${0}\n}',
        'echo': 'echo "${0}"',
      },
    },
    'Go': {
      keywords: ['package','import','func','return','if','else','for','range','switch','case','break','continue','var','const','type','struct','interface','map','chan','go','defer','select','nil','true','false','make','len','cap','append','new'],
      builtins: ['fmt.Println','fmt.Printf','fmt.Sprintf','strings.Join','strings.Split','strconv.Atoi','strconv.Itoa','time.Now','os.Open','os.ReadFile','io.ReadAll','json.Marshal','json.Unmarshal','http.Get','error','any'],
      snippets: {
        'main': 'package main\n\nimport "fmt"\n\nfunc main() {\n\t${0}\n}',
        'fn': 'func ${name}(${params}) ${ret} {\n\t${0}\n}',
        'for': 'for i := 0; i < ${n}; i++ {\n\t${0}\n}',
        'range': 'for ${i}, ${v} := range ${items} {\n\t${0}\n}',
        'iferr': 'if err != nil {\n\treturn err\n}',
      },
    },
    'Rust': {
      keywords: ['fn','let','mut','const','static','return','if','else','for','while','loop','match','struct','enum','impl','trait','use','mod','pub','crate','self','Self','super','where','as','in','ref','move','async','await','dyn','true','false','Option','Result','Some','None','Ok','Err'],
      builtins: ['println!','print!','eprintln!','format!','vec!','String::from','format!','vec!','iter','collect','unwrap','expect','map','filter','fold','clone','to_string','as_str','push','len','is_empty'],
      snippets: {
        'main': 'fn main() {\n    ${0}\n}',
        'fn': 'fn ${name}(${params}) -> ${ret} {\n    ${0}\n}',
        'for': 'for ${i} in 0..${n} {\n    ${0}\n}',
        'match': 'match ${val} {\n    ${pat} => {\n        ${0}\n    }\n    _ => {}\n}',
        'impl': 'impl ${Type} {\n    pub fn ${new}() -> Self {\n        ${0}\n    }\n}',
      },
    },
    'Java': {
      keywords: ['public','private','protected','static','final','class','interface','extends','implements','void','int','long','double','float','boolean','char','byte','short','String','return','if','else','for','while','do','switch','case','break','continue','new','this','super','null','true','false','try','catch','finally','throw','throws','import','package','enum','record','var','abstract'],
      builtins: ['System.out.println','System.out.print','System.err.println','Math.max','Math.min','Math.abs','Math.pow','Math.sqrt','Math.random','String.format','String.valueOf','Integer.parseInt','Integer.toString','List.of','Arrays.asList','ArrayList','HashMap','HashSet','Objects.equals','StringBuilder','Thread.sleep','Exception','RuntimeException'],
      snippets: {
        'main': 'public static void main(String[] args) {\n  ${0}\n}',
        'class': 'public class ${Name} {\n  ${0}\n}',
        'for': 'for (int i = 0; i < ${n}; i++) {\n  ${0}\n}',
        'if': 'if (${cond}) {\n  ${0}\n}',
        'sop': 'System.out.println(${0});',
        'try': 'try {\n  ${0}\n} catch (Exception e) {\n  e.printStackTrace();\n}',
      },
    },
    'PHP': {
      keywords: ['function','return','if','else','elseif','for','foreach','while','switch','case','break','continue','class','public','private','protected','static','extends','implements','interface','new','this','self','parent','namespace','use','require','require_once','include','include_once','echo','print','true','false','null','isset','empty','unset','array','as','=>','try','catch','finally','throw','match','fn','var','global','const','abstract','final','readonly','enum'],
      builtins: ['$_GET','$_POST','$_SERVER','$_SESSION','$_COOKIE','$_FILES','$this','array_map','array_filter','count','strlen','str_replace','explode','implode','json_encode','json_decode','file_get_contents','file_put_contents','mysqli','PDO','header','die','exit','var_dump','print_r'],
      snippets: {
        'php': '<?php\n${0}\n?>',
        'fn': 'function ${name}(${params}) {\n  ${0}\n}',
        'foreach': 'foreach (${items} as ${key} => ${value}) {\n  ${0}\n}',
        'echo': 'echo ${0};',
      },
    },
    'Swift': {
      keywords: ['let','var','func','return','if','else','guard','for','while','repeat','switch','case','break','continue','class','struct','enum','protocol','extension','init','deinit','static','override','import','public','private','internal','fileprivate','open','self','super','nil','true','false','throw','throws','try','catch','async','await','actor','in','as','is','where'],
      builtins: ['print','String','Int','Double','Float','Bool','Array','Dictionary','Set','Optional','map','filter','reduce','compactMap','flatMap','sorted','joined','split','lowercased','uppercased','count','isEmpty','append','removeAll','first','last','min','max','abs','round','Date','UUID','DispatchQueue.main.async'],
      snippets: {
        'main': 'import Foundation\n\nfunc main() {\n  ${0}\n}\nmain()',
        'func': 'func ${name}(${params}) -> ${ret} {\n  ${0}\n}',
        'class': 'class ${Name} {\n  ${0}\n}',
        'if': 'if ${cond} {\n  ${0}\n}',
        'for': 'for ${item} in ${items} {\n  ${0}\n}',
      },
    },
    'Kotlin': {
      keywords: ['fun','val','var','class','object','interface','data','sealed','enum','companion','init','constructor','return','if','else','when','for','while','do','break','continue','true','false','null','is','in','as','try','catch','finally','throw','import','package','public','private','protected','internal','override','open','abstract','suspend','async','await','by','get','set','lateinit'],
      builtins: ['println','print','String','Int','Long','Double','Float','Boolean','Char','Array','List','MutableList','Map','MutableMap','Set','Pair','Triple','Any','Unit','Nothing','map','filter','forEach','sorted','joinToString','firstOrNull','lastOrNull','take','drop','repeat','require','check','error','TODO'],
      snippets: {
        'main': 'fun main() {\n  ${0}\n}',
        'fun': 'fun ${name}(${params}): ${ret} {\n  ${0}\n}',
        'class': 'class ${Name}(${params}) {\n  ${0}\n}',
        'if': 'if (${cond}) {\n  ${0}\n}',
        'when': 'when (${value}) {\n  ${case} -> {\n    ${0}\n  }\n  else -> {}\n}',
      },
    },
    'Dart': {
      keywords: ['void','var','final','const','class','extends','implements','mixin','abstract','enum','return','if','else','for','while','do','switch','case','break','continue','true','false','null','this','super','new','import','export','part','library','typedef','Function','dynamic','is','as','in','try','catch','finally','throw','async','await','yield','get','set','static','late','required','factory'],
      builtins: ['print','String','int','double','num','bool','List','Map','Set','Iterable','Future','Stream','Object','dynamic','map','where','forEach','toList','join','split','length','isEmpty','add','remove','contains','first','last','isEmpty','isNotEmpty','toString','toInt','toDouble','DateTime.now','Duration','Timer','Uri','jsonDecode','jsonEncode'],
      snippets: {
        'main': 'void main() {\n  ${0}\n}',
        'fn': '${ret} ${name}(${params}) {\n  ${0}\n}',
        'class': 'class ${Name} {\n  ${Name}(this.${field});\n\n  ${0}\n}',
        'if': 'if (${cond}) {\n  ${0}\n}',
        'for': 'for (var i = 0; i < ${n}; i++) {\n  ${0}\n}',
      },
    },
    'Ruby': {
      keywords: ['def','end','class','module','return','if','unless','else','elsif','case','when','while','until','for','do','begin','rescue','ensure','raise','yield','self','super','true','false','nil','and','or','not','require','require_relative','include','extend','attr_reader','attr_writer','attr_accessor','new','puts','print','each','map','select','reject'],
      builtins: ['puts','print','p','gets','Array','Hash','String','Integer','Float','Symbol','Range','Object','Time','File.open','File.read','File.write','Dir.glob','JSON.parse','JSON.generate','puts "#{}"','each_with_index','select','map','inject','reduce','include?','empty?','length','size','join','split','chomp','to_s','to_i','to_f','to_sym'],
      snippets: {
        'def': 'def ${name}(${params})\n  ${0}\nend',
        'class': 'class ${Name}\n  ${0}\nend',
        'each': '${items}.each do |${item}|\n  ${0}\nend',
        'if': 'if ${cond}\n  ${0}\nend',
      },
    },
  },

  suggest(filename, prefix, docWords) {
    const lang = LanguageDetector.detect(filename).name;
    const key = this.aliases[lang] || lang;
    const data = this.data[key];
    const out = [];
    const seen = new Set();
    const p = prefix.toLowerCase();
    const push = (label, insert, kind) => {
      if (seen.has(label) || !label) return;
      if (!label.toLowerCase().startsWith(p)) return;
      seen.add(label);
      out.push({ label, insert: insert !== undefined ? insert : label, kind });
    };
    if (data) {
      // snippets first so keywords never shadow them (e.g. 'for' snippet vs 'for' keyword)
      Object.entries(data.snippets || {}).forEach(([k, tpl]) => push(k, tpl, 'sn'));
      (data.keywords || []).forEach(k => { if (!seen.has(k)) push(k, k, 'kw'); });
      (data.builtins || []).forEach(b => push(b, b, 'bi'));
    }
    // language-specific extras (e.g. TypeScript-only keywords)
    if (lang === 'TypeScript' || lang === 'TSX') {
      ['interface','type','enum','namespace','declare','readonly','abstract','implements','satisfies','keyof','infer','as','unknown','never','any','public','private','protected'].forEach(k => push(k, k, 'kw'));
    }
    // contextual: identifiers already used in this document (skip the partial word being typed)
    const kwSet = new Set(data ? data.keywords : []);
    if (docWords) {
      docWords.forEach(w => {
        if (w.length > 1 && w.toLowerCase() !== p && !kwSet.has(w) && !/^\d+$/.test(w)) push(w, w, 'id');
      });
    }
    if (out.length === 0) return out;
    const rank = { sn: 0, kw: 1, id: 2, bi: 3 };
    out.sort((a, b) => {
      const ae = a.label.toLowerCase() === p ? 0 : a.label.toLowerCase().startsWith(p) ? 1 : 2;
      const be = b.label.toLowerCase() === p ? 0 : b.label.toLowerCase().startsWith(p) ? 1 : 2;
      if (ae !== be) return ae - be;
      if (rank[a.kind] !== rank[b.kind]) return rank[a.kind] - rank[b.kind];
      if (a.label.length !== b.label.length) return a.label.length - b.label.length;
      return a.label.localeCompare(b.label);
    });
    return out.slice(0, 14);
  },
};

// ============================================================
// AutocompleteBox — the floating dropdown UI
// ============================================================

class AutocompleteBox {
  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'ac-box';
    this.el.style.display = 'none';
    document.body.appendChild(this.el);
    this.items = [];
    this.active = -1;
    this.ctx = null;
    this._onClick = (e) => {
      const li = e.target.closest('.ac-item');
      if (li) this.accept(parseInt(li.dataset.i, 10));
    };
    this.el.addEventListener('mousedown', (e) => e.preventDefault()); // keep textarea focus
    this.el.addEventListener('click', this._onClick);
  }

  isOpen() { return this.el.style.display !== 'none'; }

  show(ctx) {
    this.ctx = ctx;
    this.items = ctx.suggestions;
    this.active = 0;
    this._render();
    this.el.style.display = 'block';
    this._position(ctx.editor);
  }

  close() {
    if (!this.isOpen()) return;
    this.el.style.display = 'none';
    this.items = [];
    this.ctx = null;
    this.active = -1;
  }

  next() {
    if (!this.items.length) return;
    this.active = (this.active + 1) % this.items.length;
    this._highlightActive();
  }

  prev() {
    if (!this.items.length) return;
    this.active = (this.active - 1 + this.items.length) % this.items.length;
    this._highlightActive();
  }

  accept(index) {
    if (!this.ctx) return;
    const i = index !== undefined ? index : this.active;
    const item = this.items[i];
    if (!item) { this.close(); return; }
    const { editor, prefix } = this.ctx;
    const ta = editor.textarea;
    const pos = ta.selectionStart;
    const start = pos - prefix.length;
    const rest = ta.value.slice(pos);
    const insert = item.insert;
    const ph = insert.indexOf('${0}');
    let out, cursor;
    if (ph !== -1) {
      out = insert.slice(0, ph) + insert.slice(ph + 4).replace(/\$\{\d+\}/g, '');
      cursor = start + ph;
    } else {
      out = insert;
      cursor = start + out.length;
    }
    ta.value = ta.value.slice(0, start) + out + rest;
    ta.selectionStart = ta.selectionEnd = cursor;
    editor.content = ta.value;
    editor._updateHighlight();
    editor._updateLineNumbers();
    editor._emit('change', editor.content);
    this.close();
    ta.focus();
  }

  _render() {
    this.el.innerHTML = '';
    this.items.forEach((item, i) => {
      const li = document.createElement('div');
      li.className = 'ac-item' + (i === this.active ? ' active' : '');
      li.dataset.i = i;
      const kind = document.createElement('span');
      kind.className = 'ac-kind';
      kind.textContent = { sn: 'SNIP', kw: 'KEY', id: 'VAR', bi: 'API' }[item.kind] || 'KEY';
      const label = document.createElement('span');
      label.className = 'ac-label';
      label.textContent = item.label;
      li.appendChild(kind);
      li.appendChild(label);
      this.el.appendChild(li);
    });
  }

  _highlightActive() {
    const items = this.el.querySelectorAll('.ac-item');
    items.forEach((li, i) => li.classList.toggle('active', i === this.active));
    const act = items[this.active];
    if (act) act.scrollIntoView({ block: 'nearest' });
  }

  _position(editor) {
    const ta = editor.textarea;
    const cs = getComputedStyle(ta);
    const mirror = document.createElement('div');
    mirror.style.cssText = 'position:fixed;left:0;top:0;visibility:hidden;pointer-events:none;white-space:pre;';
    ['fontFamily','fontSize','fontWeight','fontStyle','fontVariant','letterSpacing','wordSpacing','lineHeight','textIndent','textTransform','paddingTop','paddingRight','paddingBottom','paddingLeft','borderTopWidth','borderRightWidth','borderBottomWidth','borderLeftWidth','boxSizing','tabSize'].forEach(p => mirror.style[p] = cs[p]);
    const pre = document.createElement('pre');
    pre.textContent = ta.value.slice(0, ta.selectionStart).replace(/\r\n/g, '\n').replace(/\n/g, '\u200b');
    const span = document.createElement('span');
    span.textContent = 'x';
    pre.appendChild(span);
    mirror.appendChild(pre);
    document.body.appendChild(mirror);
    const caret = span.getBoundingClientRect();
    document.body.removeChild(mirror);

    const box = this.el.getBoundingClientRect();
    let left = caret.left;
    const maxLeft = window.innerWidth - box.width - 8;
    left = Math.max(8, Math.min(left, Math.max(8, maxLeft)));
    let top = caret.bottom + 4;
    if (top + box.height > window.innerHeight - 8) top = Math.max(8, caret.top - box.height - 4);
    this.el.style.left = left + 'px';
    this.el.style.top = top + 'px';
  }
}

// ============================================================
// Problem Detector — finds bugs as you type
// ============================================================

const Problems = {
  check(code, filename) {
    if (!code || !code.trim()) return [];
    const lang = LanguageDetector.detect(filename).name;
    const cfg = this._cfgFor(lang);
    let problems = this._scan(code, cfg);
    if (lang === 'Python') this._checkPython(code, problems);
    else if (lang === 'JSON') this._checkJSON(code, problems);
    else if (lang === 'HTML' || lang === 'XML' || lang === 'SVG' || lang === 'Vue') this._checkTags(code, problems);
    else if (lang === 'JavaScript' || lang === 'TypeScript' || lang === 'JSX' || lang === 'TSX') this._checkJS(code, problems);
    // dedupe
    const seen = new Set();
    problems = problems.filter(p => {
      const k = p.line + ':' + p.col + ':' + p.message;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    problems.sort((a, b) => a.line - b.line || a.col - b.col);
    return problems;
  },

  _cfgFor(lang) {
    if (lang === 'Python' || lang === 'Ruby' || lang === 'Shell' || lang === 'YAML' || lang === 'TOML') return { line: ['#'], block: [] };
    if (lang === 'SQL') return { line: ['--'], block: [['/*', '*/']] };
    if (lang === 'HTML' || lang === 'XML' || lang === 'SVG' || lang === 'Vue') return { line: [], block: [['<!--', '-->']] };
    return { line: ['//'], block: [['/*', '*/']] };
  },

  _lineOf(code, index) { return code.slice(0, index).split('\n').length; },
  _colOf(code, index) { const b = code.slice(0, index); return index - b.lastIndexOf('\n'); },

  _scan(code, cfg) {
    const problems = [];
    const stack = [];
    const lineMarks = cfg.line;
    const blockMarks = cfg.block;
    let line = 1, col = 0;
    let inStr = null, inLine = null, inBlock = null;
    let i = 0;
    const n = code.length;
    const isQuote = (c) => c === '"' || c === "'" || c === '`';
    while (i < n) {
      const c = code[i];
      if (c === '\n') { line++; col = 0; } else col++;

      if (inLine) { if (c === '\n') inLine = null; i++; continue; }
      if (inBlock) {
        if (code.startsWith(inBlock, i)) { inBlock = null; i += inBlock.length; continue; }
        i++; continue;
      }
      if (inStr) {
        if (c === '\\') { i += 2; continue; }
        if (inStr.length > 1) {
          if (code.startsWith(inStr, i)) { inStr = null; i += inStr.length; continue; }
        } else if (c === inStr) { inStr = null; i++; continue; }
        i++; continue;
      }

      let matched = false;
      for (const mk of lineMarks) {
        if (code.startsWith(mk, i)) { inLine = mk; i += mk.length; matched = true; break; }
      }
      if (matched) continue;
      for (const bm of blockMarks) {
        if (code.startsWith(bm[0], i)) { inBlock = bm[1]; i += bm[0].length; matched = true; break; }
      }
      if (matched) continue;

      if (isQuote(c)) {
        if (c === '"' && code.startsWith('"""', i)) { inStr = '"""'; i += 3; continue; }
        if (c === "'" && code.startsWith("'''", i)) { inStr = "'''"; i += 3; continue; }
        inStr = c; i++; continue;
      }
      if (c === ')' || c === ']' || c === '}') {
        const want = c === ')' ? '(' : c === ']' ? '[' : '{';
        if (stack.length && stack[stack.length - 1].ch === want) stack.pop();
        else problems.push({ line, col, severity: 'error', message: `Unmatched '${c}'` });
      } else if (c === '(' || c === '[' || c === '{') {
        stack.push({ ch: c, line, col });
      }
      i++;
    }
    if (inStr) problems.push({ line, col: col + 1, severity: 'error', message: `Unterminated string — missing closing ${inStr.length > 1 ? 'triple quote' : inStr}` });
    if (inBlock) problems.push({ line, col, severity: 'error', message: 'Unclosed block comment — missing closing marker' });
    stack.forEach(s => problems.push({ line: s.line, col: s.col, severity: 'warning', message: `Unclosed '${s.ch}'` }));
    return problems;
  },

  _checkPython(code, problems) {
    const lines = code.split('\n');
    lines.forEach((ln, idx) => {
      const indent = ln.match(/^[ \t]+/);
      if (indent && indent[0].includes(' ') && indent[0].includes('\t')) {
        problems.push({ line: idx + 1, col: 1, severity: 'warning', message: 'Mixed tabs and spaces in indentation' });
      }
      const t = ln.trim().replace(/#.*$/, '').trimEnd();
      if (!t) return;
      const m = t.match(/^(def|class|if|elif|else|for|while|try|except|finally|with|match|case)\b/);
      if (m && !t.endsWith(':')) {
        problems.push({ line: idx + 1, col: 1, severity: 'warning', message: `${m[1]} block is missing a trailing ':'` });
      }
    });
  },

  _checkJSON(code, problems) {
    try { JSON.parse(code); }
    catch (e) {
      const m = String(e.message).match(/position (\d+)/);
      let line = 1, col = 1;
      if (m) {
        const pos = parseInt(m[1], 10);
        const before = code.slice(0, pos);
        line = before.split('\n').length;
        col = pos - before.lastIndexOf('\n');
      }
      problems.push({ line, col: Math.max(1, col), severity: 'error', message: 'Invalid JSON — ' + e.message });
    }
  },

  _voidTags: new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']),

  _checkTags(code, problems) {
    const src = code
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '');
    const stack = [];
    const re = /<\/?([a-zA-Z][\w-]*)(?:\s[^>]*)?\/?>/g;
    let m;
    while ((m = re.exec(src)) !== null) {
      const full = m[0];
      if (/^<\/?[!?]/.test(full)) continue;
      const name = m[1].toLowerCase();
      const ln = this._lineOf(src, m.index);
      const cl = this._colOf(src, m.index);
      if (full.startsWith('</')) {
        const open = stack.pop();
        if (open && open.name !== name) problems.push({ line: ln, col: cl, severity: 'warning', message: `Closing '</${name}>' does not match '<${open.name}>'` });
        else if (!open) problems.push({ line: ln, col: cl, severity: 'warning', message: `Unexpected closing tag '</${name}>'` });
      } else if (!full.endsWith('/>')) {
        if (!this._voidTags.has(name)) stack.push({ name, line: ln, col: cl });
      }
    }
    stack.forEach(s => problems.push({ line: s.line, col: s.col, severity: 'warning', message: `Unclosed tag '<${s.name}>'` }));
  },

  _checkJS(code, problems) {
    // ignore comments and string literals to avoid false positives
    const src = code
      .replace(/\/\/[^\n]*|\/\*[\s\S]*?\*\//g, '')
      .replace(/"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`/g, '""');
    const re = /console\.(log|debug)\s*\(/g;
    let m;
    while ((m = re.exec(src)) !== null) {
      problems.push({ line: this._lineOf(src, m.index), col: this._colOf(src, m.index), severity: 'info', message: `console.${m[1]}() left in code` });
    }
    const dbg = /\bdebugger\b/g;
    while ((m = dbg.exec(src)) !== null) {
      problems.push({ line: this._lineOf(src, m.index), col: this._colOf(src, m.index), severity: 'info', message: 'debugger statement left in code' });
    }
  },
};

// ============================================================
// Custom Textarea Editor (replaces CodeMirror 6)
// ============================================================

class TextEditor {
  constructor(container) {
    this.container = container;
    this.content = '';
    this.filename = '';
    this.listeners = {};
    this.fontSize = 14;
    this.tabSize = 2;

    this.editorWrapper = null;
    this.textarea = null;
    this.highlightLayer = null;
    this.lineNumbers = null;
    this.gutter = null;
    this.scrollSync = null;
    this._bracketMatchRange = null;
    this._errorRanges = null;
    this._minimapTimer = null;

    this._init();
  }

  _init() {
    this.editorWrapper = document.createElement('div');
    this.editorWrapper.className = 'editor-wrapper-custom';

    this.gutter = document.createElement('div');
    this.gutter.className = 'editor-gutter';
    this.lineNumbers = document.createElement('div');
    this.lineNumbers.className = 'editor-line-numbers';
    this.gutter.appendChild(this.lineNumbers);
    this.editorWrapper.appendChild(this.gutter);

    this.scrollSync = document.createElement('div');
    this.scrollSync.className = 'editor-scroll-sync';

    this.highlightLayer = document.createElement('div');
    this.highlightLayer.className = 'editor-highlight-layer';
    this.highlightLayer.setAttribute('aria-hidden', 'true');
    this.scrollSync.appendChild(this.highlightLayer);

    this.textarea = document.createElement('textarea');
    this.textarea.className = 'editor-textarea';
    this.textarea.spellcheck = false;
    this.textarea.autocapitalize = 'off';
    this.textarea.autocomplete = 'off';
    this.textarea.autocorrect = 'off';
    this.textarea.wrap = 'off';
    this.textarea.placeholder = 'Start typing or open a file...';
    this.scrollSync.appendChild(this.textarea);

    this.editorWrapper.appendChild(this.scrollSync);

    // Minimap
    this.minimap = document.createElement('div');
    this.minimap.className = 'editor-minimap';
    this.minimapContent = document.createElement('div');
    this.minimapContent.className = 'minimap-content';
    this.minimap.appendChild(this.minimapContent);
    this.minimapSlider = document.createElement('div');
    this.minimapSlider.className = 'minimap-slider';
    this.minimap.appendChild(this.minimapSlider);
    this.editorWrapper.appendChild(this.minimap);

    this.container.appendChild(this.editorWrapper);

    this._bindEvents();
    this._syncScroll();
    this._updateLineNumbers();
    this._buildMinimap();
    this.ac = new AutocompleteBox();
  }

  _bindEvents() {
    this.textarea.addEventListener('input', () => {
      this.content = this.textarea.value;
      this._updateHighlight();
      this._updateLineNumbers();
      this._emit('change', this.content);
      this._maybeAutocomplete();
      this._applyErrors();
      this._updateBracketHighlight();
      // Debounced minimap rebuild
      if (this._minimapTimer) clearTimeout(this._minimapTimer);
      this._minimapTimer = setTimeout(() => this._buildMinimap(), 300);
    });

    this.textarea.addEventListener('scroll', () => {
      this._syncScroll();
      this._syncMinimapScroll();
    });

    // Trigger bracket highlight on cursor movement
    this.textarea.addEventListener('keyup', (e) => {
      if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End','PageUp','PageDown'].includes(e.key)) {
        this._updateBracketHighlight();
      }
    });
    this.textarea.addEventListener('click', () => this._updateBracketHighlight());

    this.textarea.addEventListener('keydown', (e) => {
      if (this.ac && this.ac.isOpen()) {
        if (e.key === 'ArrowDown') { e.preventDefault(); this.ac.next(); return; }
        if (e.key === 'ArrowUp') { e.preventDefault(); this.ac.prev(); return; }
        if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); this.ac.accept(); return; }
        if (e.key === 'Escape') { this.ac.close(); return; }
      }
      // If Find & Replace is open, Escape should close it (handled in document keydown)
      if (e.key === 'Escape' && window.__POCKETIDE && window.__POCKETIDE.findReplace && window.__POCKETIDE.findReplace.isOpen) {
        return; // Let it bubble to document handler
      }

      // --- Auto-closing brackets/parens/quotes ---
      const PAIRS = { '(': ')', '{': '}', '[': ']', '"': '"', "'": "'", '`': '`' };
      const OPENERS = new Set(['(', '{', '[']);
      const CLOSERS = new Set([')', '}', ']']);
      const QUOTES = new Set(['"', "'", '`']);

      if (PAIRS[e.key] && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const start = this.textarea.selectionStart;
        const end = this.textarea.selectionEnd;
        const val = this.textarea.value;
        const sel = val.substring(start, end);

        // If text is selected, wrap it with the pair
        if (sel.length > 0) {
          e.preventDefault();
          const replacement = e.key + sel + PAIRS[e.key];
          this.textarea.value = val.substring(0, start) + replacement + val.substring(end);
          this.textarea.selectionStart = start + 1;
          this.textarea.selectionEnd = start + 1 + sel.length;
          this.content = this.textarea.value;
          this._updateHighlight();
          this._updateLineNumbers();
          this._emit('change', this.content);
          return;
        }

        // For quotes: if next char is same quote, skip over it instead of inserting
        if (QUOTES.has(e.key) && val[start] === e.key) {
          e.preventDefault();
          this.textarea.selectionStart = this.textarea.selectionEnd = start + 1;
          return;
        }

        // Auto-insert closing char and place cursor between
        e.preventDefault();
        this.textarea.value = val.substring(0, start) + e.key + PAIRS[e.key] + val.substring(end);
        this.textarea.selectionStart = this.textarea.selectionEnd = start + 1;
        this.content = this.textarea.value;
        this._updateHighlight();
        this._updateLineNumbers();
        this._emit('change', this.content);
        return;
      }

      // --- Enter key inside bracket pairs: smart newline ---
      if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const start = this.textarea.selectionStart;
        const val = this.textarea.value;
        const charBefore = val[start - 1];
        const charAfter = val[start];
        if ((charBefore === '(' && charAfter === ')') ||
            (charBefore === '{' && charAfter === '}') ||
            (charBefore === '[' && charAfter === ']')) {
          e.preventDefault();
          // Get current line's indentation
          const lineStart = val.lastIndexOf('\n', start - 1) + 1;
          const linePrefix = val.substring(lineStart, start);
          const indent = linePrefix.match(/^[ \t]*/)[0];
          const extraIndent = charBefore === '{' ? '  ' : '';
          const newline = '\n' + indent + extraIndent;
          const closingNewline = '\n' + indent;
          this.textarea.value = val.substring(0, start) + newline + closingNewline + val.substring(start);
          this.textarea.selectionStart = this.textarea.selectionEnd = start + newline.length;
          this.content = this.textarea.value;
          this._updateHighlight();
          this._updateLineNumbers();
          this._emit('change', this.content);
          return;
        }
      }

      // --- Backspace: delete both chars of an empty pair ---
      if (e.key === 'Backspace' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const start = this.textarea.selectionStart;
        const end = this.textarea.selectionEnd;
        if (start === end && start > 0) {
          const val = this.textarea.value;
          const before = val[start - 1];
          const after = val[start];
          if (PAIRS[before] === after) {
            e.preventDefault();
            this.textarea.value = val.substring(0, start - 1) + val.substring(start + 1);
            this.textarea.selectionStart = this.textarea.selectionEnd = start - 1;
            this.content = this.textarea.value;
            this._updateHighlight();
            this._updateLineNumbers();
            this._emit('change', this.content);
            return;
          }
        }
      }

      // --- Skip over closing char if typing it when it's already there ---
      if (CLOSERS.has(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const start = this.textarea.selectionStart;
        const end = this.textarea.selectionEnd;
        if (start === end && this.textarea.value[start] === e.key) {
          e.preventDefault();
          this.textarea.selectionStart = this.textarea.selectionEnd = start + 1;
          return;
        }
      }

      // --- Auto-close HTML tags ---
      if (e.key === '>' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const start = this.textarea.selectionStart;
        const val = this.textarea.value;
        // Look back to find <tagName
        const beforeCursor = val.substring(0, start);
        const tagMatch = beforeCursor.match(/<([a-zA-Z][a-zA-Z0-9-]*)\s*[^>]*$/);
        if (tagMatch) {
          const tagName = tagMatch[1].toLowerCase();
          const SELF_CLOSING = new Set(['area','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);
          if (!SELF_CLOSING.has(tagName) && !beforeCursor.endsWith('/')) {
            // Check it's not a closing tag (</div>)
            const charBeforeTag = beforeCursor[beforeCursor.lastIndexOf('<')];
            if (charBeforeTag !== '/') {
              e.preventDefault();
              const insert = '></' + tagName + '>';
              this.textarea.value = val.substring(0, start) + insert + val.substring(start);
              this.textarea.selectionStart = this.textarea.selectionEnd = start + 1;
              this.content = this.textarea.value;
              this._updateHighlight();
              this._updateLineNumbers();
              this._emit('change', this.content);
              return;
            }
          }
        }
      }

      // Auto-complete closing tag when typing </
      if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const start = this.textarea.selectionStart;
        const val = this.textarea.value;
        if (val[start - 1] === '<') {
          // Find the last unclosed opening tag
          const openTags = [];
          const tagRe = /<([a-zA-Z][a-zA-Z0-9-]*)(?:\s[^>]*)?>/g;
          let m;
          while ((m = tagRe.exec(val)) !== null) {
            if (m.index >= start) break;
            const SELF_CLOSING = new Set(['area','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);
            const tName = m[1].toLowerCase();
            const isClosing = val[m.index + 1] === '/';
            const isSelfClose = SELF_CLOSING.has(tName) || m[0].endsWith('/>');
            if (isClosing) {
              if (openTags.length && openTags[openTags.length - 1] === tName) openTags.pop();
            } else if (!isSelfClose) {
              openTags.push(tName);
            }
          }
          if (openTags.length > 0) {
            const lastTag = openTags[openTags.length - 1];
            e.preventDefault();
            const insert = '/' + lastTag + '>';
            this.textarea.value = val.substring(0, start) + insert + val.substring(start);
            this.textarea.selectionStart = this.textarea.selectionEnd = start + insert.length;
            this.content = this.textarea.value;
            this._updateHighlight();
            this._updateLineNumbers();
            this._emit('change', this.content);
            return;
          }
        }
      }

      if (e.key === 'Tab') {
        e.preventDefault();
        const start = this.textarea.selectionStart;
        const end = this.textarea.selectionEnd;
        const spaces = ' '.repeat(this.tabSize);

        if (e.shiftKey) {
          const beforeTab = this.textarea.value.substring(0, start);
          const lineStart = beforeTab.lastIndexOf('\n') + 1;
          const line = this.textarea.value.substring(lineStart, start);
          const indent = line.match(/^ +/);
          if (indent) {
            const remove = Math.min(indent[0].length, this.tabSize);
            this.textarea.value = this.textarea.value.substring(0, lineStart) +
              this.textarea.value.substring(lineStart + remove);
            this.textarea.selectionStart = this.textarea.selectionEnd = start - remove;
          }
        } else {
          this.textarea.value = this.textarea.value.substring(0, start) +
            spaces +
            this.textarea.value.substring(end);
          this.textarea.selectionStart = this.textarea.selectionEnd = start + spaces.length;
        }

        this.content = this.textarea.value;
        this._updateHighlight();
        this._updateLineNumbers();
        this._emit('change', this.content);
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        this._emit('save', this.content);
      }
    });

    this.textarea.addEventListener('focus', () => {
      this.editorWrapper.classList.add('focused');
    });
    this.textarea.addEventListener('blur', () => {
      this.editorWrapper.classList.remove('focused');
      if (this.ac) setTimeout(() => this.ac.close(), 200);
    });

    this.gutter.addEventListener('click', (e) => {
      const numEl = e.target.closest('.editor-line-number');
      if (numEl) {
        const line = parseInt(numEl.dataset.line);
        const lines = this.content.split('\n');
        let start = 0;
        for (let i = 0; i < line - 1; i++) start += lines[i].length + 1;
        const end = start + lines[line - 1].length;
        this.textarea.focus();
        this.textarea.selectionStart = start;
        this.textarea.selectionEnd = end;
      }
    });

    // Minimap click to jump
    this.minimap.addEventListener('click', (e) => this._minimapClick(e));
  }

  _syncScroll() {
    if (this.highlightLayer && this.textarea) {
      this.highlightLayer.scrollTop = this.textarea.scrollTop;
      this.highlightLayer.scrollLeft = this.textarea.scrollLeft;
    }
  }

  // Build a map from raw char index -> HTML char index
  _buildHtmlMap(html, rawLen) {
    let htmlPos = 0, rawPos = 0;
    const map = [];
    while (rawPos < rawLen && htmlPos < html.length) {
      if (html.substring(htmlPos, htmlPos + 4) === '&amp;') { map.push(htmlPos); htmlPos += 5; rawPos++; }
      else if (html.substring(htmlPos, htmlPos + 3) === '&lt;') { map.push(htmlPos); htmlPos += 4; rawPos++; }
      else if (html.substring(htmlPos, htmlPos + 3) === '&gt;') { map.push(htmlPos); htmlPos += 4; rawPos++; }
      else if (html[htmlPos] === '<') {
        const tagEnd = html.indexOf('>', htmlPos);
        if (tagEnd >= 0) { htmlPos = tagEnd + 1; } else { map.push(htmlPos); htmlPos++; rawPos++; }
      } else {
        map.push(htmlPos); htmlPos++; rawPos++;
      }
    }
    return map;
  }

  // Wrap a range [start, end) of raw positions with a CSS class in the HTML string
  _wrapRange(html, htmlMap, start, end, cls) {
    const hStart = htmlMap[start];
    const hEnd = htmlMap[end - 1];
    if (hStart === undefined || hEnd === undefined) return html;
    const tagOpen = `<span class="${cls}">`;
    const tagClose = '</span>';
    // Insert end first to preserve start index
    let result = html.substring(0, hEnd) + tagOpen + html[hEnd] + tagClose + html.substring(hEnd + 1);
    const shift = tagOpen.length + tagClose.length;
    const adjStart = (hEnd > hStart) ? hStart : hStart + shift;
    result = result.substring(0, adjStart) + tagOpen + result[adjStart] + tagClose + result.substring(adjStart + 1);
    return result;
  }

  _updateHighlight() {
    const highlighted = SyntaxHighlighter.highlight(this.content, this.filename);
    let result = highlighted;
    const raw = this.content;
    const htmlMap = this._buildHtmlMap(highlighted, raw.length);

    // 1. Error squiggly underlines
    if (this._errorRanges && this._errorRanges.length > 0) {
      // Apply from end to start to keep indices stable
      const sorted = this._errorRanges.slice().sort((a, b) => b.start - a.start);
      for (const err of sorted) {
        result = this._wrapRange(result, htmlMap, err.start, err.end, 'squiggly-error');
      }
    }

    // 2. Bracket pair matching highlight
    if (this._bracketMatchRange) {
      const [hStart, hEnd] = this._bracketMatchRange;
      result = this._wrapRange(result, htmlMap, hStart, hEnd + 1, 'hl-bracket-match');
    }

    this.highlightLayer.innerHTML = result + '\n';
  }

  _updateLineNumbers() {
    const lines = this.content.split('\n');
    const count = lines.length || 1;
    this.lineNumbers.innerHTML = '';
    for (let i = 1; i <= count; i++) {
      const num = document.createElement('div');
      num.className = 'editor-line-number';
      num.dataset.line = i;
      num.textContent = i;
      this.lineNumbers.appendChild(num);
    }
  }

  // --- Bracket pair matching highlight ---
  _updateBracketHighlight() {
    const pos = this.textarea.selectionStart;
    if (pos !== this.textarea.selectionEnd) return; // skip if selection
    const val = this.textarea.value;
    const MATCH = { '(': ')', ')': '(', '{': '}', '}': '{', '[': ']', ']': '[' };
    const char = val[pos] || val[pos - 1];
    if (!char || !MATCH[char]) return;

    const isForward = val[pos] === char && MATCH[char] !== char;
    const searchChar = isForward ? char : MATCH[char];
    const openChar = (char === '(' || char === '{' || char === '[') ? char : MATCH[char];
    const closeChar = MATCH[openChar];
    const dir = (char === openChar) ? 1 : -1;
    let depth = 0;
    let startIdx = -1, endIdx = -1;
    const from = (char === openChar) ? pos : pos - 1;

    for (let i = from; i >= 0 && i < val.length; i += dir) {
      if (val[i] === openChar) depth++;
      else if (val[i] === closeChar) depth--;
      if (depth === 0) {
        if (dir === 1) { startIdx = from; endIdx = i; }
        else { startIdx = i; endIdx = from; }
        break;
      }
    }
    if (startIdx < 0) return;

    // Apply highlight class to the matched pair in the highlight layer
    // We do this by wrapping matched chars in a span with a special class
    const raw = this.content;
    const hStart = startIdx;
    const hEnd = endIdx;
    // Rebuild highlight with bracket match markers
    this._bracketMatchRange = [hStart, hEnd];
  }

  _clearBracketHighlight() {
    this._bracketMatchRange = null;
  }

  // --- Error squiggly underline detection ---
  _detectErrors() {
    const errors = [];
    const val = this.content;
    if (!val || val.length > 200000) return errors;
    const lang = LanguageDetector.detect(this.filename).name;

    // 1. Unmatched brackets
    const stack = [];
    const PAIRS = { '(': '(', '{': '{', '[': '[' };
    const CLOSES = { ')': '(', '}': '{', ']': '[' };
    let inString = false;
    let stringChar = '';
    let inLineComment = false;
    let inBlockComment = false;

    for (let i = 0; i < val.length; i++) {
      const ch = val[i];
      const next = val[i + 1];

      // Track string state
      if (!inLineComment && !inBlockComment) {
        if ((ch === '"' || ch === "'" || ch === '`') && val[i - 1] !== '\\') {
          if (inString && ch === stringChar) {
            inString = false;
            continue;
          }
          if (!inString) {
            inString = true;
            stringChar = ch;
            continue;
          }
        }
      }

      if (inString) continue;

      // Track comments
      if (!inLineComment && !inBlockComment && ch === '/' && next === '/') { inLineComment = true; continue; }
      if (!inLineComment && !inBlockComment && ch === '/' && next === '*') { inBlockComment = true; i++; continue; }
      if (inLineComment && ch === '\n') { inLineComment = false; continue; }
      if (inBlockComment && ch === '*' && next === '/') { inBlockComment = false; i++; continue; }
      if (inLineComment || inBlockComment) continue;

      // Track brackets
      if (PAIRS[ch]) { stack.push({ char: ch, pos: i }); }
      else if (CLOSES[ch]) {
        if (stack.length > 0 && stack[stack.length - 1].char === CLOSES[ch]) {
          stack.pop();
        } else {
          errors.push({ start: i, end: i + 1, type: 'unmatched-bracket' });
        }
      }
    }
    // Remaining unclosed open brackets
    for (const item of stack) {
      errors.push({ start: item.pos, end: item.pos + 1, type: 'unmatched-bracket' });
    }

    // 2. Unclosed strings (only if not in a string at end of file)
    if (inString) {
      // Find where the unclosed string started
      for (let i = val.length - 1; i >= 0; i--) {
        if (val[i] === stringChar && val[i - 1] !== '\\') {
          errors.push({ start: i, end: val.length, type: 'unclosed-string' });
          break;
        }
      }
    }

    // 3. Non-HTML: stray angle brackets that look like broken tags (JS/Python/C++/JSON)
    if (['JavaScript','TypeScript','JSX','TSX','Python','C++','C','C#','JSON'].includes(lang)) {
      const tagRe = /<[a-zA-Z][a-zA-Z0-9]*(?:\s|>|\/)/g;
      let tm;
      while ((tm = tagRe.exec(val)) !== null) {
        // Skip if it's in a comment or string (rough check)
        const before = val.substring(0, tm.index);
        const singleQuotes = (before.match(/'/g) || []).length % 2;
        const doubleQuotes = (before.match(/"/g) || []).length % 2;
        const backticks = (before.match(/`/g) || []).length % 2;
        if (singleQuotes || doubleQuotes || backticks) continue;
        errors.push({ start: tm.index, end: tm.index + tm[0].length, type: 'stray-tag' });
      }
    }

    return errors;
  }

  _applyErrors() {
    const errors = this._detectErrors();
    this._errorRanges = errors.length > 0 ? errors : null;
  }

  // --- Minimap ---
  _buildMinimap() {
    if (!this.minimapContent) return;
    const lines = this.content.split('\n');
    const frag = document.createDocumentFragment();
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const div = document.createElement('div');
      div.className = 'minimap-line';
      // Approximate width: 1 char ≈ 2px at minimap scale
      const charCount = line.length;
      const width = Math.min(charCount * 2, 56);
      div.style.width = width + 'px';
      // Color hint based on line content
      const trimmed = line.trim();
      if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*') || trimmed.startsWith('#')) {
        div.style.background = 'rgba(106,153,85,0.4)'; // comment green
      } else if (/^\s*<[a-zA-Z]/.test(line)) {
        div.style.background = 'rgba(86,156,214,0.4)'; // tag blue
      } else if (/^\s*(function|const|let|var|class|if|else|for|while|return|def|import|from|public|private|static|struct|void|int|float|double|char|bool|using|namespace|include)\b/.test(line)) {
        div.style.background = 'rgba(197,134,192,0.3)'; // keyword purple
      } else if (/['"]/.test(trimmed[0]) || /^\s*["']/.test(line)) {
        div.style.background = 'rgba(206,145,120,0.3)'; // string orange
      } else {
        div.style.background = 'rgba(200,200,200,0.12)'; // default
      }
      frag.appendChild(div);
    }
    this.minimapContent.innerHTML = '';
    this.minimapContent.appendChild(frag);
    this._syncMinimapScroll();
  }

  _syncMinimapScroll() {
    if (!this.minimapSlider || !this.textarea) return;
    const ta = this.textarea;
    const scrollRatio = ta.scrollTop / (ta.scrollHeight || 1);
    const viewRatio = ta.clientHeight / (ta.scrollHeight || 1);
    const sliderHeight = Math.max(viewRatio * 100, 10);
    const sliderTop = scrollRatio * 100;
    this.minimapSlider.style.height = sliderHeight + '%';
    this.minimapSlider.style.top = sliderTop + '%';
    // Also scroll the minimap content
    const minimapScroll = this.minimapContent.scrollHeight - this.minimap.clientHeight;
    this.minimapContent.scrollTop = scrollRatio * minimapScroll;
  }

  _minimapClick(e) {
    if (!this.textarea || !this.minimap) return;
    const rect = this.minimap.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const ratio = y / rect.height;
    const lines = this.content.split('\n');
    const targetLine = Math.floor(ratio * lines.length);
    let charPos = 0;
    for (let i = 0; i < targetLine && i < lines.length; i++) {
      charPos += lines[i].length + 1;
    }
    this.textarea.focus();
    this.textarea.selectionStart = this.textarea.selectionEnd = charPos;
    // Scroll to center that line
    const lineHeight = parseFloat(getComputedStyle(this.textarea).lineHeight) || 21;
    this.textarea.scrollTop = (targetLine * lineHeight) - (this.textarea.clientHeight / 2);
    this._syncMinimapScroll();
    this._updateBracketHighlight();
  }

  _collectDocWords() {
    const words = new Set();
    const re = /[A-Za-z_$][\w$]*/g;
    let m;
    while ((m = re.exec(this.content))) words.add(m[0]);
    return words;
  }

  _maybeAutocomplete() {
    if (!this.ac) return;
    const ta = this.textarea;
    // skip on very large documents to keep mobile typing smooth
    if (ta.value.length > 150000) { this.ac.close(); return; }
    const pos = ta.selectionStart;
    const before = ta.value.slice(0, pos);
    const m = before.match(/[A-Za-z_$][\w$]*$/);
    if (!m || m[0].length === 0) { this.ac.close(); return; }
    const prefix = m[0];
    const suggestions = Autocomplete.suggest(this.filename, prefix, this._collectDocWords());
    if (!suggestions.length) { this.ac.close(); return; }
    this.ac.show({ editor: this, prefix, suggestions });
  }

  setValue(text) {
    text = text || '';
    if (this.ac) this.ac.close();
    if (this.textarea.value !== text) {
      this.textarea.value = text;
      this.content = text;
      this._applyErrors();
      this._updateHighlight();
      this._updateLineNumbers();
      this.textarea.selectionStart = this.textarea.selectionEnd = 0;
      this.textarea.scrollTop = 0;
      this.textarea.scrollLeft = 0;
    }
  }

  getValue() { return this.content; }

  setFilename(name) {
    this.filename = name || '';
    this._updateHighlight();
    const langEl = document.getElementById('status-language');
    if (langEl) langEl.textContent = LanguageDetector.getLanguageName(this.filename);
  }

  setFontSize(size) {
    this.fontSize = Math.max(10, Math.min(32, size));
    this.editorWrapper.style.fontSize = this.fontSize + 'px';
  }

  focus() { this.textarea.focus(); }

  getCursor() {
    const pos = this.textarea.selectionStart;
    const text = this.textarea.value;
    const before = text.substring(0, pos);
    const line = (before.match(/\n/g) || []).length + 1;
    const lastNewline = before.lastIndexOf('\n');
    const col = pos - lastNewline;
    return { line, col };
  }

  setCursor(line, col) {
    const lines = this.content.split('\n');
    let pos = 0;
    for (let i = 0; i < Math.min(line - 1, lines.length - 1); i++) pos += lines[i].length + 1;
    pos += Math.max(0, Math.min(col - 1, lines[Math.min(line - 1, lines.length - 1)].length));
    this.textarea.focus();
    this.textarea.selectionStart = this.textarea.selectionEnd = pos;
  }

  on(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
    return { dispose: () => { this.listeners[event] = this.listeners[event].filter(c => c !== callback); } };
  }

  _emit(event, data) {
    (this.listeners[event] || []).forEach(cb => cb(data));
  }

  destroy() {
    if (this.editorWrapper && this.editorWrapper.parentNode) this.editorWrapper.parentNode.removeChild(this.editorWrapper);
  }
}

// ============================================================
// File Icons — crisp extension badges (no emojis)
// ============================================================

const FileIcons = {
  map: {
    js: ['#f7df1e', 'JS'], mjs: ['#f7df1e', 'JS'], cjs: ['#f7df1e', 'JS'],
    ts: ['#3178c6', 'TS'], mts: ['#3178c6', 'TS'], cts: ['#3178c6', 'TS'],
    jsx: ['#61dafb', 'JSX'], tsx: ['#61dafb', 'TSX'],
    py: ['#3572a5', 'PY'], html: ['#e34f26', 'HTML'], htm: ['#e34f26', 'HTML'],
    css: ['#563d7c', 'CSS'], scss: ['#cd6799', 'SCSS'], sass: ['#cd6799', 'SASS'],
    json: ['#f5a623', 'JSON'], md: ['#4aa3df', 'MD'], mdown: ['#4aa3df', 'MD'], markdown: ['#4aa3df', 'MD'],
    txt: ['#9aa0a6', 'TXT'], cpp: ['#659ad2', 'C++'], cc: ['#659ad2', 'C++'], cxx: ['#659ad2', 'C++'],
    c: ['#659ad2', 'C'], h: ['#a074c4', 'H'], hpp: ['#a074c4', 'HPP'],
    java: ['#e76f00', 'JAVA'], rs: ['#dea584', 'RS'], go: ['#00add8', 'GO'],
    rb: ['#cc342d', 'RB'], php: ['#777bb4', 'PHP'], swift: ['#f05138', 'SW'],
    kt: ['#7f52ff', 'KT'], dart: ['#00b4ab', 'DA'], sh: ['#4eaa25', 'SH'],
    bash: ['#4eaa25', 'SH'], zsh: ['#4eaa25', 'SH'], bat: ['#9aa0a6', 'BAT'], cmd: ['#9aa0a6', 'CMD'],
    yml: ['#cb171e', 'YML'], yaml: ['#cb171e', 'YAML'], toml: ['#9c4221', 'TOML'],
    xml: ['#e34f26', 'XML'], svg: ['#ffb13b', 'SVG'], sql: ['#e38c00', 'SQL'],
    vue: ['#41b883', 'VUE'], lua: ['#000080', 'LUA'], r: ['#2266aa', 'R'],
    cs: ['#68217a', 'CS'], fs: ['#672179', 'FS'], ex: ['#7d53a4', 'EX'], exs: ['#7d53a4', 'EXS'],
    erl: ['#b83998', 'ERL'], hs: ['#5e5086', 'HS'], zig: ['#f7a41d', 'ZIG'],
    env: ['#d4a72c', 'ENV'], lock: ['#9aa0a6', 'LOCK'], gitignore: ['#9aa0a6', 'GIT'],
  },

  html(filename) {
    const ext = (filename.split('.').pop() || '').toLowerCase();
    const def = this.map[ext];
    if (!def) {
      return '<svg class="fi" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>';
    }
    const [color, label] = def;
    const fontSize = label.length > 3 ? 6.2 : 7.2;
    return `<svg class="fi" width="18" height="18" viewBox="0 0 18 18"><rect x="1" y="1" width="16" height="16" rx="3.5" fill="${color}1f" stroke="${color}" stroke-width="1.1"/><text x="9" y="11.6" font-size="${fontSize}" font-weight="700" font-family="-apple-system, 'Segoe UI', Roboto, sans-serif" text-anchor="middle" fill="${color}">${label}</text></svg>`;
  },
};

// ============================================================
// File Tree
// ============================================================

class FileTree {
  constructor(container, callbacks = {}) {
    this.container = container;
    this.callbacks = callbacks;
    this.nodes = [];
    this.selectedPath = null;
    this.expandedFolders = new Set();
    this.init();
  }

  init() {
    this.container.addEventListener('click', (e) => this.handleClick(e));
    this.container.addEventListener('contextmenu', (e) => this.handleContextMenu(e));
    document.addEventListener('click', () => this.closeContextMenu());
  }


  buildFromFileList(files) {
    const root = [];
    files.forEach(file => {
      const parts = file.path.split('/').filter(Boolean);
      let currentLevel = root;
      let currentPath = '';
      parts.forEach((part, index) => {
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        const isLast = index === parts.length - 1;
        if (isLast) {
          currentLevel.push({ name: part, type: 'file', path: currentPath });
        } else {
          let existing = currentLevel.find(n => n.name === part && n.type === 'folder');
          if (!existing) {
            existing = { name: part, type: 'folder', children: [], path: currentPath };
            currentLevel.push(existing);
          }
          currentLevel = existing.children;
        }
      });
    });
    this.nodes = this.sortTree(root);
    this.render();
  }

  sortTree(nodes) {
    const sorted = [...nodes].sort((a, b) => {
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    sorted.forEach(n => { if (n.children) n.children = this.sortTree(n.children); });
    return sorted;
  }

  selectFile(path) { this.selectedPath = path; this.render(); }

  revealPath(path) {
    if (!path) return;
    const parts = path.split('/').filter(Boolean);
    let currentPath = '';
    parts.forEach((part, index) => {
      if (index < parts.length - 1) {
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        this.expandedFolders.add(currentPath);
      }
    });
    this.render();
  }

  render() {
    this.container.innerHTML = '';
    this.nodes.forEach(node => this.renderNode(node, '', this.container));
  }

  renderNode(node, parentPath, parentElement) {
    const item = document.createElement('div');
    item.className = 'tree-item';
    item.dataset.type = node.type;
    item.dataset.path = node.path || node.name;
    if (node.type === 'file') {
      const ext = node.name.split('.').pop().toLowerCase();
      item.dataset.ext = ext;
    }
    if (node.path === this.selectedPath) item.classList.add('active');

    if (node.type === 'folder') {
      const isExpanded = this.expandedFolders.has(node.path);
      const chevron = document.createElement('span');
      chevron.className = `chevron${isExpanded ? ' expanded' : ''}`;
      chevron.textContent = '▶';
      item.appendChild(chevron);
      const icon = document.createElement('span');
      icon.className = 'icon';
      icon.innerHTML = isExpanded
        ? '<svg class="fi fi-folder"><use href="#i-folder-open"/></svg>'
        : '<svg class="fi fi-folder"><use href="#i-folder"/></svg>';
      item.appendChild(icon);
    } else {
      const icon = document.createElement('span');
      icon.className = 'icon';
      icon.innerHTML = this.getFileIcon(node.name);
      item.appendChild(icon);
    }

    const label = document.createElement('span');
    label.className = 'label';
    label.textContent = node.name;
    item.appendChild(label);
    parentElement.appendChild(item);

    if (node.type === 'folder' && node.children) {
      const childrenContainer = document.createElement('div');
      childrenContainer.className = 'tree-children';
      if (!this.expandedFolders.has(node.path)) childrenContainer.classList.add('collapsed');
      node.children.forEach(child => this.renderNode(child, node.path, childrenContainer));
      parentElement.appendChild(childrenContainer);
    }

    item._node = node;
  }

  getFileIcon(filename) {
    return FileIcons.html(filename);
  }

  handleClick(e) {
    const item = e.target.closest('.tree-item');
    if (!item) return;
    const node = item._node;
    if (!node) return;
    if (node.type === 'folder') {
      if (this.expandedFolders.has(node.path)) this.expandedFolders.delete(node.path);
      else this.expandedFolders.add(node.path);
      this.render();
    } else if (node.type === 'file') {
      this.selectedPath = node.path;
      this.render();
      if (this.callbacks.onFileSelect) this.callbacks.onFileSelect(node.path);
    }
  }

  handleContextMenu(e) {
    const item = e.target.closest('.tree-item');
    if (!item) return;
    e.preventDefault();
    e.stopPropagation();
    const node = item._node;
    if (!node) return;
    this.showContextMenu(e.clientX, e.clientY, node);
  }

  showContextMenu(x, y, node) {
    const menu = document.getElementById('context-menu');
    if (!menu) return;
    const items = menu.querySelectorAll('.context-menu-item');
    items.forEach(item => {
      const action = item.dataset.action;
      item.style.display = 'block';
      if (node.type === 'file' && (action === 'new-file' || action === 'new-folder')) {
        item.style.display = 'none';
      }
    });
    menu.style.display = 'block';
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
    menu._targetNode = node;

    const handler = (e) => {
      const action = e.target.dataset.action;
      if (!action) return;
      e.preventDefault();
      this.executeContextAction(action, node);
      this.closeContextMenu();
      menu.removeEventListener('click', handler);
    };
    menu.addEventListener('click', handler);
  }

  closeContextMenu() {
    const menu = document.getElementById('context-menu');
    if (menu) menu.style.display = 'none';
  }

  executeContextAction(action, node) {
    switch (action) {
      case 'open':
        if (node.type === 'file' && this.callbacks.onFileSelect) this.callbacks.onFileSelect(node.path);
        break;
      case 'preview':
        if (node.type === 'file' && this.callbacks.onFileSelect) this.callbacks.onFileSelect(node.path);
        break;
      case 'rename':
        this.promptRename(node);
        break;
      case 'delete':
        if (this.callbacks.onFileDelete) this.callbacks.onFileDelete(node.path);
        break;
      case 'new-file':
        this.promptNewFile(node);
        break;
      case 'new-folder':
        this.promptNewFolder(node);
        break;
      case 'copy':
        if (this.callbacks.onFileCopy) this.callbacks.onFileCopy(node.path);
        break;
      case 'cut':
        if (this.callbacks.onFileCut) this.callbacks.onFileCut(node.path);
        break;
      case 'paste':
        if (this.callbacks.onFilePaste) this.callbacks.onFilePaste(node.path ? node.path : '');
        break;
      case 'duplicate':
        if (this.callbacks.onFileDuplicate) this.callbacks.onFileDuplicate(node.path);
        break;
      case 'copy-path':
        if (this.callbacks.onCopyPath) this.callbacks.onCopyPath(node.path);
        break;
      case 'copy-relative-path':
        if (this.callbacks.onCopyPath) this.callbacks.onCopyPath(node.path);
        break;
    }
  }

  promptRename(node) {
    this.showInputModal('Rename', 'Enter new name:', node.name, (newName) => {
      if (newName && newName !== node.name && this.callbacks.onFileRename) {
        this.callbacks.onFileRename(node.path, newName);
      }
    });
  }

  promptNewFile(node) {
    const parentPath = node.type === 'folder' ? node.path : '';
    this.showInputModal('New File', 'e.g. main.py, index.cpp', '', (name) => {
      if (name && this.callbacks.onNewFile) this.callbacks.onNewFile(parentPath, name);
    }, { chips: true });
  }

  promptNewFolder(node) {
    const parentPath = node.type === 'folder' ? node.path : '';
    this.showInputModal('New Folder', 'Enter folder name:', '', (name) => {
      if (name && this.callbacks.onNewFolder) this.callbacks.onNewFolder(parentPath, name);
    });
  }

  showInputModal(titleText, placeholder, defaultValue, onConfirm, opts = {}) {
    const modal = document.getElementById('modal-overlay');
    const title = document.getElementById('modal-title');
    const subtitle = document.getElementById('modal-subtitle');
    const input = document.getElementById('modal-input');
    const chipsEl = document.getElementById('modal-input-chips');
    const confirm = document.getElementById('modal-confirm');
    const cancel = document.getElementById('modal-cancel');
    if (!modal) return;

    title.textContent = titleText;
    if (subtitle) subtitle.style.display = opts.chips ? 'block' : 'none';
    input.value = defaultValue || '';
    input.placeholder = placeholder;
    input.select();
    modal.style.display = 'flex';

    if (chipsEl) {
      chipsEl.innerHTML = '';
      if (opts.chips) {
        const EXTS = ['py', 'cpp', 'js', 'html', 'css', 'ts', 'md', 'json', 'java', 'go', 'rs', 'rb', 'txt'];
        EXTS.forEach(ext => {
          const chip = document.createElement('button');
          chip.type = 'button';
          chip.className = 'modal-chip';
          chip.textContent = '.' + ext;
          chip.addEventListener('click', (e) => {
            e.preventDefault();
            const base = input.value.replace(/\.[^.]+$/, '') || 'index';
            input.value = base + '.' + ext;
            input.focus();
            input.setSelectionRange(input.value.length, input.value.length);
          });
          chipsEl.appendChild(chip);
        });
      }
    }

    const handleConfirm = () => {
      const value = input.value.trim();
      if (value) onConfirm(value);
      close();
    };
    const handleKeydown = (e) => {
      if (e.key === 'Enter') handleConfirm();
      if (e.key === 'Escape') close();
    };
    const close = () => {
      modal.style.display = 'none';
      confirm.removeEventListener('click', handleConfirm);
      cancel.removeEventListener('click', close);
      input.removeEventListener('keydown', handleKeydown);
    };
    confirm.addEventListener('click', handleConfirm);
    cancel.addEventListener('click', close);
    input.addEventListener('keydown', handleKeydown);
    setTimeout(() => input.focus(), 100);
  }
}

// ============================================================
// Tab Manager
// ============================================================

class TabManager {
  constructor(container, callbacks = {}) {
    this.container = container;
    this.callbacks = callbacks;
    this.tabs = [];
    this.activeTabId = null;
    this.tabCounter = 0;
    this.init();
  }

  init() {
    this.container.addEventListener('click', (e) => this.handleClick(e));
    this.container.addEventListener('wheel', (e) => this.handleScroll(e), { passive: true });
  }

  openTab(path, label) {
    const existing = this.tabs.find(t => t.path === path);
    if (existing) { this.activateTab(existing.id); return existing; }
    const tab = {
      id: `tab-${++this.tabCounter}`,
      label: label || path.split('/').pop() || path,
      path, dirty: false, active: true,
    };
    this.tabs.forEach(t => t.active = false);
    this.tabs.push(tab);
    this.activeTabId = tab.id;
    this.render();
    if (this.callbacks.onTabOpen) this.callbacks.onTabOpen(tab);
    return tab;
  }

  closeTab(tabId) { const i = this.tabs.findIndex(t => t.id === tabId); if (i >= 0) this.forceCloseTab(tabId); }

  forceCloseTab(tabId) {
    const index = this.tabs.findIndex(t => t.id === tabId);
    if (index === -1) return;
    const wasActive = this.tabs[index].active;
    this.tabs.splice(index, 1);
    if (wasActive && this.tabs.length > 0) {
      const newIndex = Math.min(index, this.tabs.length - 1);
      this.activateTab(this.tabs[newIndex].id);
    } else if (this.tabs.length === 0) {
      this.activeTabId = null;
      if (this.callbacks.onNoTabs) this.callbacks.onNoTabs();
    }
    this.render();
    if (this.callbacks.onTabClose) this.callbacks.onTabClose(tabId);
  }

  activateTab(tabId) {
    if (this.activeTabId === tabId) return;
    this.tabs.forEach(t => t.active = t.id === tabId);
    this.activeTabId = tabId;
    this.render();
    const tab = this.tabs.find(t => t.id === tabId);
    if (tab && this.callbacks.onTabActivate) this.callbacks.onTabActivate(tab);
  }

  setTabDirty(path, dirty) {
    const tab = this.tabs.find(t => t.path === path);
    if (tab) { tab.dirty = dirty; this.render(); }
    if (this.callbacks.onDirtyChange) this.callbacks.onDirtyChange();
  }

  getActiveTab() { return this.tabs.find(t => t.active) || null; }
  getTabByPath(path) { return this.tabs.find(t => t.path === path) || null; }

  render() {
    this.container.innerHTML = '';
    this.tabs.forEach(tab => {
      const tabEl = document.createElement('div');
      tabEl.className = `tab${tab.active ? ' active' : ''}`;
      tabEl.dataset.tabId = tab.id;
      const label = document.createElement('span');
      label.className = 'tab-label';
      label.textContent = tab.label;
      tabEl.appendChild(label);
      if (tab.dirty) {
        const dirty = document.createElement('span');
        dirty.className = 'tab-dirty';
        tabEl.appendChild(dirty);
      } else {
        const close = document.createElement('button');
        close.className = 'tab-close';
        close.textContent = '×';
        close.title = 'Close tab';
        tabEl.appendChild(close);
      }
      this.container.appendChild(tabEl);
    });
    const active = this.container.querySelector('.tab.active');
    if (active) active.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  }

  handleClick(e) {
    const closeBtn = e.target.closest('.tab-close');
    if (closeBtn) {
      const tab = closeBtn.closest('.tab');
      if (tab) { e.stopPropagation(); this.closeTab(tab.dataset.tabId); }
      return;
    }
    const tabEl = e.target.closest('.tab');
    if (tabEl) this.activateTab(tabEl.dataset.tabId);
  }

  handleScroll(e) { if (e.deltaY !== 0) this.container.scrollLeft += e.deltaY; }
}

// ============================================================
// Storage Manager (localStorage-based, replaces backend API)
// ============================================================

const Storage = {
  _prefix: 'pocketide_',
  _key(key) { return this._prefix + key; },

  listProjects() {
    try { const d = localStorage.getItem(this._key('projects')); return d ? JSON.parse(d) : []; }
    catch { return []; }
  },

  saveProject(project) {
    const projects = this.listProjects();
    const idx = projects.findIndex(p => p.id === project.id);
    if (idx >= 0) projects[idx] = { ...projects[idx], ...project };
    else projects.push(project);
    localStorage.setItem(this._key('projects'), JSON.stringify(projects));
  },

  _getFileKey(projectId, filePath) { return this._key(`files_${projectId}_${filePath}`); },

  getProjectFilePaths(projectId) {
    const prefix = this._key(`files_${projectId}_`);
    const paths = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) paths.push(key.substring(prefix.length));
    }
    return paths.sort();
  },

  readFile(projectId, filePath) {
    try { const d = localStorage.getItem(this._getFileKey(projectId, filePath)); return d ? JSON.parse(d) : null; }
    catch { return null; }
  },

  writeFile(projectId, filePath, content) {
    const data = { content, path: filePath, updatedAt: new Date().toISOString() };
    localStorage.setItem(this._getFileKey(projectId, filePath), JSON.stringify(data));
    return data;
  },

  deleteFile(projectId, filePath) { localStorage.removeItem(this._getFileKey(projectId, filePath)); },

  renameFile(projectId, oldPath, newPath) {
    const data = this.readFile(projectId, oldPath);
    if (data) { this.writeFile(projectId, newPath, data.content); this.deleteFile(projectId, oldPath); }
  },

  initDefaultProject() {
    let projects = this.listProjects();
    if (projects.length === 0) {
      const defaultProject = { id: 'default', name: 'My Project', description: 'Start with a clean workspace', createdAt: new Date().toISOString(), fileCount: 0 };
      this.saveProject(defaultProject);
    }
    return projects.length > 0 ? projects[0] : this.listProjects()[0];
  },

  getProjectFilesList(projectId) {
    return this.getProjectFilePaths(projectId).map(p => ({ path: p }));
  },
};

// ============================================================
// Native File System — Reads/writes files on the user's machine
// using the File System Access API (showDirectoryPicker)
// ============================================================

class NativeFileSystem {
  constructor(dirHandle) {
    this.rootHandle = dirHandle;
    this._name = dirHandle.name;
  }

  get name() { return this._name; }

  async _resolve(path) {
    if (!path || path === '/') return { parent: this.rootHandle, name: '' };
    const parts = path.split('/').filter(Boolean);
    const name = parts.pop();
    let dir = this.rootHandle;
    for (const part of parts) {
      try { dir = await dir.getDirectoryHandle(part); }
      catch { dir = await dir.getDirectoryHandle(part, { create: true }); }
    }
    return { parent: dir, name };
  }

  async readFile(path) {
    try {
      const { parent, name } = await this._resolve(path);
      const fileHandle = await parent.getFileHandle(name);
      const file = await fileHandle.getFile();
      return await file.text();
    } catch { return null; }
  }

  async writeFile(path, content) {
    const { parent, name } = await this._resolve(path);
    const fileHandle = await parent.getFileHandle(name, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(content);
    await writable.close();
  }

  async deleteFile(path) {
    try { const { parent, name } = await this._resolve(path); await parent.removeEntry(name); }
    catch (e) { console.warn('NativeFS deleteFile error:', e); }
  }

  async renameFile(oldPath, newPath) {
    const content = await this.readFile(oldPath);
    if (content !== null) { await this.writeFile(newPath, content); await this.deleteFile(oldPath); }
  }

  async ensureDirectory(path) {
    const parts = path.split('/').filter(Boolean);
    let dir = this.rootHandle;
    for (const part of parts) { dir = await dir.getDirectoryHandle(part, { create: true }); }
  }

  async listFiles() {
    const results = [];
    await this._walk(this.rootHandle, '', results);
    return results.sort((a, b) => a.path.localeCompare(b.path));
  }

  async _walk(dirHandle, prefix, results) {
    const entries = [];
    for await (const entry of dirHandle.values()) entries.push(entry);
    const dirs = entries.filter(e => e.kind === 'directory');
    const files = entries.filter(e => e.kind === 'file');
    for (const dir of dirs) {
      const dirPath = prefix ? `${prefix}/${dir.name}` : dir.name;
      try { const sub = await dirHandle.getDirectoryHandle(dir.name); await this._walk(sub, dirPath, results); }
      catch { }
    }
    for (const file of files) {
      const filePath = prefix ? `${prefix}/${file.name}` : file.name;
      results.push({ path: filePath, name: file.name });
    }
  }

  static isSupported() { return 'showDirectoryPicker' in window; }

  static async pickFolder() {
    if (!this.isSupported()) throw new Error('File System Access API is not supported in this browser.');
    const dirHandle = await window.showDirectoryPicker();
    const perm = await dirHandle.queryPermission({ mode: 'readwrite' });
    if (perm !== 'granted' && (await dirHandle.requestPermission({ mode: 'readwrite' })) !== 'granted') {
      throw new Error('Permission denied — cannot access the selected folder.');
    }
    return new NativeFileSystem(dirHandle);
  }
}

// ============================================================
// Git Integration — fully offline via vendored isomorphic-git.
//
// GitFS maps the project's workspace files onto the SAME
// localStorage the editor uses, so git and the file tree always
// agree. The .git/ metadata lives in its own namespace.
// ============================================================

const GitFS = class GitFS {
  constructor(projectId) {
    this.projectId = projectId || 'default';
    this.gitNs = 'pocketide_git_' + this.projectId + '_';
    this.fileNs = 'pocketide_files_' + this.projectId + '_';
  }

  _rel(path) {
    let p = (path || '').replace(/^\/+/, '').replace(/\/+/g, '/');
    if (p === '.') return '';
    return p;
  }

  _key(path) {
    const p = this._rel(path);
    if (p === '.git' || p.startsWith('.git/')) return this.gitNs + p;
    return this.fileNs + p;
  }

  _isGitKey(key) { return key.startsWith(this.gitNs); }

  _bytesToB64(bytes) {
    let bin = '';
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    }
    return btoa(bin);
  }

  _b64ToBytes(b64) {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }

  async readFile(path, opts) {
    const key = this._key(path);
    const raw = localStorage.getItem(key);
    if (raw === null) {
      const err = new Error('ENOENT: no such file or directory, open ' + path);
      err.code = 'ENOENT';
      throw err;
    }
    let bytes;
    if (this._isGitKey(key)) {
      bytes = this._b64ToBytes(raw);
    } else {
      try { bytes = new TextEncoder().encode(JSON.parse(raw).content || ''); }
      catch { bytes = new Uint8Array(0); }
    }
    if (opts && opts.encoding === 'utf8') return new TextDecoder().decode(bytes);
    return bytes;
  }

  async writeFile(path, contents, opts) {
    const key = this._key(path);
    const bytes = typeof contents === 'string'
      ? new TextEncoder().encode(contents)
      : new Uint8Array(contents && contents.buffer ? contents : contents);
    if (this._isGitKey(key)) {
      localStorage.setItem(key, this._bytesToB64(bytes));
    } else {
      const data = { content: new TextDecoder().decode(bytes), path: this._rel(path), updatedAt: new Date().toISOString() };
      localStorage.setItem(key, JSON.stringify(data));
    }
  }

  async unlink(path) {
    localStorage.removeItem(this._key(path));
  }

  async mkdir() { /* dirs are implicit */ }

  async rmdir(path) {
    const key = this._key(path);
    const toRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(key + '/')) toRemove.push(k);
    }
    toRemove.forEach(k => localStorage.removeItem(k));
  }

  async stat(path) {
    const key = this._key(path);
    let st = null;
    if (localStorage.getItem(key) !== null) {
      st = { type: 'file', mode: 0o100644, size: this._sizeOf(key), ino: 0, mtimeMs: Date.now(), ctimeMs: Date.now(), uid: 0, gid: 0, dev: 0 };
    } else if (this._hasChildren(key)) {
      st = { type: 'dir', mode: 0o040000, size: 0, ino: 0, mtimeMs: Date.now(), ctimeMs: Date.now(), uid: 0, gid: 0, dev: 0 };
    } else {
      const err = new Error('ENOENT: no such file or directory, stat ' + path);
      err.code = 'ENOENT';
      throw err;
    }
    // isomorphic-git expects fs.stat results with these methods
    st.isDirectory = () => st.type === 'dir';
    st.isFile = () => st.type === 'file';
    st.isSymbolicLink = () => false;
    return st;
  }

  async lstat(path) { return this.stat(path); }

  async readdir(path) {
    const key = this._key(path);
    const prefix = key === '' ? '' : key + '/';
    const names = new Set();
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k) continue;
      if (!k.startsWith(this.fileNs) && !k.startsWith(this.gitNs)) continue;
      let rel = k.substring(k.startsWith(this.gitNs) ? this.gitNs.length : this.fileNs.length);
      if (rel === '') continue;
      if (path === '/' || path === '' || key === '') {
        // top level: first path segment (plus '.git' if git metadata exists)
        const seg = rel.split('/')[0];
        if (seg) names.add(seg);
        if (k.startsWith(this.gitNs)) names.add('.git');
      } else if (rel.startsWith(prefix)) {
        const rest = rel.substring(prefix.length);
        const seg = rest.split('/')[0];
        if (seg) names.add(seg);
      } else if (rel.startsWith(key + '/')) {
        const rest = rel.substring(key.length + 1);
        const seg = rest.split('/')[0];
        if (seg) names.add(seg);
      }
    }
    // a directory must exist even if empty
    if (names.size === 0 && key !== '' && key !== '.git' && !this._hasChildren(key)) {
      const err = new Error('ENOENT: no such file or directory, scandir ' + path);
      err.code = 'ENOENT';
      throw err;
    }
    return Array.from(names).sort();
  }

  _hasChildren(key) {
    // A namespace root (ends with '_') has children when any key is longer and
    // starts with it; a dir path needs a following '/' so 'main.cpp' does not
    // turn 'main' into a phantom directory.
    const isRoot = key === this.gitNs || key === this.fileNs;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.length > key.length && k.startsWith(key)) {
        if (isRoot || k[key.length] === '/') return true;
      }
    }
    return false;
  }

  _sizeOf(key) {
    const raw = localStorage.getItem(key);
    if (!raw) return 0;
    if (this._isGitKey(key)) return this._b64ToBytes(raw).length;
    try { return new TextEncoder().encode(JSON.parse(raw).content || '').length; }
    catch { return raw.length; }
  }

  readlink() { const e = new Error('ENOSYS'); e.code = 'ENOSYS'; throw e; }
  symlink() { const e = new Error('ENOSYS'); e.code = 'ENOSYS'; throw e; }
};

class GitIntegration {
  constructor(projectId) {
    this.projectId = projectId || 'default';
    this.dir = '/';
    this.rawFs = new GitFS(this.projectId);
    this.fs = { promises: this.rawFs };
    this.initialized = false;
    this.author = { name: 'PocketIDE User', email: 'user@pocketide.local' };
  }

  async isRepo() {
    try { await this.rawFs.stat('/.git'); return true; }
    catch { return false; }
  }

  async initRepo() {
    await window.git.init({ fs: this.fs, dir: this.dir, defaultBranch: 'main' });
    this.initialized = true;
  }

  async getStatus() {
    if (!this.initialized) return [];
    try {
      const matrix = await window.git.statusMatrix({ fs: this.fs, dir: this.dir });
      return this.parseStatusMatrix(matrix);
    } catch (e) { console.warn('git status failed:', e); return []; }
  }

  parseStatusMatrix(matrix) {
    const items = [];
    for (const row of matrix) {
      const filepath = row[0];
      if (filepath.startsWith('.git/')) continue;
      const head = row[1], workdir = row[2], stage = row[3];
      let status = null;
      if (head === 0 && workdir === 2 && stage === 0) status = '??';      // untracked
      else if (head === 0 && (stage === 2 || workdir === 2)) status = 'A'; // added/staged new
      else if (workdir === 3 || (head !== 0 && workdir === 0 && stage === 0)) status = 'D';
      else if (head !== 0 && workdir !== head) status = 'M';
      else if (stage === 1 && workdir === 0) status = 'M';                // staged modification
      if (status) items.push({ path: filepath, status });
    }
    return items;
  }

  async stageAll() {
    const matrix = await window.git.statusMatrix({ fs: this.fs, dir: this.dir });
    for (const row of matrix) {
      const filepath = row[0];
      if (filepath.startsWith('.git/')) continue;
      try { await window.git.add({ fs: this.fs, dir: this.dir, filepath }); }
      catch (e) { console.warn('git add failed:', filepath, e); }
    }
  }

  async commit(message) {
    return await window.git.commit({ fs: this.fs, dir: this.dir, message, author: this.author });
  }

  async getLog(depth = 8) {
    if (!this.initialized) return [];
    try {
      const commits = await window.git.log({ fs: this.fs, dir: this.dir, depth });
      return commits.map(c => ({
        oid: c.oid,
        message: String(c.commit.message).split('\n')[0],
        date: c.commit.committer.timestamp * 1000,
      }));
    } catch { return []; }
  }

  async currentBranch() {
    try { return await window.git.currentBranch({ fs: this.fs, dir: this.dir, fullname: false }); }
    catch { return null; }
  }

  async addRemote(name, url) {
    try {
      await window.git.addRemote({ fs: this.fs, dir: this.dir, remote: name, url });
    } catch (e) {
      // If remote already exists, update it
      if (e.message && e.message.includes('already exists')) {
        await window.git.deleteRemote({ fs: this.fs, dir: this.dir, remote: name }).catch(() => {});
        await window.git.addRemote({ fs: this.fs, dir: this.dir, remote: name, url });
      } else throw e;
    }
  }

  async removeRemote(name) {
    try { await window.git.deleteRemote({ fs: this.fs, dir: this.dir, remote: name }); }
    catch { /* ignore */ }
  }

  async listRemotes() {
    try {
      const remotes = await window.git.listRemotes({ fs: this.fs, dir: this.dir });
      return remotes;
    } catch { return []; }
  }

  async fetchRemote(remoteName, { onProgress } = {}) {
    const http = this._createHttpClient();
    await window.git.fetch({
      fs: this.fs,
      http,
      dir: this.dir,
      remote: remoteName || 'origin',
      onProgress,
    });
  }

  async pull({ onProgress } = {}) {
    const http = this._createHttpClient();
    await window.git.pull({
      fs: this.fs,
      http,
      dir: this.dir,
      onProgress,
    });
  }

  async push({ onProgress } = {}) {
    const http = this._createHttpClient();
    await window.git.push({
      fs: this.fs,
      http,
      dir: this.dir,
      onProgress,
    });
  }

  async clone(url, { onProgress, remoteName } = {}) {
    // Clear existing workspace first (except .git)
    await this.rawFs.rmdir('/');
    const http = this._createHttpClient();
    await window.git.clone({
      fs: this.fs,
      http,
      dir: this.dir,
      url,
      remote: remoteName || 'origin',
      onProgress,
    });
    this.initialized = true;
  }

  _createHttpClient() {
    // isomorphic-git's http client for browser fetch
    const tokenKey = 'pocketide_git_token_' + this.projectId;
    const token = localStorage.getItem(tokenKey) || '';
    return {
      async request({ url: reqUrl, method = 'GET', headers = {}, body, onProgress }) {
        const authHeaders = { ...headers };
        if (token) {
          // GitHub API uses token auth
          authHeaders['Authorization'] = 'token ' + token;
        }
        const resp = await fetch(reqUrl, {
          method,
          headers: authHeaders,
          body,
          signal: AbortSignal.timeout(60000),
        });
        if (!resp.ok) {
          const text = await resp.text().catch(() => '');
          throw new Error(`HTTP ${resp.status}: ${text || resp.statusText}`);
        }
        const contentType = resp.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          return { status: resp.status, headers: Object.fromEntries(resp.headers), body: await resp.json() };
        }
        return { status: resp.status, headers: Object.fromEntries(resp.headers), body: resp.body };
      },
      async response({ url: reqUrl, method, headers = {}, body, onProgress }) {
        return this.request({ url: reqUrl, method, headers, body, onProgress });
      },
    };
  }
}

// ============================================================
// GitPanel — sidebar UI (branch, changes, commit, history)
// ============================================================

class GitPanel {
  constructor(app) {
    this.app = app;
    this.git = null;
    this.busy = false;
    this.branch = 'main';
  }

  init() {
    const ids = ['git-init-btn', 'git-commit-btn', 'git-stage-all', 'git-commit-message', 'git-branch-name', 'git-changes', 'git-log', 'git-toggle-remote', 'git-remote-url', 'git-remote-token', 'git-clone-btn', 'git-set-remote-btn', 'git-push-btn', 'git-pull-btn', 'git-fetch-btn', 'git-remote-status'];
    this.el = {};
    ids.forEach(id => { this.el[id] = document.getElementById(id); });
    const on = (id, fn) => { const el = this.el[id]; if (el) el.addEventListener('click', fn); };
    on('git-init-btn', () => this.initRepo());
    on('git-stage-all', () => this.stageAll());
    on('git-commit-btn', () => this.commit());
    on('git-clone-btn', () => this.clone());
    on('git-set-remote-btn', () => this.setRemote());
    on('git-push-btn', () => this.push());
    on('git-pull-btn', () => this.pull());
    on('git-fetch-btn', () => this.fetch());
    on('git-toggle-remote', () => this._toggleRemotePanel());
    const msg = this.el['git-commit-message'];
    if (msg) {
      msg.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this.commit();
      });
    }
    // Auto-init a repo when the local project has files — git should just work.
    this.ensureGit().then(async (git) => {
      if (!git.initialized && this.app.fileList.length > 0 && !this.app.isNativeMode()) {
        try { await git.initRepo(); this.app.gitInitialized = true; } catch (e) { /* stored in git.errors */ }
      }
      this.refresh();
    });
  }

  async ensureGit() {
    const projectId = this.app.currentProjectId;
    if (!this.git) {
      this.git = new GitIntegration(projectId);
      this.git.initialized = await this.git.isRepo();
    }
    return this.git;
  }

  async initRepo() {
    if (this.busy) return;
    this.busy = true;
    try {
      const git = await this.ensureGit();
      await git.initRepo();
      this.app.gitInitialized = true;
    } catch (e) { console.warn('git init failed:', e); }
    this.busy = false;
    await this.refresh();
  }

  async stageAll() {
    if (this.busy) return;
    this.busy = true;
    try {
      const git = await this.ensureGit();
      await git.stageAll();
    } catch (e) { console.warn('git stage failed:', e); }
    this.busy = false;
    await this.refresh();
  }

  async commit() {
    if (this.busy) return;
    const msg = this.el['git-commit-message'];
    const message = msg ? msg.value.trim() : '';
    if (!message) { if (msg) msg.focus(); return; }
    this.busy = true;
    try {
      const git = await this.ensureGit();
      if (!git.initialized) await git.initRepo();
      await git.stageAll();
      await git.commit(message);
      if (msg) msg.value = '';
    } catch (e) { console.warn('git commit failed:', e); }
    this.busy = false;
    await this.refresh();
  }

  // --- Remote operations ---

  _setRemoteStatus(text, type) {
    const el = this.el['git-remote-status'];
    if (!el) return;
    el.textContent = text;
    el.className = 'git-remote-status' + (type ? ' ' + type : '');
  }

  _toggleRemotePanel() {
    const panel = document.getElementById('git-remote-panel');
    const btn = this.el['git-toggle-remote'];
    if (!panel) return;
    const visible = panel.style.display !== 'none';
    panel.style.display = visible ? 'none' : '';
    if (btn) btn.textContent = visible ? '▶' : '▼';
  }

  async setRemote() {
    if (this.busy) return;
    const url = this.el['git-remote-url'] ? this.el['git-remote-url'].value.trim() : '';
    if (!url) { this._setRemoteStatus('Enter a remote URL', 'error'); return; }
    this.busy = true;
    this._setRemoteStatus('Setting remote...', 'info');
    try {
      const git = await this.ensureGit();
      if (!git.initialized) await git.initRepo();
      await git.addRemote('origin', url);
      // Save token for auth
      const token = this.el['git-remote-token'] ? this.el['git-remote-token'].value.trim() : '';
      if (token) {
        const key = 'pocketide_git_token_' + this.app.currentProjectId;
        localStorage.setItem(key, token);
      }
      this._setRemoteStatus('Remote set: ' + url.split('/').slice(-2).join('/'), 'success');
    } catch (e) {
      this._setRemoteStatus('Error: ' + e.message, 'error');
      console.warn('set remote failed:', e);
    }
    this.busy = false;
    await this.refresh();
  }

  async clone() {
    if (this.busy) return;
    const url = this.el['git-remote-url'] ? this.el['git-remote-url'].value.trim() : '';
    if (!url) { this._setRemoteStatus('Enter a repository URL to clone', 'error'); return; }
    this.busy = true;
    this._setRemoteStatus('Cloning...', 'info');
    try {
      const git = await this.ensureGit();
      // Save the token for the clone operation
      const token = this.el['git-remote-token'] ? this.el['git-remote-token'].value.trim() : '';
      if (token) {
        const key = 'pocketide_git_token_' + this.app.currentProjectId;
        localStorage.setItem(key, token);
      }
      await git.clone(url, {
        onProgress: (progress) => {
          if (progress.phase) {
            const pct = progress.loaded && progress.total ? ` (${Math.round(progress.loaded / progress.total * 100)}%)` : '';
            this._setRemoteStatus(progress.phase + pct, 'info');
          }
        }
      });
      this.app.gitInitialized = true;
      this._setRemoteStatus('Clone complete!', 'success');
      // Reload files from git
      this.app.loadProjectFiles(this.app.currentProjectId);
    } catch (e) {
      this._setRemoteStatus('Clone failed: ' + e.message, 'error');
      console.warn('clone failed:', e);
    }
    this.busy = false;
    await this.refresh();
  }

  async push() {
    if (this.busy) return;
    this.busy = true;
    this._setRemoteStatus('Pushing...', 'info');
    try {
      const git = await this.ensureGit();
      await git.push({
        onProgress: (progress) => {
          if (progress.phase) {
            const pct = progress.loaded && progress.total ? ` (${Math.round(progress.loaded / progress.total * 100)}%)` : '';
            this._setRemoteStatus(progress.phase + pct, 'info');
          }
        }
      });
      this._setRemoteStatus('Push complete!', 'success');
    } catch (e) {
      this._setRemoteStatus('Push failed: ' + e.message, 'error');
      console.warn('push failed:', e);
    }
    this.busy = false;
    await this.refresh();
  }

  async pull() {
    if (this.busy) return;
    this.busy = true;
    this._setRemoteStatus('Pulling...', 'info');
    try {
      const git = await this.ensureGit();
      await git.pull({
        onProgress: (progress) => {
          if (progress.phase) {
            const pct = progress.loaded && progress.total ? ` (${Math.round(progress.loaded / progress.total * 100)}%)` : '';
            this._setRemoteStatus(progress.phase + pct, 'info');
          }
        }
      });
      this._setRemoteStatus('Pull complete!', 'success');
      this.app.loadProjectFiles(this.app.currentProjectId);
    } catch (e) {
      this._setRemoteStatus('Pull failed: ' + e.message, 'error');
      console.warn('pull failed:', e);
    }
    this.busy = false;
    await this.refresh();
  }

  async fetch() {
    if (this.busy) return;
    this.busy = true;
    this._setRemoteStatus('Fetching...', 'info');
    try {
      const git = await this.ensureGit();
      await git.fetchRemote('origin', {
        onProgress: (progress) => {
          if (progress.phase) {
            const pct = progress.loaded && progress.total ? ` (${Math.round(progress.loaded / progress.total * 100)}%)` : '';
            this._setRemoteStatus(progress.phase + pct, 'info');
          }
        }
      });
      this._setRemoteStatus('Fetch complete!', 'success');
    } catch (e) {
      this._setRemoteStatus('Fetch failed: ' + e.message, 'error');
      console.warn('fetch failed:', e);
    }
    this.busy = false;
    await this.refresh();
  }

  async refresh() {
    if (this.busy) return;
    try {
      const git = await this.ensureGit();
      // Auto-init once the local project has files — git should just work.
      if (!git.initialized && this.app.fileList.length > 0 && !this.app.isNativeMode()) {
        try { await git.initRepo(); this.app.gitInitialized = true; } catch (e) { /* keep Init Repo button */ }
      }
      this.branch = (await git.currentBranch()) || 'main';
      const branchEl = this.el['git-branch-name'];
      if (branchEl) branchEl.textContent = git.initialized ? this.branch : 'no repo yet';
      const statusBranch = document.getElementById('status-branch');
      if (statusBranch) statusBranch.textContent = git.initialized ? this.branch : 'local';
      const initBtn = this.el['git-init-btn'];
      if (initBtn) initBtn.style.display = git.initialized ? 'none' : 'inline-block';
      if (!git.initialized) {
        this.renderChanges([]);
        this.renderLog([]);
        return;
      }
      const changes = await git.getStatus();
      const log = await git.getLog(8);
      this.renderChanges(changes);
      this.renderLog(log);
    } catch (e) { console.warn('git refresh failed:', e); }
  }

  renderChanges(changes) {
    const box = this.el['git-changes'];
    if (!box) return;
    if (!changes.length) {
      box.innerHTML = '<div class="git-empty">No changes — everything committed</div>';
      return;
    }
    const map = { 'A': 'A+', 'M': 'M~', 'D': 'D-', '??': '??' };
    const cls = { 'A': 'st-added', 'M': 'st-modified', 'D': 'st-deleted', '??': 'st-untracked' };
    box.innerHTML = '';
    changes.forEach(c => {
      const row = document.createElement('div');
      row.className = 'git-change';
      const st = document.createElement('span');
      st.className = 'gc-status ' + (cls[c.status] || '');
      st.textContent = map[c.status] || c.status;
      const p = document.createElement('span');
      p.className = 'gc-path';
      p.textContent = c.path;
      row.appendChild(st);
      row.appendChild(p);
      box.appendChild(row);
    });
  }

  renderLog(log) {
    const box = this.el['git-log'];
    if (!box) return;
    if (!log.length) {
      box.innerHTML = '<div class="git-empty">No commits yet</div>';
      return;
    }
    box.innerHTML = '';
    log.forEach(c => {
      const row = document.createElement('div');
      row.className = 'git-commit';
      const msg = document.createElement('span');
      msg.className = 'gc-msg';
      msg.textContent = c.message;
      const meta = document.createElement('span');
      meta.className = 'gc-meta';
      const d = new Date(c.date);
      const stamp = isNaN(d.getTime()) ? '' : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
      meta.textContent = (stamp ? stamp + ' · ' : '') + c.oid.slice(0, 7);
      row.appendChild(msg);
      row.appendChild(meta);
      box.appendChild(row);
    });
  }
}

// ============================================================
// Find & Replace
// ============================================================

class FindReplace {
  constructor(editor) {
    this.editor = editor;
    this.matches = [];
    this.currentMatch = -1;
    this.isOpen = false;
    this.replaceVisible = false;
    this._wasFocusedBeforeOpen = false;
    this._pendingSearch = null;

    this.bar = document.getElementById('find-replace-bar');
    this.findInput = document.getElementById('find-input');
    this.replaceInput = document.getElementById('replace-input');
    this.countEl = document.getElementById('find-count');
    this.replaceRow = document.getElementById('replace-row');
    this.caseCheck = document.getElementById('find-case-check');
    this.wordCheck = document.getElementById('find-word-check');
    this.regexCheck = document.getElementById('find-regex-check');

    this._bindEvents();
  }

  _bindEvents() {
    // Search on input
    this.findInput.addEventListener('input', () => this._doSearch());
    this.replaceInput.addEventListener('input', () => {});

    // Navigation
    document.getElementById('find-next').addEventListener('click', () => this.next());
    document.getElementById('find-prev').addEventListener('click', () => this.prev());
    document.getElementById('find-replace-one').addEventListener('click', () => this.replace());
    document.getElementById('find-replace-all').addEventListener('click', () => this.replaceAll());

    // Close
    document.getElementById('find-close').addEventListener('click', () => this.close());

    // Toggle options
    this.caseCheck.addEventListener('change', () => this._doSearch());
    this.wordCheck.addEventListener('change', () => this._doSearch());
    this.regexCheck.addEventListener('change', () => this._doSearch());

    // Keyboard shortcuts inside inputs
    this.findInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (e.shiftKey) this.prev(); else this.next();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        this.close();
      }
    });
    this.replaceInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.replace();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        this.close();
      }
    });
  }

  open(withReplace) {
    if (this.isOpen) {
      // If already open, just toggle replace row
      if (withReplace !== undefined) this._toggleReplace(withReplace);
      this.findInput.focus();
      this.findInput.select();
      return;
    }

    this._wasFocusedBeforeOpen = document.activeElement === this.editor.textarea;
    this.isOpen = true;
    this.bar.style.display = '';
    this._toggleReplace(!!withReplace);

    // Pre-fill with current selection if it's on one line
    const ta = this.editor.textarea;
    if (ta.selectionStart !== ta.selectionEnd) {
      const sel = ta.value.substring(ta.selectionStart, ta.selectionEnd);
      if (!sel.includes('\n')) {
        this.findInput.value = sel;
      }
    }

    this.findInput.focus();
    this.findInput.select();
    this._doSearch();
  }

  close() {
    this.isOpen = false;
    this.bar.style.display = 'none';
    this.matches = [];
    this.currentMatch = -1;
    this.countEl.textContent = '';
    this._clearDecorations();
    if (this._wasFocusedBeforeOpen && this.editor && this.editor.textarea) {
      this.editor.textarea.focus();
    }
  }

  toggle(withReplace) {
    if (this.isOpen) { this.close(); return; }
    this.open(withReplace);
  }

  _toggleReplace(show) {
    this.replaceVisible = show;
    this.replaceRow.style.display = show ? '' : 'none';
  }

  _doSearch() {
    const query = this.findInput.value;
    if (!query) {
      this.matches = [];
      this.currentMatch = -1;
      this.countEl.textContent = '';
      this.countEl.className = 'find-count';
      this._clearDecorations();
      return;
    }

    const text = this.editor.getValue();
    const caseSensitive = this.caseCheck.checked;
    const wholeWord = this.wordCheck.checked;
    const useRegex = this.regexCheck.checked;

    let pattern;
    try {
      if (useRegex) {
        pattern = new RegExp(query, caseSensitive ? 'g' : 'gi');
      } else {
        const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const wordBoundary = wholeWord ? `\\b${escaped}\\b` : escaped;
        pattern = new RegExp(wordBoundary, caseSensitive ? 'g' : 'gi');
      }
    } catch (e) {
      this.countEl.textContent = 'Invalid';
      this.countEl.className = 'find-count no-results';
      return;
    }

    // If not using regex and not whole word, do simple search for better performance
    if (!useRegex && !wholeWord && query.length > 0) {
      this.matches = [];
      const searchStr = caseSensitive ? text : text.toLowerCase();
      const queryLower = caseSensitive ? query : query.toLowerCase();
      let idx = 0;
      while ((idx = searchStr.indexOf(queryLower, idx)) !== -1) {
        this.matches.push({ start: idx, length: query.length });
        idx++;
      }
    } else {
      this.matches = [];
      let m;
      while ((m = pattern.exec(text)) !== null) {
        this.matches.push({ start: m.index, length: m[0].length });
        if (m[0].length === 0) pattern.lastIndex++;
      }
    }

    // Update count
    if (this.matches.length === 0) {
      this.countEl.textContent = 'No results';
      this.countEl.className = 'find-count no-results';
      this.currentMatch = -1;
    } else {
      // Find the closest match to current cursor
      const cursor = this.editor.textarea.selectionStart;
      this.currentMatch = 0;
      for (let i = 0; i < this.matches.length; i++) {
        if (this.matches[i].start >= cursor) { this.currentMatch = i; break; }
        this.currentMatch = i;
      }
      this._updateCount();
    }

    this._highlightCurrent();
  }

  next() {
    if (this.matches.length === 0) return;
    this.currentMatch = (this.currentMatch + 1) % this.matches.length;
    this._updateCount();
    this._highlightCurrent();
  }

  prev() {
    if (this.matches.length === 0) return;
    this.currentMatch = (this.currentMatch - 1 + this.matches.length) % this.matches.length;
    this._updateCount();
    this._highlightCurrent();
  }

  replace() {
    if (this.currentMatch < 0 || this.currentMatch >= this.matches.length) return;
    const match = this.matches[this.currentMatch];
    const text = this.editor.textarea.value;
    const replacement = this.replaceInput.value;

    // Perform replacement
    const before = text.substring(0, match.start);
    const after = text.substring(match.start + match.length);
    const newText = before + replacement + after;

    // Update editor
    this.editor.textarea.value = newText;
    this.editor.content = newText;
    this.editor._updateHighlight();
    this.editor._updateLineNumbers();
    this.editor._emit('change', newText);

    // Re-search to update matches
    this._doSearch();
  }

  replaceAll() {
    if (this.matches.length === 0) return;
    const text = this.editor.textarea.value;
    const replacement = this.replaceInput.value;
    const count = this.matches.length;

    // Walk matches in reverse to avoid offset issues
    let newText = text;
    for (let i = this.matches.length - 1; i >= 0; i--) {
      const m = this.matches[i];
      newText = newText.substring(0, m.start) + replacement + newText.substring(m.start + m.length);
    }

    // Update editor
    this.editor.textarea.value = newText;
    this.editor.content = newText;
    this.editor._updateHighlight();
    this.editor._updateLineNumbers();
    this.editor._emit('change', newText);

    // Re-search
    this._doSearch();
  }

  _updateCount() {
    if (this.matches.length === 0) {
      this.countEl.textContent = '';
      this.countEl.className = 'find-count';
    } else {
      this.countEl.textContent = `${this.currentMatch + 1} of ${this.matches.length}`;
      this.countEl.className = 'find-count';
    }
  }

  _highlightCurrent() {
    if (this.currentMatch < 0 || this.currentMatch >= this.matches.length) {
      // No match selected — just scroll to selection if any
      return;
    }
    const match = this.matches[this.currentMatch];
    const ta = this.editor.textarea;
    ta.focus();
    ta.selectionStart = match.start;
    ta.selectionEnd = match.start + match.length;

    // Scroll the match into view by calculating line position
    const text = ta.value.substring(0, match.start);
    const lineNum = (text.match(/\n/g) || []).length;
    const lineHeight = parseFloat(getComputedStyle(ta).lineHeight) || 21;
    const targetTop = lineNum * lineHeight;
    const taHeight = ta.clientHeight;
    if (targetTop < ta.scrollTop || targetTop > ta.scrollTop + taHeight - lineHeight * 2) {
      ta.scrollTop = Math.max(0, targetTop - taHeight / 3);
    }
  }

  _clearDecorations() {
    // We highlight via selection in the textarea, no decorations to clear
  }
}

// ============================================================
// Shell — Command interpreter for the terminal
// ============================================================

class Shell {
  constructor(getProjectId, fileListRef, app) {
    this._getProjectId = getProjectId;
    this._fileListRef = fileListRef; // ref to app.fileList
    this._app = app;
    this.cwd = '/';
    this.env = { HOME: '/', USER: 'pocket', SHELL: '/bin/psh', TERM: 'xterm-256color' };
    this.aliases = { ll: 'ls -la', la: 'ls -a', cls: 'clear' };
  }

  execute(input) {
    const trimmed = input.trim();
    if (!trimmed) return { lines: [] };

    // Handle aliases
    let expanded = trimmed;
    const firstWord = trimmed.split(/\s+/)[0];
    if (this.aliases[firstWord]) {
      expanded = this.aliases[firstWord] + trimmed.slice(firstWord.length);
    }

    // Handle pipes (simple: only cmd1 | cmd2)
    const pipeIdx = expanded.indexOf('|');
    if (pipeIdx !== -1) {
      const left = expanded.slice(0, pipeIdx).trim();
      const right = expanded.slice(pipeIdx + 1).trim();
      const leftResult = this.execute(left);
      // Feed left output as stdin to right
      const stdin = leftResult.lines.map(l => l.text).join('\n');
      return this._execSingle(right, stdin);
    }

    return this._execSingle(expanded, null);
  }

  _execSingle(input, stdin) {
    const tokens = this._tokenize(input);
    if (tokens.length === 0) return { lines: [] };
    const cmd = tokens[0];
    const args = tokens.slice(1);

    const handlers = {
      help: () => this._cmdHelp(),
      ls: () => this._cmdLs(args),
      cd: () => this._cmdCd(args),
      pwd: () => this._cmdPwd(),
      cat: () => this._cmdCat(args),
      echo: () => this._cmdEcho(args),
      touch: () => this._cmdTouch(args),
      mkdir: () => this._cmdMkdir(args),
      rm: () => this._cmdRm(args),
      mv: () => this._cmdMv(args),
      cp: () => this._cmdCp(args),
      clear: () => this._cmdClear(),
      whoami: () => this._cmdWhoami(),
      date: () => this._cmdDate(),
      env: () => this._cmdEnv(),
      export: () => this._cmdExport(args),
      head: () => this._cmdHead(args, stdin),
      tail: () => this._cmdTail(args, stdin),
      wc: () => this._cmdWc(args, stdin),
      grep: () => this._cmdGrep(args, stdin),
      sort: () => this._cmdSort(args, stdin),
      uniq: () => this._cmdUniq(args, stdin),
      find: () => this._cmdFind(args),
      tree: () => this._cmdTree(args),
      stats: () => this._cmdStats(),
    };

    if (handlers[cmd]) return handlers[cmd]();
    return { lines: [{ text: `psh: command not found: ${cmd}`, type: 'error' }] };
  }

  _tokenize(input) {
    const tokens = [];
    let current = '';
    let inSingle = false, inDouble = false, escaped = false;
    for (const ch of input) {
      if (escaped) { current += ch; escaped = false; continue; }
      if (ch === '\\') { escaped = true; continue; }
      if (ch === "'" && !inDouble) { inSingle = !inSingle; continue; }
      if (ch === '"' && !inSingle) { inDouble = !inDouble; continue; }
      if (ch === ' ' && !inSingle && !inDouble) {
        if (current) { tokens.push(current); current = ''; }
        continue;
      }
      current += ch;
    }
    if (current) tokens.push(current);
    return tokens;
  }

  _resolvePath(p) {
    if (!p) return this.cwd;
    if (p === '~') return '/';
    if (p.startsWith('~/')) p = '/' + p.slice(2);
    if (!p.startsWith('/')) p = this.cwd + (this.cwd.endsWith('/') ? '' : '/') + p;
    // Normalize: resolve .. and .
    const parts = p.split('/').filter(Boolean);
    const resolved = [];
    for (const part of parts) {
      if (part === '.') continue;
      if (part === '..') { resolved.pop(); continue; }
      resolved.push(part);
    }
    return '/' + resolved.join('/');
  }

  _getFiles() {
    const projectId = this._getProjectId();
    return Storage.getProjectFilePaths(projectId);
  }

  _isDir(path) {
    const files = this._getFiles();
    const normalized = path.endsWith('/') ? path : path + '/';
    return files.some(f => f.startsWith(normalized));
  }

  _exists(path) {
    const files = this._getFiles();
    if (files.includes(path)) return true;
    return files.some(f => f.startsWith(path.endsWith('/') ? path : path + '/'));
  }

  _listDir(dirPath) {
    const files = this._getFiles();
    const prefix = dirPath.endsWith('/') ? dirPath : dirPath + '/';
    const entries = new Map();
    for (const f of files) {
      if (!f.startsWith(prefix)) continue;
      const rest = f.slice(prefix.length);
      const slashIdx = rest.indexOf('/');
      if (slashIdx === -1) {
        entries.set(rest, { name: rest, isDir: false });
      } else {
        const dirName = rest.slice(0, slashIdx);
        if (!entries.has(dirName)) entries.set(dirName, { name: dirName, isDir: true });
      }
    }
    return [...entries.values()].sort((a, b) => {
      if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }

  _matchFiles(pattern) {
    const files = this._getFiles();
    const resolved = this._resolvePath(pattern);
    // Exact match
    if (files.includes(resolved)) return [resolved];
    // Directory prefix match
    const prefix = resolved.endsWith('/') ? resolved : resolved + '/';
    const matches = files.filter(f => f.startsWith(prefix));
    // Glob support: simple * wildcard
    const starIdx = pattern.indexOf('*');
    if (starIdx !== -1) {
      const regex = new RegExp('^' + pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$');
      return files.filter(f => regex.test(f));
    }
    return matches;
  }

  // --- Built-in commands ---

  _cmdHelp() {
    const cmds = [
      'Available commands:',
      '',
      '  ls [-la]       List directory contents',
      '  cd <dir>       Change directory',
      '  pwd            Print working directory',
      '  cat <file>     Display file contents',
      '  echo <text>    Print text',
      '  touch <file>   Create a file',
      '  mkdir <dir>    Create a directory',
      '  rm <path>      Remove a file',
      '  mv <s> <d>     Move/rename a file',
      '  cp <s> <d>     Copy a file',
      '  grep <pat>     Search for pattern in files',
      '  head <file>    Show first lines of a file',
      '  tail <file>    Show last lines of a file',
      '  wc <file>      Word/line/char count',
      '  sort [file]    Sort lines',
      '  uniq [file]    Remove duplicate lines',
      '  find <pat>     Find files matching pattern',
      '  tree [dir]     Show directory tree',
      '  clear          Clear terminal',
      '  whoami         Print current user',
      '  date           Print current date/time',
      '  env            Show environment variables',
      '  stats          Show file storage stats',
      '  help           Show this help',
      '',
      'Pipes: cmd1 | cmd2',
      'Shortcuts: Ctrl+` toggle, ↑/↓ history, Tab completion',
    ];
    return { lines: cmds.map(t => ({ text: t, type: 'info' })) };
  }

  _cmdLs(args) {
    const showAll = args.includes('-a') || args.includes('-la') || args.includes('-al');
    const showLong = args.includes('-l') || args.includes('-la') || args.includes('-al');
    const pathArg = args.find(a => !a.startsWith('-'));
    const target = pathArg ? this._resolvePath(pathArg) : this.cwd;

    if (!this._exists(target) && pathArg) {
      return { lines: [{ text: `ls: cannot access '${pathArg}': No such file or directory`, type: 'error' }] };
    }

    const entries = this._listDir(target);
    if (entries.length === 0) return { lines: [] };

    const lines = [];
    if (showLong) {
      lines.push({ text: `total ${entries.length}`, type: 'output' });
      for (const e of entries) {
        const perm = e.isDir ? 'drwxr-xr-x' : '-rw-r--r--';
        const size = e.isDir ? '4096' : '  0';
        const date = 'Aug 21 12:00';
        const name = e.isDir ? e.name + '/' : e.name;
        lines.push({ text: `${perm}  1 user user ${size} ${date} ${name}`, type: 'output' });
      }
    } else {
      let row = '';
      const colored = entries.map(e => e.isDir ? e.name + '/' : e.name);
      lines.push({ text: colored.join('  '), type: 'output' });
    }
    return { lines };
  }

  _cmdCd(args) {
    const target = args[0] || '/';
    const resolved = this._resolvePath(target);
    if (target === '-') {
      // cd - not fully supported, just go to / for now
      this.cwd = '/';
      return { lines: [] };
    }
    if (!this._exists(resolved)) {
      return { lines: [{ text: `cd: no such file or directory: ${target}`, type: 'error' }] };
    }
    if (!this._isDir(resolved) && target !== '/') {
      return { lines: [{ text: `cd: not a directory: ${target}`, type: 'error' }] };
    }
    this.cwd = resolved === '/' ? '/' : resolved;
    return { lines: [] };
  }

  _cmdPwd() {
    return { lines: [{ text: this.cwd, type: 'output' }] };
  }

  _cmdCat(args) {
    if (args.length === 0) return { lines: [{ text: 'cat: missing file operand', type: 'error' }] };
    const projectId = this._getProjectId();
    const results = [];
    for (const arg of args) {
      const resolved = this._resolvePath(arg);
      const data = Storage.readFile(projectId, resolved);
      if (!data) {
        results.push({ text: `cat: ${arg}: No such file or directory`, type: 'error' });
        continue;
      }
      const content = typeof data === 'string' ? data : data.content || '';
      content.split('\n').forEach(line => results.push({ text: line, type: 'output' }));
    }
    return { lines: results };
  }

  _cmdEcho(args) {
    // Handle variable expansion
    const text = args.map(a => {
      if (a.startsWith('$')) return this.env[a.slice(1)] || '';
      return a;
    }).join(' ');
    return { lines: [{ text, type: 'output' }] };
  }

  _cmdTouch(args) {
    if (args.length === 0) return { lines: [{ text: 'touch: missing file operand', type: 'error' }] };
    const projectId = this._getProjectId();
    const results = [];
    for (const arg of args) {
      const resolved = this._resolvePath(arg);
      if (!this._exists(resolved)) {
        Storage.writeFile(projectId, resolved, '');
      }
    }
    this._refreshFileList();
    return { lines: results };
  }

  _cmdMkdir(args) {
    const dirs = args.filter(a => !a.startsWith('-'));
    if (dirs.length === 0) return { lines: [{ text: 'mkdir: missing operand', type: 'error' }] };
    const projectId = this._getProjectId();
    for (const arg of dirs) {
      const resolved = this._resolvePath(arg);
      // Create a .gitkeep or placeholder to represent the directory
      const placeholder = resolved + '/.gitkeep';
      if (!this._exists(resolved)) {
        Storage.writeFile(projectId, placeholder, '');
      }
    }
    this._refreshFileList();
    return { lines: [] };
  }

  _cmdRm(args) {
    const recursive = args.includes('-r') || args.includes('-rf') || args.includes('-fr');
    const paths = args.filter(a => !a.startsWith('-'));
    if (paths.length === 0) return { lines: [{ text: 'rm: missing operand', type: 'error' }] };
    const projectId = this._getProjectId();
    const results = [];
    for (const arg of paths) {
      const resolved = this._resolvePath(arg);
      if (!this._exists(resolved)) {
        results.push({ text: `rm: cannot remove '${arg}': No such file or directory`, type: 'error' });
        continue;
      }
      if (this._isDir(resolved) && !recursive) {
        results.push({ text: `rm: cannot remove '${arg}': Is a directory (use -r)`, type: 'error' });
        continue;
      }
      // Delete file or all files under dir
      const files = this._getFiles();
      const prefix = resolved.endsWith('/') ? resolved : resolved + '/';
      const toDelete = files.filter(f => f === resolved || f.startsWith(prefix));
      for (const f of toDelete) Storage.deleteFile(projectId, f);
    }
    this._refreshFileList();
    return { lines: results };
  }

  _cmdMv(args) {
    if (args.length < 2) return { lines: [{ text: 'mv: missing operand', type: 'error' }] };
    const projectId = this._getProjectId();
    const src = this._resolvePath(args[0]);
    let dest = this._resolvePath(args[1]);
    if (!this._exists(src)) return { lines: [{ text: `mv: '${args[0]}': No such file or directory`, type: 'error' }] };
    // If dest is a directory, move into it
    if (this._isDir(dest)) {
      const fileName = src.split('/').pop();
      dest = dest + (dest.endsWith('/') ? '' : '/') + fileName;
    }
    Storage.renameFile(projectId, src, dest);
    this._refreshFileList();
    return { lines: [] };
  }

  _cmdCp(args) {
    if (args.length < 2) return { lines: [{ text: 'cp: missing operand', type: 'error' }] };
    const projectId = this._getProjectId();
    const src = this._resolvePath(args[0]);
    let dest = this._resolvePath(args[1]);
    if (!this._exists(src)) return { lines: [{ text: `cp: '${args[0]}': No such file or directory`, type: 'error' }] };
    if (this._isDir(src)) return { lines: [{ text: `cp: '${args[0]}': Is a directory`, type: 'error' }] };
    if (this._isDir(dest)) {
      const fileName = src.split('/').pop();
      dest = dest + (dest.endsWith('/') ? '' : '/') + fileName;
    }
    const data = Storage.readFile(projectId, src);
    if (data) Storage.writeFile(projectId, dest, data.content || '');
    this._refreshFileList();
    return { lines: [] };
  }

  _cmdClear() {
    return { lines: [], clear: true };
  }

  _cmdWhoami() {
    return { lines: [{ text: this.env.USER, type: 'output' }] };
  }

  _cmdDate() {
    return { lines: [{ text: new Date().toString(), type: 'output' }] };
  }

  _cmdEnv() {
    const lines = Object.entries(this.env).map(([k, v]) => ({ text: `${k}=${v}`, type: 'output' }));
    return { lines };
  }

  _cmdExport(args) {
    for (const arg of args) {
      const eq = arg.indexOf('=');
      if (eq !== -1) this.env[arg.slice(0, eq)] = arg.slice(eq + 1);
    }
    return { lines: [] };
  }

  _cmdHead(args, stdin) {
    let n = 10;
    let file = null;
    for (let i = 0; i < args.length; i++) {
      if (args[i] === '-n' && args[i + 1]) { n = parseInt(args[i + 1]) || 10; i++; }
      else file = args[i];
    }
    let content;
    if (stdin) {
      content = stdin;
    } else if (file) {
      const data = Storage.readFile(this._getProjectId(), this._resolvePath(file));
      content = data ? (data.content || '') : null;
    } else {
      return { lines: [{ text: 'head: missing file operand', type: 'error' }] };
    }
    if (content === null) return { lines: [{ text: `head: ${file}: No such file`, type: 'error' }] };
    const lines = content.split('\n').slice(0, n).map(l => ({ text: l, type: 'output' }));
    return { lines };
  }

  _cmdTail(args, stdin) {
    let n = 10;
    let file = null;
    for (let i = 0; i < args.length; i++) {
      if (args[i] === '-n' && args[i + 1]) { n = parseInt(args[i + 1]) || 10; i++; }
      else file = args[i];
    }
    let content;
    if (stdin) {
      content = stdin;
    } else if (file) {
      const data = Storage.readFile(this._getProjectId(), this._resolvePath(file));
      content = data ? (data.content || '') : null;
    } else {
      return { lines: [{ text: 'tail: missing file operand', type: 'error' }] };
    }
    if (content === null) return { lines: [{ text: `tail: ${file}: No such file`, type: 'error' }] };
    const allLines = content.split('\n');
    const lines = allLines.slice(-n).map(l => ({ text: l, type: 'output' }));
    return { lines };
  }

  _cmdWc(args, stdin) {
    let file = args.find(a => !a.startsWith('-'));
    let content;
    if (stdin) {
      content = stdin;
    } else if (file) {
      const data = Storage.readFile(this._getProjectId(), this._resolvePath(file));
      content = data ? (data.content || '') : null;
    } else {
      return { lines: [{ text: 'wc: missing file operand', type: 'error' }] };
    }
    if (content === null) return { lines: [{ text: `wc: ${file}: No such file`, type: 'error' }] };
    const lines = content.split('\n').length;
    const words = content.split(/\s+/).filter(Boolean).length;
    const chars = content.length;
    return { lines: [{ text: `  ${lines}  ${words} ${chars} ${file || ''}`, type: 'output' }] };
  }

  _cmdGrep(args, stdin) {
    let ignoreCase = false;
    const nonFlags = [];
    for (const a of args) {
      if (a === '-i') ignoreCase = true;
      else nonFlags.push(a);
    }
    if (nonFlags.length === 0) return { lines: [{ text: 'grep: missing pattern', type: 'error' }] };
    const pattern = nonFlags[0];
    let content;
    if (stdin) {
      content = stdin;
    } else if (nonFlags[1]) {
      const data = Storage.readFile(this._getProjectId(), this._resolvePath(nonFlags[1]));
      content = data ? (data.content || '') : null;
    } else {
      // Search all files
      const files = this._getFiles();
      const results = [];
      const regex = new RegExp(pattern, ignoreCase ? 'i' : '');
      for (const f of files) {
        const data = Storage.readFile(this._getProjectId(), f);
        if (!data) continue;
        const c = data.content || '';
        c.split('\n').forEach((line, i) => {
          if (regex.test(line)) results.push({ text: `${f}:${i + 1}:${line}`, type: 'output' });
        });
      }
      return { lines: results.length ? results : [{ text: '(no matches)', type: 'info' }] };
    }
    if (content === null) return { lines: [{ text: `grep: ${nonFlags[1]}: No such file`, type: 'error' }] };
    const regex = new RegExp(pattern, ignoreCase ? 'i' : '');
    const results = content.split('\n').filter(l => regex.test(l)).map(l => ({ text: l, type: 'output' }));
    return { lines: results.length ? results : [{ text: '(no matches)', type: 'info' }] };
  }

  _cmdSort(args, stdin) {
    let reverse = args.includes('-r');
    let file = args.find(a => !a.startsWith('-'));
    let content;
    if (stdin) content = stdin;
    else if (file) {
      const data = Storage.readFile(this._getProjectId(), this._resolvePath(file));
      content = data ? (data.content || '') : null;
    } else {
      return { lines: [{ text: 'sort: missing file operand', type: 'error' }] };
    }
    if (content === null) return { lines: [{ text: `sort: ${file}: No such file`, type: 'error' }] };
    const lines = content.split('\n').sort();
    if (reverse) lines.reverse();
    return { lines: lines.map(l => ({ text: l, type: 'output' })) };
  }

  _cmdUniq(args, stdin) {
    let file = args.find(a => !a.startsWith('-'));
    let content;
    if (stdin) content = stdin;
    else if (file) {
      const data = Storage.readFile(this._getProjectId(), this._resolvePath(file));
      content = data ? (data.content || '') : null;
    } else {
      return { lines: [{ text: 'uniq: missing file operand', type: 'error' }] };
    }
    if (content === null) return { lines: [{ text: `uniq: ${file}: No such file`, type: 'error' }] };
    const lines = [];
    let prev = null;
    for (const line of content.split('\n')) {
      if (line !== prev) { lines.push({ text: line, type: 'output' }); prev = line; }
    }
    return { lines };
  }

  _cmdFind(args) {
    const pattern = args[0] || '*';
    const files = this._getFiles();
    const regex = new RegExp('^' + pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.') + '$', 'i');
    const results = files.filter(f => regex.test(f.split('/').pop())).map(f => ({ text: f, type: 'output' }));
    return { lines: results.length ? results : [{ text: '(no matches)', type: 'info' }] };
  }

  _cmdTree(args) {
    const target = args[0] ? this._resolvePath(args[0]) : this.cwd;
    const files = this._getFiles();
    const prefix = target.endsWith('/') ? target : target + '/';
    const relevant = files.filter(f => f.startsWith(prefix) || f === target);
    if (relevant.length === 0) return { lines: [{ text: '(empty)', type: 'info' }] };

    const lines = [{ text: target === '/' ? '/' : target.split('/').pop() + '/', type: 'output' }];
    // Build tree structure
    const dirs = new Map();
    for (const f of relevant) {
      const rest = f.slice(prefix.length);
      if (!rest) continue;
      const parts = rest.split('/');
      let current = '';
      for (let i = 0; i < parts.length; i++) {
        const isLast = i === parts.length - 1;
        current = current ? current + '/' + parts[i] : parts[i];
        if (!dirs.has(current)) {
          const indent = '  '.repeat(i);
          const connector = isLast ? '└── ' : '├── ';
          const suffix = isLast ? '' : '/';
          dirs.set(current, { indent, connector, name: parts[i] + (isLast && !this._isDir(prefix + current) ? '' : '/') });
        }
      }
    }
    const sorted = [...dirs.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    for (const [_, d] of sorted) {
      lines.push({ text: d.indent + d.connector + d.name, type: 'output' });
    }
    return { lines };
  }

  _cmdStats() {
    const files = this._getFiles();
    const projectId = this._getProjectId();
    let totalSize = 0;
    let fileCount = 0;
    let dirCount = 0;
    const dirs = new Set();
    for (const f of files) {
      const data = Storage.readFile(projectId, f);
      if (data) {
        totalSize += (data.content || '').length;
        fileCount++;
      }
      const parts = f.split('/');
      for (let i = 1; i < parts.length; i++) {
        dirs.add(parts.slice(0, i).join('/'));
      }
    }
    dirCount = dirs.size;
    const sizeStr = totalSize > 1024 * 1024
      ? (totalSize / 1024 / 1024).toFixed(1) + ' MB'
      : totalSize > 1024
        ? (totalSize / 1024).toFixed(1) + ' KB'
        : totalSize + ' B';
    const lines = [
      { text: `Files:       ${fileCount}`, type: 'output' },
      { text: `Directories: ${dirCount}`, type: 'output' },
      { text: `Total size:  ${sizeStr}`, type: 'output' },
      { text: `Storage:     localStorage`, type: 'info' },
    ];
    return { lines };
  }

  _refreshFileList() {
    if (this._app && this._app.loadProjectFiles) {
      this._app.loadProjectFiles(this._getProjectId());
    }
  }

  getCompletions(partial) {
    const files = this._getFiles();
    const resolved = this._resolvePath(partial);
    const prefix = resolved.endsWith('/') ? resolved : resolved.substring(0, resolved.lastIndexOf('/') + 1);
    const suffix = resolved.slice(prefix.length);
    const matches = [];
    // Directory completions
    const dirs = new Set();
    for (const f of files) {
      if (!f.startsWith(prefix)) continue;
      const rest = f.slice(prefix.length);
      const slashIdx = rest.indexOf('/');
      if (slashIdx !== -1) {
        const dir = rest.slice(0, slashIdx + 1);
        if (dir.startsWith(suffix)) dirs.add(dir);
      } else if (rest.startsWith(suffix)) {
        matches.push(rest);
      }
    }
    return [...dirs, ...matches];
  }
}

// ============================================================
// Terminal — UI component for the terminal panel
// ============================================================

class Terminal {
  constructor(shell) {
    this.shell = shell;
    this.body = document.getElementById('terminal-body');
    this.isOpen = false;
    this.history = [];
    this.historyIndex = -1;
    this.currentInput = '';
    this._inputEl = null;
    this._inputLine = null;

    this._bindCloseBtn();
    this._bindClearBtn();
  }

  open() {
    const panel = document.getElementById('terminal-panel');
    const resize = document.getElementById('terminal-resize');
    if (!panel || !resize) return;
    this.isOpen = true;
    panel.style.display = '';
    resize.style.display = '';
    this._ensureInputLine();
    this._scrollToBottom();
    if (this._inputEl) this._inputEl.focus();
  }

  close() {
    const panel = document.getElementById('terminal-panel');
    const resize = document.getElementById('terminal-resize');
    if (!panel || !resize) return;
    this.isOpen = false;
    panel.style.display = 'none';
    resize.style.display = 'none';
  }

  toggle() {
    if (this.isOpen) this.close(); else this.open();
  }

  _bindCloseBtn() {
    const btn = document.getElementById('btn-terminal-close');
    if (btn) btn.addEventListener('click', () => this.close());
  }

  _bindClearBtn() {
    const btn = document.getElementById('btn-terminal-clear');
    if (btn) btn.addEventListener('click', () => this.clear());
  }

  clear() {
    if (this.body) this.body.innerHTML = '';
    this._inputEl = null;
    this._inputLine = null;
    this._ensureInputLine();
  }

  _ensureInputLine() {
    if (!this.body) return;
    // Remove old input line if no longer in DOM
    if (this._inputLine && !this._inputLine.parentNode) {
      this._inputLine = null;
      this._inputEl = null;
    }
    if (this._inputEl) return;

    const line = document.createElement('div');
    line.className = 'terminal-input-line';

    const prompt = document.createElement('span');
    prompt.className = 'terminal-input-prompt';
    prompt.textContent = this._getPrompt();

    const input = document.createElement('input');
    input.className = 'terminal-input';
    input.type = 'text';
    input.autocomplete = 'off';
    input.autocapitalize = 'off';
    input.spellcheck = false;
    input.placeholder = 'Type a command...';

    input.addEventListener('keydown', (e) => this._onKeyDown(e));

    line.appendChild(prompt);
    line.appendChild(input);
    this.body.appendChild(line);
    this._inputLine = line;
    this._inputEl = input;
  }

  _getPrompt() {
    const cwd = this.shell.cwd === '/' ? '~' : '~' + this.shell.cwd;
    return `${this.shell.env.USER}@pocketide:${cwd}$ `;
  }

  _onKeyDown(e) {
    const input = this._inputEl;
    if (!input) return;
    if (e.key === 'Enter') {
      e.preventDefault();
      const cmd = input.value;
      // Add command line to output
      this._addLine(this.shell.cwd === '/' ? '~' : '~' + this.shell.cwd + ' $ ' + cmd, 'prompt');
      if (cmd.trim()) {
        this.history.push(cmd);
        this.historyIndex = this.history.length;
        const result = this.shell.execute(cmd);
        if (result.clear) {
          this.clear();
        } else {
          for (const line of result.lines) this._addLine(line.text, line.type);
        }
      }
      input.value = '';
      this._scrollToBottom();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (this.history.length > 0 && this.historyIndex > 0) {
        if (this.historyIndex === this.history.length) this.currentInput = input.value;
        this.historyIndex--;
        input.value = this.history[this.historyIndex];
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (this.historyIndex < this.history.length - 1) {
        this.historyIndex++;
        input.value = this.history[this.historyIndex];
      } else if (this.historyIndex === this.history.length - 1) {
        this.historyIndex = this.history.length;
        input.value = this.currentInput;
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      this._tabComplete(input);
    } else if (e.key === 'c' && e.ctrlKey) {
      e.preventDefault();
      input.value = '';
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      this.clear();
    } else if (e.key === 'u' && e.ctrlKey) {
      e.preventDefault();
      input.value = '';
    }
  }

  _tabComplete(input) {
    const value = input.value;
    const parts = value.split(/\s+/);
    const last = parts[parts.length - 1];
    if (!last) return;
    const completions = this.shell.getCompletions(last);
    if (completions.length === 0) return;
    if (completions.length === 1) {
      parts[parts.length - 1] = completions[0];
      input.value = parts.join(' ');
    } else {
      // Show all completions
      const cwd = this.shell.cwd === '/' ? '~' : '~' + this.shell.cwd;
      this._addLine(`${cwd} $ ${value}`, 'prompt');
      this._addLine(completions.join('  '), 'info');
      // Find common prefix
      let common = completions[0];
      for (const c of completions) {
        while (!c.startsWith(common)) common = common.slice(0, -1);
      }
      if (common.length > last.length) {
        parts[parts.length - 1] = common;
        input.value = parts.join(' ');
      }
      this._scrollToBottom();
    }
  }

  _addLine(text, type) {
    if (!this.body) return;
    const div = document.createElement('div');
    div.className = 'terminal-line ' + (type || 'output');
    if (type === 'prompt') {
      const promptSpan = document.createElement('span');
      promptSpan.className = 'term-prompt';
      // Split off the prompt part
      const dollarIdx = text.indexOf('$ ');
      if (dollarIdx !== -1) {
        promptSpan.textContent = text.slice(0, dollarIdx + 2);
        const cmdSpan = document.createElement('span');
        cmdSpan.className = 'term-cmd';
        cmdSpan.textContent = text.slice(dollarIdx + 2);
        div.appendChild(promptSpan);
        div.appendChild(cmdSpan);
      } else {
        div.textContent = text;
      }
    } else {
      div.textContent = text;
    }
    // Insert before the input line
    if (this._inputLine && this._inputLine.parentNode === this.body) {
      this.body.insertBefore(div, this._inputLine);
    } else {
      this.body.appendChild(div);
    }
  }

  _scrollToBottom() {
    if (this.body) this.body.scrollTop = this.body.scrollHeight;
  }
}

// ============================================================
// PocketIDE - Main Application
// ============================================================

class PocketIDE {
  constructor() {
    this.editor = null;
    this.fileTree = null;
    this.tabManager = null;
    this.currentProjectId = null;
    this.fileContents = new Map();
    this.savedContents = new Map();
    this.fileList = [];
    this.sidebarVisible = true;
    /** Native File System (null = localStorage mode) */
    this.fileSystem = null;
    /** Clipboard for copy/cut/paste: { action: 'copy'|'cut', paths: string[] } */
    this._fileClipboard = null;
    /** Git panel + problem-detection state */
    this.gitPanel = null;
    this.gitInitialized = false;
    /** Find & Replace */
    this.findReplace = null;
    /** Terminal */
    this.terminal = null;
    this.shell = null;
    this.problems = [];
    this._problemsTimer = null;
    this.init();
  }

  init() {
    ThemeManager.apply('dark');

    const project = Storage.initDefaultProject();
    this.currentProjectId = project.id;

    this.initEditor();
    this.initFileTree();
    this.initTabs();
    this.initTerminal();
    this.setupKeyboardShortcuts();
    this.setupSidebarResize();
    this.setupUIControls();
    this.initGit();
    this.initProblemsUI();

    this.loadProjectFiles(this.currentProjectId);

    const sidebarTitle = document.getElementById('sidebar-title');
    if (sidebarTitle) sidebarTitle.textContent = project.name;

    this._initMobileGestures();
    this._initKeyboardViewport();
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        this._initMobileGestures();
        if (window.innerWidth > 768 && this.sidebarVisible === false) {
          const sidebar = document.getElementById('sidebar');
          if (sidebar) sidebar.classList.remove('open');
        }
      }, 200);
    });

    this._updateSaveStatusBar();
    console.log('PocketIDE initialized');
  }

  isNativeMode() { return this.fileSystem !== null; }

  async openFolder() {
    try {
      const fs = await NativeFileSystem.pickFolder();
      this.fileSystem = fs;
      // Clear existing state
      this.fileContents.clear();
      this.savedContents.clear();
      this.fileList = [];
      this.tabManager.tabs = [];
      this.tabManager.activeTabId = null;
      this.tabManager.render();
      this.editor.setValue('');
      this.showWelcome();
      // Update sidebar
      const sidebarTitle = document.getElementById('sidebar-title-text');
      const folderName = document.getElementById('sidebar-folder-name');
      const sidebar = document.getElementById('sidebar');
      if (sidebarTitle) sidebarTitle.textContent = 'EXPLORER';
      if (folderName) { folderName.textContent = fs.name; folderName.style.display = 'block'; }
      if (sidebar) sidebar.classList.add('folder-mode');
      // Update Open Folder button icon
      const openBtn = document.getElementById('btn-open-folder');
      if (openBtn) {
        const use = openBtn.querySelector('use');
        if (use) use.setAttribute('href', '#i-x');
        openBtn.title = 'Close Folder';
      }
      // Update status
      const statusBranch = document.getElementById('status-branch');
      if (statusBranch) statusBranch.textContent = fs.name;
      // Load files from native FS
      await this._loadNativeFiles();
    } catch (e) {
      if (e.name !== 'AbortError' && e.name !== 'SecurityError') {
        console.warn('Open folder cancelled or error:', e);
      }
    }
  }

  async closeFolder() {
    this.fileSystem = null;
    this.fileContents.clear();
    this.savedContents.clear();
    this.fileList = [];
    this.tabManager.tabs = [];
    this.tabManager.activeTabId = null;
    this.tabManager.render();
    this.editor.setValue('');
    this.showWelcome();
    // Reset sidebar
    const sidebarTitle = document.getElementById('sidebar-title-text');
    const folderName = document.getElementById('sidebar-folder-name');
    const sidebar = document.getElementById('sidebar');
    if (sidebarTitle) sidebarTitle.textContent = 'EXPLORER';
    if (folderName) { folderName.textContent = ''; folderName.style.display = 'none'; }
    if (sidebar) sidebar.classList.remove('folder-mode');
    const openBtn = document.getElementById('btn-open-folder');
    if (openBtn) {
      const use = openBtn.querySelector('use');
      if (use) use.setAttribute('href', '#i-folder-open');
      openBtn.title = 'Open Folder';
    }
    const statusBranch = document.getElementById('status-branch');
    if (statusBranch) statusBranch.textContent = 'local';
    // Reload local project
    this.currentProjectId = Storage.listProjects()[0]?.id || 'default';
    this.loadProjectFiles(this.currentProjectId);
  }

  async _loadNativeFiles() {
    if (!this.fileSystem) return;
    try {
      this.fileList = await this.fileSystem.listFiles();
      if (this.fileTree) this.fileTree.buildFromFileList(this.fileList);
    } catch (e) {
      console.warn('Failed to load native files:', e);
    }
  }

  // --- Editor ---
  initEditor() {
    const editorContainer = document.getElementById('editor-wrapper');
    if (!editorContainer) return;
    this.editor = new TextEditor(editorContainer);
    this.findReplace = new FindReplace(this.editor);
    this.editor.on('save', (content) => {
      const tab = this.tabManager.getActiveTab();
      if (tab) this.saveFile(tab.path, content);
    });
    this.editor.on('change', () => {
      const tab = this.tabManager.getActiveTab();
      if (!tab) return;
      const currentContent = this.editor.getValue();
      this.fileContents.set(tab.path, currentContent);
      const saved = this.savedContents.get(tab.path) || '';
      this.tabManager.setTabDirty(tab.path, currentContent !== saved);
      this._scheduleProblemCheck();
      this._scheduleAutoSave();
    });
    const updateCursorPos = () => this.updateStatusBarPosition();
    this.editor.textarea.addEventListener('click', updateCursorPos);
    this.editor.textarea.addEventListener('keyup', updateCursorPos);

    // Save All button
    const saveAllBtn = document.getElementById('status-save-all');
    if (saveAllBtn) {
      saveAllBtn.addEventListener('click', () => this.saveAllFiles());
    }
  }

  _updateSaveStatusBar() {
    const count = this.getUnsavedCount();
    const btn = document.getElementById('status-save-all');
    const countEl = document.getElementById('status-unsaved-count');
    if (btn) btn.style.display = count > 0 ? '' : 'none';
    if (countEl) countEl.textContent = count;
  }

  // --- Terminal ---
  initTerminal() {
    const self = this;
    this.shell = new Shell(
      () => self.currentProjectId,
      () => self.fileList,
      self
    );
    this.terminal = new Terminal(this.shell);
    this._setupTerminalResize();
  }

  _setupTerminalResize() {
    const resizeHandle = document.getElementById('terminal-resize');
    const panel = document.getElementById('terminal-panel');
    if (!resizeHandle || !panel) return;
    let startY = 0, startH = 0;
    const onMove = (e) => {
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const newH = Math.max(100, Math.min(window.innerHeight * 0.7, startH - (clientY - startY)));
      panel.style.height = newH + 'px';
    };
    const onUp = () => {
      resizeHandle.classList.remove('resizing');
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onUp);
    };
    resizeHandle.addEventListener('mousedown', (e) => {
      e.preventDefault();
      startY = e.clientY;
      startH = panel.offsetHeight;
      resizeHandle.classList.add('resizing');
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
    resizeHandle.addEventListener('touchstart', (e) => {
      startY = e.touches[0].clientY;
      startH = panel.offsetHeight;
      resizeHandle.classList.add('resizing');
      document.addEventListener('touchmove', onMove, { passive: false });
      document.addEventListener('touchend', onUp);
    });
  }

  // --- File Tree ---
  initFileTree() {
    const treeContainer = document.getElementById('file-tree');
    if (!treeContainer) return;

    this.fileTree = new FileTree(treeContainer, {
      onFileSelect: async (path) => {
        const cached = this.fileContents.get(path);
        if (cached !== undefined) { this.openFile(path, cached); return; }
        if (this.isNativeMode()) {
          const content = await this.fileSystem.readFile(path);
          this.openFile(path, content !== null ? content : '', true);
        } else {
          const data = Storage.readFile(this.currentProjectId, path);
          this.openFile(path, data ? data.content : '', true);
        }
      },
      onFileDelete: async (path) => {
        if (this.isNativeMode()) {
          await this.fileSystem.deleteFile(path);
          this.fileList = this.fileList.filter(f => f.path !== path);
          this.fileTree.buildFromFileList(this.fileList);
          this.closeFile(path);
        } else {
          Storage.deleteFile(this.currentProjectId, path);
          this.fileList = this.fileList.filter(f => f.path !== path);
          this.fileTree.buildFromFileList(this.fileList);
          this.closeFile(path);
        }
      },
      onFileRename: async (oldPath, newName) => {
        const parentDir = oldPath.substring(0, oldPath.lastIndexOf('/') + 1);
        const newPath = parentDir ? `${parentDir}${newName}` : newName;
        if (this.isNativeMode()) {
          await this.fileSystem.renameFile(oldPath, newPath);
        } else {
          Storage.renameFile(this.currentProjectId, oldPath, newPath);
        }
        if (this.fileContents.has(oldPath)) {
          this.fileContents.set(newPath, this.fileContents.get(oldPath));
          this.fileContents.delete(oldPath);
        }
        if (this.savedContents.has(oldPath)) {
          this.savedContents.set(newPath, this.savedContents.get(oldPath));
          this.savedContents.delete(oldPath);        }
        await this._loadNativeFiles();
      },

      onNewFile: async (parentPath, name) => {
        const filePath = parentPath ? `${parentPath}/${name}` : name;
        if (this.isNativeMode()) {
          await this.fileSystem.writeFile(filePath, '');
          await this._loadNativeFiles();
          this.openFile(filePath, '');
        } else {
          Storage.writeFile(this.currentProjectId, filePath, '');
          this.loadProjectFiles(this.currentProjectId);
          this.openFile(filePath, '');
        }
      },
      onNewFolder: async (parentPath, name) => {
        if (this.isNativeMode()) {
          const folderPath = parentPath ? `${parentPath}/${name}` : name;
          await this.fileSystem.ensureDirectory(folderPath);
          await this._loadNativeFiles();
        } else {
          this.loadProjectFiles(this.currentProjectId);
        }
      },
      onFileCopy: (path) => { this._fileClipboard = { action: 'copy', paths: [path] }; },
      onFileCut: (path) => { this._fileClipboard = { action: 'cut', paths: [path] }; },
      onFilePaste: async (targetPath) => {
        if (!this._fileClipboard || !this._fileClipboard.paths.length) return;
        const { action, paths } = this._fileClipboard;
        for (const srcPath of paths) {
          const name = srcPath.split('/').pop() || srcPath;
          const destPath = targetPath ? `${targetPath}/${name}` : name;
          if (this.isNativeMode()) {
            const content = await this.fileSystem.readFile(srcPath);
            if (content !== null) {
              await this.fileSystem.writeFile(destPath, content);
              if (action === 'cut') await this.fileSystem.deleteFile(srcPath);
            }
          } else {
            const data = Storage.readFile(this.currentProjectId, srcPath);
            if (data && data.content !== undefined) {
              Storage.writeFile(this.currentProjectId, destPath, data.content);
              if (action === 'cut') Storage.deleteFile(this.currentProjectId, srcPath);
            }
          }
        }
        if (action === 'cut') this._fileClipboard = null;    await this._loadNativeFiles();
    this.loadProjectFiles(this.currentProjectId);
  },

      onFileDuplicate: async (path) => {
        const name = path.split('/').pop() || path;
        const base = name.replace(/(\.[^.]+)$/, '');
        const ext = name.includes('.') ? name.substring(name.lastIndexOf('.')) : '';
        let copyName = `${base} copy${ext}`;
        let copyPath = path.substring(0, path.lastIndexOf('/') + 1) + copyName;
        if (this.isNativeMode()) {
          const content = await this.fileSystem.readFile(path);
          if (content !== null) { await this.fileSystem.writeFile(copyPath, content); await this._loadNativeFiles(); }
        } else {
          const data = Storage.readFile(this.currentProjectId, path);
          if (data && data.content !== undefined) {
            Storage.writeFile(this.currentProjectId, copyPath, data.content);
            this.loadProjectFiles(this.currentProjectId);
          }
        }
      },
      onCopyPath: (path) => {
        navigator.clipboard.writeText(path).catch(() => {});
      },
    });
  }

  initTabs() {
    const tabsContainer = document.getElementById('tabs-container');
    if (!tabsContainer) return;
    this.tabManager = new TabManager(tabsContainer, {
      onTabOpen: () => this.showEditor(),
      onTabActivate: (tab) => {
        const content = this.fileContents.get(tab.path);
        if (content !== undefined) this.editor.setValue(content);
        this.editor.setFilename(tab.path);
        this.updateStatusBarFile(tab.path);
        if (this.fileTree) this.fileTree.revealPath(tab.path);
      },
      onTabClose: (tabId) => {
        const tab = this.tabManager.tabs.find(t => t.id === tabId);
        if (tab) {
          this.fileContents.delete(tab.path);
          this.savedContents.delete(tab.path);
        }
        if (this.tabManager.tabs.length === 0) this.showWelcome();
      },
      onNoTabs: () => {
        this.showWelcome();
      },
      onDirtyChange: () => {
        this._updateSaveStatusBar();
      },
    });
  }

  // --- File Operations ---
  openFile(path, content, isSaved = true) {
    if (!path) return;
    this.fileContents.set(path, content || '');
    if (isSaved) this.savedContents.set(path, content || '');
    const name = path.split('/').pop() || path;
    const tab = this.tabManager.openTab(path, name);
    if (!tab) return;
    if (tab.active) {
      this.editor.setValue(content || '');
      this.editor.setFilename(path);
      this.showEditor();
      this.updateStatusBarFile(path);
    }
    if (this.fileTree) this.fileTree.revealPath(path);
    this.closeMobileSidebar();
  }

  closeFile(path) {
    const tab = this.tabManager.getTabByPath(path);
    if (tab) this.tabManager.closeTab(tab.id);
    this.fileContents.delete(path);
    this.savedContents.delete(path);
  }

  saveFile(path, content) {
    if (content !== undefined) this.fileContents.set(path, content);
    const savedContent = this.fileContents.get(path) || '';
    this.savedContents.set(path, savedContent);
    this.tabManager.setTabDirty(path, false);

    if (this.isNativeMode()) {
      // Write to native file system
      this.fileSystem.writeFile(path, savedContent).catch(e => console.warn('Native save error:', e));
    } else {
      Storage.writeFile(this.currentProjectId, path, savedContent);
    }
    if (this.gitPanel) this.gitPanel.refresh();
    console.log(`Saved: ${path}`);
  }

  _scheduleAutoSave() {
    clearTimeout(this._autoSaveTimer);
    this._autoSaveTimer = setTimeout(() => this._autoSave(), 2000);
  }

  _autoSave() {
    // Save all dirty tabs
    let saved = 0;
    for (const tab of this.tabManager.tabs) {
      if (tab.dirty) {
        const content = this.fileContents.get(tab.path);
        if (content !== undefined) {
          this.saveFile(tab.path, content);
          saved++;
        }
      }
    }
  }

  saveAllFiles() {
    let saved = 0;
    for (const tab of this.tabManager.tabs) {
      if (tab.dirty) {
        const content = this.fileContents.get(tab.path);
        if (content !== undefined) {
          this.saveFile(tab.path, content);
          saved++;
        }
      }
    }
    // Also save the current tab even if not marked dirty
    const activeTab = this.tabManager.getActiveTab();
    if (activeTab) {
      const content = this.editor.getValue();
      this.saveFile(activeTab.path, content);
      saved++;
    }
    return saved;
  }

  getUnsavedCount() {
    return this.tabManager.tabs.filter(t => t.dirty).length;
  }

  loadProjectFiles(projectId) {
    if (this.isNativeMode()) return;
    const files = Storage.getProjectFilesList(projectId);
    this.fileList = files;
    if (this.fileTree) this.fileTree.buildFromFileList(files);
  }

  // --- UI helpers ---
  showEditor() {
    const welcome = document.getElementById('editor-welcome');
    const wrapper = document.getElementById('editor-wrapper');
    if (welcome) welcome.style.display = 'none';
    if (wrapper) wrapper.style.display = 'flex';
    setTimeout(() => this.editor.focus(), 50);
  }

  showWelcome() {
    const welcome = document.getElementById('editor-welcome');
    const wrapper = document.getElementById('editor-wrapper');
    if (welcome) welcome.style.display = 'flex';
    if (wrapper) wrapper.style.display = 'none';
  }

  updateStatusBarFile(path) {
    const langEl = document.getElementById('status-language');
    if (langEl) langEl.textContent = LanguageDetector.getLanguageName(path);
    this.updateStatusBarPosition();
  }

  updateStatusBarPosition() {
    const cursor = this.editor.getCursor();
    const statusPos = document.getElementById('status-position');
    if (statusPos) statusPos.textContent = `Ln ${cursor.line}, Col ${cursor.col}`;
  }

  toggleSidebar() {
    this.sidebarVisible = !this.sidebarVisible;
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (!sidebar) return;
    if (window.innerWidth <= 768) {
      sidebar.classList.toggle('open', this.sidebarVisible);
      if (overlay) overlay.classList.toggle('visible', this.sidebarVisible);
      document.body.style.overflow = this.sidebarVisible ? 'hidden' : '';
    } else {
      sidebar.classList.toggle('collapsed', !this.sidebarVisible);
    }
  }

  closeMobileSidebar() {
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
      loc.textContent = `${p.line}:${p.col}`;
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
  }

  _showBottomSheet() {
    const bs = document.getElementById('bottom-sheet-overlay');
    if (bs) bs.style.display = 'block';
    const themeLabel = document.getElementById('bs-theme-label');
    if (themeLabel) {
      themeLabel.textContent = 'Switch to ' + (ThemeManager.currentTheme === 'dark' ? 'Light' : 'Dark') + ' Theme';
    }
  }

  _closeBottomSheet() {
    const bs = document.getElementById('bottom-sheet-overlay');
    if (bs) bs.style.display = 'none';
  }

  _showZoomIndicator(size) {
    const el = document.getElementById('zoom-indicator');
    if (!el) return;
    el.textContent = `Font: ${size}px`;
    el.classList.add('visible');
    clearTimeout(this._zoomTimer);
    this._zoomTimer = setTimeout(() => el.classList.remove('visible'), 1500);
  }

  // --- Mobile Touch Gestures ---
  _initMobileGestures() {
    const isMobile = window.innerWidth <= 768;

    if (this._mobileGesturesInited && isMobile) return;

    if (!isMobile) {
      // Clean up on desktop transition
      if (this._mobileGesturesInited) {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) { sidebar.style.transform = ''; sidebar.style.transition = ''; }
        this._mobileGesturesInited = false;
        document.body.style.overflow = '';
      }
      return;
    }

    this._mobileGesturesInited = true;
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const edgeZone = document.getElementById('edge-swipe-zone');
    if (!sidebar || !overlay || !edgeZone) return;

    let touchStartX = 0;
    let touchStartY = 0;
    let isDragging = false;
    let currentTranslateX = 0;
    const sidebarWidth = () => sidebar.offsetWidth || 260;

    // Edge swipe zone — open sidebar
    edgeZone.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      isDragging = false;
    }, { passive: true });

    edgeZone.addEventListener('touchmove', (e) => {
      const deltaX = e.touches[0].clientX - touchStartX;
      const deltaY = Math.abs(e.touches[0].clientY - touchStartY);
      if (deltaX > 10 && deltaY < deltaX * 2) {
        isDragging = true;
        sidebar.style.transition = 'none';
        currentTranslateX = Math.min(0, deltaX - sidebarWidth());
        sidebar.style.transform = `translateX(${currentTranslateX}px)`;
        const progress = Math.min(1, (deltaX) / sidebarWidth());
        overlay.style.display = 'block';
        overlay.style.pointerEvents = 'none';
        overlay.style.opacity = progress * 0.4;
      }
    }, { passive: true });

    const onEdgeTouchEnd = () => {
      if (isDragging) {
        sidebar.style.transition = '';
        const progress = Math.abs(currentTranslateX) / sidebarWidth();
        if (progress > 0.3) {
          sidebar.classList.add('open');
          overlay.classList.add('visible');
          overlay.style.opacity = '';
          overlay.style.pointerEvents = '';
          this.sidebarVisible = true;
        } else {
          sidebar.style.transform = '';
          overlay.style.display = '';
          overlay.style.opacity = '';
          overlay.style.pointerEvents = '';
        }
        isDragging = false;
      }
    };
    edgeZone.addEventListener('touchend', onEdgeTouchEnd);
    edgeZone.addEventListener('touchcancel', onEdgeTouchEnd);

    // Swipe left on open sidebar to close
    sidebar.addEventListener('touchstart', (e) => {
      if (!sidebar.classList.contains('open')) return;
      touchStartX = e.touches[0].clientX;
      isDragging = false;
    }, { passive: true });

    sidebar.addEventListener('touchmove', (e) => {
      if (!sidebar.classList.contains('open')) return;
      const deltaX = e.touches[0].clientX - touchStartX;
      if (deltaX < 0) {
        isDragging = true;
        sidebar.style.transition = 'none';
        currentTranslateX = Math.max(-sidebarWidth(), deltaX);
        sidebar.style.transform = `translateX(${currentTranslateX}px)`;
        const progress = Math.min(1, Math.abs(deltaX) / sidebarWidth());
        overlay.style.opacity = 0.4 * (1 - progress);
      }
    }, { passive: true });

    sidebar.addEventListener('touchend', () => {
      if (!isDragging) return;
      sidebar.style.transition = '';
      const progress = Math.abs(currentTranslateX) / sidebarWidth();
      if (progress > 0.3) {
        this.sidebarVisible = false;
        sidebar.classList.remove('open');
        overlay.classList.remove('visible');
        overlay.style.opacity = '';
        document.body.style.overflow = '';
      } else {
        sidebar.style.transform = '';
        overlay.style.opacity = 0.4;
      }
      isDragging = false;
    }, { passive: true });

    // Pinch-to-zoom
    const hasGestureEvents = 'ongesturechange' in window;
    let initialFontSize = this.editor ? this.editor.fontSize : 14;

    if (hasGestureEvents) {
      // iOS: gesturechange event
      document.addEventListener('gesturestart', (e) => {
        if (e.target.closest && !e.target.closest('.editor-wrapper-custom')) return;
        initialFontSize = this.editor ? this.editor.fontSize : 14;
        e.preventDefault();
      }, { passive: false });

      document.addEventListener('gesturechange', (e) => {
        if (e.target.closest && !e.target.closest('.editor-wrapper-custom')) return;
        e.preventDefault();
        if (this.editor) {
          const newSize = Math.round(initialFontSize * e.scale);
          this.editor.setFontSize(newSize);
          this._showZoomIndicator(Math.round(newSize));
        }
      }, { passive: false });

      document.addEventListener('gestureend', () => {});
    } else {
      // Android: two-finger touch
      let initialDist = 0;
      document.addEventListener('touchstart', (e) => {
        if (e.touches.length === 2 && e.target.closest && e.target.closest('.editor-wrapper-custom')) {
          initialFontSize = this.editor ? this.editor.fontSize : 14;
          initialDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
        }
      }, { passive: true });

      document.addEventListener('touchmove', (e) => {
        if (e.touches.length === 2 && e.target.closest && e.target.closest('.editor-wrapper-custom')) {
          e.preventDefault();
          const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
          if (initialDist > 0) {
            const scale = dist / initialDist;
            const newSize = Math.round(initialFontSize * scale);
            this.editor.setFontSize(newSize);
            this._showZoomIndicator(newSize);
          }
        }
      }, { passive: false });

      document.addEventListener('touchend', () => { initialDist = 0; }, { passive: true });
    }
  }

  // --- Keyboard Shortcuts ---
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      const ctrl = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;

      // Ctrl+Shift+S - Save All
      if (ctrl && shift && (e.key === 'S' || e.key === 's')) {
        e.preventDefault();
        this.saveAllFiles();
        return;
      }

      // Ctrl+S - Save
      if (ctrl && e.key === 's' && !shift) {
        e.preventDefault();
        const tab = this.tabManager.getActiveTab();
        if (tab) this.saveFile(tab.path, this.editor.getValue());
        return;
      }

      // Ctrl+F - Find
      if (ctrl && e.key === 'f' && !shift) {
        e.preventDefault();
        if (this.findReplace) this.findReplace.open(false);
        return;
      }

      // Ctrl+Shift+F - Find & Replace
      if (ctrl && shift && (e.key === 'F' || e.key === 'f')) {
        e.preventDefault();
        if (this.findReplace) this.findReplace.open(true);
        return;
      }

      // Ctrl+H - Find & Replace (alt shortcut)
      if (ctrl && e.key === 'h') {
        e.preventDefault();
        if (this.findReplace) this.findReplace.open(true);
        return;
      }

      // Escape - Close Find & Replace
      if (e.key === 'Escape' && this.findReplace && this.findReplace.isOpen) {
        e.preventDefault();
        e.stopPropagation();
        this.findReplace.close();
        return;
      }

      // Ctrl+` - Toggle Terminal
      if (ctrl && e.key === '`') {
        e.preventDefault();
        if (this.terminal) this.terminal.toggle();
        return;
      }

      // Escape - Close Terminal (when terminal is focused)
      if (e.key === 'Escape' && this.terminal && this.terminal.isOpen && document.activeElement && document.activeElement.closest('#terminal-panel')) {
        e.preventDefault();
        e.stopPropagation();
        this.terminal.close();
        if (this.editor && this.editor.textarea) this.editor.textarea.focus();
        return;
      }

      // Ctrl+W - Close Tab
      if (ctrl && e.key === 'w') {
        e.preventDefault();
        const tab = this.tabManager.getActiveTab();
        if (tab) this.tabManager.closeTab(tab.id);
        return;
      }

      // Ctrl+B - Toggle Sidebar
      if (ctrl && e.key === 'b') {
        e.preventDefault();
        this.toggleSidebar();
        return;
      }

      // Ctrl+Tab - Next Tab
      if (ctrl && e.key === 'Tab' && !shift) {
        e.preventDefault();
        const tabs = this.tabManager.tabs;
        if (tabs.length < 2) return;
        const activeIndex = tabs.findIndex(t => t.active);
        const newIndex = (activeIndex + 1) % tabs.length;
        this.tabManager.activateTab(tabs[newIndex].id);
        return;
      }

      // Ctrl+Shift+Tab - Previous Tab
      if (ctrl && shift && e.key === 'Tab') {
        e.preventDefault();
        const tabs = this.tabManager.tabs;
        if (tabs.length < 2) return;
        const activeIndex = tabs.findIndex(t => t.active);
        const newIndex = (activeIndex - 1 + tabs.length) % tabs.length;
        this.tabManager.activateTab(tabs[newIndex].id);
        return;
      }

      // Ctrl+N - New File
      if (ctrl && e.key === 'n') {
        e.preventDefault();
        const path = this.fileTree ? this.fileTree.selectedPath : '';
        const parentPath = path && this.fileList.find(f => f.path === path)
          ? path.substring(0, path.lastIndexOf('/'))
          : '';
        this.fileTree.showInputModal('New File', 'e.g. main.py, index.cpp', '', (name) => {
          if (this.isNativeMode()) {
            const fp = parentPath ? `${parentPath}/${name}` : name;
            this.fileSystem.writeFile(fp, '').then(() => this._loadNativeFiles());
            this.openFile(fp, '');
          } else {
            const fp = parentPath ? `${parentPath}/${name}` : name;
            Storage.writeFile(this.currentProjectId, fp, '');
            this.loadProjectFiles(this.currentProjectId);
            this.openFile(fp, '');
          }
        }, { chips: true });
        return;
      }

      // F2 - Rename selected file
      if (e.key === 'F2') {
        e.preventDefault();
        const selectedPath = this.fileTree ? this.fileTree.selectedPath : null;
        if (selectedPath) {
          const node = this.fileTree.nodes.find(n => n.path === selectedPath);
          if (node) this.fileTree.promptRename(node);
        }
        return;
      }

      // Delete - Delete selected file
      if (e.key === 'Delete') {
        const path = this.fileTree ? this.fileTree.selectedPath : null;
        if (path && document.activeElement && document.activeElement.closest('#file-tree')) {
          e.preventDefault();
          if (this.isNativeMode()) {
            this.fileSystem.deleteFile(path).then(() => this._loadNativeFiles());
            this.closeFile(path);
          } else {
            Storage.deleteFile(this.currentProjectId, path);
            this.loadProjectFiles(this.currentProjectId);
            this.closeFile(path);
          }
        }
        return;
      }

      // Ctrl+C - Copy file (when focused on file tree)
      if (ctrl && e.key === 'c' && document.activeElement && document.activeElement.closest('#file-tree')) {
        e.preventDefault();
        const path = this.fileTree ? this.fileTree.selectedPath : null;
        if (path) this._fileClipboard = { action: 'copy', paths: [path] };
        return;
      }

      // Ctrl+X - Cut file
      if (ctrl && e.key === 'x' && document.activeElement && document.activeElement.closest('#file-tree')) {
        e.preventDefault();
        const path = this.fileTree ? this.fileTree.selectedPath : null;
        if (path) this._fileClipboard = { action: 'cut', paths: [path] };
        return;
      }

      // Ctrl+V - Paste file
      if (ctrl && e.key === 'v' && document.activeElement && document.activeElement.closest('#file-tree')) {
        e.preventDefault();
        if (this._fileClipboard && this._fileClipboard.paths.length) {
          const targetPath = this.fileTree ? this.fileTree.selectedPath || '' : '';
          this._pasteFiles(targetPath);
        }
        return;
      }

      // Ctrl+D - Duplicate file
      if (ctrl && e.key === 'd' && document.activeElement && document.activeElement.closest('#file-tree')) {
        e.preventDefault();
        const path = this.fileTree ? this.fileTree.selectedPath : null;
        if (path) this._duplicateFile(path);
        return;
      }
    });
  }

  async _pasteFiles(targetPath) {
    if (!this._fileClipboard || !this._fileClipboard.paths.length) return;
    const { action, paths } = this._fileClipboard;
    const targetDir = targetPath && this.fileList.find(f => f.path === targetPath)
      ? targetPath.substring(0, targetPath.lastIndexOf('/') + 1)
      : targetPath || '';

    for (const srcPath of paths) {
      const name = srcPath.split('/').pop() || srcPath;
      const destPath = targetDir ? `${targetDir}/${name}` : name;

      if (this.isNativeMode()) {
        const content = await this.fileSystem.readFile(srcPath);
        if (content !== null) {
          await this.fileSystem.writeFile(destPath, content);
          if (action === 'cut') await this.fileSystem.deleteFile(srcPath);
        }
      } else {
        const data = Storage.readFile(this.currentProjectId, srcPath);
        if (data && data.content !== undefined) {
          Storage.writeFile(this.currentProjectId, destPath, data.content);
          if (action === 'cut') Storage.deleteFile(this.currentProjectId, srcPath);
        }
      }
    }
    if (action === 'cut') this._fileClipboard = null;
    await this._loadNativeFiles();
    this.loadProjectFiles(this.currentProjectId);
  }

  async _duplicateFile(path) {
    const name = path.split('/').pop() || path;
    const base = name.replace(/(\.[^.]+)$/, '');
    const ext = name.includes('.') ? name.substring(name.lastIndexOf('.')) : '';
    let copyName = `${base} copy${ext}`;
    let copyPath = path.substring(0, path.lastIndexOf('/') + 1) + copyName;

    if (this.isNativeMode()) {
      const content = await this.fileSystem.readFile(path);
      if (content !== null) { await this.fileSystem.writeFile(copyPath, content); await this._loadNativeFiles(); }
    } else {
      const data = Storage.readFile(this.currentProjectId, path);
      if (data && data.content !== undefined) {
        Storage.writeFile(this.currentProjectId, copyPath, data.content);
        this.loadProjectFiles(this.currentProjectId);
      }
    }
  }

  // --- Import Files ---
  triggerImport(mode) {
    const input = document.getElementById(mode === 'folder' ? 'import-folder-input' : 'import-input');
    if (input) input.click();
  }

  importFiles(fileList) {
    if (!fileList || !fileList.length) return;
    const files = Array.from(fileList);
    let imported = 0, skipped = 0, quotaError = false;
    const tasks = files.map(file => new Promise((resolve) => {
      // Skip media files (images/videos/audio are not text-editable)
      if (file.type && /^(image|video|audio)\//.test(file.type)) { skipped++; resolve(); return; }
      const path = file.webkitRelativePath || file.name;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const content = typeof reader.result === 'string' ? reader.result : '';
          // Binary files (zip/pdf/etc.) read as text contain null bytes — skip them
          if (content.indexOf('\u0000') !== -1) { skipped++; resolve(); return; }
          const write = () => {
            if (this.isNativeMode()) {
              this.fileSystem.writeFile(path, content).then(() => { imported++; }).catch(() => { skipped++; }).finally(resolve);
            } else {
              Storage.writeFile(this.currentProjectId, path, content);
              imported++;
              resolve();
            }
          };
          // Ask before overwriting an existing file
          const exists = this.isNativeMode()
            ? null // checked asynchronously below
            : !!Storage.readFile(this.currentProjectId, path);
          if (this.isNativeMode()) {
            this.fileSystem.readFile(path).then((existing) => {
              if (existing !== null && !window.confirm(`Overwrite "${path}"?`)) { skipped++; resolve(); return; }
              write();
            }).catch(() => write());
          } else if (exists && !window.confirm(`Overwrite "${path}"?`)) {
            skipped++; resolve();
          } else {
            write();
          }
        } catch (e) {
          if (e && e.name === 'QuotaExceededError') quotaError = true;
          skipped++;
          resolve();
        }
      };
      reader.onerror = () => { skipped++; resolve(); };
      reader.readAsText(file);
    }));
    Promise.all(tasks).then(() => {
      this._loadNativeFiles();
      this.loadProjectFiles(this.currentProjectId);
      if (this.gitPanel) this.gitPanel.refresh();
      if (quotaError) alert('Storage is full — some files could not be saved. Delete old files to free up space.');
      else if (imported > 0) console.log(`Imported ${imported} of ${imported + skipped} file(s)`);
    });
  }

  // --- Keyboard / visual viewport (mobile) ---
  _initKeyboardViewport() {
    if (!window.visualViewport || !this.editor) return;
    const apply = () => {
      const padding = Math.max(0, window.innerHeight - window.visualViewport.height);
      if (this.editor && this.editor.editorWrapper) {
        this.editor.editorWrapper.style.paddingBottom = padding > 40 ? padding + 'px' : '';
      }
    };
    window.visualViewport.addEventListener('resize', apply);
    window.visualViewport.addEventListener('scroll', apply);
  }

  // --- Sidebar Resize ---
  setupSidebarResize() {
    const handle = document.getElementById('sidebar-resize');
    const sidebar = document.getElementById('sidebar');
    if (!handle || !sidebar) return;

    let isResizing = false;
    let startX, startWidth;

    const onStart = (x) => {
      isResizing = true;
      startX = x;
      startWidth = sidebar.getBoundingClientRect().width;
      handle.classList.add('resizing');
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    };
    const onMove = (x) => {
      if (!isResizing) return;
      const newWidth = Math.max(180, Math.min(500, startWidth + (x - startX)));
      sidebar.style.width = `${newWidth}px`;
    };
    const onEnd = () => {
      if (isResizing) {
        isResizing = false;
        handle.classList.remove('resizing');
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };
    handle.addEventListener('mousedown', (e) => onStart(e.clientX));
    document.addEventListener('mousemove', (e) => onMove(e.clientX));
    document.addEventListener('mouseup', onEnd);
  }

  // --- UI Controls ---
  setupUIControls() {
    // Theme toggle
    const themeBtn = document.getElementById('btn-theme-toggle');
    if (themeBtn) themeBtn.addEventListener('click', () => ThemeManager.toggle());

    // Collapse all
    const collapseBtn = document.getElementById('btn-collapse');
    if (collapseBtn) {
      collapseBtn.addEventListener('click', () => {
        if (this.fileTree) { this.fileTree.expandedFolders.clear(); this.fileTree.render(); }
      });
    }

    // Open Folder / Close Folder button
    const openFolderBtn = document.getElementById('btn-open-folder');
    if (openFolderBtn) {
      openFolderBtn.addEventListener('click', () => {
        if (this.isNativeMode()) this.closeFolder();
        else this.openFolder();
      });
    }

    // Welcome screen Open Folder button
    const welcomeOpenBtn = document.getElementById('btn-welcome-open-folder');
    if (welcomeOpenBtn) {
      welcomeOpenBtn.addEventListener('click', () => this.openFolder());
    }

    // Hide native-folder actions where the File System Access API is unavailable (mobile/WebView)
    if (!NativeFileSystem.isSupported()) {
      [document.getElementById('btn-open-folder'), document.getElementById('btn-welcome-open-folder')].forEach(b => { if (b) b.style.display = 'none'; });
      const divider = document.querySelector('#welcome-content .welcome-divider');
      if (divider) divider.style.display = 'none';
    }

    // Welcome screen Create New File button
    const welcomeNewFileBtn = document.getElementById('btn-welcome-new-file');
    if (welcomeNewFileBtn) {
      welcomeNewFileBtn.addEventListener('click', () => {
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

    // New file button in sidebar header
    const newFileBtn = document.getElementById('btn-new-file');
    if (newFileBtn) {
      newFileBtn.addEventListener('click', () => {
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

    // New folder button in sidebar header
    const newFolderBtn = document.getElementById('btn-new-folder');
    if (newFolderBtn) {
      newFolderBtn.addEventListener('click', () => {
        this.fileTree.showInputModal('New Folder', 'Enter folder name:', '', (name) => {
          if (this.isNativeMode()) {
            this.fileSystem.ensureDirectory(name).then(() => this._loadNativeFiles());
          } else {
            this.loadProjectFiles(this.currentProjectId);
          }
        });
      });
    }

    // Import buttons + inputs
    const importBtn = document.getElementById('btn-import');
    if (importBtn) importBtn.addEventListener('click', () => this.triggerImport('files'));

    const welcomeImportBtn = document.getElementById('btn-welcome-import');
    if (welcomeImportBtn) welcomeImportBtn.addEventListener('click', () => this.triggerImport('files'));

    const importInput = document.getElementById('import-input');
    if (importInput) importInput.addEventListener('change', (e) => { this.importFiles(e.target.files); e.target.value = ''; });

    const importFolderInput = document.getElementById('import-folder-input');
    if (importFolderInput) importFolderInput.addEventListener('change', (e) => { this.importFiles(e.target.files); e.target.value = ''; });

    // Hide folder-import entry on browsers that don't support directory picking
    const bsImportFolder = document.getElementById('bs-import-folder');
    if (bsImportFolder && !('webkitdirectory' in document.createElement('input'))) {
      bsImportFolder.style.display = 'none';
    }

    // Menu button (desktop)
    const menuBtn = document.getElementById('btn-menu');
    if (menuBtn) {
      menuBtn.addEventListener('click', () => {
        if (window.innerWidth <= 768) { this._showBottomSheet(); return; }
        alert('PocketIDE v1.0\n\nKeyboard Shortcuts:\n' +
          'Ctrl+N - New File\n' +
          'Ctrl+S - Save\n' +
          'Ctrl+W - Close Tab\n' +
          'Ctrl+B - Toggle Sidebar\n' +
          'Ctrl+Tab - Next Tab\n' +
          'F2 - Rename File\n' +
          'Delete - Delete File\n' +
          'Shift+Tab - Un-indent\n\n' +
          'All files are saved locally in your browser.');
      });
    }

    // Mobile hamburger menu button
    const mobileMenuBtn = document.getElementById('btn-mobile-menu');
    if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', () => this._showBottomSheet());

    // Bottom sheet actions
    document.addEventListener('click', (e) => {
      const item = e.target.closest('#bottom-sheet .bottom-sheet-item');
      if (!item) return;
      const action = item.dataset.action;
      if (!action) return;
      this._closeBottomSheet();

      switch (action) {
        case 'new-file':
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
          break;
        case 'new-folder':
          this.fileTree.showInputModal('New Folder', 'Enter folder name:', '', (name) => {
            if (this.isNativeMode()) {
              this.fileSystem.ensureDirectory(name).then(() => this._loadNativeFiles());
            } else {
              this.loadProjectFiles(this.currentProjectId);
            }
          });
          break;
        case 'import-files':
          this.triggerImport('files');
          break;
        case 'import-folder':
          this.triggerImport('folder');
          break;
        case 'collapse-all':
          if (this.fileTree) { this.fileTree.expandedFolders.clear(); this.fileTree.render(); }
          break;
        case 'toggle-theme':
          ThemeManager.toggle();
          const bsThemeLabel = document.getElementById('bs-theme-label');
          if (bsThemeLabel) {
            bsThemeLabel.textContent = ThemeManager.currentTheme === 'dark'
              ? 'Switch to Light Theme' : 'Switch to Dark Theme';
          }
          break;
        case 'toggle-sidebar':
          this.toggleSidebar();
          break;
        case 'toggle-terminal':
          if (this.terminal) this.terminal.toggle();
          break;
        case 'about':
          alert('PocketIDE v1.0 — a mobile-first code editor\n\nAll files are stored locally on this device. No server, no account needed.');
          break;
      }
    });

    // Bottom sheet overlay click to close
    const bsOverlay = document.getElementById('bottom-sheet-overlay');
    if (bsOverlay) bsOverlay.addEventListener('click', (e) => { if (e.target === bsOverlay) this._closeBottomSheet(); });

    // Close context menu on any click
    document.addEventListener('click', (e) => {
      const menu = document.getElementById('context-menu');
      if (menu && menu.style.display === 'block' && !e.target.closest('.context-menu')) {
        menu.style.display = 'none';
      }
    });

    // Sidebar overlay click to close (mobile)
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    if (sidebarOverlay) sidebarOverlay.addEventListener('click', () => this.closeMobileSidebar());

    // Sidebar view tabs (Files / Git / Problems)
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
    window.addEventListener('beforeunload', (e) => {
      if (this.fileContents.size > 0) {
        const hasUnsaved = [...this.fileContents.entries()].some(([path, content]) => {
          const saved = this.savedContents.get(path);
          return content !== saved;
        });
        if (hasUnsaved) { e.preventDefault(); e.returnValue = 'You have unsaved changes.'; }
      }
    });
  }
}

// ============================================================
// Bootstrap
// ============================================================

function bootstrap() {
  const app = new PocketIDE();
  window.__POCKETIDE = app;

  // Handle Ctrl+O to open folder
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
      e.preventDefault();
      app.openFolder();
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
