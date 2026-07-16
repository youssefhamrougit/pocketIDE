/**
 * File management routes
 * Express 5 compatible - uses :path(.*) instead of bare * wildcards
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import fileService from '../services/file-service.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/projects/:projectId/files?path=...
 * Read a file's content (uses query param for file path to avoid route pattern issues)
 */
router.get('/projects/:projectId/files', async (req, res, next) => {
  try {
    const projectId = req.params.projectId;
    const filePath = req.query.path || '';

    if (!filePath) {
      // List files in project
      const files = await fileService.listFiles(projectId, req.user.id);
      return res.json({ files });
    }

    const result = await fileService.readFile(projectId, filePath, req.user.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/projects/:projectId/files
 * Write content to a file (uses query param for file path)
 */
router.put('/projects/:projectId/files', async (req, res, next) => {
  try {
    const projectId = req.params.projectId;
    const filePath = req.query.path || '';
    const { content } = req.body;

    if (!filePath) {
      return res.status(400).json({ error: { message: 'File path is required (use ?path=...)' } });
    }

    const result = await fileService.writeFile(projectId, filePath, content || '', req.user.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/projects/:projectId/files
 * Create a new file or directory (uses query param for path)
 */
router.post('/projects/:projectId/files', async (req, res, next) => {
  try {
    const projectId = req.params.projectId;
    const filePath = req.query.path || '';
    const { type, content } = req.body;

    if (!filePath) {
      return res.status(400).json({ error: { message: 'Path is required (use ?path=...)' } });
    }

    let result;
    if (type === 'folder') {
      result = await fileService.createDirectory(projectId, filePath, req.user.id);
    } else {
      result = await fileService.createFile(projectId, filePath, req.user.id, content);
    }

    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/projects/:projectId/files
 * Rename a file or directory (uses query param for source path)
 */
router.patch('/projects/:projectId/files', async (req, res, next) => {
  try {
    const projectId = req.params.projectId;
    const oldPath = req.query.path || '';
    const { newPath } = req.body;

    if (!oldPath || !newPath) {
      return res.status(400).json({ error: { message: 'Current path (query ?path=...) and new path (body newPath) are required' } });
    }

    const result = await fileService.rename(projectId, oldPath, newPath, req.user.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/projects/:projectId/files
 * Delete a file or directory (uses query param for path)
 */
router.delete('/projects/:projectId/files', async (req, res, next) => {
  try {
    const projectId = req.params.projectId;
    const filePath = req.query.path || '';

    if (!filePath) {
      return res.status(400).json({ error: { message: 'File path is required (use ?path=...)' } });
    }

    const result = await fileService.delete(projectId, filePath, req.user.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export { router };
export default router;
