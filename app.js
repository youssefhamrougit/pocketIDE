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
      btn.textContent = this.currentTheme === 'dark' ? '🌙' : '☀️';
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
    // Strings
    code = code.replace(/('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`)/g, '<span class="hl-string">$1</span>');
    // Comments
    code = code.replace(/\/\/.*$/gm, '<span class="hl-comment">$&</span>');
    code = code.replace(/\/\*[\s\S]*?\*\//g, '<span class="hl-comment">$&</span>');
    // Keywords
    const keywords = /\b(as|async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|export|extends|finally|for|from|function|if|import|in|instanceof|let|new|of|return|static|super|switch|this|throw|try|typeof|var|void|while|with|yield)\b/g;
    code = code.replace(keywords, '<span class="hl-keyword">$1</span>');
    // Numbers
    code = code.replace(/\b(\d+\.?\d*)\b/g, '<span class="hl-number">$1</span>');
    // Built-in objects
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
    code = code.replace(/("(?:[^"\\]|\\.)*")\s*:/g, '<span class="hl-attr">$1</span>:');
    code = code.replace(/:\s*("(?:[^"\\]|\\.)*")/g, ': <span class="hl-string">$1</span>');
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

    // Gutter (line numbers)
    this.gutter = document.createElement('div');
    this.gutter.className = 'editor-gutter';
    this.lineNumbers = document.createElement('div');
    this.lineNumbers.className = 'editor-line-numbers';
    this.gutter.appendChild(this.lineNumbers);
    this.editorWrapper.appendChild(this.gutter);

    // Scroll sync wrapper
    this.scrollSync = document.createElement('div');
    this.scrollSync.className = 'editor-scroll-sync';

    // Highlight layer (behind textarea)
    this.highlightLayer = document.createElement('div');
    this.highlightLayer.className = 'editor-highlight-layer';
    this.highlightLayer.setAttribute('aria-hidden', 'true');
    this.scrollSync.appendChild(this.highlightLayer);

    // Textarea (the actual editable element)
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
    // Input
    this.textarea.addEventListener('input', () => {
      this.content = this.textarea.value;
      this._updateHighlight();
      this._updateLineNumbers();
      this._emit('change', this.content);
    });

    // Scroll sync
    this.textarea.addEventListener('scroll', () => this._syncScroll());

    // Tab key handling
    this.textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const start = this.textarea.selectionStart;
        const end = this.textarea.selectionEnd;
        const spaces = ' '.repeat(this.tabSize);

        if (e.shiftKey) {
          // Un-indent
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
          // Indent
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

      // Ctrl+S / Cmd+S
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        this._emit('save', this.content);
      }
    });

    // Focus/blur for cursor line highlighting
    this.textarea.addEventListener('focus', () => {
      this.editorWrapper.classList.add('focused');
    });
    this.textarea.addEventListener('blur', () => {
      this.editorWrapper.classList.remove('focused');
    });

    // Click on line numbers to select line
    this.gutter.addEventListener('click', (e) => {
      const numEl = e.target.closest('.editor-line-number');
      if (numEl) {
        const line = parseInt(numEl.dataset.line);
        const lines = this.content.split('\n');
        let start = 0;
        for (let i = 0; i < line - 1; i++) {
          start += lines[i].length + 1;
        }
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

  getValue() {
    return this.content;
  }

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

  focus() {
    this.textarea.focus();
  }

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
    for (let i = 0; i < Math.min(line - 1, lines.length - 1); i++) {
      pos += lines[i].length + 1;
    }
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
    if (this.editorWrapper && this.editorWrapper.parentNode) {
      this.editorWrapper.parentNode.removeChild(this.editorWrapper);
    }
  }
}

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

  setTree(nodes) {
    this.nodes = nodes;
    this.render();
  }

  buildFromFileList(files) {
    const root = [];
    const map = {};

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
    sorted.forEach(n => {
      if (n.children) n.children = this.sortTree(n.children);
    });
    return sorted;
  }

  selectFile(path) {
    this.selectedPath = path;
    this.render();
  }

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

    const isSelected = node.path === this.selectedPath;
    if (isSelected) item.classList.add('active');

    if (node.type === 'folder') {
      const isExpanded = this.expandedFolders.has(node.path);
      const chevron = document.createElement('span');
      chevron.className = `chevron${isExpanded ? ' expanded' : ''}`;
      chevron.textContent = '▶';
      item.appendChild(chevron);

      const icon = document.createElement('span');
      icon.className = 'icon';
      icon.textContent = isExpanded ? '📂' : '📁';
      item.appendChild(icon);
    } else {
      const icon = document.createElement('span');
      icon.className = 'icon';
      icon.textContent = this.getFileIcon(node.name);
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
      if (!this.expandedFolders.has(node.path)) {
        childrenContainer.classList.add('collapsed');
      }
      node.children.forEach(child => this.renderNode(child, node.path, childrenContainer));
      parentElement.appendChild(childrenContainer);
    }

    item._node = node;
  }

  getFileIcon(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const icons = {
      js: '📄', jsx: '⚛️', ts: '📘', tsx: '⚛️',
      py: '🐍', html: '🌐', css: '🎨', json: '📋',
      md: '📝', txt: '📄', gitignore: '🔧',
      env: '🔒', yml: '⚙️', yaml: '⚙️',
      toml: '⚙️', xml: '📰', svg: '🖼️',
      lock: '🔒', rs: '🦀', go: '🔵',
      java: '☕', rb: '💎', php: '🐘', swift: '🐦',
      kt: '📱', dart: '🎯', sh: '💻', bat: '🪟',
    };
    return icons[ext] || '📄';
  }

  handleClick(e) {
    const item = e.target.closest('.tree-item');
    if (!item) return;
    const node = item._node;
    if (!node) return;

    if (node.type === 'folder') {
      if (this.expandedFolders.has(node.path)) {
        this.expandedFolders.delete(node.path);
      } else {
        this.expandedFolders.add(node.path);
      }
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
    this.showInputModal('New File', 'Enter file name:', '', (name) => {
      if (name && this.callbacks.onNewFile) this.callbacks.onNewFile(parentPath, name);
    });
  }

  promptNewFolder(node) {
    const parentPath = node.type === 'folder' ? node.path : '';
    this.showInputModal('New Folder', 'Enter folder name:', '', (name) => {
      if (name && this.callbacks.onNewFolder) this.callbacks.onNewFolder(parentPath, name);
    });
  }

  showInputModal(titleText, placeholder, defaultValue, onConfirm) {
    const modal = document.getElementById('modal-overlay');
    const title = document.getElementById('modal-title');
    const input = document.getElementById('modal-input');
    const confirm = document.getElementById('modal-confirm');
    const cancel = document.getElementById('modal-cancel');
    if (!modal) return;

    title.textContent = titleText;
    input.value = defaultValue || '';
    input.placeholder = placeholder;
    input.select();
    modal.style.display = 'flex';

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
    if (existing) {
      this.activateTab(existing.id);
      return existing;
    }

    const tab = {
      id: `tab-${++this.tabCounter}`,
      label: label || path.split('/').pop() || path,
      path: path,
      dirty: false,
      active: true,
    };

    this.tabs.forEach(t => t.active = false);
    this.tabs.push(tab);
    this.activeTabId = tab.id;
    this.render();
    if (this.callbacks.onTabOpen) this.callbacks.onTabOpen(tab);
    return tab;
  }

  closeTab(tabId) {
    const index = this.tabs.findIndex(t => t.id === tabId);
    if (index === -1) return;
    this.forceCloseTab(tabId);
  }

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
    if (tab) {
      tab.dirty = dirty;
      this.render();
    }
  }

  getActiveTab() {
    return this.tabs.find(t => t.active) || null;
  }

  getTabByPath(path) {
    return this.tabs.find(t => t.path === path) || null;
  }

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
    if (active) {
      active.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }
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

  handleScroll(e) {
    if (e.deltaY !== 0) this.container.scrollLeft += e.deltaY;
  }
}

// ============================================================
// Storage Manager (localStorage-based, replaces backend API)
// ============================================================

const Storage = {
  _prefix: 'pocketide_',

  _key(key) { return this._prefix + key; },

  // --- Projects ---
  listProjects() {
    try {
      const data = localStorage.getItem(this._key('projects'));
      return data ? JSON.parse(data) : [];
    } catch { return []; }
  },

  saveProject(project) {
    const projects = this.listProjects();
    const idx = projects.findIndex(p => p.id === project.id);
    if (idx >= 0) {
      projects[idx] = { ...projects[idx], ...project };
    } else {
      projects.push(project);
    }
    localStorage.setItem(this._key('projects'), JSON.stringify(projects));
  },

  deleteProject(projectId) {
    const projects = this.listProjects().filter(p => p.id !== projectId);
    localStorage.setItem(this._key('projects'), JSON.stringify(projects));
    this._removePrefix(this._key(`files_${projectId}_`));
  },

  // --- Files ---
  _getFileKey(projectId, filePath) {
    return this._key(`files_${projectId}_${filePath}`);
  },

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
      if (key && key.startsWith(prefix)) {
        paths.push(key.substring(prefix.length));
      }
    }
    return paths.sort();
  },

  readFile(projectId, filePath) {
    try {
      const data = localStorage.getItem(this._getFileKey(projectId, filePath));
      return data ? JSON.parse(data) : null;
    } catch { return null; }
  },

  writeFile(projectId, filePath, content) {
    const data = { content, path: filePath, updatedAt: new Date().toISOString() };
    localStorage.setItem(this._getFileKey(projectId, filePath), JSON.stringify(data));
    return data;
  },

  deleteFile(projectId, filePath) {
    localStorage.removeItem(this._getFileKey(projectId, filePath));
  },

  renameFile(projectId, oldPath, newPath) {
    const data = this.readFile(projectId, oldPath);
    if (data) {
      this.writeFile(projectId, newPath, data.content);
      this.deleteFile(projectId, oldPath);
    }
  },

  // --- Initialize default project ---
  initDefaultProject() {
    let projects = this.listProjects();
    if (projects.length === 0) {
      const defaultProject = {
        id: 'default',
        name: 'My Project',
        description: 'A sample project to get started',
        createdAt: new Date().toISOString(),
        fileCount: 0,
      };
      this.saveProject(defaultProject);

      // Create some sample files
      const sampleFiles = {
        'index.html': '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>My App</title>\n  <link rel="stylesheet" href="styles.css">\n</head>\n<body>\n  <h1>Hello, World!</h1>\n  <script src="app.js"></script>\n</body>\n</html>\n',
        'styles.css': '/* Styles */\n* {\n  margin: 0;\n  padding: 0;\n  box-sizing: border-box;\n}\n\nbody {\n  font-family: -apple-system, BlinkMacSystemFont, sans-serif;\n  background: #1a1a1a;\n  color: #ffffff;\n}\n\nh1 {\n  color: #007acc;\n}\n',
        'app.js': '// Main application\nconsole.log("Hello from PocketIDE!");\n\nfunction greet(name) {\n  return `Hello, ${name}!`;\n}\n\ndocument.addEventListener("DOMContentLoaded", () => {\n  const title = document.querySelector("h1");\n  if (title) {\n    title.textContent = greet("World");\n  }\n});\n',
        'README.md': '# My Project\n\nWelcome to PocketIDE! This is a sample project.\n\n## Getting Started\n\nEdit files in the sidebar and see your changes live.\n\n## Features\n\n- Syntax highlighting\n- Multi-tab editing\n- Dark/Light themes\n- File management\n',
      };

      Object.entries(sampleFiles).forEach(([path, content]) => {
        this.writeFile('default', path, content);
      });
    }
    return projects.length > 0 ? projects[0] : this.listProjects()[0];
  },

  getProjectFilesList(projectId) {
    const paths = this.getProjectFilePaths(projectId);
    return paths.map(p => ({ path: p }));
  },
};

// ============================================================
// Main Application
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
    this.init();
  }

  init() {
    // Apply dark theme
    ThemeManager.apply('dark');

    // Initialize default project in storage
    const project = Storage.initDefaultProject();
    this.currentProjectId = project.id;

    // Setup UI
    this.initEditor();
    this.initFileTree();
    this.initTabs();
    this.setupKeyboardShortcuts();
    this.setupSidebarResize();
    this.setupUIControls();

    // Load project files
    this.loadProjectFiles(this.currentProjectId);

    // Set sidebar title
    const sidebarTitle = document.getElementById('sidebar-title');
    if (sidebarTitle) sidebarTitle.textContent = project.name;

    console.log('🚀 PocketIDE initialized (standalone edition)');
  }

  // --- Editor ---
  initEditor() {
    const editorContainer = document.getElementById('editor-wrapper');
    if (!editorContainer) return;

    this.editor = new TextEditor(editorContainer);

    // Listen for file saves
    this.editor.on('save', (content) => {
      const tab = this.tabManager.getActiveTab();
      if (tab) this.saveFile(tab.path, content);
    });

    // Track dirty state on every content change
    this.editor.on('change', () => {
      const tab = this.tabManager.getActiveTab();
      if (!tab) return;
      const currentContent = this.editor.getValue();
      this.fileContents.set(tab.path, currentContent);
      const saved = this.savedContents.get(tab.path) || '';
      this.tabManager.setTabDirty(tab.path, currentContent !== saved);
    });

    // Update cursor position on click and keyup
    const updateCursorPos = () => this.updateStatusBarPosition();
    this.editor.textarea.addEventListener('click', updateCursorPos);
    this.editor.textarea.addEventListener('keyup', updateCursorPos);
  }

  // --- File Tree ---
  initFileTree() {
    const treeContainer = document.getElementById('file-tree');
    if (!treeContainer) return;

    this.fileTree = new FileTree(treeContainer, {
      onFileSelect: (path) => {
        const cached = this.fileContents.get(path);
        if (cached !== undefined) {
          this.openFile(path, cached);
          return;
        }
        const data = Storage.readFile(this.currentProjectId, path);
        this.openFile(path, data ? data.content : '', true);
      },
      onFileDelete: (path) => {
        Storage.deleteFile(this.currentProjectId, path);
        this.fileList = this.fileList.filter(f => f.path !== path);
        this.fileTree.buildFromFileList(this.fileList);
        this.closeFile(path);
      },
      onFileRename: (oldPath, newName) => {
        const parentDir = oldPath.substring(0, oldPath.lastIndexOf('/') + 1);
        const newPath = parentDir ? `${parentDir}${newName}` : newName;
        Storage.renameFile(this.currentProjectId, oldPath, newPath);

        // Update in-memory maps
        if (this.fileContents.has(oldPath)) {
          this.fileContents.set(newPath, this.fileContents.get(oldPath));
          this.fileContents.delete(oldPath);
        }
        if (this.savedContents.has(oldPath)) {
          this.savedContents.set(newPath, this.savedContents.get(oldPath));
          this.savedContents.delete(oldPath);
        }

        this.loadProjectFiles(this.currentProjectId);
      },
      onNewFile: (parentPath, name) => {
        const filePath = parentPath ? `${parentPath}/${name}` : name;
        Storage.writeFile(this.currentProjectId, filePath, '');
        this.loadProjectFiles(this.currentProjectId);
        this.openFile(filePath, '');
      },
      onNewFolder: (parentPath, name) => {
        // Folders are virtual in our flat storage
        this.loadProjectFiles(this.currentProjectId);
      },
    });

    // Also handle new file/folder from header buttons
    const newFileBtn = document.getElementById('btn-new-file');
    if (newFileBtn) {
      newFileBtn.addEventListener('click', () => {
        this.fileTree.showInputModal('New File', 'Enter file name:', '', (name) => {
          Storage.writeFile(this.currentProjectId, name, '');
          this.loadProjectFiles(this.currentProjectId);
          this.openFile(name, '');
        });
      });
    }

    const newFolderBtn = document.getElementById('btn-new-folder');
    if (newFolderBtn) {
      newFolderBtn.addEventListener('click', () => {
        this.fileTree.showInputModal('New Folder', 'Enter folder name:', '', (name) => {
          this.loadProjectFiles(this.currentProjectId);
        });
      });
    }
  }

  // --- Tabs ---
  initTabs() {
    const tabsContainer = document.getElementById('tabs-container');
    if (!tabsContainer) return;

    this.tabManager = new TabManager(tabsContainer, {
      onTabOpen: () => this.showEditor(),
      onTabActivate: (tab) => {
        const content = this.fileContents.get(tab.path);
        if (content !== undefined) this.editor.setValue(content);
        this.editor.setFilename(tab.path);
        if (this.fileTree) {
          this.fileTree.selectFile(tab.path);
          this.fileTree.revealPath(tab.path);
        }
        this.updateStatusBarFile(tab.path);
      },
      onTabClose: (tabId) => {
        const tab = this.tabManager.getActiveTab();
        if (tab) {
          this.editor.setValue(this.fileContents.get(tab.path) || '');
          this.editor.setFilename(tab.path);
          this.updateStatusBarFile(tab.path);
        } else {
          this.showWelcome();
        }
      },
      onNoTabs: () => {
        this.showWelcome();
        this.editor.setValue('');
      },
    });
  }

  // --- Editor actions ---
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

    // Persist to localStorage
    Storage.writeFile(this.currentProjectId, path, savedContent);
    console.log(`Saved: ${path}`);
  }

  loadProjectFiles(projectId) {
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
    if (sidebar) sidebar.classList.toggle('collapsed', !this.sidebarVisible);
  }

  // --- Keyboard Shortcuts ---
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      const ctrl = e.ctrlKey || e.metaKey;

      // Ctrl+S - Save (handled by editor too, but this is a fallback)
      if (ctrl && e.key === 's') {
        e.preventDefault();
        const tab = this.tabManager.getActiveTab();
        if (tab) {
          const content = this.editor.getValue();
          this.saveFile(tab.path, content);
        }
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
      if (ctrl && e.key === 'Tab' && !e.shiftKey) {
        e.preventDefault();
        const tabs = this.tabManager.tabs;
        if (tabs.length < 2) return;
        const activeIndex = tabs.findIndex(t => t.active);
        const newIndex = (activeIndex + 1) % tabs.length;
        this.tabManager.activateTab(tabs[newIndex].id);
        return;
      }

      // Ctrl+Shift+Tab - Previous Tab
      if (ctrl && e.shiftKey && e.key === 'Tab') {
        e.preventDefault();
        const tabs = this.tabManager.tabs;
        if (tabs.length < 2) return;
        const activeIndex = tabs.findIndex(t => t.active);
        const newIndex = (activeIndex - 1 + tabs.length) % tabs.length;
        this.tabManager.activateTab(tabs[newIndex].id);
        return;
      }
    });
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

    handle.addEventListener('touchstart', (e) => onStart(e.touches[0].clientX), { passive: true });
    document.addEventListener('touchmove', (e) => onMove(e.touches[0].clientX), { passive: true });
    document.addEventListener('touchend', onEnd);
  }

  // --- UI Controls ---
  setupUIControls() {
    // Theme toggle
    const themeBtn = document.getElementById('btn-theme-toggle');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => ThemeManager.toggle());
    }

    // Collapse all
    const collapseBtn = document.getElementById('btn-collapse');
    if (collapseBtn) {
      collapseBtn.addEventListener('click', () => {
        if (this.fileTree) {
          this.fileTree.expandedFolders.clear();
          this.fileTree.render();
        }
      });
    }

    // Menu button
    const menuBtn = document.getElementById('btn-menu');
    if (menuBtn) {
      menuBtn.addEventListener('click', () => {
        alert('PocketIDE v1.0\n\nKeyboard Shortcuts:\n' +
          'Ctrl+N - New File\n' +
          'Ctrl+S - Save\n' +
          'Ctrl+W - Close Tab\n' +
          'Ctrl+B - Toggle Sidebar\n' +
          'Ctrl+Tab - Next Tab\n' +
          'Shift+Tab - Un-indent\n\n' +
          'All files are saved locally in your browser.');
      });
    }

    // Close context menu on any click
    document.addEventListener('click', () => {
      const menu = document.getElementById('context-menu');
      if (menu) menu.style.display = 'none';
    });

    // Modal overlay click to close
    const modalOverlay = document.getElementById('modal-overlay');
    if (modalOverlay) {
      modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) modalOverlay.style.display = 'none';
      });
    }
  }
}

// ============================================================
// Bootstrap
// ============================================================

let pocketIDE = null;

function bootstrap() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { pocketIDE = new PocketIDE(); });
  } else {
    pocketIDE = new PocketIDE();
  }
}

bootstrap();
