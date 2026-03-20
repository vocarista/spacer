# Data Model: Spaced Repetition System

**Date**: 2025-03-15  
**Purpose**: Entity definitions and relationships for spaced-repetition system (Express.js + Next.js)

## Entity Overview

The system consists of four main entities: User, Topic, Review, and Notification. All entities are stored in SQLite database with proper relationships and indexing. The data model is designed for use with Node.js sqlite3 library.

## User Entity

**Purpose**: Stores user authentication and preferences

```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    timezone VARCHAR(50) DEFAULT 'UTC',
    notification_enabled BOOLEAN DEFAULT TRUE,
    notification_time TIME DEFAULT '09:00:00',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Node.js Model Structure**:
```javascript
class User {
  constructor(id, email, passwordHash, timezone, notificationEnabled, notificationTime, createdAt, updatedAt) {
    this.id = id;
    this.email = email;
    this.passwordHash = passwordHash;
    this.timezone = timezone;
    this.notificationEnabled = notificationEnabled;
    this.notificationTime = notificationTime;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}
```

**Fields**:
- `id`: Primary key
- `email`: Unique email address for authentication
- `password_hash`: bcrypt hashed password
- `timezone`: User's timezone for scheduling
- `notification_enabled`: Whether user receives notifications
- `notification_time`: Daily notification time
- `created_at`, `updated_at`: Timestamps (SQLite DATETIME)

**Validation Rules**:
- Email must be valid format (using Joi email validation)
- Password minimum 8 characters
- Timezone must be valid IANA timezone
- Notification time must be valid time format

## Topic Entity

**Purpose**: Stores learning topics and their metadata

```sql
CREATE TABLE topics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    links TEXT, -- JSON array of URLs
    initial_date DATE NOT NULL,
    next_review_date DATE NOT NULL,
    interval_days INTEGER DEFAULT 1,
    easiness_factor REAL DEFAULT 2.5,
    repetition_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);
```

**Node.js Model Structure**:
```javascript
class Topic {
  constructor(id, userId, name, description, links, initialDate, nextReviewDate, intervalDays, easinessFactor, repetitionCount, createdAt, updatedAt) {
    this.id = id;
    this.userId = userId;
    this.name = name;
    this.description = description;
    this.links = links; // Parsed JSON array
    this.initialDate = initialDate;
    this.nextReviewDate = nextReviewDate;
    this.intervalDays = intervalDays;
    this.easinessFactor = easinessFactor;
    this.repetitionCount = repetitionCount;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}
```

**Fields**:
- `id`: Primary key
- `user_id`: Foreign key to users table
- `name`: Topic name (required)
- `description`: Topic description (optional)
- `links`: JSON array of study material URLs
- `initial_date`: When topic was first created
- `next_review_date`: When topic should be reviewed next
- `interval_days`: Current review interval in days
- `easiness_factor`: SM-2 easiness factor (EF)
- `repetition_count`: Number of successful reviews
- `created_at`, `updated_at`: Timestamps

**Validation Rules**:
- Name must be non-empty and unique per user
- Links must be valid JSON array of URLs
- Initial date cannot be future date
- Next review date must be valid date
- Interval must be positive integer
- Easiness factor must be between 1.3 and 2.5

**State Transitions**:
1. **Created**: Initial state, interval = 1 day
2. **Reviewed**: Interval updated based on SM-2 algorithm
3. **Skipped**: Next review date moved forward
4. **Reset**: Interval reset to 1 day

## Review Entity

**Purpose**: Tracks individual review sessions and performance

```sql
CREATE TABLE reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    topic_id INTEGER NOT NULL,
    review_date DATE NOT NULL,
    quality_rating INTEGER NOT NULL CHECK (quality_rating >= 0 AND quality_rating <= 5),
    previous_interval INTEGER,
    new_interval INTEGER,
    previous_easiness_factor REAL,
    new_easiness_factor REAL,
    review_time_seconds INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (topic_id) REFERENCES topics (id) ON DELETE CASCADE
);
```

**Node.js Model Structure**:
```javascript
class Review {
  constructor(id, topicId, reviewDate, qualityRating, previousInterval, newInterval, previousEasinessFactor, newEasinessFactor, reviewTimeSeconds, createdAt) {
    this.id = id;
    this.topicId = topicId;
    this.reviewDate = reviewDate;
    this.qualityRating = qualityRating;
    this.previousInterval = previousInterval;
    this.newInterval = newInterval;
    this.previousEasinessFactor = previousEasinessFactor;
    this.newEasinessFactor = newEasinessFactor;
    this.reviewTimeSeconds = reviewTimeSeconds;
    this.createdAt = createdAt;
  }
}
```

**SM-2 Algorithm Implementation**:
```javascript
// SM-2 algorithm in JavaScript
function calculateNextReview(currentInterval, easinessFactor, repetitionCount, qualityRating) {
  let newInterval = currentInterval;
  let newEasinessFactor = easinessFactor;
  
  if (qualityRating >= 3) {
    if (repetitionCount === 0) {
      newInterval = 1;
    } else if (repetitionCount === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(currentInterval * easinessFactor);
    }
  } else {
    newInterval = 1;
  }
  
  newEasinessFactor = easinessFactor + (0.1 - (5 - qualityRating) * (0.08 + (5 - qualityRating) * 0.02));
  
  if (newEasinessFactor < 1.3) newEasinessFactor = 1.3;
  
  return {
    interval: newInterval,
    easinessFactor: newEasinessFactor
  };
}
```

## Notification Entity

**Purpose**: Tracks scheduled and sent notifications

```sql
CREATE TABLE notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    topic_id INTEGER,
    notification_type VARCHAR(50) NOT NULL, -- 'daily_review', 'topic_due'
    scheduled_date DATE NOT NULL,
    sent_date DATETIME,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'failed'
    message_content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (topic_id) REFERENCES topics (id) ON DELETE CASCADE
);
```

**Node.js Model Structure**:
```javascript
class Notification {
  constructor(id, userId, topicId, notificationType, scheduledDate, sentDate, status, messageContent, createdAt) {
    this.id = id;
    this.userId = userId;
    this.topicId = topicId;
    this.notificationType = notificationType;
    this.scheduledDate = scheduledDate;
    this.sentDate = sentDate;
    this.status = status;
    this.messageContent = messageContent;
    this.createdAt = createdAt;
  }
}
```

## Push Subscription Entity

**Purpose**: Stores web push subscription information

```sql
CREATE TABLE push_subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    endpoint VARCHAR(500) NOT NULL,
    p256dh_key VARCHAR(255) NOT NULL,
    auth_key VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);
```

**Node.js Model Structure**:
```javascript
class PushSubscription {
  constructor(id, userId, endpoint, p256dhKey, authKey, createdAt) {
    this.id = id;
    this.userId = userId;
    this.endpoint = endpoint;
    this.p256dhKey = p256dhKey;
    this.authKey = authKey;
    this.createdAt = createdAt;
  }
}
```

## Indexes

**Performance optimization indexes**:

```sql
-- User queries
CREATE INDEX idx_users_email ON users(email);

-- Topic queries
CREATE INDEX idx_topics_user_id ON topics(user_id);
CREATE INDEX idx_topics_next_review ON topics(next_review_date);
CREATE INDEX idx_topics_user_review ON topics(user_id, next_review_date);

-- Review queries
CREATE INDEX idx_reviews_topic_id ON reviews(topic_id);
CREATE INDEX idx_reviews_date ON reviews(review_date);

-- Notification queries
CREATE INDEX idx_notifications_user_date ON notifications(user_id, scheduled_date);
CREATE INDEX idx_notifications_status ON notifications(status);

-- Push subscription queries
CREATE INDEX idx_push_subscriptions_user_id ON push_subscriptions(user_id);
```

## Database Connection (Node.js)

```javascript
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
  constructor(dbPath = './data/spacer.db') {
    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err.message);
      } else {
        console.log('Connected to SQLite database');
        this.initialize();
      }
    });
  }
  
  async initialize() {
    // Create tables
    await this.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        timezone VARCHAR(50) DEFAULT 'UTC',
        notification_enabled BOOLEAN DEFAULT TRUE,
        notification_time TIME DEFAULT '09:00:00',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create other tables...
    // Create indexes...
  }
}
```

## Data Integrity

**Constraints**:
1. Foreign key constraints with CASCADE delete
2. Unique constraints on user emails
3. Check constraints on numeric ranges
4. Non-null constraints on required fields

**Transactions**:
```javascript
async function createTopicWithReview(userId, topicData) {
  const db = new Database();
  
  try {
    await db.beginTransaction();
    
    // Create topic
    const topic = await db.createTopic(topicData);
    
    // Create initial review record if needed
    if (topicData.initialReview) {
      await db.createReview({
        topicId: topic.id,
        reviewDate: new Date(),
        qualityRating: topicData.qualityRating
      });
    }
    
    await db.commit();
    return topic;
  } catch (error) {
    await db.rollback();
    throw error;
  }
}
```

## Privacy Considerations

**Sensitive data protection**:
1. Password hashes never exposed in logs
2. Email addresses used only for authentication
3. Notification content minimized to avoid data leakage
4. Session data stored securely

**Data retention**:
1. Review history retained indefinitely for algorithm effectiveness
2. Notification history cleaned after 30 days
3. Push subscriptions removed when invalid
4. User can delete all data on request

## Migration Strategy

**Custom Migration Scripts**:
```javascript
// migrations/001_initial_schema.js
module.exports = {
  up: async (db) => {
    await db.run(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        -- ... other fields
      )
    `);
  },
  
  down: async (db) => {
    await db.run('DROP TABLE users');
  }
};
```

**Migration Runner**:
```javascript
async function runMigrations(db) {
  const migrations = require('./migrations');
  
  for (const [version, migration] of Object.entries(migrations)) {
    const applied = await db.get(
      'SELECT 1 FROM schema_migrations WHERE version = ?',
      [version]
    );
    
    if (!applied) {
      await migration.up(db);
      await db.run(
        'INSERT INTO schema_migrations (version) VALUES (?)',
        [version]
      );
    }
  }
}
