/**
 * File service - file operations within projects
 */

import fs from 'fs/promises';
import path from 'path';
import config from '../config.js';
import projectService from './project-service.js';
import store from '../storage/store.js';
import { NotFoundError, ValidationError } from '../middleware/errors.js';

class FileService {
  /**
   * Get the project directory path
   * @param {string} projectId
   * @returns {string}
   */
  _getProjectDir(projectId) {
    return path.join(config.storage.projectsDir, projectId);
  }

  /**
   * Resolve a file path within a project, preventing directory traversal
   * @param {string} projectDir
   * @param {string} filePath
   * @returns {string}
   */
  _resolvePath(projectDir, filePath) {
    // Normalize and prevent directory traversal
    const normalized = path.normalize(filePath).replace(/^[/\\]/, '');
    const fullPath = path.join(projectDir, normalized);

    // Ensure the resolved path is within the project directory
    if (!fullPath.startsWith(projectDir)) {
      throw new ValidationError('Invalid file path');
    }

    return fullPath;
  }

  /**
   * List files in a project
   * @param {string} projectId
   * @param {string} userId
   * @returns {Promise<Array>}
   */
  async listFiles(projectId, userId) {
    await projectService.getProject(projectId, userId);
    return projectService.getProjectFiles(projectId, userId);
  }

  /**
   * Read a file's content
   * @param {string} projectId
   * @param {string} filePath
   * @param {string} userId
   * @returns {Promise<{content: string, path: string}>}
   */
  async readFile(projectId, filePath, userId) {
    await projectService.getProject(projectId, userId);
    const projectDir = this._getProjectDir(projectId);
    const resolvedPath = this._resolvePath(projectDir, filePath);

    try {
      const stat = await fs.stat(resolvedPath);
      if (!stat.isFile()) {
        throw new ValidationError('Path is not a file');
      }

      const content = await fs.readFile(resolvedPath, 'utf-8');
      return {
        path: filePath.replace(/\\/g, '/'),
        content,
        size: stat.size,
        modifiedAt: stat.mtime.toISOString(),
      };
    } catch (err) {
      if (err.code === 'ENOENT') {
        throw new NotFoundError('File');
      }
      throw err;
    }
  }

  /**
   * Write content to a file
   * @param {string} projectId
   * @param {string} filePath
   * @param {string} content
   * @param {string} userId
   * @returns {Promise<Object>}
   */
  async writeFile(projectId, filePath, content, userId) {
    const project = await projectService.getProject(projectId, userId);
    const projectDir = this._getProjectDir(projectId);
    const resolvedPath = this._resolvePath(projectDir, filePath);

    // Ensure parent directory exists
    await fs.mkdir(path.dirname(resolvedPath), { recursive: true });

    // Check if this is a new file
    let isNew = false;
    try {
      await fs.access(resolvedPath);
    } catch {
      isNew = true;
    }

    await fs.writeFile(resolvedPath, content, 'utf-8');

    // Update project file count if new
    if (isNew) {
      await store.update('projects', projectId, {
        fileCount: (project.fileCount || 0) + 1,
      });
    }

    return {
      path: filePath.replace(/\\/g, '/'),
      size: Buffer.byteLength(content, 'utf-8'),
      isNew,
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Create a new file
   * @param {string} projectId
   * @param {string} filePath
   * @param {string} userId
   * @param {string} [content]
   * @returns {Promise<Object>}
   */
  async createFile(projectId, filePath, userId, content = '') {
    return this.writeFile(projectId, filePath, content, userId);
  }

  /**
   * Create a new directory
   * @param {string} projectId
   * @param {string} dirPath
   * @param {string} userId
   * @returns {Promise<Object>}
   */
  async createDirectory(projectId, dirPath, userId) {
    const project = await projectService.getProject(projectId, userId);
    const projectDir = this._getProjectDir(projectId);
    const resolvedPath = this._resolvePath(projectDir, dirPath);

    try {
      await fs.mkdir(resolvedPath, { recursive: true });
    } catch (err) {
      if (err.code === 'EEXIST') {
        throw new ValidationError('Directory already exists');
      }
      throw err;
    }

    return {
      path: dirPath.replace(/\\/g, '/'),
      type: 'folder',
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Rename a file or directory
   * @param {string} projectId
   * @param {string} oldPath
   * @param {string} newPath
   * @param {string} userId
   * @returns {Promise<Object>}
   */
  async rename(projectId, oldPath, newPath, userId) {
    await projectService.getProject(projectId, userId);
    const projectDir = this._getProjectDir(projectId);
    const resolvedOld = this._resolvePath(projectDir, oldPath);
    const resolvedNew = this._resolvePath(projectDir, newPath);

    try {
      await fs.access(resolvedOld);
    } catch {
      throw new NotFoundError('File or directory');
    }

    try {
      await fs.access(resolvedNew);
      throw new ValidationError('A file or directory already exists at the destination');
    } catch (err) {
      if (err instanceof ValidationError) throw err;
      // Destination doesn't exist, proceed
    }

    await fs.rename(resolvedOld, resolvedNew);

    return {
      oldPath: oldPath.replace(/\\/g, '/'),
      newPath: newPath.replace(/\\/g, '/'),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Delete a file or directory
   * @param {string} projectId
   * @param {string} filePath
   * @param {string} userId
   * @returns {Promise<Object>}
   */
  async delete(projectId, filePath, userId) {
    const project = await projectService.getProject(projectId, userId);
    const projectDir = this._getProjectDir(projectId);
    const resolvedPath = this._resolvePath(projectDir, filePath);

    try {
      const stat = await fs.stat(resolvedPath);
      if (stat.isDirectory()) {
        await fs.rm(resolvedPath, { recursive: true });
      } else {
        await fs.unlink(resolvedPath);
      }
    } catch (err) {
      if (err.code === 'ENOENT') {
        throw new NotFoundError('File or directory');
      }
      throw err;
    }

    return {
      path: filePath.replace(/\\/g, '/'),
      deleted: true,
    };
  }

  /**
   * Get file metadata
   * @param {string} projectId
   * @param {string} filePath
   * @param {string} userId
   * @returns {Promise<Object>}
   */
  async getFileInfo(projectId, filePath, userId) {
    await projectService.getProject(projectId, userId);
    const projectDir = this._getProjectDir(projectId);
    const resolvedPath = this._resolvePath(projectDir, filePath);

    try {
      const stat = await fs.stat(resolvedPath);
      return {
        path: filePath.replace(/\\/g, '/'),
        name: path.basename(filePath),
        type: stat.isDirectory() ? 'folder' : 'file',
        size: stat.size,
        createdAt: stat.birthtime.toISOString(),
        modifiedAt: stat.mtime.toISOString(),
        isDirectory: stat.isDirectory(),
      };
    } catch (err) {
      if (err.code === 'ENOENT') {
        throw new NotFoundError('File or directory');
      }
      throw err;
    }
  }
}

const fileService = new FileService();
export { fileService, FileService };
export default fileService;
