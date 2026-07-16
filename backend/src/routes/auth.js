/**
 * Authentication routes
 */

import { Router } from 'express';
import bcrypt from 'bcryptjs';
import store from '../storage/store.js';
import config from '../config.js';
import { generateToken, authenticate } from '../middleware/auth.js';
import { ValidationError, UnauthorizedError } from '../middleware/errors.js';

const router = Router();

/**
 * POST /api/auth/register
 * Create a new user account
 */
router.post('/register', async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    // Validate input
    if (!username || !email || !password) {
      throw new ValidationError('Username, email, and password are required');
    }

    if (username.length < 3 || username.length > 30) {
      throw new ValidationError('Username must be between 3 and 30 characters');
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new ValidationError('Invalid email format');
    }

    if (password.length < 6) {
      throw new ValidationError('Password must be at least 6 characters');
    }

    // Check if user exists
    const existingUser = await store.findOne('users', { email });
    if (existingUser) {
      throw new ValidationError('Email already registered');
    }

    const existingUsername = await store.findOne('users', { username });
    if (existingUsername) {
      throw new ValidationError('Username already taken');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, config.auth.saltRounds);

    // Create user
    const user = await store.create('users', {
      username,
      email: email.toLowerCase(),
      password: hashedPassword,
      createdAt: new Date().toISOString(),
    });

    // Generate token
    const token = generateToken(user.id);

    res.status(201).json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
      },
      token,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/login
 * Authenticate and get token
 */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ValidationError('Email and password are required');
    }

    // Find user
    const user = await store.findOne('users', { email: email.toLowerCase() });
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Generate token
    const token = generateToken(user.id);

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
      },
      token,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await store.findById('users', req.user.id);
    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
});

export { router };
export default router;
