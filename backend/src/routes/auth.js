/**
 * Authentication routes
 * Handles user registration, login, logout, and profile management
 */

const express = require('express');
const UserService = require('../services/userService');
const { validate, schemas } = require('../utils/validators');
const { 
  authenticateUser, 
  requireAuthentication, 
  regenerateSession,
  createAuthRateLimit,
  logAuthEvent,
  requireValidSession
} = require('../middleware/auth');
const { logout } = require('../middleware/session');
const { asyncHandler } = require('../middleware/errorHandler');
const { logger } = require('../utils/logger');

const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', 
  createAuthRateLimit({ max: 3, windowMs: 15 * 60 * 1000 }), // 3 attempts per 15 minutes
  validate(schemas.registerSchema),
  logAuthEvent('USER_REGISTER'),
  asyncHandler(async (req, res) => {
    const { email, password, timezone, notificationEnabled, notificationTime } = req.body;

    const user = await UserService.register({
      email,
      password,
      timezone,
      notificationEnabled,
      notificationTime
    });

    // Set session after successful registration
    req.session.userId = user.id;
    req.session.userEmail = user.email;
    req.session.regenerated = true;

    logger.logUserAction(user.id, 'USER_REGISTERED_SESSION_CREATED');

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        timezone: user.timezone,
        notificationEnabled: user.notification_enabled,
        notificationTime: user.notification_time,
        createdAt: user.created_at
      }
    });
  })
);

/**
 * POST /api/auth/login
 * Authenticate user and create session
 */
router.post('/login',
  createAuthRateLimit({ max: 5, windowMs: 15 * 60 * 1000 }), // 5 attempts per 15 minutes
  validate(schemas.loginSchema),
  regenerateSession,
  logAuthEvent('USER_LOGIN'),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await UserService.login(email, password);

    // Set session
    req.session.userId = user.id;
    req.session.userEmail = user.email;
    req.session.createdAt = Date.now();
    req.session.lastActivity = Date.now();

    logger.logUserAction(user.id, 'USER_LOGIN_SESSION_CREATED');

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        timezone: user.timezone,
        notificationEnabled: user.notification_enabled,
        notificationTime: user.notification_time,
        createdAt: user.created_at
      }
    });
  })
);

/**
 * POST /api/auth/logout
 * End user session
 */
router.post('/logout',
  requireAuthentication,
  logAuthEvent('USER_LOGOUT'),
  logout,
  asyncHandler(async (req, res) => {
    logger.logUserAction(req.user.id, 'USER_LOGOUT_SESSION_DESTROYED');

    res.json({
      success: true,
      message: 'Logout successful'
    });
  })
);

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get('/me',
  authenticateUser,
  requireAuthentication,
  asyncHandler(async (req, res) => {
    const userProfile = await UserService.getProfile(req.user.id);

    res.json({
      success: true,
      user: userProfile
    });
  })
);

/**
 * PUT /api/auth/profile
 * Update user profile
 */
router.put('/profile',
  authenticateUser,
  requireAuthentication,
  validate(schemas.updateProfileSchema),
  logAuthEvent('USER_PROFILE_UPDATE'),
  asyncHandler(async (req, res) => {
    const { timezone, notificationEnabled, notificationTime } = req.body;

    const updatedUser = await UserService.updateProfile(req.user.id, {
      timezone,
      notificationEnabled,
      notificationTime
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    });
  })
);

/**
 * PUT /api/auth/password
 * Change user password
 */
router.put('/password',
  authenticateUser,
  requireAuthentication,
  validate(schemas.registerSchema.partial({})), // Re-use register schema for password validation
  logAuthEvent('USER_PASSWORD_CHANGE'),
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current password and new password are required',
        errorCode: 'VALIDATION_ERROR'
      });
    }

    await UserService.changePassword(req.user.id, currentPassword, newPassword);

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  })
);

/**
 * DELETE /api/auth/account
 * Delete user account
 */
router.delete('/account',
  authenticateUser,
  requireAuthentication,
  logAuthEvent('USER_ACCOUNT_DELETE'),
  asyncHandler(async (req, res) => {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        error: 'Password is required to delete account',
        errorCode: 'VALIDATION_ERROR'
      });
    }

    await UserService.deleteAccount(req.user.id, password);

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  })
);

/**
 * GET /api/auth/statistics
 * Get user statistics
 */
router.get('/statistics',
  authenticateUser,
  requireAuthentication,
  asyncHandler(async (req, res) => {
    const statistics = await UserService.getUserStatistics(req.user.id);

    res.json({
      success: true,
      statistics
    });
  })
);

/**
 * PUT /api/auth/notifications
 * Update notification preferences
 */
router.put('/notifications',
  authenticateUser,
  requireAuthentication,
  logAuthEvent('USER_NOTIFICATION_PREFERENCES_UPDATE'),
  asyncHandler(async (req, res) => {
    const { notificationEnabled, notificationTime } = req.body;

    const updatedUser = await UserService.updateNotificationPreferences(
      req.user.id,
      notificationEnabled,
      notificationTime
    );

    res.json({
      success: true,
      message: 'Notification preferences updated successfully',
      user: updatedUser
    });
  })
);

/**
 * PUT /api/auth/timezone
 * Update user timezone
 */
router.put('/timezone',
  authenticateUser,
  requireAuthentication,
  logAuthEvent('USER_TIMEZONE_UPDATE'),
  asyncHandler(async (req, res) => {
    const { timezone } = req.body;

    if (!timezone) {
      return res.status(400).json({
        success: false,
        error: 'Timezone is required',
        errorCode: 'VALIDATION_ERROR'
      });
    }

    const updatedUser = await UserService.updateTimezone(req.user.id, timezone);

    res.json({
      success: true,
      message: 'Timezone updated successfully',
      user: updatedUser
    });
  })
);

/**
 * GET /api/auth/session
 * Check if session is valid
 */
router.get('/session',
  authenticateUser,
  requireValidSession,
  asyncHandler(async (req, res) => {
    res.json({
      success: true,
      valid: true,
      user: {
        id: req.user.id,
        email: req.user.email,
        timezone: req.user.timezone
      },
      session: {
        createdAt: req.session.createdAt,
        lastActivity: req.session.lastActivity
      }
    });
  })
);

module.exports = router;
