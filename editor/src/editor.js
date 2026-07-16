/**
 * PocketIDE CodeMirror 6 Editor - Main Entry Point
 * Initializes the editor, file tree, tabs, themes, plugin API, bridge, and API client
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
import { apiClient } from './api-client.js';

class PocketIDEEditor {
  constructor() {
    this.view = null;
    this.editorWrapper = null;
    this.welcomeScreen = null;
    this.languageCompartment = new Compartment();
    this.themeCompartment = new Compartment();
    this.editorConfigCompartment = new Compartment();

    /** @type {Map<string, string>} */
    this.fileContents = new Map();

    /** @type {Map<string, string>} */
    this.savedContents = new Map();

    /** @type {Array<{path: string, name: string}>} */
    this.fileList = [];
    this.currentProjectId = null;
    this.apiReady = false;

    this.fontSize = 14;
    this.sidebarVisible = true;

    this.init();
  }

  init() {
    this.editorWrapper = document.getElementById('editor-wrapper');
    this.welcomeScreen = document.getElementById('editor-welcome');

    applyTheme('dark');

    this.initFileTree();
    this.initTabs();
    this.initPlugins();
    this.initBridge();
    this.initEditor();
    this.setupKeyboardShortcuts();
    this.setupSidebarResize();
    this.setupUIControls();

    // Connect to backend API
    this.initApi();

    console.log('🚀 PocketIDE Editor initialized');
    bridge.notify('editorReady', { version: '1.0.0' });
  }

  // ============================================================
  // CodeMirror 6
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
            keymap.of([
              ...defaultKeymap,
              ...searchKeymap,
              ...historyKeymap,
              ...closeBracketsKeymap,
              ...foldKeymap,
              indentWithTab,
            ]),
            this.themeCompartment.of(getThemeExtension()),
            this.languageCompartment.of([]),
            this.editorConfigCompartment.of(
              EditorView.theme({ '&': { fontSize: `${this.fontSize}px` } })
            ),
            EditorView.updateListener.of((update) => {
              if (update.docChanged) this.handleEditorChange();
              if (update.selectionSet) this.updateStatusBarPosition();
            }),
          ],
        }),
        parent: this.editorWrapper,
      });

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
      onFileSelect: async (path) => {
        // Check local cache first
        const cached = this.fileContents.get(path);
        if (cached !== undefined) {
          this.openFile(path, cached);
          return;
        }

        // Fetch from API if available
        if (this.currentProjectId && this.apiReady) {
          try {
            const result = await apiClient.readFile(this.currentProjectId, path);
            this.openFile(path, result.content, true);
          } catch {
            this.openFile(path, '');
          }
        } else {
          this.openFile(path, '');
        }
      },
      onFileDelete: async (path) => {
        if (this.currentProjectId && this.apiReady) {
          try {
            await apiClient.deleteFile(this.currentProjectId, path);
            this.fileList = this.fileList.filter(f => f.path !== path);
            this.setFiles(this.fileList);
            this.closeFile(path);
          } catch (err) {
            console.error('Failed to delete file:', err);
          }
        } else {
          bridge.notify('deleteFile', { path });
        }
      },
      onFileRename: async (oldPath, newName) => {
        if (this.currentProjectId && this.apiReady) {
          try {
            const parentDir = oldPath.substring(0, oldPath.lastIndexOf('/') + 1);
            const newPath = parentDir ? `${parentDir}${newName}` : newName;
            await apiClient.renameFile(this.currentProjectId, oldPath, newPath);
            await this.loadProjectFiles(this.currentProjectId);
            if (this.tabManager.getTabByPath(oldPath)) {
              const content = this.fileContents.get(oldPath);
              this.fileContents.set(newPath, content);
              this.fileContents.delete(oldPath);
            }
          } catch (err) {
            console.error('Failed to rename:', err);
          }
        } else {
          bridge.notify('renameFile', { oldPath, newName });
        }
      },
      onNewFile: async (parentPath, name) => {
        if (this.currentProjectId && this.apiReady) {
          try {
            const filePath = parentPath ? `${parentPath}/${name}` : name;
            await apiClient.createFile(this.currentProjectId, filePath, '');
            await this.loadProjectFiles(this.currentProjectId);
            this.openFile(filePath, '');
          } catch (err) {
            console.error('Failed to create file:', err);
          }
        } else {
          bridge.notify('newFile', { parentPath, name });
        }
      },
      onNewFolder: async (parentPath, name) => {
        if (this.currentProjectId && this.apiReady) {
          try {
            const dirPath = parentPath ? `${parentPath}/${name}` : name;
            await apiClient.createDirectory(this.currentProjectId, dirPath);
            await this.loadProjectFiles(this.currentProjectId);
          } catch (err) {
            console.error('Failed to create folder:', err);
          }
        } else {
          bridge.notify('newFolder', { parentPath, name });
        }
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
      onTabOpen: (tab) => this.showEditor(),
      onTabActivate: (tab) => {
        const content = this.fileContents.get(tab.path);
        if (content !== undefined) this.setText(content);
        this.setLanguage(tab.path);
        if (this.fileTree) {
          this.fileTree.selectFile(tab.path);
          this.fileTree.revealPath(tab.path);
        }
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

    bridge.registerHandler('newFile', (payload) => {
      if (this.fileTree && this.tabManager) {
        this.openFile(payload.path || payload.name, '');
        bridge.notify('fileChanged', { path: payload.path || payload.name, content: '' });
      }
    });
  }

  // ============================================================
  // API Client & Backend Connection
  // ============================================================

  async initApi() {
    try {
      const restored = await apiClient.restoreSession();

      if (!restored) {
        console.log('[API] Logging in with demo credentials...');
        await apiClient.login('demo@pocketide.dev', 'demo1234');
        console.log('[API] Logged in as:', apiClient.user?.username);
      } else {
        console.log('[API] Session restored for:', apiClient.user?.username);
      }

      this.apiReady = true;

      const statusBranch = document.getElementById('status-branch');
      if (statusBranch) statusBranch.textContent = apiClient.user?.username || 'main';

      await this.loadProjects();

      const statusEl = document.getElementById('welcome-status');
      if (statusEl) statusEl.textContent = `Connected as ${apiClient.user?.username}`;
    } catch (err) {
      console.error('[API] Failed to connect:', err);
      const statusEl = document.getElementById('welcome-status');
      if (statusEl) statusEl.textContent = '⚠️ Backend offline — start with: cd backend && npm run dev';
    }
  }

  async loadProjects() {
    try {
      const projects = await apiClient.listProjects();
      if (projects && projects.length > 0) {
        const first = projects[0];
        this.currentProjectId = first.id;

        const sidebarTitle = document.getElementById('sidebar-title');
        if (sidebarTitle) sidebarTitle.textContent = first.name;

        this.addProjectSwitcher(projects);
        await this.loadProjectFiles(this.currentProjectId);
        console.log(`[API] Loaded project: ${first.name} (${projects.length} total)`);
      }
    } catch (err) {
      console.error('[API] Failed to load projects:', err);
    }
  }

  addProjectSwitcher(projects) {
    const header = document.getElementById('sidebar-header');
    if (!header || projects.length <= 1) return;

    const existing = document.getElementById('project-selector');
    if (existing) existing.remove();

    const select = document.createElement('select');
    select.id = 'project-selector';
    select.style.cssText = `
      background: var(--bg-tertiary);
      color: var(--text-primary);
      border: 1px solid var(--border-color);
      border-radius: 4px;
      padding: 2px 6px;
      font-size: 11px;
      font-family: var(--font-ui);
      cursor: pointer;
      max-width: 120px;
    `;

    projects.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.name;
      opt.selected = p.id === this.currentProjectId;
      select.appendChild(opt);
    });

    select.addEventListener('change', async (e) => {
      this.currentProjectId = e.target.value;
      const project = projects.find(p => p.id === this.currentProjectId);
      const sidebarTitle = document.getElementById('sidebar-title');
      if (sidebarTitle && project) sidebarTitle.textContent = project.name;
      await this.loadProjectFiles(this.currentProjectId);
    });

    header.insertBefore(select, header.querySelector('#sidebar-actions'));
  }

  async loadProjectFiles(projectId) {
    try {
      const files = await apiClient.getProjectFiles(projectId);
      this.setFiles(files);
    } catch (err) {
      console.error('[API] Failed to load project files:', err);
    }
  }

  // ============================================================
  // Editor API Methods
  // ============================================================

  openFile(path, content, isSaved = true) {
    if (!path) return;
    this.fileContents.set(path, content || '');
    if (isSaved) this.savedContents.set(path, content || '');

    const name = path.split('/').pop() || path;
    const tab = this.tabManager.openTab(path, name);
    if (!tab) return;

    if (tab.active) {
      this.setText(content || '');
      this.setLanguage(path);
      this.showEditor();
      this.updateStatusBarFile(path);
    }

    if (this.fileTree) this.fileTree.revealPath(path);
  }

  closeFile(path) {
    const tab = this.tabManager.getTabByPath(path);
    if (tab) this.tabManager.closeTab(tab.id);
    this.fileContents.delete(path);
  }

  async saveFile(path, content) {
    if (content !== undefined) this.fileContents.set(path, content);
    const savedContent = this.fileContents.get(path) || '';
    this.savedContents.set(path, savedContent);
    this.tabManager.setTabDirty(path, false);

    bridge.notify('fileSaved', { path, content: savedContent });

    // Persist to backend
    if (this.currentProjectId && this.apiReady) {
      try {
        await apiClient.writeFile(this.currentProjectId, path, savedContent);
        console.log(`[API] Saved: ${path}`);
      } catch (err) {
        console.error('[API] Save failed:', err);
        this.tabManager.setTabDirty(path, true);
      }
    }
  }

  setFiles(files) {
    this.fileList = files || [];
    if (this.fileTree) this.fileTree.buildFromFileList(this.fileList);
  }

  setTheme(themeName) {
    applyTheme(themeName);
    this.reconfigureTheme();
  }

  toggleSidebar() {
    this.sidebarVisible = !this.sidebarVisible;
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.toggle('collapsed', !this.sidebarVisible);
  }

  executeCommand(command, args) {
    pluginAPI.executeCommand(command, args);
  }

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
        changes: { from: 0, to: current.length, insert: text || '' },
      });
    }
  }

  getText() {
    return this.view ? this.view.state.doc.toString() : '';
  }

  setLanguage(path) {
    if (!this.view) return;
    const ext = createLanguageExtension(path);
    this.view.dispatch({ effects: this.languageCompartment.reconfigure(ext || []) });
    const lang = detectLanguage(path);
    const statusLang = document.getElementById('status-language');
    if (statusLang) statusLang.textContent = lang.name;
  }

  reconfigureTheme() {
    if (!this.view) return;
    this.view.dispatch({ effects: this.themeCompartment.reconfigure(getThemeExtension()) });
  }

  reconfigureEditor() {
    if (!this.view) return;
    this.view.dispatch({
      effects: this.editorConfigCompartment.reconfigure(
        EditorView.theme({ '&': { fontSize: `${this.fontSize}px` } })
      ),
    });
  }

  setCursor(line, col) {
    if (!this.view) return;
    const pos = this.view.state.doc.line(line).from + Math.max(0, col - 1);
    this.view.dispatch({ selection: { anchor: pos }, scrollIntoView: true });
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
    if (statusPos) statusPos.textContent = `Ln ${cursor.line}, Col ${cursor.col}`;
  }

  handleEditorChange() {
    const tab = this.tabManager.getActiveTab();
    if (!tab) return;

    const currentContent = this.getText();
    this.fileContents.set(tab.path, currentContent);
    const savedContent = this.savedContents.get(tab.path) || '';
    this.tabManager.setTabDirty(tab.path, currentContent !== savedContent);
    bridge.notify('fileChanged', { path: tab.path, content: currentContent });
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
        return;
      }

      // Ctrl+N / Cmd+N - New File
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        bridge.notify('newFileRequested', {});
        return;
      }

      // Ctrl+P / Cmd+P - Quick Open
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        bridge.notify('quickOpenRequested', {});
        return;
      }

      // Ctrl+W / Cmd+W - Close Tab
      if ((e.ctrlKey || e.metaKey) && e.key === 'w') {
        e.preventDefault();
        const tab = this.tabManager.getActiveTab();
        if (tab) this.tabManager.closeTab(tab.id);
        return;
      }

      // Ctrl+B / Cmd+B - Toggle Sidebar
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        this.toggleSidebar();
        return;
      }

      // Ctrl+Tab / Cmd+Tab - Next Tab
      if ((e.ctrlKey || e.metaKey) && e.key === 'Tab' && !e.shiftKey) {
        e.preventDefault();
        this.cycleTab(1);
        return;
      }

      // Ctrl+Shift+Tab / Cmd+Shift+Tab - Previous Tab
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'Tab') {
        e.preventDefault();
        this.cycleTab(-1);
        return;
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

  // ============================================================
  // UI Controls
  // ============================================================

  setupUIControls() {
    const themeBtn = document.getElementById('btn-theme-toggle');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        const newTheme = toggleTheme();
        this.reconfigureTheme();
        bridge.notify('themeChanged', { theme: newTheme });
      });
    }

    const newFileBtn = document.getElementById('btn-new-file');
    if (newFileBtn) {
      newFileBtn.addEventListener('click', () => bridge.notify('newFileRequested', {}));
    }

    const newFolderBtn = document.getElementById('btn-new-folder');
    if (newFolderBtn) {
      newFolderBtn.addEventListener('click', () => bridge.notify('newFolderRequested', {}));
    }

    const collapseBtn = document.getElementById('btn-collapse');
    if (collapseBtn) {
      collapseBtn.addEventListener('click', () => {
        if (this.fileTree) {
          this.fileTree.expandedFolders.clear();
          this.fileTree.render();
        }
      });
    }

    const menuBtn = document.getElementById('btn-menu');
    if (menuBtn) {
      menuBtn.addEventListener('click', () => bridge.notify('menuRequested', {}));
    }

    document.addEventListener('click', () => {
      const menu = document.getElementById('context-menu');
      if (menu) menu.style.display = 'none';
    });

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

let editorInstance = null;

function bootstrap() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      editorInstance = new PocketIDEEditor();
    });
  } else {
    editorInstance = new PocketIDEEditor();
  }
}

bootstrap();

export { PocketIDEEditor, editorInstance };
