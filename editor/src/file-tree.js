/**
 * File Tree module - File explorer sidebar component
 * Part of PocketIDE CodeMirror 6 Editor
 */

/**
 * @typedef {Object} FileNode
 * @property {string} name - File/folder name
 * @property {'file'|'folder'} type
 * @property {string} [path] - Full path (for files)
 * @property {FileNode[]} [children] - Children (for folders)
 */

/**
 * @typedef {Object} TreeCallbacks
 * @property {(path: string) => void} onFileSelect
 * @property {(path: string) => void} onFileDelete
 * @property {(path: string, newName: string) => void} onFileRename
 * @property {(parentPath: string) => void} onNewFile
 * @property {(parentPath: string) => void} onNewFolder
 */

class FileTree {
  constructor(container, callbacks = {}) {
    this.container = container;
    this.callbacks = callbacks;
    /** @type {FileNode[]} */
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

  /**
   * Set the file tree data
   * @param {FileNode[]} nodes
   */
  setTree(nodes) {
    this.nodes = nodes;
    this.render();
  }

  /**
   * Build tree structure from flat file list
   * @param {Array<{path: string}>} files
   */
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

    // Sort: folders first, then alphabetical
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

  /**
   * Select a file in the tree
   * @param {string} path
   */
  selectFile(path) {
    this.selectedPath = path;
    this.render();
  }

  /**
   * Expand all parent folders for a given path
   * @param {string} path
   */
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
    this.nodes.forEach(node => {
      this.renderNode(node, '', this.container);
    });
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

    // Build the item content
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

    // Render children for folders
    if (node.type === 'folder' && node.children) {
      const childrenContainer = document.createElement('div');
      childrenContainer.className = 'tree-children';
      if (!this.expandedFolders.has(node.path)) {
        childrenContainer.classList.add('collapsed');
      }

      node.children.forEach(child => {
        this.renderNode(child, node.path, childrenContainer);
      });

      parentElement.appendChild(childrenContainer);
    }

    // Store node data
    item._node = node;
  }

  getFileIcon(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const icons = {
      js: '📄', jsx: '⚛️', ts: '📘', tsx: '⚛️',
      py: '🐍', html: '🌐', css: '🎨', json: '📋',
      md: '📝', txt: '📄', gitignore: '🔧',
      env: '🔒', yml: '⚙️', yaml: '⚙️',
      toml: '⚙️', xml: '📰', svg: '🖼️', png: '🖼️',
      jpg: '🖼️', jpeg: '🖼️', gif: '🖼️', ico: '🖼️',
      lock: '🔒', wasm: '⚡', rs: '🦀', go: '🔵',
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
      if (this.callbacks.onFileSelect) {
        this.callbacks.onFileSelect(node.path);
      }
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

      // Hide inappropriate actions
      if (node.type === 'file' && (action === 'new-file' || action === 'new-folder')) {
        item.style.display = 'none';
      }
    });

    menu.style.display = 'block';
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;

    // Store the target node
    menu._targetNode = node;

    // Handle menu clicks
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
    if (menu) {
      menu.style.display = 'none';
    }
  }

  executeContextAction(action, node) {
    switch (action) {
      case 'open':
        if (node.type === 'file' && this.callbacks.onFileSelect) {
          this.callbacks.onFileSelect(node.path);
        }
        break;

      case 'rename':
        this.promptRename(node);
        break;

      case 'delete':
        if (node.type === 'file' && this.callbacks.onFileDelete) {
          this.callbacks.onFileDelete(node.path);
        } else if (node.type === 'folder' && this.callbacks.onFileDelete) {
          this.callbacks.onFileDelete(node.path);
        }
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
    const modal = document.getElementById('modal-overlay');
    const title = document.getElementById('modal-title');
    const input = document.getElementById('modal-input');
    const confirm = document.getElementById('modal-confirm');
    const cancel = document.getElementById('modal-cancel');

    if (!modal) return;

    title.textContent = `Rename ${node.type === 'folder' ? 'Folder' : 'File'}`;
    input.value = node.name;
    input.select();

    modal.style.display = 'flex';

    const handleConfirm = () => {
      const newName = input.value.trim();
      if (newName && newName !== node.name && this.callbacks.onFileRename) {
        const parentPath = node.path.substring(0, node.path.lastIndexOf('/'));
        const newPath = parentPath ? `${parentPath}/${newName}` : newName;
        this.callbacks.onFileRename(node.path, newName);
      }
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

  promptNewFile(node) {
    const parentPath = node.type === 'folder' ? node.path : '';
    this.showInputModal('New File', 'Enter file name:', '', (name) => {
      if (name && this.callbacks.onNewFile) {
        this.callbacks.onNewFile(parentPath, name);
      }
    });
  }

  promptNewFolder(node) {
    const parentPath = node.type === 'folder' ? node.path : '';
    this.showInputModal('New Folder', 'Enter folder name:', '', (name) => {
      if (name && this.callbacks.onNewFolder) {
        this.callbacks.onNewFolder(parentPath, name);
      }
    });
  }

  showInputModal(titleText, labelText, defaultValue, onConfirm) {
    const modal = document.getElementById('modal-overlay');
    const title = document.getElementById('modal-title');
    const input = document.getElementById('modal-input');
    const confirm = document.getElementById('modal-confirm');
    const cancel = document.getElementById('modal-cancel');

    if (!modal) return;

    title.textContent = titleText;
    input.value = defaultValue;
    input.placeholder = labelText;
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

export { FileTree };
