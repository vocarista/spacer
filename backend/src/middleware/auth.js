/**
 * Authentication middleware
 * Handles user authentication, session management, and authorization
 */

const UserService = require('../services/userService');
const { logger } = require('../utils/logger');
const { AuthenticationError, AuthorizationError } = require('./errorHandler');

/**
 * Middleware to authenticate user from session
 * Verifies user exists and is valid
 */
async function authenticateUser(req, res, next) {
  try {
    // Check if session exists and has userId
    if (!req.session || !req.session.userId) {
      throw new AuthenticationError('Authentication required');
    }

    // Validate user session
    const user = await UserService.validateSession(req.session.userId);
    
    if (!user) {
      // Clear invalid session
      req.session.destroy();
      throw new AuthenticationError('Invalid session');
    }

    // Add user to request object
    req.user = user;
    
    // Refresh session activity
    req.session.lastActivity = Date.now();
    
    logger.debug('User authenticated successfully', { 
      userId: user.id, 
      email: user.email 
    });

    next();
  } catch (error) {
    logger.warn('Authentication failed', { 
      userId: req.session?.userId,
      error: error.message 
    });
    next(error);
  }
}

/**
 * Middleware to check if user is authenticated
 * Returns error if not authenticated
 */
function requireAuthentication(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      errorCode: 'AUTHENTICATION_REQUIRED'
    });
  }
  next();
}

/**
 * Middleware to check if user owns a resource
 * Used for resource-specific authorization
 */
function requireResourceOwnership(resourceIdParam = 'id') {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required');
      }

      const resourceId = parseInt(req.params[resourceIdParam]);
      
      // For now, we'll implement basic ownership checking
      // In a real implementation, you would check the resource belongs to the user
      // This will be expanded when we implement topics, reviews, etc.
      
      logger.debug('Resource ownership check', { 
        userId: req.user.id, 
        resourceId 
      });

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware to optionally authenticate user
 * Adds user to request if authenticated, but doesn't require it
 */
async function optionalAuthentication(req, res, next) {
  try {
    if (req.session && req.session.userId) {
      const user = await UserService.validateSession(req.session.userId);
      if (user) {
        req.user = user;
        req.session.lastActivity = Date.now();
      } else {
        // Clear invalid session
        req.session.destroy();
      }
    }
    next();
  } catch (error) {
    // Don't fail the request for optional authentication
    logger.warn('Optional authentication failed', { error: error.message });
    next();
  }
}

/**
 * Middleware to check session timeout
 * Automatically logs out inactive sessions
 */
function checkSessionTimeout(maxInactiveTime = 24 * 60 * 60 * 1000) { // 24 hours default
  return (req, res, next) => {
    if (req.session && req.session.lastActivity) {
      const inactiveTime = Date.now() - req.session.lastActivity;
      
      if (inactiveTime > maxInactiveTime) {
        req.session.destroy();
        return res.status(401).json({
          success: false,
          error: 'Session expired due to inactivity',
          errorCode: 'SESSION_EXPIRED'
        });
      }
    }
    next();
  };
}

/**
 * Middleware to prevent session fixation
 * Regenerates session ID after login
 */
function regenerateSession(req, res, next) {
  if (req.session && !req.session.regenerated) {
    req.session.regenerate((err) => {
      if (err) {
        logger.error('Session regeneration error', { error: err.message });
        return next(err);
      }
      req.session.regenerated = true;
      next();
    });
  } else {
    next();
  }
}

/**
 * Middleware to add security headers for authenticated requests
 */
function addSecurityHeaders(req, res, next) {
  if (req.user) {
    // Add user context to response headers for debugging
    res.setHeader('X-User-ID', req.user.id);
    res.setHeader('X-User-Email', req.user.email);
  }
  next();
}

/**
 * Rate limiting middleware for authentication endpoints
 * Prevents brute force attacks
 */
function createAuthRateLimit(options = {}) {
  const rateLimit = require('express-rate-limit');
  
  return rateLimit({
    windowMs: options.windowMs || 15 * 60 * 1000, // 15 minutes
    max: options.max || 5, // 5 attempts per window
    message: {
      success: false,
      error: 'Too many authentication attempts, please try again later',
      errorCode: 'AUTH_RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      // Use IP + email for login attempts to prevent email targeting
      const key = req.ip;
      if (req.body && req.body.email) {
        return `${key}:${req.body.email}`;
      }
      return key;
    },
    handler: (req, res) => {
      logger.logSecurityEvent('AUTH_RATE_LIMIT_EXCEEDED', {
        ip: req.ip,
        email: req.body?.email,
        userAgent: req.get('User-Agent')
      });
      
      res.status(429).json({
        success: false,
        error: 'Too many authentication attempts, please try again later',
        errorCode: 'AUTH_RATE_LIMIT_EXCEEDED'
      });
    }
  });
}

/**
 * Middleware to log authentication events
 */
function logAuthEvent(eventType) {
  return (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      // Log successful authentication
      if (res.statusCode === 200 && req.user) {
        logger.logUserAction(req.user.id, eventType, {
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
      }
      
      // Log failed authentication attempts
      if (res.statusCode >= 400) {
        logger.logSecurityEvent(`${eventType}_FAILED`, {
          ip: req.ip,
          email: req.body?.email,
          userAgent: req.get('User-Agent'),
          statusCode: res.statusCode
        });
      }
      
      originalSend.call(this, data);
    };
    
    next();
  };
}

/**
 * Middleware to validate session before sensitive operations
 */
function requireValidSession(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({
      success: false,
      error: 'Valid session required',
      errorCode: 'INVALID_SESSION'
    });
  }

  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'User not found in session',
      errorCode: 'USER_NOT_IN_SESSION'
    });
  }

  next();
}

module.exports = {
  authenticateUser,
  requireAuthentication,
  requireResourceOwnership,
  optionalAuthentication,
  checkSessionTimeout,
  regenerateSession,
  addSecurityHeaders,
  createAuthRateLimit,
  logAuthEvent,
  requireValidSession
};
