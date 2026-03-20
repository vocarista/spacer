/**
 * Topic management routes
 * Handles CRUD operations for topics and SM-2 algorithm integration
 */

const express = require('express');
const TopicService = require('../services/topicService');
const { validate, schemas, validateParams } = require('../utils/validators');
const { 
  authenticateUser, 
  requireAuthentication, 
  requireResourceOwnership 
} = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { logger } = require('../utils/logger');

const router = express.Router();

// Apply authentication to all topic routes
router.use(authenticateUser, requireAuthentication);

/**
 * POST /api/topics
 * Create a new topic
 */
router.post('/',
  validate(schemas.createTopicSchema),
  logAuthEvent('TOPIC_CREATE'),
  asyncHandler(async (req, res) => {
    const topicData = {
      ...req.body,
      userId: req.user.id
    };

    const topic = await TopicService.createTopic(topicData);

    res.status(201).json({
      success: true,
      message: 'Topic created successfully',
      topic
    });
  })
);

/**
 * GET /api/topics
 * Get all topics for the authenticated user
 */
router.get('/',
  asyncHandler(async (req, res) => {
    const { limit = 50, offset = 0, sortBy = 'next_review_date', sortOrder = 'ASC' } = req.query;

    const topics = await TopicService.getUserTopics(req.user.id, {
      limit: parseInt(limit),
      offset: parseInt(offset),
      sortBy,
      sortOrder
    });

    res.json({
      success: true,
      topics,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: topics.length
      }
    });
  })
);

/**
 * GET /api/topics/search
 * Search topics
 */
router.get('/search',
  asyncHandler(async (req, res) => {
    const { q: query, limit = 20, offset = 0 } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required',
        errorCode: 'VALIDATION_ERROR'
      });
    }

    const topics = await TopicService.searchTopics(req.user.id, query, {
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      topics,
      query,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: topics.length
      }
    });
  })
);

/**
 * GET /api/topics/today
 * Get topics due for review today
 */
router.get('/today',
  asyncHandler(async (req, res) => {
    const { date } = req.query; // Optional date parameter

    const topics = await TopicService.getTodayTopics(req.user.id, date);

    res.json({
      success: true,
      topics,
      date: date || 'today',
      count: topics.length
    });
  })
);

/**
 * GET /api/topics/calendar
 * Get topics for calendar view
 */
router.get('/calendar',
  asyncHandler(async (req, res) => {
    const { start_date: startDate, end_date: endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Start date and end date are required',
        errorCode: 'VALIDATION_ERROR'
      });
    }

    const topics = await TopicService.getCalendarTopics(req.user.id, startDate, endDate);

    res.json({
      success: true,
      topics,
      dateRange: { start: startDate, end: endDate },
      count: topics.length
    });
  })
);

/**
 * GET /api/topics/statistics
 * Get topic statistics
 */
router.get('/statistics',
  asyncHandler(async (req, res) => {
    const statistics = await TopicService.getTopicStatistics(req.user.id);

    res.json({
      success: true,
      statistics
    });
  })
);

/**
 * GET /api/topics/upcoming
 * Get upcoming reviews
 */
router.get('/upcoming',
  asyncHandler(async (req, res) => {
    const { days = 7 } = req.query;

    const upcomingReviews = await TopicService.getUpcomingReviews(
      req.user.id, 
      parseInt(days)
    );

    res.json({
      success: true,
      upcomingReviews
    });
  })
);

/**
 * GET /api/topics/:id
 * Get a specific topic
 */
router.get('/:id',
  validateParams(schemas.idParamSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const topic = await TopicService.getTopicById(parseInt(id), req.user.id);

    res.json({
      success: true,
      topic
    });
  })
);

/**
 * GET /api/topics/:id/history
 * Get topic with review history
 */
router.get('/:id/history',
  validateParams(schemas.idParamSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const topicWithHistory = await TopicService.getTopicWithHistory(
      parseInt(id), 
      req.user.id
    );

    res.json({
      success: true,
      topic: topicWithHistory
    });
  })
);

/**
 * PUT /api/topics/:id
 * Update a topic
 */
router.put('/:id',
  validateParams(schemas.idParamSchema),
  validate(schemas.updateTopicSchema),
  logAuthEvent('TOPIC_UPDATE'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const updatedTopic = await TopicService.updateTopic(
      parseInt(id), 
      req.user.id, 
      req.body
    );

    res.json({
      success: true,
      message: 'Topic updated successfully',
      topic: updatedTopic
    });
  })
);

/**
 * PUT /api/topics/:id/reset
 * Reset topic schedule
 */
router.put('/:id/reset',
  validateParams(schemas.idParamSchema),
  logAuthEvent('TOPIC_SCHEDULE_RESET'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const resetTopic = await TopicService.resetTopicSchedule(
      parseInt(id), 
      req.user.id
    );

    res.json({
      success: true,
      message: 'Topic schedule reset successfully',
      topic: resetTopic
    });
  })
);

/**
 * DELETE /api/topics/:id
 * Delete a topic
 */
router.delete('/:id',
  validateParams(schemas.idParamSchema),
  logAuthEvent('TOPIC_DELETE'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const success = await TopicService.deleteTopic(parseInt(id), req.user.id);

    if (success) {
      res.json({
        success: true,
        message: 'Topic deleted successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Topic not found',
        errorCode: 'NOT_FOUND'
      });
    }
  })
);

/**
 * POST /api/topics/batch
 * Create multiple topics (batch operation)
 */
router.post('/batch',
  validate({
    body: {
      topics: {
        type: 'array',
        min: 1,
        max: 10,
        items: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string', minLength: 1, maxLength: 255 },
            description: { type: 'string', maxLength: 1000 },
            links: { type: 'array', items: { type: 'string', format: 'uri' } },
            initialDate: { type: 'string', format: 'date' }
          }
        }
      }
    }
  }),
  logAuthEvent('TOPICS_BATCH_CREATE'),
  asyncHandler(async (req, res) => {
    const { topics } = req.body;
    const createdTopics = [];
    const errors = [];

    // Process each topic individually
    for (let i = 0; i < topics.length; i++) {
      try {
        const topicData = {
          ...topics[i],
          userId: req.user.id
        };

        const topic = await TopicService.createTopic(topicData);
        createdTopics.push(topic);
      } catch (error) {
        errors.push({
          index: i,
          topic: topics[i].name,
          error: error.message
        });
      }
    }

    res.status(201).json({
      success: true,
      message: `Created ${createdTopics.length} out of ${topics.length} topics`,
      createdTopics,
      errors,
      summary: {
        total: topics.length,
        created: createdTopics.length,
        failed: errors.length
      }
    });
  })
);

/**
 * GET /api/topics/export
 * Export topics data (CSV format)
 */
router.get('/export',
  asyncHandler(async (req, res) => {
    const { format = 'json' } = req.query;

    const topics = await TopicService.getUserTopics(req.user.id, {
      limit: 1000, // Reasonable limit for export
      offset: 0
    });

    if (format === 'csv') {
      // Convert to CSV
      const csvHeader = 'Name,Description,Links,Initial Date,Next Review Date,Interval,Easiness Factor,Repetitions,Created At';
      const csvRows = topics.map(topic => [
        topic.name,
        topic.description || '',
        (topic.links || []).join(';'),
        topic.initial_date,
        topic.next_review_date,
        topic.interval_days,
        topic.easiness_factor,
        topic.repetition_count,
        topic.created_at
      ]);

      const csvContent = [csvHeader, ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="topics.csv"');
      res.send(csvContent);
    } else {
      // JSON format (default)
      res.json({
        success: true,
        topics,
        exportedAt: new Date().toISOString(),
        count: topics.length
      });
    }
  })
);

/**
 * Helper function to log auth events
 */
function logAuthEvent(eventType) {
  return (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      if (res.statusCode < 400) {
        logger.logUserAction(req.user.id, eventType, {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          method: req.method,
          url: req.url
        });
      }
      
      originalSend.call(this, data);
    };
    
    next();
  };
}

module.exports = router;
