/**
 * Tabs module - Multi-tab editor management
 * Part of PocketIDE CodeMirror 6 Editor
 */

/**
 * @typedef {Object} Tab
 * @property {string} id - Unique tab identifier (usually file path)
 * @property {string} label - Display name
 * @property {string} path - File path
 * @property {boolean} dirty - Whether file has unsaved changes
 * @property {boolean} active - Whether this is the active tab
 */

class TabManager {
  constructor(container, callbacks = {}) {
    this.container = container;
    this.callbacks = callbacks;
    /** @type {Tab[]} */
    this.tabs = [];
    this.activeTabId = null;
    this.tabCounter = 0;
    this.init();
  }

  init() {
    this.container.addEventListener('click', (e) => this.handleClick(e));
    this.container.addEventListener('wheel', (e) => this.handleScroll(e), { passive: true });
  }

  /**
   * Open a file in a new or existing tab
   * @param {string} path - File path
   * @param {string} label - Display name
   * @returns {Tab}
   */
  openTab(path, label) {
    // Check if tab already exists
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

    // Deactivate current tabs
    this.tabs.forEach(t => t.active = false);
    this.tabs.push(tab);
    this.activeTabId = tab.id;
    this.render();

    if (this.callbacks.onTabOpen) {
      this.callbacks.onTabOpen(tab);
    }

    return tab;
  }

  /**
   * Close a tab by ID
   * @param {string} tabId
   */
  closeTab(tabId) {
    const index = this.tabs.findIndex(t => t.id === tabId);
    if (index === -1) return;

    const tab = this.tabs[index];

    // Check if dirty (unsaved)
    if (tab.dirty && this.callbacks.onTabCloseDirty) {
      this.callbacks.onTabCloseDirty(tab, () => this.forceCloseTab(tabId));
      return;
    }

    this.forceCloseTab(tabId);
  }

  forceCloseTab(tabId) {
    const index = this.tabs.findIndex(t => t.id === tabId);
    if (index === -1) return;

    const wasActive = this.tabs[index].active;
    this.tabs.splice(index, 1);

    // If the active tab was closed, activate the nearest tab
    if (wasActive && this.tabs.length > 0) {
      const newIndex = Math.min(index, this.tabs.length - 1);
      this.activateTab(this.tabs[newIndex].id);
    } else if (this.tabs.length === 0) {
      this.activeTabId = null;
      if (this.callbacks.onNoTabs) this.callbacks.onNoTabs();
    }

    this.render();

    if (this.callbacks.onTabClose) {
      this.callbacks.onTabClose(tabId);
    }
  }

  /**
   * Activate a tab by ID
   * @param {string} tabId
   */
  activateTab(tabId) {
    if (this.activeTabId === tabId) return;

    this.tabs.forEach(t => t.active = t.id === tabId);
    this.activeTabId = tabId;
    this.render();

    const tab = this.tabs.find(t => t.id === tabId);
    if (tab && this.callbacks.onTabActivate) {
      this.callbacks.onTabActivate(tab);
    }
  }

  /**
   * Mark a tab as dirty (unsaved changes)
   * @param {string} path - File path
   * @param {boolean} dirty
   */
  setTabDirty(path, dirty) {
    const tab = this.tabs.find(t => t.path === path);
    if (tab) {
      tab.dirty = dirty;
      this.render();
    }
  }

  /**
   * Get the active tab
   * @returns {Tab|null}
   */
  getActiveTab() {
    return this.tabs.find(t => t.active) || null;
  }

  /**
   * Get tab by file path
   * @param {string} path
   * @returns {Tab|null}
   */
  getTabByPath(path) {
    return this.tabs.find(t => t.path === path) || null;
  }

  /**
   * Update tab label (e.g., when file is renamed)
   * @param {string} path
   * @param {string} newLabel
   */
  updateTabLabel(path, newLabel) {
    const tab = this.tabs.find(t => t.path === path);
    if (tab) {
      tab.label = newLabel;
      this.render();
    }
  }

  /**
   * Close all tabs
   */
  closeAllTabs() {
    this.tabs = [];
    this.activeTabId = null;
    this.render();
    if (this.callbacks.onNoTabs) this.callbacks.onNoTabs();
  }

  /**
   * Render the tab bar
   */
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

    // Scroll active tab into view
    const active = this.container.querySelector('.tab.active');
    if (active) {
      active.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }
  }

  handleClick(e) {
    // Close button
    const closeBtn = e.target.closest('.tab-close');
    if (closeBtn) {
      const tab = closeBtn.closest('.tab');
      if (tab) {
        e.stopPropagation();
        this.closeTab(tab.dataset.tabId);
      }
      return;
    }

    // Tab click
    const tabEl = e.target.closest('.tab');
    if (tabEl) {
      this.activateTab(tabEl.dataset.tabId);
    }
  }

  handleScroll(e) {
    if (e.deltaY !== 0) {
      this.container.scrollLeft += e.deltaY;
    }
  }
}

export { TabManager };
