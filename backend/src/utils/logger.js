/**
 * Logging and monitoring utilities
 * Provides structured logging and application monitoring
 */

const morgan = require('morgan');
const fs = require('fs');
const path = require('path');

/**
 * Custom Morgan token for user ID
 */
morgan.token('user', (req) => {
  return req.user ? req.user.id : 'anonymous';
});

/**
 * Custom Morgan token for request ID
 */
morgan.token('requestId', (req) => {
  return req.id || 'N/A';
});

/**
 * Development log format
 */
const developmentFormat = ':method :url :status :response-time ms - :user@:requestId';

/**
 * Production log format (JSON)
 */
const productionFormat = JSON.stringify({
  method: ':method',
  url: ':url',
  status: ':status',
  responseTime: ':response-time',
  userAgent: ':user-agent',
  ip: ':remote-addr',
  user: ':user',
  requestId: ':requestId',
  timestamp: ':date[iso]'
});

/**
 * Create Morgan middleware with appropriate format
 */
function createLogger() {
  if (process.env.NODE_ENV === 'production') {
    // Create logs directory if it doesn't exist
    const logsDir = path.join(__dirname, '../../logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    // Write logs to file
    const accessLogStream = fs.createWriteStream(
      path.join(logsDir, 'access.log'),
      { flags: 'a' }
    );

    return morgan(productionFormat, { stream: accessLogStream });
  } else {
    return morgan(developmentFormat);
  }
}

/**
 * Application logger
 */
class Logger {
  constructor() {
    this.level = process.env.LOG_LEVEL || 'info';
  }

  /**
   * Log info message
   */
  info(message, meta = {}) {
    this.log('info', message, meta);
  }

  /**
   * Log warning message
   */
  warn(message, meta = {}) {
    this.log('warn', message, meta);
  }

  /**
   * Log error message
   */
  error(message, meta = {}) {
    this.log('error', message, meta);
  }

  /**
   * Log debug message
   */
  debug(message, meta = {}) {
    if (this.level === 'debug') {
      this.log('debug', message, meta);
    }
  }

  /**
   * Internal log method
   */
  log(level, message, meta) {
    const logEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...meta
    };

    if (process.env.NODE_ENV === 'production') {
      console.log(JSON.stringify(logEntry));
    } else {
      console.log(`[${logEntry.timestamp}] ${level.toUpperCase()}: ${message}`, meta);
    }
  }

  /**
   * Log user action
   */
  logUserAction(userId, action, details = {}) {
    this.info(`User action: ${action}`, {
      userId,
      action,
      ...details
    });
  }

  /**
   * Log API request
   */
  logApiRequest(req, res, responseTime) {
    this.info('API request', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      responseTime: `${responseTime}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      userId: req.user?.id || 'anonymous'
    });
  }

  /**
   * Log database query
   */
  logDatabaseQuery(query, params, duration) {
    if (this.level === 'debug') {
      this.debug('Database query', {
        query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
        paramCount: params?.length || 0,
        duration: `${duration}ms`
      });
    }
  }

  /**
   * Log security event
   */
  logSecurityEvent(event, details = {}) {
    this.warn(`Security event: ${event}`, {
      event,
      ...details
    });
  }
}

/**
 * Performance monitoring
 */
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      requests: 0,
      errors: 0,
      responseTime: [],
      memoryUsage: []
    };
  }

  /**
   * Record request
   */
  recordRequest(responseTime) {
    this.metrics.requests++;
    this.metrics.responseTime.push(responseTime);
    
    // Keep only last 1000 response times
    if (this.metrics.responseTime.length > 1000) {
      this.metrics.responseTime = this.metrics.responseTime.slice(-1000);
    }
  }

  /**
   * Record error
   */
  recordError() {
    this.metrics.errors++;
  }

  /**
   * Record memory usage
   */
  recordMemoryUsage() {
    const usage = process.memoryUsage();
    this.metrics.memoryUsage.push({
      timestamp: Date.now(),
      rss: usage.rss,
      heapUsed: usage.heapUsed,
      heapTotal: usage.heapTotal
    });

    // Keep only last 100 entries
    if (this.metrics.memoryUsage.length > 100) {
      this.metrics.memoryUsage = this.metrics.memoryUsage.slice(-100);
    }
  }

  /**
   * Get metrics summary
   */
  getMetrics() {
    const responseTimes = this.metrics.responseTime;
    const avgResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
      : 0;

    const lastMemory = this.metrics.memoryUsage[this.metrics.memoryUsage.length - 1];

    return {
      requests: this.metrics.requests,
      errors: this.metrics.errors,
      errorRate: this.metrics.requests > 0 ? (this.metrics.errors / this.metrics.requests) * 100 : 0,
      avgResponseTime: Math.round(avgResponseTime),
      memoryUsage: lastMemory,
      uptime: process.uptime()
    };
  }
}

// Create instances
const logger = new Logger();
const performanceMonitor = new PerformanceMonitor();

// Start memory monitoring
setInterval(() => {
  performanceMonitor.recordMemoryUsage();
}, 60000); // Every minute

module.exports = {
  createLogger,
  logger,
  performanceMonitor
};
