/**
 * Seed script - creates demo data for development
 * Run with: node src/seed.js
 */

import bcrypt from 'bcryptjs';
import store from './storage/store.js';
import config from './config.js';
import projectService from './services/project-service.js';

async function seed() {
  console.log('🌱 Seeding PocketIDE database...\n');

  await store.init();

  // === Create demo user ===
  const existingUser = await store.findOne('users', { email: 'demo@pocketide.dev' });
  let userId;

  if (existingUser) {
    console.log('📝 Demo user already exists, updating...');
    userId = existingUser.id;
  } else {
    const hashedPassword = await bcrypt.hash('demo1234', config.auth.saltRounds);
    const user = await store.create('users', {
      username: 'demouser',
      email: 'demo@pocketide.dev',
      password: hashedPassword,
    });
    userId = user.id;
    console.log(`✅ Created demo user: demouser / demo@pocketide.dev / demo1234`);
  }

  // === Create demo projects ===

  // JavaScript project
  const jsProject = await store.findOne('projects', { userId, name: 'My JavaScript App' });
  if (!jsProject) {
    const project = await projectService.createProject({
      name: 'My JavaScript App',
      description: 'A simple JavaScript project to get started',
      template: 'javascript',
      language: 'javascript',
    }, userId);
    console.log(`✅ Created project: My JavaScript App (${project.id})`);
  }

  // HTML/CSS project
  const htmlProject = await store.findOne('projects', { userId, name: 'Landing Page' });
  if (!htmlProject) {
    const project = await projectService.createProject({
      name: 'Landing Page',
      description: 'A landing page built with HTML, CSS, and JavaScript',
      template: 'html',
      language: 'html',
    }, userId);
    console.log(`✅ Created project: Landing Page (${project.id})`);
  }

  // Python project
  const pyProject = await store.findOne('projects', { userId, name: 'Python Scripts' });
  if (!pyProject) {
    const project = await projectService.createProject({
      name: 'Python Scripts',
      description: 'Collection of Python utility scripts',
      template: 'python',
      language: 'python',
    }, userId);
    console.log(`✅ Created project: Python Scripts (${project.id})`);
  }

  // TypeScript project
  const tsProject = await store.findOne('projects', { userId, name: 'TypeScript API' });
  if (!tsProject) {
    const project = await projectService.createProject({
      name: 'TypeScript API',
      description: 'A TypeScript API server example',
      template: 'typescript',
      language: 'typescript',
    }, userId);
    console.log(`✅ Created project: TypeScript API (${project.id})`);
  }

  // Node.js project
  const nodeProject = await store.findOne('projects', { userId, name: 'Node.js Server' });
  if (!nodeProject) {
    const project = await projectService.createProject({
      name: 'Node.js Server',
      description: 'A Node.js HTTP server example',
      template: 'node',
      language: 'javascript',
    }, userId);
    console.log(`✅ Created project: Node.js Server (${project.id})`);
  }

  console.log('\n🌱 Seeding complete!');
  console.log('\n📋 Login credentials:');
  console.log('   Email:    demo@pocketide.dev');
  console.log('   Password: demo1234');
}

seed().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
