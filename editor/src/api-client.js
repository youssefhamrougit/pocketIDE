/**
 * API Client module - Connects the PocketIDE editor to the backend API
 * Handles authentication, project listing, file CRUD operations
 * Part of PocketIDE CodeMirror 6 Editor
 */

class ApiClient {
  constructor(baseUrl = '') {
    // Use empty base URL for same-origin (server serves both editor and API)
    this.baseUrl = baseUrl;
    this.token = null;
    this.user = null;
    this.currentProject = null;
    this.isAuthenticated = false;
  }

  /**
   * Make an API request
   * @param {string} method - HTTP method
   * @param {string} path - API path (e.g. '/api/projects')
   * @param {Object} [body] - Request body for POST/PUT/PATCH
   * @returns {Promise<Object>} Response JSON
   */
  async request(method, path, body = undefined) {
    const url = `${this.baseUrl}${path}`;
    const headers = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const options = { method, headers };
    if (body !== undefined) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
      throw new Error(error.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data;
  }

  // ============================================================
  // Authentication
  // ============================================================

  /**
   * Login with email and password
   * @param {string} email
   * @param {string} password
   * @returns {Promise<Object>} User and token
   */
  async login(email, password) {
    const data = await this.request('POST', '/api/auth/login', { email, password });
    this.token = data.token;
    this.user = data.user;
    this.isAuthenticated = true;
    // Store token for page refreshes
    this._saveToken();
    return data;
  }

  /**
   * Register a new user
   * @param {string} username
   * @param {string} email
   * @param {string} password
   * @returns {Promise<Object>}
   */
  async register(username, email, password) {
    const data = await this.request('POST', '/api/auth/register', { username, email, password });
    this.token = data.token;
    this.user = data.user;
    this.isAuthenticated = true;
    this._saveToken();
    return data;
  }

  /**
   * Fetch the current user profile
   * @returns {Promise<Object>}
   */
  async getProfile() {
    const data = await this.request('GET', '/api/auth/me');
    this.user = data.user;
    return data;
  }

  /**
   * Try to restore session from saved token
   * @returns {Promise<boolean>} Whether session was restored
   */
  async restoreSession() {
    const token = this._getSavedToken();
    if (!token) return false;

    this.token = token;
    try {
      await this.getProfile();
      return true;
    } catch {
      this.token = null;
      this._removeToken();
      return false;
    }
  }

  _saveToken() {
    try {
      sessionStorage.setItem('pocketide_token', this.token);
    } catch { /* Storage not available */ }
  }

  _getSavedToken() {
    try {
      return sessionStorage.getItem('pocketide_token');
    } catch {
      return null;
    }
  }

  _removeToken() {
    try {
      sessionStorage.removeItem('pocketide_token');
    } catch { /* Storage not available */ }
  }

  // ============================================================
  // Projects
  // ============================================================

  /**
   * List all projects for the current user
   * @returns {Promise<Array>}
   */
  async listProjects() {
    const data = await this.request('GET', '/api/projects');
    return data.projects;
  }

  /**
   * Get a single project with its file tree
   * @param {string} projectId
   * @returns {Promise<{project: Object, files: Array}>}
   */
  async getProject(projectId) {
    const data = await this.request('GET', `/api/projects/${projectId}`);
    this.currentProject = data.project;
    return data;
  }

  /**
   * Create a new project
   * @param {Object} params - { name, description, template, language }
   * @returns {Promise<Object>}
   */
  async createProject(params) {
    const data = await this.request('POST', '/api/projects', params);
    return data.project;
  }

  /**
   * Update a project
   * @param {string} projectId
   * @param {Object} updates
   * @returns {Promise<Object>}
   */
  async updateProject(projectId, updates) {
    const data = await this.request('PUT', `/api/projects/${projectId}`, updates);
    return data.project;
  }

  /**
   * Delete a project
   * @param {string} projectId
   * @returns {Promise<void>}
   */
  async deleteProject(projectId) {
    await this.request('DELETE', `/api/projects/${projectId}`);
  }

  /**
   * Get file tree for a project
   * @param {string} projectId
   * @returns {Promise<Array>}
   */
  async getProjectFiles(projectId) {
    const data = await this.request('GET', `/api/projects/${projectId}/files`);
    return data.files;
  }

  // ============================================================
  // Files
  // ============================================================

  /**
   * Read a file's content
   * @param {string} projectId
   * @param {string} filePath
   * @returns {Promise<{content: string, path: string}>}
   */
  async readFile(projectId, filePath) {
    const encodedPath = encodeURIComponent(filePath);
    const data = await this.request('GET', `/api/projects/${projectId}/files?path=${encodedPath}`);
    return data;
  }

  /**
   * Write content to a file
   * @param {string} projectId
   * @param {string} filePath
   * @param {string} content
   * @returns {Promise<Object>}
   */
  async writeFile(projectId, filePath, content) {
    const encodedPath = encodeURIComponent(filePath);
    const data = await this.request('PUT', `/api/projects/${projectId}/files?path=${encodedPath}`, { content });
    return data;
  }

  /**
   * Create a new file
   * @param {string} projectId
   * @param {string} filePath
   * @param {string} [content='']
   * @returns {Promise<Object>}
   */
  async createFile(projectId, filePath, content = '') {
    const encodedPath = encodeURIComponent(filePath);
    const data = await this.request('POST', `/api/projects/${projectId}/files?path=${encodedPath}`, { content });
    return data;
  }

  /**
   * Create a new directory
   * @param {string} projectId
   * @param {string} dirPath
   * @returns {Promise<Object>}
   */
  async createDirectory(projectId, dirPath) {
    const encodedPath = encodeURIComponent(dirPath);
    const data = await this.request('POST', `/api/projects/${projectId}/files?path=${encodedPath}`, { type: 'folder' });
    return data;
  }

  /**
   * Rename a file or directory
   * @param {string} projectId
   * @param {string} oldPath
   * @param {string} newPath
   * @returns {Promise<Object>}
   */
  async renameFile(projectId, oldPath, newPath) {
    const encodedPath = encodeURIComponent(oldPath);
    const data = await this.request('PATCH', `/api/projects/${projectId}/files?path=${encodedPath}`, { newPath });
    return data;
  }

  /**
   * Delete a file or directory
   * @param {string} projectId
   * @param {string} filePath
   * @returns {Promise<Object>}
   */
  async deleteFile(projectId, filePath) {
    const encodedPath = encodeURIComponent(filePath);
    const data = await this.request('DELETE', `/api/projects/${projectId}/files?path=${encodedPath}`);
    return data;
  }
}

const apiClient = new ApiClient();
export { apiClient, ApiClient };
