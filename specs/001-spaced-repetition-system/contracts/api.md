# API Contracts: Spaced Repetition System

**Date**: 2025-03-15  
**Purpose**: REST API endpoint definitions for spaced-repetition system (Express.js + Next.js)

## Authentication

All API endpoints (except authentication endpoints) require valid session token.

**Session Management**:
- Session cookie: `connect.sid`
- Login required for all protected endpoints
- Session timeout: 24 hours
- Express.js session middleware with filesystem store

## Authentication Endpoints

### POST /api/auth/login
**Purpose**: Authenticate user and create session

**Request**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "timezone": "UTC",
    "notificationEnabled": true,
    "notificationTime": "09:00:00"
  }
}
```

**Response** (401 Unauthorized):
```json
{
  "success": false,
  "error": "Invalid email or password",
  "errorCode": "AUTHENTICATION_ERROR"
}
```

**Express.js Route**:
```javascript
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate input
    const { error } = loginSchema.validate({ email, password });
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message,
        errorCode: 'VALIDATION_ERROR'
      });
    }
    
    // Authenticate user
    const user = await authService.authenticate(email, password);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password",
        errorCode: 'AUTHENTICATION_ERROR'
      });
    }
    
    // Create session
    req.session.userId = user.id;
    
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        timezone: user.timezone,
        notificationEnabled: user.notificationEnabled,
        notificationTime: user.notificationTime
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Internal server error",
      errorCode: 'SERVER_ERROR'
    });
  }
});
```

### POST /api/auth/logout
**Purpose**: End user session

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Express.js Route**:
```javascript
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        error: "Failed to logout",
        errorCode: 'SERVER_ERROR'
      });
    }
    
    res.clearCookie('connect.sid');
    res.json({
      success: true,
      message: "Logged out successfully"
    });
  });
});
```

### POST /api/auth/register
**Purpose**: Create new user account

**Request**:
```json
{
  "email": "newuser@example.com",
  "password": "password123",
  "timezone": "America/New_York"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "user": {
    "id": 2,
    "email": "newuser@example.com",
    "timezone": "America/New_York",
    "notificationEnabled": true,
    "notificationTime": "09:00:00"
  }
}
```

## Topic Management Endpoints

### GET /api/topics
**Purpose**: List all topics for authenticated user

**Query Parameters**:
- `status`: optional filter (`due_today`, `upcoming`, `all`)
- `limit`: optional pagination limit (default: 50)
- `offset`: optional pagination offset (default: 0)

**Response** (200 OK):
```json
{
  "success": true,
  "topics": [
    {
      "id": 1,
      "name": "Python Basics",
      "description": "Fundamental Python concepts",
      "links": ["https://docs.python.org/3/tutorial/"],
      "initialDate": "2025-03-10",
      "nextReviewDate": "2025-03-15",
      "intervalDays": 5,
      "easinessFactor": 2.5,
      "repetitionCount": 3,
      "createdAt": "2025-03-10T10:00:00Z",
      "updatedAt": "2025-03-15T14:30:00Z"
    }
  ],
  "pagination": {
    "total": 1,
    "limit": 50,
    "offset": 0
  }
}
```

**Express.js Route**:
```javascript
router.get('/', authenticateSession, async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;
    const userId = req.session.userId;
    
    const topics = await topicService.getTopics(userId, {
      status,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    const total = await topicService.getTopicsCount(userId, status);
    
    res.json({
      success: true,
      topics,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Internal server error",
      errorCode: 'SERVER_ERROR'
    });
  }
});
```

### POST /api/topics
**Purpose**: Create new topic

**Request**:
```json
{
  "name": "JavaScript Promises",
  "description": "Understanding async JavaScript",
  "links": ["https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise"],
  "initialDate": "2025-03-15"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "topic": {
    "id": 2,
    "name": "JavaScript Promises",
    "description": "Understanding async JavaScript",
    "links": ["https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise"],
    "initialDate": "2025-03-15",
    "nextReviewDate": "2025-03-16",
    "intervalDays": 1,
    "easinessFactor": 2.5,
    "repetitionCount": 0,
    "createdAt": "2025-03-15T15:00:00Z",
    "updatedAt": "2025-03-15T15:00:00Z"
  }
}
```

**Express.js Route**:
```javascript
router.post('/', authenticateSession, async (req, res) => {
  try {
    const userId = req.session.userId;
    const topicData = { ...req.body, userId };
    
    // Validate input
    const { error } = createTopicSchema.validate(topicData);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message,
        errorCode: 'VALIDATION_ERROR'
      });
    }
    
    const topic = await topicService.createTopic(topicData);
    
    res.status(201).json({
      success: true,
      topic
    });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({
        success: false,
        error: "Topic name already exists",
        errorCode: 'DUPLICATE_ERROR'
      });
    }
    
    res.status(500).json({
      success: false,
      error: "Internal server error",
      errorCode: 'SERVER_ERROR'
    });
  }
});
```

## Review Management Endpoints

### POST /api/reviews
**Purpose**: Submit topic review with quality rating

**Request**:
```json
{
  "topicId": 1,
  "qualityRating": 4,
  "reviewTimeSeconds": 120
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "review": {
    "id": 15,
    "topicId": 1,
    "reviewDate": "2025-03-15",
    "qualityRating": 4,
    "previousInterval": 5,
    "newInterval": 12,
    "previousEasinessFactor": 2.5,
    "newEasinessFactor": 2.6,
    "reviewTimeSeconds": 120,
    "createdAt": "2025-03-15T16:30:00Z"
  },
  "topic": {
    "id": 1,
    "nextReviewDate": "2025-03-27",
    "intervalDays": 12,
    "easinessFactor": 2.6,
    "repetitionCount": 4
  }
}
```

**Express.js Route**:
```javascript
router.post('/', authenticateSession, async (req, res) => {
  try {
    const userId = req.session.userId;
    const reviewData = { ...req.body, userId };
    
    // Validate input
    const { error } = createReviewSchema.validate(reviewData);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message,
        errorCode: 'VALIDATION_ERROR'
      });
    }
    
    // Verify topic ownership
    const topic = await topicService.getTopic(reviewData.topicId, userId);
    if (!topic) {
      return res.status(404).json({
        success: false,
        error: "Topic not found",
        errorCode: 'NOT_FOUND'
      });
    }
    
    const result = await reviewService.createReview(reviewData);
    
    res.status(201).json({
      success: true,
      review: result.review,
      topic: result.updatedTopic
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Internal server error",
      errorCode: 'SERVER_ERROR'
    });
  }
});
```

## Calendar Endpoints

### GET /api/calendar
**Purpose**: Get calendar data for specified month

**Query Parameters**:
- `year`: required year (e.g., 2025)
- `month`: required month (1-12)

**Response** (200 OK):
```json
{
  "success": true,
  "year": 2025,
  "month": 3,
  "topics": [
    {
      "date": "2025-03-15",
      "topics": [
        {
          "id": 1,
          "name": "Python Basics",
          "intervalDays": 5
        }
      ]
    }
  ]
}
```

## Dashboard Endpoints

### GET /api/dashboard
**Purpose**: Get dashboard summary data

**Response** (200 OK):
```json
{
  "success": true,
  "summary": {
    "topicsDueToday": 3,
    "topicsTotal": 25,
    "reviewsCompletedToday": 1,
    "streakDays": 7,
    "upcomingReviews": [
      {
        "date": "2025-03-16",
        "count": 2
      }
    ]
  },
  "todayTopics": [
    {
      "id": 1,
      "name": "Python Basics",
      "description": "Fundamental Python concepts",
      "links": ["https://docs.python.org/3/tutorial/"],
      "intervalDays": 5,
      "easinessFactor": 2.5
    }
  ]
}
```

## Notification Endpoints

### POST /api/notifications/subscribe
**Purpose**: Subscribe to web push notifications

**Request**:
```json
{
  "endpoint": "https://fcm.googleapis.com/fcm/send/...",
  "keys": {
    "p256dh": "B...=",
    "auth": "B...="
  }
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Subscribed to notifications successfully"
}
```

## Error Handling

All endpoints return consistent error format:

```json
{
  "success": false,
  "error": "Error message description",
  "errorCode": "VALIDATION_ERROR"
}
```

**Express.js Error Middleware**:
```javascript
function errorHandler(err, req, res, next) {
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: err.message,
      errorCode: 'VALIDATION_ERROR'
    });
  }
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      success: false,
      error: "Authentication required",
      errorCode: 'AUTHENTICATION_ERROR'
    });
  }
  
  res.status(500).json({
    success: false,
    error: "Internal server error",
    errorCode: 'SERVER_ERROR'
  });
}
```

## Rate Limiting

Using `express-rate-limit`:

```javascript
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 requests per minute
  message: {
    success: false,
    error: "Too many authentication attempts",
    errorCode: 'RATE_LIMIT_EXCEEDED'
  }
});

const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: {
    success: false,
    error: "Rate limit exceeded",
    errorCode: 'RATE_LIMIT_EXCEEDED'
  }
});
```

## Input Validation

Using Joi schemas:

```javascript
const Joi = require('joi');

const createTopicSchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
  description: Joi.string().max(1000).optional(),
  links: Joi.array().items(Joi.string().uri()).optional(),
  initialDate: Joi.date().iso().max('now').required()
});

const createReviewSchema = Joi.object({
  topicId: Joi.number().integer().positive().required(),
  qualityRating: Joi.number().integer().min(0).max(5).required(),
  reviewTimeSeconds: Joi.number().integer().min(1).optional()
});
```

## CORS Configuration

For Next.js frontend:

```javascript
const cors = require('cors');

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://yourdomain.com' 
    : 'http://localhost:3000',
  credentials: true
}));
```

## Database Integration

Using sqlite3 with promises:

```javascript
const sqlite3 = require('sqlite3').verbose();

function runQuery(db, query, params = []) {
  return new Promise((resolve, reject) => {
    db.run(query, params, function(err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

function getQuery(db, query, params = []) {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}
```
