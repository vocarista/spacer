/**
 * Session management middleware configuration
 * Configures express-session with SQLite store for multi-user support
 */

const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
require('dotenv').config();

/**
 * Session middleware configuration
 * Provides secure session management for multi-user authentication
 */
const sessionConfig = session({
  store: new SQLiteStore({
    db: 'sessions.db',
    dir: './data',
    table: 'sessions'
  }),
  secret: process.env.SESSION_SECRET || 'change-this-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  },
  name: 'spacer.sid', // Custom session name
  rolling: true, // Reset cookie expiration on every request
  unset: 'destroy' // Destroy session on logout
});

/**
 * Middleware to ensure user is authenticated
 * Redirects to login if user is not authenticated
 */
function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      errorCode: 'AUTHENTICATION_REQUIRED'
    });
  }
  next();
}

/**
 * Middleware to add user information to request
 * Makes user data available throughout the application
 */
function addUserToRequest(req, res, next) {
  if (req.session && req.session.userId) {
    req.user = {
      id: req.session.userId,
      email: req.session.userEmail
    };
  }
  next();
}

/**
 * Middleware to destroy session on logout
 */
function logout(req, res, next) {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
      return res.status(500).json({
        success: false,
        error: 'Error during logout',
        errorCode: 'LOGOUT_ERROR'
      });
    }
    res.clearCookie('spacer.sid');
    next();
  });
}

module.exports = {
  sessionConfig,
  requireAuth,
  addUserToRequest,
  logout
};
