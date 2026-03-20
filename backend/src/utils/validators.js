/**
 * Input validation schemas using Joi
 * Provides comprehensive validation for all API endpoints
 */

const Joi = require('joi');

/**
 * User registration validation schema
 */
const registerSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, and one number',
      'any.required': 'Password is required'
    }),
  timezone: Joi.string()
    .optional()
    .default('UTC')
    .messages({
      'string.base': 'Timezone must be a string'
    }),
  notificationEnabled: Joi.boolean()
    .optional()
    .default(true),
  notificationTime: Joi.string()
    .pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .optional()
    .default('09:00')
    .messages({
      'string.pattern.base': 'Notification time must be in HH:MM format (24-hour)'
    })
});

/**
 * User login validation schema
 */
const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password is required'
    })
});

/**
 * Topic creation validation schema
 */
const createTopicSchema = Joi.object({
  name: Joi.string()
    .min(1)
    .max(255)
    .required()
    .messages({
      'string.min': 'Topic name cannot be empty',
      'string.max': 'Topic name cannot exceed 255 characters',
      'any.required': 'Topic name is required'
    }),
  description: Joi.string()
    .max(1000)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Description cannot exceed 1000 characters'
    }),
  links: Joi.array()
    .items(Joi.string().uri())
    .optional()
    .default([])
    .messages({
      'array.items': 'All links must be valid URLs'
    }),
  initialDate: Joi.date()
    .iso()
    .max('now')
    .optional()
    .default(new Date().toISOString().split('T')[0])
    .messages({
      'date.max': 'Initial date cannot be in the future',
      'date.iso': 'Initial date must be in ISO format (YYYY-MM-DD)'
    })
});

/**
 * Topic update validation schema
 */
const updateTopicSchema = Joi.object({
  name: Joi.string()
    .min(1)
    .max(255)
    .optional()
    .messages({
      'string.min': 'Topic name cannot be empty',
      'string.max': 'Topic name cannot exceed 255 characters'
    }),
  description: Joi.string()
    .max(1000)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Description cannot exceed 1000 characters'
    }),
  links: Joi.array()
    .items(Joi.string().uri())
    .optional()
    .messages({
      'array.items': 'All links must be valid URLs'
    })
});

/**
 * Review submission validation schema
 */
const reviewSchema = Joi.object({
  topicId: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'Topic ID must be a number',
      'number.integer': 'Topic ID must be an integer',
      'number.positive': 'Topic ID must be positive',
      'any.required': 'Topic ID is required'
    }),
  qualityRating: Joi.number()
    .integer()
    .min(0)
    .max(5)
    .required()
    .messages({
      'number.base': 'Quality rating must be a number',
      'number.integer': 'Quality rating must be an integer',
      'number.min': 'Quality rating must be between 0 and 5',
      'number.max': 'Quality rating must be between 0 and 5',
      'any.required': 'Quality rating is required'
    }),
  reviewTimeSeconds: Joi.number()
    .integer()
    .min(0)
    .optional()
    .default(0)
    .messages({
      'number.base': 'Review time must be a number',
      'number.integer': 'Review time must be an integer',
      'number.min': 'Review time cannot be negative'
    })
});

/**
 * User profile update validation schema
 */
const updateProfileSchema = Joi.object({
  timezone: Joi.string()
    .optional()
    .messages({
      'string.base': 'Timezone must be a string'
    }),
  notificationEnabled: Joi.boolean()
    .optional(),
  notificationTime: Joi.string()
    .pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .optional()
    .messages({
      'string.pattern.base': 'Notification time must be in HH:MM format (24-hour)'
    })
});

/**
 * Push subscription validation schema
 */
const pushSubscriptionSchema = Joi.object({
  endpoint: Joi.string()
    .uri()
    .required()
    .messages({
      'string.uri': 'Endpoint must be a valid URL',
      'any.required': 'Endpoint is required'
    }),
  p256dhKey: Joi.string()
    .required()
    .messages({
      'any.required': 'P256DH key is required'
    }),
  authKey: Joi.string()
    .required()
    .messages({
      'any.required': 'Auth key is required'
    })
});

/**
 * Validation middleware factory
 * Creates middleware that validates request body against a schema
 */
function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        errorCode: 'VALIDATION_ERROR',
        details: errors
      });
    }

    req.body = value;
    next();
  };
}

/**
 * Route parameter validation
 */
const idParamSchema = Joi.object({
  id: Joi.number()
    .integer()
    .positive()
    .required()
});

function validateParams(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params);

    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid parameter',
        errorCode: 'INVALID_PARAMETER',
        message: error.details[0].message
      });
    }

    req.params = value;
    next();
  };
}

module.exports = {
  schemas: {
    registerSchema,
    loginSchema,
    createTopicSchema,
    updateTopicSchema,
    reviewSchema,
    updateProfileSchema,
    pushSubscriptionSchema,
    idParamSchema
  },
  validate,
  validateParams
};
