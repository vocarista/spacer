/**
 * Security middleware
 * Provides CSRF protection, rate limiting, and other security measures
 */

const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
require('dotenv').config();

/**
 * Enhanced rate limiting for sensitive endpoints
 */
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later',
    errorCode: 'AUTH_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false
});

/**
 * Rate limiting for general API endpoints
 */
const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests, please try again later',
    errorCode: 'API_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Rate limiting for creation endpoints
 */
const createRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 requests per windowMs
  message: {
    success: false,
    error: 'Too many creation attempts, please try again later',
    errorCode: 'CREATE_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * CSRF protection middleware (simplified version)
 * Since we're using session-based authentication, we'll implement basic CSRF protection
 */
function csrfProtection(req, res, next) {
  // Skip CSRF for GET, HEAD, OPTIONS requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Skip CSRF for API endpoints that will be protected by session authentication
  if (req.path.startsWith('/api/')) {
    return next();
  }

  // For other POST/PUT/DELETE requests, check Origin header
  const origin = req.get('Origin');
  const host = req.get('Host');

  if (process.env.NODE_ENV === 'production' && origin) {
    const allowedOrigins = [
      `https://${host}`,
      `https://www.${host}`
    ];

    if (!allowedOrigins.includes(origin)) {
      return res.status(403).json({
        success: false,
        error: 'CSRF protection: Origin not allowed',
        errorCode: 'CSRF_ERROR'
      });
    }
  }

  next();
}

/**
 * Security headers middleware
 */
function securityHeaders(req, res, next) {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Content Security Policy (basic)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Content-Security-Policy', 
      "default-src 'self'; " +
      "script-src 'self'; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: https:; " +
      "font-src 'self'; " +
      "connect-src 'self'; " +
      "frame-ancestors 'none';"
    );
  }

  next();
}

/**
 * Input sanitization middleware
 */
function inputSanitization(req, res, next) {
  // Basic XSS prevention by removing potential script tags
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    return str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  };

  const sanitizeObject = (obj) => {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key] = sanitizeString(value);
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map(item => 
          typeof item === 'string' ? sanitizeString(item) : sanitizeObject(item)
        );
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  };

  // Sanitize request body
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize query parameters
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  next();
}

/**
 * Request ID middleware
 */
function requestId(req, res, next) {
  req.id = Math.random().toString(36).substring(2, 15);
  res.setHeader('X-Request-ID', req.id);
  next();
}

/**
 * IP whitelist middleware (optional, for admin endpoints)
 */
function ipWhitelist(allowedIPs = []) {
  return (req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
    
    if (allowedIPs.length > 0 && !allowedIPs.includes(clientIP)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied from this IP address',
        errorCode: 'IP_NOT_ALLOWED'
      });
    }
    
    next();
  };
}

module.exports = {
  // Rate limiting
  authRateLimit,
  apiRateLimit,
  createRateLimit,
  
  // CSRF and security headers
  csrfProtection,
  securityHeaders,
  
  // Input sanitization
  inputSanitization,
  
  // Request tracking
  requestId,
  
  // IP whitelist
  ipWhitelist
};
