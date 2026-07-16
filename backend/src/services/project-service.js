/**
 * Project service - business logic for project management
 */

import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import store from '../storage/store.js';
import config from '../config.js';
import { NotFoundError, ValidationError } from '../middleware/errors.js';

class ProjectService {
  /**
   * List all projects for a user
   * @param {string} userId
   * @returns {Promise<Array>}
   */
  async listProjects(userId) {
    const projects = await store.findAll('projects', { userId });
    return projects.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }

  /**
   * Get a single project by ID
   * @param {string} projectId
   * @param {string} userId
   * @returns {Promise<Object>}
   */
  async getProject(projectId, userId) {
    const project = await store.findById('projects', projectId);
    if (!project || project.userId !== userId) {
      throw new NotFoundError('Project');
    }
    return project;
  }

  /**
   * Create a new project
   * @param {Object} data
   * @param {string} userId
   * @returns {Promise<Object>}
   */
  async createProject(data, userId) {
    const { name, description = '', template = 'empty', language = 'javascript' } = data;

    if (!name || name.trim().length === 0) {
      throw new ValidationError('Project name is required');
    }

    if (name.length > config.limits.maxProjectNameLength) {
      throw new ValidationError(`Project name must be ${config.limits.maxProjectNameLength} characters or less`);
    }

    const project = await store.create('projects', {
      name: name.trim(),
      description: description.trim(),
      template,
      language,
      userId,
      fileCount: 0,
    });

    // Create project directory on disk
    const projectDir = path.join(config.storage.projectsDir, project.id);
    await fs.mkdir(projectDir, { recursive: true });

    // Create template files based on language
    await this._createTemplateFiles(projectDir, template, language);

    return project;
  }

  /**
   * Update a project
   * @param {string} projectId
   * @param {Object} updates
   * @param {string} userId
   * @returns {Promise<Object>}
   */
  async updateProject(projectId, updates, userId) {
    const project = await this.getProject(projectId, userId);

    const allowed = ['name', 'description', 'language'];
    const filtered = {};
    for (const key of allowed) {
      if (updates[key] !== undefined) {
        if (key === 'name' && updates[key].trim().length === 0) {
          throw new ValidationError('Project name cannot be empty');
        }
        filtered[key] = updates[key];
      }
    }

    const updated = await store.update('projects', projectId, filtered);
    return updated;
  }

  /**
   * Delete a project
   * @param {string} projectId
   * @param {string} userId
   * @returns {Promise<boolean>}
   */
  async deleteProject(projectId, userId) {
    const project = await this.getProject(projectId, userId);

    // Remove project directory
    const projectDir = path.join(config.storage.projectsDir, projectId);
    await fs.rm(projectDir, { recursive: true, force: true });

    // Remove from store
    await store.delete('projects', projectId);
    return true;
  }

  /**
   * Get project file tree
   * @param {string} projectId
   * @param {string} userId
   * @returns {Promise<Array>}
   */
  async getProjectFiles(projectId, userId) {
    const project = await this.getProject(projectId, userId);
    const projectDir = path.join(config.storage.projectsDir, projectId);

    const files = await this._walkDirectory(projectDir, projectDir);
    return files;
  }

  /**
   * Walk a directory and return file tree as flat list
   * @param {string} dir - Current directory
   * @param {string} baseDir - Base project directory
   * @returns {Promise<Array>}
   */
  async _walkDirectory(dir, baseDir) {
    const entries = [];
    const items = await fs.readdir(dir, { withFileTypes: true });

    for (const item of items.sort((a, b) => {
      // Folders first, then alphabetical
      if (a.isDirectory() !== b.isDirectory()) {
        return a.isDirectory() ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    })) {
      const fullPath = path.join(dir, item.name);
      const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, '/');

      if (item.isDirectory()) {
        entries.push({
          name: item.name,
          path: relativePath,
          type: 'folder',
          children: [],
        });

        const children = await this._walkDirectory(fullPath, baseDir);
        entries.push(...children);
      } else {
        entries.push({
          name: item.name,
          path: relativePath,
          type: 'file',
        });
      }
    }

    return entries;
  }

  /**
   * Create template files for new projects
   */
  async _createTemplateFiles(projectDir, template, language) {
    const templates = {
      empty: {},
      javascript: {
        'index.js': '// Welcome to PocketIDE!\n// Start coding here\n\nconsole.log("Hello, PocketIDE!");\n',
        'package.json': JSON.stringify({
          name: 'my-project',
          version: '1.0.0',
          main: 'index.js',
          scripts: { start: 'node index.js' },
        }, null, 2),
        'README.md': '# My Project\n\nCreated with PocketIDE 🚀\n',
      },
      typescript: {
        'index.ts': '// Welcome to PocketIDE!\n// Start coding here\n\nconst greeting: string = "Hello, PocketIDE!";\nconsole.log(greeting);\n',
        'tsconfig.json': JSON.stringify({
          compilerOptions: {
            target: 'ES2020',
            module: 'ESNext',
            moduleResolution: 'node',
            strict: true,
            esModuleInterop: true,
            outDir: './dist',
          },
        }, null, 2),
        'package.json': JSON.stringify({
          name: 'my-project',
          version: '1.0.0',
          scripts: {
            build: 'tsc',
            start: 'node dist/index.js',
          },
        }, null, 2),
        'README.md': '# My TypeScript Project\n\nCreated with PocketIDE 🚀\n',
      },
      python: {
        'main.py': '# Welcome to PocketIDE!\n# Start coding here\n\ndef main():\n    print("Hello, PocketIDE!")\n\nif __name__ == "__main__":\n    main()\n',
        'README.md': '# My Python Project\n\nCreated with PocketIDE 🚀\n',
      },
      html: {
        'index.html': '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>My Project</title>\n  <link rel="stylesheet" href="styles.css">\n</head>\n<body>\n  <h1>Hello, PocketIDE!</h1>\n  <script src="script.js"></script>\n</body>\n</html>\n',
        'styles.css': 'body {\n  font-family: -apple-system, BlinkMacSystemFont, sans-serif;\n  margin: 0;\n  padding: 2rem;\n  background: #1e1e1e;\n  color: #cccccc;\n}\n\nh1 {\n  color: #007acc;\n}\n',
        'script.js': '// Welcome to PocketIDE!\nconsole.log("Hello, PocketIDE!");\n',
        'README.md': '# My HTML Project\n\nCreated with PocketIDE 🚀\n',
      },
      node: {
        'index.js': 'const http = require(\'http\');\n\nconst hostname = \'127.0.0.1\';\nconst port = 3000;\n\nconst server = http.createServer((req, res) => {\n  res.statusCode = 200;\n  res.setHeader(\'Content-Type\', \'text/plain\');\n  res.end(\'Hello, PocketIDE!\\n\');\n});\n\nserver.listen(port, hostname, () => {\n  console.log(`Server running at http://${hostname}:${port}/`);\n});\n',
        'package.json': JSON.stringify({
          name: 'my-project',
          version: '1.0.0',
          main: 'index.js',
          scripts: { start: 'node index.js' },
        }, null, 2),
        'README.md': '# Node.js Project\n\nCreated with PocketIDE 🚀\n',
      },
    };

    const selectedTemplate = templates[template] || templates[language] || templates.empty;

    for (const [filename, content] of Object.entries(selectedTemplate)) {
      const filePath = path.join(projectDir, filename);
      await fs.writeFile(filePath, content, 'utf-8');
    }
  }
}

const projectService = new ProjectService();
export { projectService, ProjectService };
export default projectService;
