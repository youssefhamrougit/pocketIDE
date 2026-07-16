/**
 * Bridge module - Communication layer between Flutter and the CodeMirror 6 WebView
 * Part of PocketIDE CodeMirror 6 Editor
 * 
 * Protocol:
 *   Flutter -> WebView: window.handleFlutterMessage(message)
 *   WebView -> Flutter: window.PocketIDEBridge.sendToFlutter(message)
 * 
 * Message format: { type: string, payload: any }
 */

class Bridge {
  constructor() {
    this.handlers = new Map();
    this.pendingRequests = new Map();
    this.requestId = 0;
    this.ready = false;
    this.pendingQueue = [];
    this.flutterReady = false;
  }

  /**
   * Initialize the bridge
   * @param {Object} editorAPI - Reference to the editor API
   */
  init(editorAPI) {
    this.editorAPI = editorAPI;
    this.ready = true;

    // Register default handlers
    this.registerHandler('openFile', (payload) => {
      if (this.editorAPI) this.editorAPI.openFile(payload.path, payload.content);
    });

    this.registerHandler('closeFile', (payload) => {
      if (this.editorAPI) this.editorAPI.closeFile(payload.path);
    });

    this.registerHandler('saveFile', (payload) => {
      if (this.editorAPI) this.editorAPI.saveFile(payload.path, payload.content);
    });

    this.registerHandler('setFiles', (payload) => {
      if (this.editorAPI) this.editorAPI.setFiles(payload.files);
    });

    this.registerHandler('setTheme', (payload) => {
      if (this.editorAPI) this.editorAPI.setTheme(payload.theme);
    });

    this.registerHandler('getEditorContent', (payload) => {
      const content = this.editorAPI ? this.editorAPI.getText() : '';
      this.sendToFlutter({
        type: 'editorContent',
        payload: { content },
      });
    });

    this.registerHandler('executeCommand', (payload) => {
      if (this.editorAPI) this.editorAPI.executeCommand(payload.command, payload.args);
    });

    this.registerHandler('setFontSize', (payload) => {
      if (this.editorAPI) this.editorAPI.setFontSize(payload.size);
    });

    this.registerHandler('toggleSidebar', () => {
      if (this.editorAPI) this.editorAPI.toggleSidebar();
    });

    // Send ready event
    this.sendToFlutter({ type: 'editorReady', payload: { version: '1.0.0' } });

    // Process any queued messages
    this.flushPendingQueue();
  }

  /**
   * Register a message handler
   * @param {string} type - Message type
   * @param {Function} handler - Handler function
   */
  registerHandler(type, handler) {
    this.handlers.set(type, handler);
  }

  /**
   * Handle a message from Flutter
   * @param {Object|string} message - The message from Flutter
   */
  handleFlutterMessage(message) {
    let parsed;

    if (typeof message === 'string') {
      try {
        parsed = JSON.parse(message);
      } catch (e) {
        console.error('[Bridge] Invalid JSON from Flutter:', message);
        return;
      }
    } else {
      parsed = message;
    }

    const { type, payload, requestId } = parsed;

    if (!type) {
      console.warn('[Bridge] Message without type:', parsed);
      return;
    }

    const handler = this.handlers.get(type);
    if (handler) {
      try {
        const result = handler(payload);
        // Send response if this was a request
        if (requestId) {
          this.sendToFlutter({ type: 'response', requestId, payload: result });
        }
      } catch (err) {
        console.error(`[Bridge] Error handling message "${type}":`, err);
        if (requestId) {
          this.sendToFlutter({ type: 'error', requestId, payload: { error: err.message } });
        }
      }
    } else {
      console.warn(`[Bridge] Unknown message type: "${type}"`);
      if (requestId) {
        this.sendToFlutter({ type: 'error', requestId, payload: { error: `Unknown message type: ${type}` } });
      }
    }
  }

  /**
   * Send a message to Flutter
   * @param {Object} message - Message to send
   */
  sendToFlutter(message) {
    const json = JSON.stringify(message);

    // Try multiple methods for maximum compatibility
    try {
      // Method 1: Flutter InAppWebView callHandler
      if (typeof window.flutter_inappwebview !== 'undefined' &&
          typeof window.flutter_inappwebview.callHandler === 'function') {
        window.flutter_inappwebview.callHandler('onEditorMessage', json);
        return;
      }

      // Method 2: PostMessage API (for webview_flutter)
      if (typeof window.EditorMessageChannel !== 'undefined' &&
          typeof window.EditorMessageChannel.postMessage === 'function') {
        window.EditorMessageChannel.postMessage(json);
        return;
      }

      // Method 3: Custom event
      if (typeof window.flutterPostMessage === 'function') {
        window.flutterPostMessage(json);
        return;
      }

      // Method 4: URL scheme trick (fallback)
      // This is handled by the WebView intercepting navigation requests
      console.log('[Bridge] No Flutter bridge found, logging message:', json);
    } catch (err) {
      console.error('[Bridge] Error sending message to Flutter:', err);
    }
  }

  /**
   * Send a notification message to Flutter
   * @param {string} type - Notification type
   * @param {*} payload - Notification data
   */
  notify(type, payload) {
    this.sendToFlutter({ type, payload });
  }

  /**
   * Send a request to Flutter and wait for response
   * @param {string} type - Request type
   * @param {*} payload - Request data
   * @returns {Promise<*>} Response data
   */
  request(type, payload) {
    return new Promise((resolve, reject) => {
      const requestId = `req_${++this.requestId}`;
      
      this.pendingRequests.set(requestId, { resolve, reject, timeout: setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error(`Request "${type}" timed out`));
      }, 10000) });

      this.sendToFlutter({ type, payload, requestId });
    });
  }

  /**
   * Flush any messages that were queued before initialization
   */
  flushPendingQueue() {
    if (this.pendingQueue.length > 0) {
      this.pendingQueue.forEach(msg => this.sendToFlutter(msg));
      this.pendingQueue = [];
    }
  }

  /**
   * Handle response from Flutter
   * @param {Object} response
   */
  handleResponse(response) {
    const { requestId, payload } = response;
    const pending = this.pendingRequests.get(requestId);
    if (pending) {
      clearTimeout(pending.timeout);
      this.pendingRequests.delete(requestId);
      pending.resolve(payload);
    }
  }
}

// Create singleton and expose globally
const bridge = new Bridge();

// Expose for Flutter to call
window.handleFlutterMessage = (message) => bridge.handleFlutterMessage(message);

// Signal that the bridge is ready
window.PocketIDEBridge = bridge;

export { bridge, Bridge };
