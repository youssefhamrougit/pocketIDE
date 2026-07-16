/**
 * Project routes
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import projectService from '../services/project-service.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/projects
 * List all projects for the current user
 */
router.get('/', async (req, res, next) => {
  try {
    const projects = await projectService.listProjects(req.user.id);
    res.json({ projects });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/projects/:id
 * Get a single project
 */
router.get('/:id', async (req, res, next) => {
  try {
    const project = await projectService.getProject(req.params.id, req.user.id);
    const files = await projectService.getProjectFiles(req.params.id, req.user.id);
    res.json({ project, files });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/projects
 * Create a new project
 */
router.post('/', async (req, res, next) => {
  try {
    const project = await projectService.createProject(req.body, req.user.id);
    res.status(201).json({ project });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/projects/:id
 * Update a project
 */
router.put('/:id', async (req, res, next) => {
  try {
    const project = await projectService.updateProject(req.params.id, req.body, req.user.id);
    res.json({ project });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/projects/:id
 * Delete a project
 */
router.delete('/:id', async (req, res, next) => {
  try {
    await projectService.deleteProject(req.params.id, req.user.id);
    res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/projects/:id/files
 * Get project file tree
 */
router.get('/:id/files', async (req, res, next) => {
  try {
    const files = await projectService.getProjectFiles(req.params.id, req.user.id);
    res.json({ files });
  } catch (err) {
    next(err);
  }
});

export { router };
export default router;
