/**
 * Plugin API module - Plugin system for PocketIDE
 * Matches the plugin specification from plugins/README.md
 * Part of PocketIDE CodeMirror 6 Editor
 */

class PluginAPI {
  constructor() {
    this.plugins = new Map();
    this.commands = new Map();
    this.eventHandlers = new Map();
    this.pluginActivateFns = new Map();    // per-plugin activate functions
    this.pluginDeactivateFns = new Map();  // per-plugin deactivate functions
    this.initialized = false;
  }

  /**
   * Initialize the plugin system
   * @param {Object} editorAPI - Reference to the editor API
   */
  init(editorAPI) {
    this.editorAPI = editorAPI;
    this.initialized = true;

    // Load plugins from the global window scope
    this.discoverPlugins();
  }

  /**
   * Discover plugins that were loaded via script tags
   */
  discoverPlugins() {
    if (typeof window !== 'undefined') {
      // Check for plugins registered in window.__pocketIDE_plugins
      const registeredPlugins = window.__pocketIDE_plugins || [];
      registeredPlugins.forEach(plugin => {
        this.loadPlugin(plugin);
      });
    }
  }

  /**
   * Load a plugin manifest
   * @param {Object} manifest - Plugin manifest
   */
  loadPlugin(manifest) {
    if (!manifest || !manifest.name) {
      console.warn('[PluginAPI] Invalid plugin manifest');
      return;
    }

    if (this.plugins.has(manifest.name)) {
      console.warn(`[PluginAPI] Plugin "${manifest.name}" already loaded`);
      return;
    }

    const plugin = {
      manifest,
      subscriptions: [],
      activated: false,
    };

    // Register per-plugin activate/deactivate if exported
    if (typeof manifest.activate === 'function') {
      this.pluginActivateFns.set(manifest.name, manifest.activate);
    }
    if (typeof manifest.deactivate === 'function') {
      this.pluginDeactivateFns.set(manifest.name, manifest.deactivate);
    }

    this.plugins.set(manifest.name, plugin);
    console.log(`[PluginAPI] Loaded plugin: ${manifest.name} v${manifest.version}`);

    // Auto-activate if needed
    if (this.shouldAutoActivate(manifest)) {
      this.activatePlugin(manifest.name);
    }
  }

  /**
   * Check if a plugin should auto-activate
   */
  shouldAutoActivate(manifest) {
    if (!manifest.activationEvents || manifest.activationEvents.length === 0) {
      return true; // Activate on startup
    }
    return manifest.activationEvents.includes('*') || 
           manifest.activationEvents.includes('onStartup');
  }

  /**
   * Activate a plugin
   * @param {string} name - Plugin name
   */
  activatePlugin(name) {
    const plugin = this.plugins.get(name);
    if (!plugin || plugin.activated) return;

    const context = this.createPluginContext(name);

    try {
      // Try per-plugin activate function first
      const activateFn = this.pluginActivateFns.get(name);
      if (typeof activateFn === 'function') {
        activateFn(context);
      } else if (typeof window.activate === 'function') {
        // Fallback to global window.activate (legacy single-plugin support)
        window.activate(context);
        // Clear global after use so next plugin doesn't reuse it
        delete window.activate;
      }

      plugin.activated = true;
      console.log(`[PluginAPI] Activated plugin: ${name}`);
    } catch (err) {
      console.error(`[PluginAPI] Failed to activate plugin "${name}":`, err);
    }
  }

  /**
   * Deactivate a plugin
   * @param {string} name - Plugin name
   */
  deactivatePlugin(name) {
    const plugin = this.plugins.get(name);
    if (!plugin || !plugin.activated) return;

    try {
      // Try per-plugin deactivate function first
      const deactivateFn = this.pluginDeactivateFns.get(name);
      if (typeof deactivateFn === 'function') {
        deactivateFn(name);
      } else if (typeof window.deactivate === 'function') {
        // Fallback to global window.deactivate
        window.deactivate(name);
        delete window.deactivate;
      }

      // Cleanup subscriptions
      plugin.subscriptions.forEach(sub => {
        if (typeof sub.dispose === 'function') sub.dispose();
      });
      plugin.subscriptions = [];

      plugin.activated = false;
      console.log(`[PluginAPI] Deactivated plugin: ${name}`);
    } catch (err) {
      console.error(`[PluginAPI] Failed to deactivate plugin "${name}":`, err);
    }
  }

  /**
   * Create the plugin context object
   * @param {string} pluginName
   * @returns {Object} Plugin context
   */
  createPluginContext(pluginName) {
    const plugin = this.plugins.get(pluginName);
    const self = this;

    return {
      // Editor API
      editor: {
        setText: (text) => {
          if (self.editorAPI) self.editorAPI.setText(text);
        },
        getText: () => {
          return self.editorAPI ? self.editorAPI.getText() : '';
        },
        setCursor: (line, col) => {
          if (self.editorAPI) self.editorAPI.setCursor(line, col);
        },
        getCursor: () => {
          return self.editorAPI ? self.editorAPI.getCursor() : { line: 1, col: 1 };
        },
        format: () => {
          if (self.editorAPI) self.editorAPI.format();
        },
        getSelection: () => {
          return self.editorAPI ? self.editorAPI.getSelection() : '';
        },
        replaceSelection: (text) => {
          if (self.editorAPI) self.editorAPI.replaceSelection(text);
        },
      },

      // Commands
      commands: {
        register: (id, handler) => {
          self.commands.set(id, { handler, pluginName });
          return {
            dispose: () => self.commands.delete(id),
          };
        },
        execute: (id, args) => {
          const cmd = self.commands.get(id);
          if (cmd && typeof cmd.handler === 'function') {
            return cmd.handler(args);
          }
        },
      },

      // Workspace
      workspace: {
        getFiles: () => {
          return self.editorAPI ? self.editorAPI.getFiles() : [];
        },
        readFile: (path) => {
          return self.editorAPI ? self.editorAPI.readFile(path) : null;
        },
        writeFile: (path, content) => {
          if (self.editorAPI) self.editorAPI.writeFile(path, content);
        },
        onDidChangeFiles: (callback) => {
          return self.on('workspace:filesChanged', callback);
        },
      },

      // Window
      window: {
        showMessage: (msg) => {
          if (self.editorAPI) self.editorAPI.showNotification(msg);
        },
        showErrorMessage: (msg) => {
          if (self.editorAPI) self.editorAPI.showNotification(msg, 'error');
        },
        showWarningMessage: (msg) => {
          if (self.editorAPI) self.editorAPI.showNotification(msg, 'warning');
        },
      },

      // Events
      events: {
        onDidChangeText: (callback) => self.on('editor:change', callback),
        onDidOpenFile: (callback) => self.on('editor:fileOpen', callback),
        onDidSaveFile: (callback) => self.on('editor:fileSave', callback),
        onDidChangeActiveEditor: (callback) => self.on('editor:activeChanged', callback),
      },

      // Subscriptions (for cleanup)
      subscriptions: plugin ? plugin.subscriptions : [],

      // Plugin info
      extension: {
        id: pluginName,
        subscriptions: plugin ? plugin.subscriptions : [],
      },
    };
  }

  /**
   * Register a command
   * @param {string} id - Command ID
   * @param {Function} handler - Command handler
   */
  registerCommand(id, handler) {
    this.commands.set(id, { handler, pluginName: 'core' });
  }

  /**
   * Execute a command
   * @param {string} id - Command ID
   * @param {*} args - Command arguments
   * @returns {*}
   */
  executeCommand(id, args) {
    const cmd = this.commands.get(id);
    if (cmd && typeof cmd.handler === 'function') {
      return cmd.handler(args);
    }
    console.warn(`[PluginAPI] Unknown command: ${id}`);
  }

  /**
   * Register an event handler
   * @param {string} event - Event name
   * @param {Function} handler - Event handler
   * @returns {{dispose: Function}} Disposable
   */
  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event).add(handler);

    return {
      dispose: () => {
        const handlers = this.eventHandlers.get(event);
        if (handlers) {
          handlers.delete(handler);
        }
      },
    };
  }

  /**
   * Emit an event to all registered handlers
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emit(event, data) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (err) {
          console.error(`[PluginAPI] Error in event handler for "${event}":`, err);
        }
      });
    }
  }

  /**
   * Get all loaded plugins
   * @returns {Array}
   */
  getPlugins() {
    return Array.from(this.plugins.values()).map(p => ({
      name: p.manifest.name,
      version: p.manifest.version,
      description: p.manifest.description,
      author: p.manifest.author,
      activated: p.activated,
    }));
  }

  /**
   * Get all registered commands
   * @returns {Array}
   */
  getCommands() {
    return Array.from(this.commands.keys());
  }
}

// Singleton
const pluginAPI = new PluginAPI();

export { pluginAPI, PluginAPI };
