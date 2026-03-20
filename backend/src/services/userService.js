/**
 * UserService for user management operations
 * Provides business logic for user authentication, registration, and profile management
 */

const User = require('../models/User');
const { logger } = require('../utils/logger');
const { ValidationError, NotFoundError, ConflictError } = require('../middleware/errorHandler');

class UserService {
  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @param {string} userData.email - User email
   * @param {string} userData.password - User password
   * @param {string} userData.timezone - User timezone (optional)
   * @param {boolean} userData.notificationEnabled - Notification preference (optional)
   * @param {string} userData.notificationTime - Notification time (optional)
   * @returns {Promise<Object>} Created user object
   */
  static async register(userData) {
    logger.info('User registration attempt', { email: userData.email });

    // Validate input data
    const validation = User.validate(userData);
    if (!validation.isValid) {
      logger.warn('User registration validation failed', { 
        email: userData.email, 
        errors: validation.errors 
      });
      throw new ValidationError('Validation failed', validation.errors);
    }

    try {
      const user = await User.create(userData);
      
      logger.logUserAction(user.id, 'USER_REGISTERED', {
        email: user.email,
        timezone: user.timezone
      });

      return user;
    } catch (error) {
      if (error instanceof ConflictError) {
        logger.warn('User registration failed - email exists', { email: userData.email });
        throw error;
      }
      
      logger.error('User registration error', { 
        email: userData.email, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Authenticate user login
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} Authenticated user object
   */
  static async login(email, password) {
    logger.info('User login attempt', { email });

    try {
      const user = await User.authenticate(email, password);
      
      if (!user) {
        logger.warn('User login failed - invalid credentials', { email });
        throw new ValidationError('Invalid email or password');
      }

      logger.logUserAction(user.id, 'USER_LOGGED_IN', {
        email: user.email
      });

      return user;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      
      logger.error('User login error', { 
        email, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Get user profile by ID
   * @param {number} userId - User ID
   * @returns {Promise<Object>} User profile object
   */
  static async getProfile(userId) {
    logger.info('Getting user profile', { userId });

    try {
      const user = await User.findById(userId);
      
      if (!user) {
        logger.warn('User profile not found', { userId });
        throw new NotFoundError('User not found');
      }

      // Get user statistics
      const statistics = await User.getStatistics(userId);

      logger.logUserAction(userId, 'USER_PROFILE_VIEWED');

      return {
        ...user,
        statistics
      };
    } catch (error) {
      logger.error('Get user profile error', { 
        userId, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Update user profile
   * @param {number} userId - User ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated user object
   */
  static async updateProfile(userId, updateData) {
    logger.info('Updating user profile', { userId, updateData });

    try {
      // Validate update data
      const validation = User.validate(updateData);
      if (!validation.isValid) {
        logger.warn('User profile update validation failed', { 
          userId, 
          errors: validation.errors 
        });
        throw new ValidationError('Validation failed', validation.errors);
      }

      const user = await User.update(userId, updateData);
      
      if (!user) {
        logger.warn('User profile update failed - user not found', { userId });
        throw new NotFoundError('User not found');
      }

      logger.logUserAction(userId, 'USER_PROFILE_UPDATED', {
        updatedFields: Object.keys(updateData)
      });

      return user;
    } catch (error) {
      logger.error('Update user profile error', { 
        userId, 
        updateData, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Change user password
   * @param {number} userId - User ID
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<boolean>} True if password changed successfully
   */
  static async changePassword(userId, currentPassword, newPassword) {
    logger.info('Changing user password', { userId });

    try {
      // Validate new password
      const validation = User.validate({ password: newPassword });
      if (!validation.isValid) {
        logger.warn('Password change validation failed', { 
          userId, 
          errors: validation.errors 
        });
        throw new ValidationError('Validation failed', validation.errors);
      }

      const success = await User.updatePassword(userId, currentPassword, newPassword);
      
      if (!success) {
        logger.warn('Password change failed - user not found', { userId });
        throw new NotFoundError('User not found');
      }

      logger.logUserAction(userId, 'USER_PASSWORD_CHANGED');

      return success;
    } catch (error) {
      logger.error('Change password error', { 
        userId, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Delete user account
   * @param {number} userId - User ID
   * @param {string} password - User password for confirmation
   * @returns {Promise<boolean>} True if account deleted successfully
   */
  static async deleteAccount(userId, password) {
    logger.info('Deleting user account', { userId });

    try {
      // Verify password before deletion
      const user = await User.findById(userId);
      if (!user) {
        logger.warn('Account deletion failed - user not found', { userId });
        throw new NotFoundError('User not found');
      }

      // Authenticate with provided password
      const authenticated = await User.authenticate(user.email, password);
      if (!authenticated) {
        logger.warn('Account deletion failed - invalid password', { userId });
        throw new ValidationError('Invalid password');
      }

      const success = await User.delete(userId);
      
      if (success) {
        logger.logUserAction(userId, 'USER_ACCOUNT_DELETED');
      } else {
        logger.warn('Account deletion failed', { userId });
      }

      return success;
    } catch (error) {
      logger.error('Delete account error', { 
        userId, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Get user statistics
   * @param {number} userId - User ID
   * @returns {Promise<Object>} User statistics
   */
  static async getUserStatistics(userId) {
    logger.info('Getting user statistics', { userId });

    try {
      const statistics = await User.getStatistics(userId);
      
      logger.logUserAction(userId, 'USER_STATISTICS_VIEWED');

      return statistics;
    } catch (error) {
      logger.error('Get user statistics error', { 
        userId, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Validate user session
   * @param {number} userId - User ID from session
   * @returns {Promise<Object>} User object if valid, null otherwise
   */
  static async validateSession(userId) {
    logger.debug('Validating user session', { userId });

    try {
      const user = await User.findById(userId);
      
      if (user) {
        logger.debug('User session validated', { userId });
      } else {
        logger.warn('User session validation failed - user not found', { userId });
      }

      return user;
    } catch (error) {
      logger.error('Session validation error', { 
        userId, 
        error: error.message 
      });
      return null;
    }
  }

  /**
   * Update notification preferences
   * @param {number} userId - User ID
   * @param {boolean} notificationEnabled - Enable notifications
   * @param {string} notificationTime - Notification time (HH:MM)
   * @returns {Promise<Object>} Updated user object
   */
  static async updateNotificationPreferences(userId, notificationEnabled, notificationTime) {
    logger.info('Updating notification preferences', { 
      userId, 
      notificationEnabled, 
      notificationTime 
    });

    try {
      // Validate notification time format
      if (notificationTime && !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(notificationTime)) {
        throw new ValidationError('Notification time must be in HH:MM format (24-hour)');
      }

      const user = await User.update(userId, {
        notification_enabled: notificationEnabled,
        notification_time: notificationTime || '09:00'
      });

      logger.logUserAction(userId, 'USER_NOTIFICATION_PREFERENCES_UPDATED', {
        notificationEnabled,
        notificationTime
      });

      return user;
    } catch (error) {
      logger.error('Update notification preferences error', { 
        userId, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Update user timezone
   * @param {number} userId - User ID
   * @param {string} timezone - New timezone
   * @returns {Promise<Object>} Updated user object
   */
  static async updateTimezone(userId, timezone) {
    logger.info('Updating user timezone', { userId, timezone });

    try {
      const user = await User.update(userId, { timezone });

      logger.logUserAction(userId, 'USER_TIMEZONE_UPDATED', {
        newTimezone: timezone
      });

      return user;
    } catch (error) {
      logger.error('Update timezone error', { 
        userId, 
        timezone, 
        error: error.message 
      });
      throw error;
    }
  }
}

module.exports = UserService;
