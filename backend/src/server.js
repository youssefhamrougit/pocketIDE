/**
 * PocketIDE Backend API Server
 * Express.js server with project management, file operations, and authentication
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import config from './config.js';
import store from './storage/store.js';
import { errorHandler, notFoundHandler } from './middleware/errors.js';
import authRoutes from './routes/auth.js';
import projectRoutes from './routes/projects.js';
import fileRoutes from './routes/files.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();

// ============================================================
// Middleware
// ============================================================

// Security headers
app.use(helmet({
  contentSecurityPolicy: false, // Disabled for development
  crossOriginEmbedderPolicy: false,
}));

// CORS
app.use(cors({
  origin: config.cors.origin,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Request logging
if (config.isDev) {
  app.use(morgan('dev'));
}

// Body parsing
app.use(express.json({
  limit: '5mb',
  verify: (req, _res, buf) => {
    req.rawBody = buf.toString();
  },
}));

app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// ============================================================
// API Routes
// ============================================================

const api = express.Router();

// Health check
api.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Auth routes
api.use('/auth', authRoutes);

// Project routes
api.use('/projects', projectRoutes);

// File routes (nested under /api)
api.use('/', fileRoutes);

// Mount API
app.use('/api', api);

// ============================================================
// Serve Editor Static Files
// ============================================================

app.use('/editor', express.static(join(__dirname, '..', '..', 'editor', 'dist')));

// Serve editor index.html for the /editor route
app.get('/editor', (req, res) => {
  res.sendFile(join(__dirname, '..', '..', 'editor', 'dist', 'index.html'));
});

// ============================================================
// Error Handling
// ============================================================

app.use(notFoundHandler);
app.use(errorHandler);

// ============================================================
// Start Server
// ============================================================

async function start() {
  try {
    // Initialize data store
    await store.init();

    app.listen(config.port, config.host, () => {
      console.log(`
╔══════════════════════════════════════════════╗
║           PocketIDE Backend Server           ║
╠══════════════════════════════════════════════╣
║  Server:   http://${config.host === '0.0.0.0' ? 'localhost' : config.host}:${config.port}      ║
║  API:      http://localhost:${config.port}/api      ║
║  Editor:   http://localhost:${config.port}/editor   ║
║  Health:   http://localhost:${config.port}/api/health║
║  Mode:     ${config.isDev ? 'Development' : 'Production'}                       ║
╚══════════════════════════════════════════════╝
      `);
    });
  } catch (err) {
    console.error('[Server] Failed to start:', err);
    process.exit(1);
  }
}

start();

export { app };
export default app;
