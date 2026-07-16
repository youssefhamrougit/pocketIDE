/**
 * PocketIDE CodeMirror 6 Editor - Main Entry Point
 * Initializes the editor, file tree, tabs, themes, plugin API, and bridge
 */

import { EditorState, Compartment } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter,
         highlightSpecialChars, drawSelection, rectangularSelection, crosshairCursor } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { bracketMatching, foldGutter, indentOnInput, syntaxHighlighting,
         defaultHighlightStyle, foldKeymap } from '@codemirror/language';
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search';

import { detectLanguage, createLanguageExtension, registerLanguage } from './languages.js';
import { applyTheme, toggleTheme, getThemeExtension, getCurrentTheme } from './themes.js';
import { FileTree } from './file-tree.js';
import { TabManager } from './tabs.js';
import { pluginAPI } from './plugin-api.js';
import { bridge } from './bridge.js';

class PocketIDEEditor {
  constructor() {
    this.view = null;
    this.editorWrapper = null;
    this.welcomeScreen = null;
    this.languageCompartment = new Compartment();
    this.themeCompartment = new Compartment();
    this.editorConfigCompartment = new Compartment();

    /** @type {Map<string, string>} */ // path -> content cache for open files
    this.fileContents = new Map();

    /** @type {Map<string, string>} */ // path -> content cache for saved state
    this.savedContents = new Map();

    /** @type {Array<{path: string, name: string}>} */
    this.fileList = [];

    this.fontSize = 14;
    this.sidebarVisible = true;

    this.init();
  }

  init() {
    // Get DOM references
    this.editorWrapper = document.getElementById('editor-wrapper');
    this.welcomeScreen = document.getElementById('editor-welcome');

    // Apply default dark theme
    applyTheme('dark');

    // Initialize the file tree
    this.initFileTree();

    // Initialize the tab manager
    this.initTabs();

    // Initialize the plugin system
    this.initPlugins();

    // Initialize the bridge
    this.initBridge();

    // Initialize CodeMirror
    this.initEditor();

    // Set up keyboard shortcuts
    this.setupKeyboardShortcuts();

    // Set up sidebar resize
    this.setupSidebarResize();

    // Set up UI controls
    this.setupUIControls();

    // Signal ready
    console.log('🚀 PocketIDE Editor initialized');
    bridge.notify('editorReady', { version: '1.0.0' });
  }

  // ============================================================
  // CodeMirror 6 Initialization
  // ============================================================

  initEditor() {
    try {
      this.view = new EditorView({
        state: EditorState.create({
          doc: '',
          extensions: [
            lineNumbers(),
            highlightActiveLineGutter(),
            highlightActiveLine(),
            highlightSpecialChars(),
            drawSelection(),
            rectangularSelection(),
            crosshairCursor(),
            bracketMatching(),
            closeBrackets(),
            indentOnInput(),
            syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
            highlightSelectionMatches(),
            foldGutter(),
            history(),

            // Keymaps
            keymap.of([
              ...defaultKeymap,
              ...searchKeymap,
              ...historyKeymap,
              ...closeBracketsKeymap,
              ...foldKeymap,
              indentWithTab,
            ]),

            // Theme
            this.themeCompartment.of(getThemeExtension()),

            // Language
            this.languageCompartment.of([]),

            // Editor config
            this.editorConfigCompartment.of(
              EditorView.theme({
                '&': { fontSize: `${this.fontSize}px` },
              })
            ),

            // Listen for changes
            EditorView.updateListener.of((update) => {
              if (update.docChanged) {
                this.handleEditorChange();
              }
              if (update.selectionSet) {
                this.updateStatusBarPosition();
              }
            }),
          ],
        }),
        parent: this.editorWrapper,
      });

      // Focus the editor when clicking on the wrapper
      this.editorWrapper.addEventListener('click', () => {
        if (this.view) this.view.focus();
      });

      console.log('[Editor] CodeMirror 6 initialized');
    } catch (err) {
      console.error('[Editor] Failed to initialize CodeMirror:', err);
    }
  }

  // ============================================================
  // File Tree
  // ============================================================

  initFileTree() {
    const treeContainer = document.getElementById('file-tree');
    if (!treeContainer) return;

    this.fileTree = new FileTree(treeContainer, {
      onFileSelect: (path) => {
        const content = this.fileContents.get(path) || '';
        this.openFile(path, content);
      },
      onFileDelete: (path) => {
        bridge.notify('deleteFile', { path });
      },
      onFileRename: (oldPath, newName) => {
        bridge.notify('renameFile', { oldPath, newName });
      },
      onNewFile: (parentPath, name) => {
        bridge.notify('newFile', { parentPath, name });
      },
      onNewFolder: (parentPath, name) => {
        bridge.notify('newFolder', { parentPath, name });
      },
    });
  }

  // ============================================================
  // Tab Manager
  // ============================================================

  initTabs() {
    const tabsContainer = document.getElementById('tabs-container');
    if (!tabsContainer) return;

    this.tabManager = new TabManager(tabsContainer, {
      onTabOpen: (tab) => {
        // Show editor when a tab is opened
        this.showEditor();
      },
      onTabActivate: (tab) => {
        // Switch to the file content
        const content = this.fileContents.get(tab.path);
        if (content !== undefined) {
          this.setText(content);
        }
        this.setLanguage(tab.path);

        // Update file tree selection
        if (this.fileTree) {
          this.fileTree.selectFile(tab.path);
          this.fileTree.revealPath(tab.path);
        }

        // Update status bar
        this.updateStatusBarFile(tab.path);

        bridge.notify('fileSelected', { path: tab.path });
      },
      onTabClose: (tabId) => {
        const tab = this.tabManager.getActiveTab();
        if (tab) {
          this.setText(this.fileContents.get(tab.path) || '');
          this.setLanguage(tab.path);
          this.updateStatusBarFile(tab.path);
        } else {
          this.showWelcome();
        }
      },
      onNoTabs: () => {
        this.showWelcome();
        this.setText('');
      },
    });
  }

  // ============================================================
  // Plugin System
  // ============================================================

  initPlugins() {
    const editorAPI = this.createEditorAPI();
    pluginAPI.init(editorAPI);
  }

  createEditorAPI() {
    const self = this;
    return {
      setText: (text) => self.setText(text),
      getText: () => self.getText(),
      setCursor: (line, col) => self.setCursor(line, col),
      getCursor: () => self.getCursor(),
      format: () => self.format(),
      getSelection: () => self.getSelection(),
      replaceSelection: (text) => self.replaceSelection(text),
      getFiles: () => self.fileList,
      readFile: (path) => self.fileContents.get(path) || null,
      writeFile: (path, content) => {
        self.fileContents.set(path, content);
        bridge.notify('fileChanged', { path, content });
      },
      showNotification: (msg, type) => {
        bridge.notify('showNotification', { message: msg, type: type || 'info' });
      },
      executeCommand: (command, args) => {
        pluginAPI.executeCommand(command, args);
      },
    };
  }

  // ============================================================
  // Bridge (Flutter Communication)
  // ============================================================

  initBridge() {
    const editorAPI = this.createEditorAPI();
    bridge.init(editorAPI);

    // Register additional handlers
    bridge.registerHandler('newFile', (payload) => {
      if (this.fileTree && this.tabManager) {
        this.openFile(payload.path || payload.name, '');
        bridge.notify('fileChanged', { path: payload.path || payload.name, content: '' });
      }
    });
  }

  // ============================================================
  // Editor API Methods
  // ============================================================

  /**
   * Open a file in the editor
   * @param {string} path - File path
   * @param {string} content - File content
   * @param {boolean} [isSaved=true] - Whether this content is the saved version
   */
  openFile(path, content, isSaved = true) {
    if (!path) return;

    // Store content
    this.fileContents.set(path, content || '');
    if (isSaved) {
      this.savedContents.set(path, content || '');
    }

    // Get display name from path
    const name = path.split('/').pop() || path;

    // Open tab
    const tab = this.tabManager.openTab(path, name);
    if (!tab) return;

    // Set editor content if this is the active tab
    if (tab.active) {
      this.setText(content || '');
      this.setLanguage(path);
      this.showEditor();
      this.updateStatusBarFile(path);
    }

    // Reveal in file tree
    if (this.fileTree) {
      this.fileTree.revealPath(path);
    }
  }

  /**
   * Close a file
   * @param {string} path - File path
   */
  closeFile(path) {
    const tab = this.tabManager.getTabByPath(path);
    if (tab) {
      this.tabManager.closeTab(tab.id);
    }
    this.fileContents.delete(path);
  }

  /**
   * Save a file
   * @param {string} path - File path
   * @param {string} content - Content to save
   */
  saveFile(path, content) {
    if (content !== undefined) {
      this.fileContents.set(path, content);
    }
    const savedContent = this.fileContents.get(path) || '';
    this.savedContents.set(path, savedContent);
    this.tabManager.setTabDirty(path, false);

    bridge.notify('fileSaved', {
      path,
      content: savedContent,
    });
  }

  /**
   * Set the file list
   * @param {Array<{path: string, name?: string}>} files
   */
  setFiles(files) {
    this.fileList = files || [];
    if (this.fileTree) {
      this.fileTree.buildFromFileList(this.fileList);
    }
  }

  /**
   * Set the editor theme
   * @param {string} themeName - 'dark' or 'light'
   */
  setTheme(themeName) {
    applyTheme(themeName);
    this.reconfigureTheme();
  }

  /**
   * Toggle the sidebar visibility
   */
  toggleSidebar() {
    this.sidebarVisible = !this.sidebarVisible;
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
      sidebar.classList.toggle('collapsed', !this.sidebarVisible);
    }
  }

  /**
   * Execute a command via the plugin system
   * @param {string} command - Command ID
   * @param {*} args - Command arguments
   */
  executeCommand(command, args) {
    pluginAPI.executeCommand(command, args);
  }

  /**
   * Set the font size
   * @param {number} size - Font size in pixels
   */
  setFontSize(size) {
    this.fontSize = Math.max(10, Math.min(32, size));
    this.reconfigureEditor();
  }

  // ============================================================
  // CodeMirror Helpers
  // ============================================================

  setText(text) {
    if (!this.view) return;
    const current = this.view.state.doc.toString();
    if (current !== text) {
      this.view.dispatch({
        changes: {
          from: 0,
          to: current.length,
          insert: text || '',
        },
      });
    }
  }

  getText() {
    return this.view ? this.view.state.doc.toString() : '';
  }

  setLanguage(path) {
    if (!this.view) return;
    const ext = createLanguageExtension(path);
    this.view.dispatch({
      effects: this.languageCompartment.reconfigure(ext || []),
    });

    // Update status bar
    const lang = detectLanguage(path);
    const statusLang = document.getElementById('status-language');
    if (statusLang) statusLang.textContent = lang.name;
  }

  reconfigureTheme() {
    if (!this.view) return;
    this.view.dispatch({
      effects: this.themeCompartment.reconfigure(getThemeExtension()),
    });
  }

  reconfigureEditor() {
    if (!this.view) return;
    this.view.dispatch({
      effects: this.editorConfigCompartment.reconfigure(
        EditorView.theme({
          '&': { fontSize: `${this.fontSize}px` },
        })
      ),
    });
  }

  setCursor(line, col) {
    if (!this.view) return;
    const pos = this.view.state.doc.line(line).from + Math.max(0, col - 1);
    this.view.dispatch({
      selection: { anchor: pos },
      scrollIntoView: true,
    });
  }

  getCursor() {
    if (!this.view) return { line: 1, col: 1 };
    const pos = this.view.state.selection.main.head;
    const line = this.view.state.doc.lineAt(pos);
    return { line: line.number, col: pos - line.from + 1 };
  }

  getSelection() {
    if (!this.view) return '';
    return this.view.state.sliceDoc(
      this.view.state.selection.main.from,
      this.view.state.selection.main.to
    );
  }

  replaceSelection(text) {
    if (!this.view) return;
    this.view.dispatch({
      changes: {
        from: this.view.state.selection.main.from,
        to: this.view.state.selection.main.to,
        insert: text,
      },
    });
  }

  format() {
    // Basic format - could be extended with prettier or other formatters
    console.log('[Editor] Format requested');
  }

  // ============================================================
  // UI Methods
  // ============================================================

  showEditor() {
    if (this.welcomeScreen) this.welcomeScreen.style.display = 'none';
    if (this.editorWrapper) this.editorWrapper.style.display = 'block';
    if (this.view) setTimeout(() => this.view.focus(), 50);
  }

  showWelcome() {
    if (this.welcomeScreen) this.welcomeScreen.style.display = 'flex';
    if (this.editorWrapper) this.editorWrapper.style.display = 'none';
  }

  updateStatusBarFile(path) {
    const lang = detectLanguage(path);
    const statusLang = document.getElementById('status-language');
    if (statusLang) statusLang.textContent = lang.name;
    this.updateStatusBarPosition();
  }

  updateStatusBarPosition() {
    const cursor = this.getCursor();
    const statusPos = document.getElementById('status-position');
    if (statusPos) {
      statusPos.textContent = `Ln ${cursor.line}, Col ${cursor.col}`;
    }
  }

  handleEditorChange() {
    const tab = this.tabManager.getActiveTab();
    if (!tab) return;

    const currentContent = this.getText();
    this.fileContents.set(tab.path, currentContent);

    // Check if dirty
    const savedContent = this.savedContents.get(tab.path) || '';
    const isDirty = currentContent !== savedContent;
    this.tabManager.setTabDirty(tab.path, isDirty);

    // Notify Flutter of changes
    bridge.notify('fileChanged', { path: tab.path, content: currentContent });

    // Update cursor position
    this.updateStatusBarPosition();
  }

  // ============================================================
  // Keyboard Shortcuts
  // ============================================================

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ctrl+S / Cmd+S - Save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        const tab = this.tabManager.getActiveTab();
        if (tab) {
          const content = this.getText();
          this.saveFile(tab.path, content);
          bridge.notify('saveRequested', { path: tab.path, content });
        }
      }

      // Ctrl+N / Cmd+N - New File
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        bridge.notify('newFileRequested', {});
      }

      // Ctrl+P / Cmd+P - Quick Open
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        bridge.notify('quickOpenRequested', {});
      }

      // Ctrl+W / Cmd+W - Close Tab
      if ((e.ctrlKey || e.metaKey) && e.key === 'w') {
        e.preventDefault();
        const tab = this.tabManager.getActiveTab();
        if (tab) {
          this.tabManager.closeTab(tab.id);
        }
      }

      // Ctrl+B / Cmd+B - Toggle Sidebar
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        this.toggleSidebar();
      }

      // Ctrl+Tab / Cmd+Tab - Next Tab
      if ((e.ctrlKey || e.metaKey) && e.key === 'Tab') {
        e.preventDefault();
        this.cycleTab(1);
      }

      // Ctrl+Shift+Tab / Cmd+Shift+Tab - Previous Tab
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'Tab') {
        e.preventDefault();
        this.cycleTab(-1);
      }
    });
  }

  cycleTab(direction) {
    const tabs = this.tabManager.tabs;
    if (tabs.length < 2) return;

    const activeIndex = tabs.findIndex(t => t.active);
    const newIndex = (activeIndex + direction + tabs.length) % tabs.length;
    this.tabManager.activateTab(tabs[newIndex].id);
  }

  // ============================================================
  // Sidebar Resize
  // ============================================================

  setupSidebarResize() {
    const handle = document.getElementById('sidebar-resize');
    const sidebar = document.getElementById('sidebar');

    if (!handle || !sidebar) return;

    let isResizing = false;
    let startX, startWidth;

    handle.addEventListener('mousedown', (e) => {
      isResizing = true;
      startX = e.clientX;
      startWidth = sidebar.getBoundingClientRect().width;
      handle.classList.add('resizing');
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    });

    document.addEventListener('mousemove', (e) => {
      if (!isResizing) return;
      const delta = e.clientX - startX;
      const newWidth = Math.max(180, Math.min(500, startWidth + delta));
      sidebar.style.width = `${newWidth}px`;
    });

    document.addEventListener('mouseup', () => {
      if (isResizing) {
        isResizing = false;
        handle.classList.remove('resizing');
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    });

    // Touch support for mobile
    handle.addEventListener('touchstart', (e) => {
      const touch = e.touches[0];
      isResizing = true;
      startX = touch.clientX;
      startWidth = sidebar.getBoundingClientRect().width;
    }, { passive: true });

    document.addEventListener('touchmove', (e) => {
      if (!isResizing) return;
      const touch = e.touches[0];
      const delta = touch.clientX - startX;
      const newWidth = Math.max(180, Math.min(500, startWidth + delta));
      sidebar.style.width = `${newWidth}px`;
    }, { passive: true });

    document.addEventListener('touchend', () => {
      isResizing = false;
    });
  }

  // ============================================================
  // UI Controls
  // ============================================================

  setupUIControls() {
    // Theme toggle button
    const themeBtn = document.getElementById('btn-theme-toggle');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        const newTheme = toggleTheme();
        this.reconfigureTheme();
        bridge.notify('themeChanged', { theme: newTheme });
      });
    }

    // New file button in sidebar
    const newFileBtn = document.getElementById('btn-new-file');
    if (newFileBtn) {
      newFileBtn.addEventListener('click', () => {
        bridge.notify('newFileRequested', {});
      });
    }

    // New folder button in sidebar
    const newFolderBtn = document.getElementById('btn-new-folder');
    if (newFolderBtn) {
      newFolderBtn.addEventListener('click', () => {
        bridge.notify('newFolderRequested', {});
      });
    }

    // Collapse all button in sidebar
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
        bridge.notify('menuRequested', {});
      });
    }

    // Close context menu on click outside
    document.addEventListener('click', () => {
      const menu = document.getElementById('context-menu');
      if (menu) menu.style.display = 'none';
    });

    // Close modal on overlay click
    const modalOverlay = document.getElementById('modal-overlay');
    if (modalOverlay) {
      modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
          modalOverlay.style.display = 'none';
        }
      });
    }
  }
}

// ============================================================
// Bootstrap
// ============================================================

let editorInstance = null;

function bootstrap() {
  // Wait for DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      editorInstance = new PocketIDEEditor();
    });
  } else {
    editorInstance = new PocketIDEEditor();
  }
}

bootstrap();

// Export for external use
export { PocketIDEEditor, editorInstance };
