/**
 * TopicService for topic management operations
 * Provides business logic for topic CRUD operations and SM-2 algorithm integration
 */

const Topic = require('../models/Topic');
const { logger } = require('../utils/logger');
const { NotFoundError, ConflictError, ValidationError } = require('../middleware/errorHandler');

class TopicService {
  /**
   * Create a new topic
   * @param {Object} topicData - Topic creation data
   * @param {number} topicData.userId - User ID
   * @param {string} topicData.name - Topic name
   * @param {string} topicData.description - Topic description (optional)
   * @param {Array} topicData.links - Array of study links (optional)
   * @param {string} topicData.initialDate - Initial date (optional)
   * @returns {Promise<Object>} Created topic object
   */
  static async createTopic(topicData) {
    logger.info('Creating new topic', { 
      userId: topicData.userId, 
      name: topicData.name 
    });

    // Validate input data
    const validation = Topic.validate(topicData);
    if (!validation.isValid) {
      logger.warn('Topic creation validation failed', { 
        userId: topicData.userId, 
        errors: validation.errors 
      });
      throw new ValidationError('Validation failed', validation.errors);
    }

    try {
      const topic = await Topic.create(topicData);
      
      logger.logUserAction(topicData.userId, 'TOPIC_CREATED', {
        topicId: topic.id,
        topicName: topic.name,
        initialDate: topic.initialDate
      });

      return topic;
    } catch (error) {
      if (error instanceof ConflictError) {
        logger.warn('Topic creation failed - duplicate name', { 
          userId: topicData.userId, 
          name: topicData.name 
        });
        throw error;
      }
      
      logger.error('Topic creation error', { 
        userId: topicData.userId, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Get all topics for a user
   * @param {number} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of topic objects
   */
  static async getUserTopics(userId, options = {}) {
    logger.info('Getting user topics', { userId });

    try {
      const topics = await Topic.findByUserId(userId, options);
      
      logger.logUserAction(userId, 'USER_TOPICS_VIEWED', {
        topicCount: topics.length
      });

      return topics;
    } catch (error) {
      logger.error('Get user topics error', { 
        userId, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Get topic by ID
   * @param {number} topicId - Topic ID
   * @param {number} userId - User ID (for ownership verification)
   * @returns {Promise<Object>} Topic object
   */
  static async getTopicById(topicId, userId) {
    logger.info('Getting topic by ID', { topicId, userId });

    try {
      const topic = await Topic.findById(topicId);
      
      if (!topic) {
        logger.warn('Topic not found', { topicId, userId });
        throw new NotFoundError('Topic not found');
      }

      // Verify ownership
      if (topic.user_id !== userId) {
        logger.warn('Topic access denied - wrong user', { topicId, userId });
        throw new ValidationError('Access denied');
      }

      logger.logUserAction(userId, 'TOPIC_VIEWED', {
        topicId: topic.id,
        topicName: topic.name
      });

      return topic;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      
      logger.error('Get topic error', { 
        topicId, 
        userId, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Update topic
   * @param {number} topicId - Topic ID
   * @param {number} userId - User ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated topic object
   */
  static async updateTopic(topicId, userId, updateData) {
    logger.info('Updating topic', { topicId, userId, updateData });

    try {
      // Verify ownership first
      await this.getTopicById(topicId, userId);

      // Validate update data
      const validation = Topic.validate(updateData);
      if (!validation.isValid) {
        logger.warn('Topic update validation failed', { 
          topicId, 
          userId, 
          errors: validation.errors 
        });
        throw new ValidationError('Validation failed', validation.errors);
      }

      const updatedTopic = await Topic.update(topicId, updateData);
      
      logger.logUserAction(userId, 'TOPIC_UPDATED', {
        topicId: updatedTopic.id,
        topicName: updatedTopic.name,
        updatedFields: Object.keys(updateData)
      });

      return updatedTopic;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      
      logger.error('Update topic error', { 
        topicId, 
        userId, 
        updateData, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Delete topic
   * @param {number} topicId - Topic ID
   * @param {number} userId - User ID
   * @returns {Promise<boolean>} True if topic deleted successfully
   */
  static async deleteTopic(topicId, userId) {
    logger.info('Deleting topic', { topicId, userId });

    try {
      // Get topic details for logging
      const topic = await this.getTopicById(topicId, userId);
      
      const success = await Topic.delete(topicId, userId);
      
      if (success) {
        logger.logUserAction(userId, 'TOPIC_DELETED', {
          topicId: topic.id,
          topicName: topic.name
        });
      }

      return success;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      
      logger.error('Delete topic error', { 
        topicId, 
        userId, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Get topics due for review today
   * @param {number} userId - User ID
   * @param {string} date - Date (optional, defaults to today)
   * @returns {Promise<Array>} Array of topics due for review
   */
  static async getTodayTopics(userId, date = null) {
    logger.info('Getting today\'s topics', { userId, date });

    try {
      const topics = await Topic.getTopicsDueForReview(userId, date);
      
      logger.logUserAction(userId, 'TODAY_TOPICS_VIEWED', {
        topicCount: topics.length,
        date: date || 'today'
      });

      return topics;
    } catch (error) {
      logger.error('Get today\'s topics error', { 
        userId, 
        date, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Get topics for calendar view
   * @param {number} userId - User ID
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @returns {Promise<Array>} Array of topics in date range
   */
  static async getCalendarTopics(userId, startDate, endDate) {
    logger.info('Getting calendar topics', { userId, startDate, endDate });

    try {
      const topics = await Topic.getTopicsByDateRange(userId, startDate, endDate);
      
      logger.logUserAction(userId, 'CALENDAR_TOPICS_VIEWED', {
        topicCount: topics.length,
        dateRange: `${startDate} to ${endDate}`
      });

      return topics;
    } catch (error) {
      logger.error('Get calendar topics error', { 
        userId, 
        startDate, 
        endDate, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Search topics
   * @param {number} userId - User ID
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Array of matching topics
   */
  static async searchTopics(userId, query, options = {}) {
    logger.info('Searching topics', { userId, query });

    try {
      const topics = await Topic.search(userId, query, options);
      
      logger.logUserAction(userId, 'TOPICS_SEARCHED', {
        query,
        resultCount: topics.length
      });

      return topics;
    } catch (error) {
      logger.error('Search topics error', { 
        userId, 
        query, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Get topic statistics
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Topic statistics
   */
  static async getTopicStatistics(userId) {
    logger.info('Getting topic statistics', { userId });

    try {
      const statistics = await Topic.getStatistics(userId);
      
      logger.logUserAction(userId, 'TOPIC_STATISTICS_VIEWED', statistics);

      return statistics;
    } catch (error) {
      logger.error('Get topic statistics error', { 
        userId, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Reset topic schedule
   * @param {number} topicId - Topic ID
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Updated topic object
   */
  static async resetTopicSchedule(topicId, userId) {
    logger.info('Resetting topic schedule', { topicId, userId });

    try {
      const updatedTopic = await Topic.resetSchedule(topicId, userId);
      
      logger.logUserAction(userId, 'TOPIC_SCHEDULE_RESET', {
        topicId: updatedTopic.id,
        topicName: updatedTopic.name,
        newReviewDate: updatedTopic.next_review_date
      });

      return updatedTopic;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      
      logger.error('Reset topic schedule error', { 
        topicId, 
        userId, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Get upcoming reviews for a user
   * @param {number} userId - User ID
   * @param {number} days - Number of days ahead (default: 7)
   * @returns {Promise<Object>} Upcoming reviews data
   */
  static async getUpcomingReviews(userId, days = 7) {
    logger.info('Getting upcoming reviews', { userId, days });

    try {
      const today = new Date().toISOString().split('T')[0];
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + days);
      const endDateStr = endDate.toISOString().split('T')[0];

      const topics = await Topic.getTopicsByDateRange(userId, today, endDateStr);
      
      // Group topics by date
      const reviewsByDate = {};
      topics.forEach(topic => {
        const date = topic.next_review_date;
        if (!reviewsByDate[date]) {
          reviewsByDate[date] = [];
        }
        reviewsByDate[date].push(topic);
      });

      const result = {
        reviewsByDate,
        totalReviews: topics.length,
        dateRange: { start: today, end: endDateStr }
      };

      logger.logUserAction(userId, 'UPCOMING_REVIEWS_VIEWED', {
        totalReviews: topics.length,
        dateRange: `${today} to ${endDateStr}`
      });

      return result;
    } catch (error) {
      logger.error('Get upcoming reviews error', { 
        userId, 
        days, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Validate topic ownership
   * @param {number} topicId - Topic ID
   * @param {number} userId - User ID
   * @returns {Promise<boolean>} True if user owns the topic
   */
  static async validateOwnership(topicId, userId) {
    try {
      const topic = await Topic.findById(topicId);
      return topic && topic.user_id === userId;
    } catch (error) {
      logger.error('Validate ownership error', { 
        topicId, 
        userId, 
        error: error.message 
      });
      return false;
    }
  }

  /**
   * Get topic with review history
   * @param {number} topicId - Topic ID
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Topic with review history
   */
  static async getTopicWithHistory(topicId, userId) {
    logger.info('Getting topic with review history', { topicId, userId });

    try {
      const topic = await this.getTopicById(topicId, userId);
      
      // Get review history (will be implemented when Review model is ready)
      const reviewHistory = []; // Placeholder
      
      const result = {
        ...topic,
        reviewHistory,
        reviewCount: reviewHistory.length
      };

      logger.logUserAction(userId, 'TOPIC_WITH_HISTORY_VIEWED', {
        topicId: topic.id,
        topicName: topic.name,
        reviewCount: reviewHistory.length
      });

      return result;
    } catch (error) {
      logger.error('Get topic with history error', { 
        topicId, 
        userId, 
        error: error.message 
      });
      throw error;
    }
  }
}

module.exports = TopicService;
