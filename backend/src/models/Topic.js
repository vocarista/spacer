/**
 * Topic model for the spaced repetition system
 * Handles topic creation, management, and SM-2 algorithm integration
 */

const database = require('../config/database');
const { NotFoundError, ConflictError, ValidationError } = require('../middleware/errorHandler');

class Topic {
  /**
   * Create a new topic for a user
   * @param {Object} topicData - Topic data
   * @param {number} topicData.userId - User ID
   * @param {string} topicData.name - Topic name
   * @param {string} topicData.description - Topic description (optional)
   * @param {Array} topicData.links - Array of study links (optional)
   * @param {string} topicData.initialDate - Initial date for topic (default: today)
   * @returns {Promise<Object>} Created topic object
   */
  static async create(topicData) {
    const { 
      userId, 
      name, 
      description = '', 
      links = [], 
      initialDate = new Date().toISOString().split('T')[0]
    } = topicData;

    // Validate user exists
    const user = await database.get('SELECT id FROM users WHERE id = ?', [userId]);
    if (!user) {
      throw new ValidationError('User not found');
    }

    // Check if topic name already exists for this user
    const existingTopic = await database.get(
      'SELECT id FROM topics WHERE user_id = ? AND name = ?',
      [userId, name]
    );
    if (existingTopic) {
      throw new ConflictError('Topic with this name already exists');
    }

    // Calculate initial review date (same as initial date)
    const nextReviewDate = initialDate;

    // Insert topic
    const result = await database.run(
      `INSERT INTO topics (
        user_id, name, description, links, initial_date, next_review_date,
        interval_days, easiness_factor, repetition_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        name,
        description,
        JSON.stringify(links),
        initialDate,
        nextReviewDate,
        1, // Initial interval: 1 day
        2.5, // Initial easiness factor
        0 // Initial repetition count
      ]
    );

    // Return created topic
    return this.findById(result.id);
  }

  /**
   * Find topic by ID
   * @param {number} id - Topic ID
   * @returns {Promise<Object|null>} Topic object or null
   */
  static async findById(id) {
    const topic = await database.get(
      'SELECT * FROM topics WHERE id = ?',
      [id]
    );
    
    if (!topic) {
      return null;
    }

    // Parse JSON fields
    return {
      ...topic,
      links: JSON.parse(topic.links || '[]')
    };
  }

  /**
   * Find topics by user ID
   * @param {number} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of topic objects
   */
  static async findByUserId(userId, options = {}) {
    const { 
      limit = 50, 
      offset = 0, 
      sortBy = 'next_review_date',
      sortOrder = 'ASC'
    } = options;

    const topics = await database.all(
      `SELECT * FROM topics 
       WHERE user_id = ? 
       ORDER BY ${sortBy} ${sortOrder}
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );

    // Parse JSON fields for each topic
    return topics.map(topic => ({
      ...topic,
      links: JSON.parse(topic.links || '[]')
    }));
  }

  /**
   * Get topics due for review on a specific date
   * @param {number} userId - User ID
   * @param {string} date - Date in YYYY-MM-DD format (default: today)
   * @returns {Promise<Array>} Array of topics due for review
   */
  static async getTopicsDueForReview(userId, date = null) {
    const reviewDate = date || new Date().toISOString().split('T')[0];

    const topics = await database.all(
      `SELECT * FROM topics 
       WHERE user_id = ? AND next_review_date <= ?
       ORDER BY next_review_date ASC, created_at ASC`,
      [userId, reviewDate]
    );

    // Parse JSON fields for each topic
    return topics.map(topic => ({
      ...topic,
      links: JSON.parse(topic.links || '[]')
    }));
  }

  /**
   * Get topics scheduled for a date range
   * @param {number} userId - User ID
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @returns {Promise<Array>} Array of topics in date range
   */
  static async getTopicsByDateRange(userId, startDate, endDate) {
    const topics = await database.all(
      `SELECT * FROM topics 
       WHERE user_id = ? AND next_review_date BETWEEN ? AND ?
       ORDER BY next_review_date ASC, name ASC`,
      [userId, startDate, endDate]
    );

    // Parse JSON fields for each topic
    return topics.map(topic => ({
      ...topic,
      links: JSON.parse(topic.links || '[]')
    }));
  }

  /**
   * Update topic
   * @param {number} id - Topic ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated topic object
   */
  static async update(id, updateData) {
    const allowedFields = ['name', 'description', 'links'];
    const updates = [];
    const values = [];

    // Build dynamic update query
    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key)) {
        if (key === 'links') {
          updates.push(`${key} = ?`);
          values.push(JSON.stringify(value));
        } else {
          updates.push(`${key} = ?`);
          values.push(value);
        }
      }
    }

    if (updates.length === 0) {
      throw new ValidationError('No valid fields to update');
    }

    // Add updated_at timestamp and topic ID
    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    // Execute update
    await database.run(
      `UPDATE topics SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    // Return updated topic
    return this.findById(id);
  }

  /**
   * Update topic schedule after review
   * @param {number} id - Topic ID
   * @param {Object} scheduleData - Schedule update data
   * @returns {Promise<Object>} Updated topic object
   */
  static async updateSchedule(id, scheduleData) {
    const {
      nextReviewDate,
      intervalDays,
      easinessFactor,
      repetitionCount
    } = scheduleData;

    await database.run(
      `UPDATE topics 
       SET next_review_date = ?, interval_days = ?, easiness_factor = ?, 
           repetition_count = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [nextReviewDate, intervalDays, easinessFactor, repetitionCount, id]
    );

    return this.findById(id);
  }

  /**
   * Delete topic
   * @param {number} id - Topic ID
   * @param {number} userId - User ID (for ownership verification)
   * @returns {Promise<boolean>} True if topic deleted successfully
   */
  static async delete(id, userId) {
    // Verify ownership
    const topic = await database.get(
      'SELECT id FROM topics WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (!topic) {
      throw new NotFoundError('Topic not found or access denied');
    }

    const result = await database.run('DELETE FROM topics WHERE id = ?', [id]);
    return result.changes > 0;
  }

  /**
   * Get topic statistics
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Topic statistics
   */
  static async getStatistics(userId) {
    const [totalTopics, dueToday, dueThisWeek, overdue] = await Promise.all([
      // Total topics
      database.get('SELECT COUNT(*) as count FROM topics WHERE user_id = ?', [userId]),
      
      // Topics due today
      database.get(
        'SELECT COUNT(*) as count FROM topics WHERE user_id = ? AND next_review_date = date("now", "localtime")',
        [userId]
      ),
      
      // Topics due this week
      database.get(
        'SELECT COUNT(*) as count FROM topics WHERE user_id = ? AND next_review_date BETWEEN date("now", "localtime") AND date("now", "+7 days", "localtime")',
        [userId]
      ),
      
      // Overdue topics
      database.get(
        'SELECT COUNT(*) as count FROM topics WHERE user_id = ? AND next_review_date < date("now", "localtime")',
        [userId]
      )
    ]);

    return {
      totalTopics: totalTopics.count,
      dueToday: dueToday.count,
      dueThisWeek: dueThisWeek.count,
      overdue: overdue.count
    };
  }

  /**
   * Search topics by name or description
   * @param {number} userId - User ID
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Array of matching topics
   */
  static async search(userId, query, options = {}) {
    const { limit = 20, offset = 0 } = options;
    const searchQuery = `%${query}%`;

    const topics = await database.all(
      `SELECT * FROM topics 
       WHERE user_id = ? AND (name LIKE ? OR description LIKE ?)
       ORDER BY name ASC
       LIMIT ? OFFSET ?`,
      [userId, searchQuery, searchQuery, limit, offset]
    );

    // Parse JSON fields for each topic
    return topics.map(topic => ({
      ...topic,
      links: JSON.parse(topic.links || '[]')
    }));
  }

  /**
   * Validate topic data
   * @param {Object} topicData - Topic data to validate
   * @returns {Object} Validation result
   */
  static validate(topicData) {
    const errors = [];

    // Name validation
    if (!topicData.name) {
      errors.push('Topic name is required');
    } else if (topicData.name.trim().length === 0) {
      errors.push('Topic name cannot be empty');
    } else if (topicData.name.length > 255) {
      errors.push('Topic name cannot exceed 255 characters');
    }

    // Description validation
    if (topicData.description && topicData.description.length > 1000) {
      errors.push('Description cannot exceed 1000 characters');
    }

    // Links validation
    if (topicData.links) {
      if (!Array.isArray(topicData.links)) {
        errors.push('Links must be an array');
      } else {
        topicData.links.forEach((link, index) => {
          if (typeof link !== 'string') {
            errors.push(`Link at index ${index} must be a string`);
          } else if (link && !this.isValidUrl(link)) {
            errors.push(`Link at index ${index} is not a valid URL`);
          }
        });
      }
    }

    // Initial date validation
    if (topicData.initialDate) {
      const date = new Date(topicData.initialDate);
      if (isNaN(date.getTime())) {
        errors.push('Initial date must be a valid date');
      } else if (date > new Date()) {
        errors.push('Initial date cannot be in the future');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate URL format
   * @param {string} url - URL to validate
   * @returns {boolean} True if valid URL
   */
  static isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Reset topic schedule (for when user wants to restart learning)
   * @param {number} id - Topic ID
   * @param {number} userId - User ID (for ownership verification)
   * @returns {Promise<Object>} Updated topic object
   */
  static async resetSchedule(id, userId) {
    // Verify ownership
    const topic = await database.get(
      'SELECT * FROM topics WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (!topic) {
      throw new NotFoundError('Topic not found or access denied');
    }

    // Reset to initial values
    const today = new Date().toISOString().split('T')[0];
    
    await this.updateSchedule(id, {
      nextReviewDate: today,
      intervalDays: 1,
      easinessFactor: 2.5,
      repetitionCount: 0
    });

    return this.findById(id);
  }
}

module.exports = Topic;
