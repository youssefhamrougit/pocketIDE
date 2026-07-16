/**
 * JWT Authentication middleware
 */

import jwt from 'jsonwebtoken';
import config from '../config.js';
import store from '../storage/store.js';
import { UnauthorizedError } from './errors.js';

/**
 * Extract token from Authorization header
 */
function extractToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.split(' ')[1];
}

/**
 * Authenticate request - required auth
 */
export async function authenticate(req, res, next) {
  try {
    const token = extractToken(req);
    if (!token) {
      throw new UnauthorizedError('No authentication token provided');
    }

    const decoded = jwt.verify(token, config.jwt.secret);
    const user = await store.findById('users', decoded.userId);

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
    };

    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return next(new UnauthorizedError('Invalid or expired token'));
    }
    next(err);
  }
}

/**
 * Optional auth - doesn't fail if no token
 */
export async function optionalAuth(req, res, next) {
  try {
    const token = extractToken(req);
    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, config.jwt.secret);
    const user = await store.findById('users', decoded.userId);

    if (user) {
      req.user = {
        id: user.id,
        username: user.username,
        email: user.email,
      };
    }

    next();
  } catch {
    // Silently continue without auth
    next();
  }
}

/**
 * Generate a JWT token
 */
export function generateToken(userId) {
  return jwt.sign({ userId }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
}
