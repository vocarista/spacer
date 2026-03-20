/**
 * User model for the spaced repetition system
 * Handles user authentication, preferences, and profile management
 */

const database = require('../config/database');
const bcrypt = require('bcrypt');
const { NotFoundError, ConflictError, ValidationError } = require('../middleware/errorHandler');

class User {
  /**
   * Create a new user
   * @param {Object} userData - User data
   * @param {string} userData.email - User email
   * @param {string} userData.password - Plain text password
   * @param {string} userData.timezone - User timezone (default: UTC)
   * @param {boolean} userData.notificationEnabled - Enable notifications (default: true)
   * @param {string} userData.notificationTime - Notification time (default: 09:00)
   * @returns {Promise<Object>} Created user object
   */
  static async create(userData) {
    const { email, password, timezone = 'UTC', notificationEnabled = true, notificationTime = '09:00' } = userData;

    // Check if user already exists
    const existingUser = await this.findByEmail(email);
    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert user
    const result = await database.run(
      `INSERT INTO users (email, password_hash, timezone, notification_enabled, notification_time) 
       VALUES (?, ?, ?, ?, ?)`,
      [email, passwordHash, timezone, notificationEnabled, notificationTime]
    );

    // Return created user
    return this.findById(result.id);
  }

  /**
   * Find user by ID
   * @param {number} id - User ID
   * @returns {Promise<Object|null>} User object or null
   */
  static async findById(id) {
    const user = await database.get(
      'SELECT id, email, timezone, notification_enabled, notification_time, created_at, updated_at FROM users WHERE id = ?',
      [id]
    );
    return user || null;
  }

  /**
   * Find user by email
   * @param {string} email - User email
   * @returns {Promise<Object|null>} User object or null
   */
  static async findByEmail(email) {
    const user = await database.get(
      'SELECT id, email, timezone, notification_enabled, notification_time, created_at, updated_at FROM users WHERE email = ?',
      [email]
    );
    return user || null;
  }

  /**
   * Authenticate user with email and password
   * @param {string} email - User email
   * @param {string} password - Plain text password
   * @returns {Promise<Object|null>} User object if authenticated, null otherwise
   */
  static async authenticate(email, password) {
    const user = await database.get(
      'SELECT id, email, password_hash, timezone, notification_enabled, notification_time, created_at, updated_at FROM users WHERE email = ?',
      [email]
    );

    if (!user) {
      return null;
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return null;
    }

    // Remove password hash from returned object
    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Update user profile
   * @param {number} id - User ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated user object
   */
  static async update(id, updateData) {
    const allowedFields = ['timezone', 'notification_enabled', 'notification_time'];
    const updates = [];
    const values = [];

    // Build dynamic update query
    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key)) {
        updates.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (updates.length === 0) {
      throw new ValidationError('No valid fields to update');
    }

    // Add updated_at timestamp and user ID
    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    // Execute update
    await database.run(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    // Return updated user
    return this.findById(id);
  }

  /**
   * Update user password
   * @param {number} id - User ID
   * @param {string} currentPassword - Current plain text password
   * @param {string} newPassword - New plain text password
   * @returns {Promise<boolean>} True if password updated successfully
   */
  static async updatePassword(id, currentPassword, newPassword) {
    // Get user with password hash
    const user = await database.get(
      'SELECT password_hash FROM users WHERE id = ?',
      [id]
    );

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValidPassword) {
      throw new ValidationError('Current password is incorrect');
    }

    // Hash new password
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await database.run(
      'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [newPasswordHash, id]
    );

    return true;
  }

  /**
   * Delete user account
   * @param {number} id - User ID
   * @returns {Promise<boolean>} True if user deleted successfully
   */
  static async delete(id) {
    const result = await database.run('DELETE FROM users WHERE id = ?', [id]);
    return result.changes > 0;
  }

  /**
   * Get user statistics
   * @param {number} id - User ID
   * @returns {Promise<Object>} User statistics
   */
  static async getStatistics(id) {
    const [topicCount, reviewCount, todayReviews, upcomingReviews] = await Promise.all([
      // Total topics
      database.get('SELECT COUNT(*) as count FROM topics WHERE user_id = ?', [id]),
      
      // Total reviews
      database.get('SELECT COUNT(*) as count FROM reviews r JOIN topics t ON r.topic_id = t.id WHERE t.user_id = ?', [id]),
      
      // Today's reviews
      database.get(
        'SELECT COUNT(*) as count FROM topics WHERE user_id = ? AND next_review_date = date("now", "localtime")',
        [id]
      ),
      
      // Upcoming reviews (next 7 days)
      database.get(
        'SELECT COUNT(*) as count FROM topics WHERE user_id = ? AND next_review_date BETWEEN date("now", "localtime") AND date("now", "+7 days", "localtime")',
        [id]
      )
    ]);

    return {
      totalTopics: topicCount.count,
      totalReviews: reviewCount.count,
      todayReviews: todayReviews.count,
      upcomingReviews: upcomingReviews.count
    };
  }

  /**
   * Validate user data
   * @param {Object} userData - User data to validate
   * @returns {Object} Validation result
   */
  static validate(userData) {
    const errors = [];

    // Email validation
    if (!userData.email) {
      errors.push('Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
      errors.push('Invalid email format');
    }

    // Password validation
    if (!userData.password) {
      errors.push('Password is required');
    } else if (userData.password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(userData.password)) {
      errors.push('Password must contain at least one lowercase letter, one uppercase letter, and one number');
    }

    // Timezone validation (basic check)
    if (userData.timezone && typeof userData.timezone !== 'string') {
      errors.push('Timezone must be a string');
    }

    // Notification time validation
    if (userData.notificationTime && !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(userData.notificationTime)) {
      errors.push('Notification time must be in HH:MM format (24-hour)');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

module.exports = User;
