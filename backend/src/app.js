/**
 * Basic API structure and routing
 * Main Express application setup with middleware and routes
 */

const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
require('dotenv').config();

// Import middleware
const { corsMiddleware } = require('./middleware/cors');
const { sessionConfig, addUserToRequest } = require('./middleware/session');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth');
const topicRoutes = require('./routes/topics');
// const reviewRoutes = require('./routes/reviews');
// const calendarRoutes = require('./routes/calendar');
// const notificationRoutes = require('./routes/notifications');
// const dashboardRoutes = require('./routes/dashboard');

/**
 * Create Express application
 */
function createApp() {
  const app = express();

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
  }));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
    message: {
      success: false,
      error: 'Too many requests from this IP, please try again later',
      errorCode: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(limiter);

  // CORS
  app.use(corsMiddleware);

  // Request logging
  if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
  } else {
    app.use(morgan('combined'));
  }

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Session management
  app.use(sessionConfig);

  // Add user information to requests
  app.use(addUserToRequest);

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    });
  });

  // API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/topics', topicRoutes);

  app.use('/api/reviews', (req, res, next) => {
    // Placeholder until review routes are implemented
    res.json({
      success: true,
      message: 'Review routes will be implemented in T043'
    });
  });

  app.use('/api/calendar', (req, res, next) => {
    // Placeholder until calendar routes are implemented
    res.json({
      success: true,
      message: 'Calendar routes will be implemented in T053'
    });
  });

  app.use('/api/notifications', (req, res, next) => {
    // Placeholder until notification routes are implemented
    res.json({
      success: true,
      message: 'Notification routes will be implemented in T063'
    });
  });

  app.use('/api/dashboard', (req, res, next) => {
    // Placeholder until dashboard routes are implemented
    res.json({
      success: true,
      message: 'Dashboard routes will be implemented in T045'
    });
  });

  // API documentation endpoint
  app.get('/api', (req, res) => {
    res.json({
      success: true,
      message: 'Spacer API',
      version: '1.0.0',
      endpoints: {
        auth: '/api/auth',
        topics: '/api/topics',
        reviews: '/api/reviews',
        calendar: '/api/calendar',
        notifications: '/api/notifications',
        dashboard: '/api/dashboard',
        health: '/health'
      },
      documentation: 'https://github.com/spacer/docs'
    });
  });

  // Root endpoint
  app.get('/', (req, res) => {
    res.json({
      success: true,
      message: 'Spacer Backend API',
      version: '1.0.0',
      status: 'running'
    });
  });

  // 404 handler
  app.use(notFoundHandler);

  // Error handler
  app.use(errorHandler);

  return app;
}

// Create and export app
const app = createApp();

// Start server if run directly
if (require.main === module) {
  const PORT = process.env.PORT || 5001;
  
  app.listen(PORT, () => {
    console.log(`🚀 Spacer Backend API running on port ${PORT}`);
    console.log(`📖 API Documentation: http://localhost:${PORT}/api`);
    console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

module.exports = app;
