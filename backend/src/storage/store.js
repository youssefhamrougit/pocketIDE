import crypto from 'node:crypto';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '..', '..', 'data');

/**
 * Simple JSON file-based data store
 * Persists data as JSON files in the data/ directory
 */
class Store {
  constructor() {
    this.cache = {};
  }

  async init() {
    await fs.mkdir(dataDir, { recursive: true });
    console.log(`[Store] Data directory: ${dataDir}`);
  }

  _getFilePath(collection) {
    return join(dataDir, `${collection}.json`);
  }

  async _readFile(collection) {
    const filePath = this._getFilePath(collection);
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (err) {
      if (err.code === 'ENOENT') {
        return [];
      }
      throw err;
    }
  }

  async _writeFile(collection, data) {
    const filePath = this._getFilePath(collection);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  }

  /**
   * Find all documents in a collection
   * @param {string} collection
   * @param {Object} [filter]
   * @returns {Promise<Array>}
   */
  async findAll(collection, filter = {}) {
    let items = await this._readFile(collection);
    if (Object.keys(filter).length > 0) {
      items = items.filter(item =>
        Object.entries(filter).every(([key, value]) => item[key] === value)
      );
    }
    return items;
  }

  /**
   * Find a single document by filter
   * @param {string} collection
   * @param {Object} filter
   * @returns {Promise<Object|null>}
   */
  async findOne(collection, filter) {
    const items = await this._readFile(collection);
    return items.find(item =>
      Object.entries(filter).every(([key, value]) => item[key] === value)
    ) || null;
  }

  /**
   * Find a document by ID
   * @param {string} collection
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  async findById(collection, id) {
    const items = await this._readFile(collection);
    return items.find(item => item.id === id) || null;
  }

  /**
   * Create a document
   * @param {string} collection
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  async create(collection, data) {
    const items = await this._readFile(collection);
    const doc = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data,
    };
    items.push(doc);
    await this._writeFile(collection, items);
    return doc;
  }

  /**
   * Update a document by ID
   * @param {string} collection
   * @param {string} id
   * @param {Object} updates
   * @returns {Promise<Object|null>}
   */
  async update(collection, id, updates) {
    const items = await this._readFile(collection);
    const index = items.findIndex(item => item.id === id);
    if (index === -1) return null;

    items[index] = {
      ...items[index],
      ...updates,
      id: items[index].id,
      createdAt: items[index].createdAt,
      updatedAt: new Date().toISOString(),
    };

    await this._writeFile(collection, items);
    return items[index];
  }

  /**
   * Delete a document by ID
   * @param {string} collection
   * @param {string} id
   * @returns {Promise<boolean>}
   */
  async delete(collection, id) {
    const items = await this._readFile(collection);
    const index = items.findIndex(item => item.id === id);
    if (index === -1) return false;

    items.splice(index, 1);
    await this._writeFile(collection, items);
    return true;
  }

  /**
   * Delete documents matching a filter
   * @param {string} collection
   * @param {Object} filter
   * @returns {Promise<number>} Number of deleted documents
   */
  async deleteMany(collection, filter) {
    const items = await this._readFile(collection);
    const before = items.length;
    const remaining = items.filter(item =>
      !Object.entries(filter).every(([key, value]) => item[key] === value)
    );
    const deleted = before - remaining.length;

    if (deleted > 0) {
      await this._writeFile(collection, remaining);
    }

    return deleted;
  }

  /**
   * Count documents in a collection
   * @param {string} collection
   * @param {Object} [filter]
   * @returns {Promise<number>}
   */
  async count(collection, filter = {}) {
    const items = await this._readFile(collection);
    if (Object.keys(filter).length === 0) return items.length;
    return items.filter(item =>
      Object.entries(filter).every(([key, value]) => item[key] === value)
    ).length;
  }
}

const store = new Store();
export { store, Store };
export default store;
