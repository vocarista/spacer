/**
 * CORS configuration for Next.js frontend
 * Configures cross-origin resource sharing for the API
 */

const cors = require('cors');
require('dotenv').config();

/**
 * CORS options for development and production
 */
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);

    // Allowed origins
    const allowedOrigins = [
      process.env.CORS_ORIGIN || 'http://localhost:3000',
      'http://localhost:3000',
      'http://127.0.0.1:3000'
    ];

    // In development, allow all origins
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }

    // In production, check against allowed origins
    if (process.env.NODE_ENV === 'production' && allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Origin not allowed
    const error = new Error('Not allowed by CORS');
    error.status = 403;
    callback(error);
  },
  
  credentials: true, // Allow cookies for session management
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control'
  ],
  exposedHeaders: ['X-Total-Count'],
  maxAge: 86400 // 24 hours
};

/**
 * Custom CORS middleware with additional security headers
 */
function corsMiddleware(req, res, next) {
  // Apply CORS
  cors(corsOptions)(req, res, (err) => {
    if (err) {
      return next(err);
    }

    // Additional security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    next();
  });
}

module.exports = {
  corsMiddleware,
  corsOptions
};
