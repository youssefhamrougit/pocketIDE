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
  highlight(code, filename) {
    const lang = LanguageDetector.detect(filename).name;
    const escaped = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    if (!code.trim()) return escaped;

    switch (lang) {
      case 'JavaScript':
      case 'JSX':
      case 'TypeScript':
      case 'TSX':
        return this.highlightJS(escaped);
      case 'HTML':
        return this.highlightHTML(escaped);
      case 'CSS':
        return this.highlightCSS(escaped);
      case 'SCSS':
        return this.highlightCSS(escaped);
      case 'C++':
      case 'C':
      case 'C#':
      case 'C/C++ Header':
      case 'C++ Header':
        return this.highlightC(escaped);
      case 'SQL':
        return this.highlightSQL(escaped);
      case 'Python':
        return this.highlightPython(escaped);
      case 'JSON':
        return this.highlightJSON(escaped);
      case 'Markdown':
        return this.highlightMarkdown(escaped);
      default:
        return escaped;
    }
  },

  highlightJS(code) {
    code = code.replace(/('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`)/g, '<span class="hl-string">$1</span>');
    code = code.replace(/\/\/.*$/gm, '<span class="hl-comment">$&</span>');
    code = code.replace(/\/\*[\s\S]*?\*\//g, '<span class="hl-comment">$&</span>');
    const keywords = /\b(as|async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|export|extends|finally|for|from|function|if|import|in|instanceof|let|new|of|return|static|super|switch|this|throw|try|typeof|var|void|while|with|yield)\b/g;
    code = code.replace(keywords, '<span class="hl-keyword">$1</span>');
    code = code.replace(/\b(\d+\.?\d*)\b/g, '<span class="hl-number">$1</span>');
    code = code.replace(/\b(Math|JSON|console|window|document|Array|Object|String|Number|Boolean|Date|RegExp|Map|Set|Promise|Error)\b/g, '<span class="hl-builtin">$1</span>');
    return code;
  },

  highlightHTML(code) {
    code = code.replace(/(&lt;\/?)([\w-]+)/g, '$1<span class="hl-tag">$2</span>');
    code = code.replace(/(\b[\w-]+)(=)(&quot;|&#39;|")/g, '<span class="hl-attr">$1</span>$2$3');
    code = code.replace(/(&quot;[^&]*&quot;|&#39;[^&#]*&#39;)/g, '<span class="hl-string">$1</span>');
    code = code.replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="hl-comment">$1</span>');
    return code;
  },

  highlightC(code) {
    code = code.replace(/('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")/g, '<span class="hl-string">$1</span>');
    code = code.replace(/(\/\/.*$|\/\*[\s\S]*?\*\/)/gm, '<span class="hl-comment">$1</span>');
    const keywords = /\b(alignas|alignof|and|asm|auto|bool|break|case|catch|char|class|const|constexpr|continue|default|delete|do|double|else|enum|explicit|extern|false|float|for|friend|goto|if|inline|int|long|mutable|namespace|new|noexcept|nullptr|operator|private|protected|public|register|reinterpret_cast|return|short|signed|sizeof|static|static_assert|struct|switch|template|this|throw|true|try|typedef|typeid|typename|union|unsigned|using|virtual|void|volatile|wchar_t|while)\b/g;
    code = code.replace(keywords, '<span class="hl-keyword">$1</span>');
    code = code.replace(/^(#[^\n]*)/gm, '<span class="hl-keyword">$1</span>');
    code = code.replace(/\b(\d+\.?\d*)\b/g, '<span class="hl-number">$1</span>');
    return code;
  },

  highlightSQL(code) {
    const keywords = /\b(select|from|where|insert|into|values|update|set|delete|create|table|drop|alter|join|left|right|inner|outer|on|as|and|or|not|null|group|by|order|having|limit|offset|union|all|distinct|primary|key|foreign|references|index|view|procedure|function|begin|commit|rollback|cascade)\b/gi;
    code = code.replace(/(--[^\n]*|\/\*[\s\S]*?\*\/)/g, '<span class="hl-comment">$1</span>');
    code = code.replace(/('[^']*'|"[^"]*")/g, '<span class="hl-string">$1</span>');
    code = code.replace(keywords, '<span class="hl-keyword">$1</span>');
    code = code.replace(/\b(\d+\.?\d*)\b/g, '<span class="hl-number">$1</span>');
    return code;
  },

  highlightCSS(code) {
    code = code.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="hl-comment">$1</span>');
    code = code.replace(/([\w-]+)(\s*:)/g, '<span class="hl-attr">$1</span>$2');
    code = code.replace(/(#[0-9a-fA-F]{3,8})\b/g, '<span class="hl-number">$1</span>');
    code = code.replace(/(\d+\.?\d*(px|em|rem|vh|vw|%|s|ms)?)\b/g, '<span class="hl-number">$1</span>');
    code = code.replace(/(@[\w-]+)/g, '<span class="hl-keyword">$1</span>');
    code = code.replace(/\.([\w-]+)/g, '<span class="hl-builtin">.$1</span>');
    code = code.replace(/(['"][^'"]*['"])/g, '<span class="hl-string">$1</span>');
    return code;
  },

  highlightPython(code) {
    code = code.replace(/('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|'''[\s\S]*?'''|"""[\s\S]*?""")/g, '<span class="hl-string">$1</span>');
    code = code.replace(/#.*$/gm, '<span class="hl-comment">$1</span>');
    const keywords = /\b(and|as|assert|async|await|break|class|continue|def|del|elif|else|except|finally|for|from|global|if|import|in|is|lambda|nonlocal|not|or|pass|raise|return|try|while|with|yield|True|False|None)\b/g;
    code = code.replace(keywords, '<span class="hl-keyword">$1</span>');
    code = code.replace(/\b(\d+\.?\d*)\b/g, '<span class="hl-number">$1</span>');
    return code;
  },

  highlightJSON(code) {
    code = code.replace(/(\"(?:[^"\\]|\\.)*\")\s*:/g, '<span class="hl-attr">$1</span>:');
    code = code.replace(/:\s*(\"(?:[^"\\]|\\.)*\")/g, ': <span class="hl-string">$1</span>');
    code = code.replace(/:\s*(true|false|null)/g, ': <span class="hl-keyword">$1</span>');
    code = code.replace(/:\s*(\d+\.?\d*)/g, ': <span class="hl-number">$1</span>');
    return code;
  },

  highlightMarkdown(code) {
    code = code.replace(/(#{1,6}\s.*)/g, '<span class="hl-keyword">$1</span>');
    code = code.replace(/(\*\*.*?\*\*|__.*?__)/g, '<span class="hl-string">$1</span>');
    code = code.replace(/(`[^`]+`)/g, '<span class="hl-builtin">$1</span>');
    code = code.replace(/^(\s*[-*+]\s)/gm, '<span class="hl-number">$1</span>');
    code = code.replace(/^(\s*\d+\.\s)/gm, '<span class="hl-number">$1</span>');
    code = code.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<span class="hl-string">$1</span>(<span class="hl-number">$2</span>)');
    return code;
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
    this.container.appendChild(this.editorWrapper);

    this._bindEvents();
    this._syncScroll();
    this._updateLineNumbers();
  }

  _bindEvents() {
    this.textarea.addEventListener('input', () => {
      this.content = this.textarea.value;
      this._updateHighlight();
      this._updateLineNumbers();
      this._emit('change', this.content);
    });

    this.textarea.addEventListener('scroll', () => this._syncScroll());

    this.textarea.addEventListener('keydown', (e) => {
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
  }

  _syncScroll() {
    if (this.highlightLayer && this.textarea) {
      this.highlightLayer.scrollTop = this.textarea.scrollTop;
      this.highlightLayer.scrollLeft = this.textarea.scrollLeft;
    }
  }

  _updateHighlight() {
    const highlighted = SyntaxHighlighter.highlight(this.content, this.filename);
    this.highlightLayer.innerHTML = highlighted + '\n';
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

  setValue(text) {
    text = text || '';
    if (this.textarea.value !== text) {
      this.textarea.value = text;
      this.content = text;
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

  getSelection() {
    const start = this.textarea.selectionStart;
    const end = this.textarea.selectionEnd;
    return this.textarea.value.substring(start, end);
  }

  replaceSelection(text) {
    const start = this.textarea.selectionStart;
    const end = this.textarea.selectionEnd;
    this.textarea.value = this.textarea.value.substring(0, start) + text + this.textarea.value.substring(end);
    this.textarea.selectionStart = this.textarea.selectionEnd = start + text.length;
    this.content = this.textarea.value;
    this._updateHighlight();
    this._updateLineNumbers();
    this._emit('change', this.content);
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

  setTree(nodes) { this.nodes = nodes; this.render(); }

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

  deleteProject(projectId) {
    const projects = this.listProjects().filter(p => p.id !== projectId);
    localStorage.setItem(this._key('projects'), JSON.stringify(projects));
    this._removePrefix(this._key(`files_${projectId}_`));
  },

  _getFileKey(projectId, filePath) { return this._key(`files_${projectId}_${filePath}`); },

  _removePrefix(prefix) {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) keys.push(key);
    }
    keys.forEach(k => localStorage.removeItem(k));
  },

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
      const defaultProject = { id: 'default', name: 'My Project', description: 'A sample project to get started', createdAt: new Date().toISOString(), fileCount: 0 };
      this.saveProject(defaultProject);
      const sampleFiles = {
        'index.html': '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>My App</title>\n  <link rel="stylesheet" href="styles.css">\n</head>\n<body>\n  <h1>Hello, World!</h1>\n  <script src="app.js"></script>\n</body>\n</html>\n',
        'styles.css': '/* Styles */\n* {\n  margin: 0;\n  padding: 0;\n  box-sizing: border-box;\n}\n\nbody {\n  font-family: -apple-system, BlinkMacSystemFont, sans-serif;\n  background: #1a1a1a;\n  color: #ffffff;\n}\n\nh1 {\n  color: #007acc;\n}\n',
        'app.js': '// Main application\nconsole.log("Hello from PocketIDE!");\n\nfunction greet(name) {\n  return `Hello, ${name}!`;\n}\n\ndocument.addEventListener("DOMContentLoaded", () => {\n  const title = document.querySelector("h1");\n  if (title) {\n    title.textContent = greet("World");\n  }\n});\n',
        'README.md': '# My Project\n\nWelcome to PocketIDE! This is a sample project.\n\n## Getting Started\n\nEdit files in the sidebar and see your changes live.\n\n## Features\n\n- Syntax highlighting\n- Multi-tab editing\n- Dark/Light themes\n- File management\n',
      };
      Object.entries(sampleFiles).forEach(([path, content]) => this.writeFile('default', path, content));
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
    this.init();
  }

  init() {
    ThemeManager.apply('dark');

    const project = Storage.initDefaultProject();
    this.currentProjectId = project.id;

    this.initEditor();
    this.initFileTree();
    this.initTabs();
    this.setupKeyboardShortcuts();
    this.setupSidebarResize();
    this.setupUIControls();

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
    });
    const updateCursorPos = () => this.updateStatusBarPosition();
    this.editor.textarea.addEventListener('click', updateCursorPos);
    this.editor.textarea.addEventListener('keyup', updateCursorPos);
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
    console.log(`Saved: ${path}`);
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

      // Ctrl+S - Save
      if (ctrl && e.key === 's') {
        e.preventDefault();
        const tab = this.tabManager.getActiveTab();
        if (tab) this.saveFile(tab.path, this.editor.getValue());
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
          this.fileTree.showInputModal('New File', 'Enter file name:', '', (name) => {
            if (this.isNativeMode()) {
              this.fileSystem.writeFile(name, '').then(() => this._loadNativeFiles());
              this.openFile(name, '');
            } else {
              Storage.writeFile(this.currentProjectId, name, '');
              this.loadProjectFiles(this.currentProjectId);
              this.openFile(name, '');
            }
          });
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
