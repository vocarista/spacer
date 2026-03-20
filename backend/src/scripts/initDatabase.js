#!/usr/bin/env node

/**
 * Database initialization script for Spacer
 * Creates tables and sets up indexes for the spaced repetition system
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database path from environment or default
const dbPath = process.env.DATABASE_URL?.replace('sqlite:///', '') || './data/spacer.db';

async function initializeDatabase() {
  console.log('Initializing database at:', dbPath);
  
  // Ensure data directory exists
  const fs = require('fs');
  const dataDir = path.dirname(dbPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error opening database:', err.message);
      process.exit(1);
    }
    console.log('Connected to SQLite database');
  });

  // Enable foreign keys
  await runQuery(db, 'PRAGMA foreign_keys = ON');

  // Create tables
  await createTables(db);
  
  // Create indexes
  await createIndexes(db);
  
  console.log('Database initialization completed successfully');
  
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed');
    }
  });
}

function runQuery(db, sql) {
  return new Promise((resolve, reject) => {
    db.run(sql, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve(this);
      }
    });
  });
}

async function createTables(db) {
  console.log('Creating tables...');

  // Users table
  await runQuery(db, `
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

  // Topics table
  await runQuery(db, `
    CREATE TABLE IF NOT EXISTS topics (
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
    )
  `);

  // Reviews table
  await runQuery(db, `
    CREATE TABLE IF NOT EXISTS reviews (
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
    )
  `);

  // Notifications table
  await runQuery(db, `
    CREATE TABLE IF NOT EXISTS notifications (
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
    )
  `);

  // Push subscriptions table
  await runQuery(db, `
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      endpoint VARCHAR(500) NOT NULL,
      p256dh_key VARCHAR(255) NOT NULL,
      auth_key VARCHAR(255) NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `);

  console.log('Tables created successfully');
}

async function createIndexes(db) {
  console.log('Creating indexes...');

  // User indexes
  await runQuery(db, 'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');

  // Topic indexes
  await runQuery(db, 'CREATE INDEX IF NOT EXISTS idx_topics_user_id ON topics(user_id)');
  await runQuery(db, 'CREATE INDEX IF NOT EXISTS idx_topics_next_review ON topics(next_review_date)');
  await runQuery(db, 'CREATE INDEX IF NOT EXISTS idx_topics_user_review ON topics(user_id, next_review_date)');

  // Review indexes
  await runQuery(db, 'CREATE INDEX IF NOT EXISTS idx_reviews_topic_id ON reviews(topic_id)');
  await runQuery(db, 'CREATE INDEX IF NOT EXISTS idx_reviews_date ON reviews(review_date)');

  // Notification indexes
  await runQuery(db, 'CREATE INDEX IF NOT EXISTS idx_notifications_user_date ON notifications(user_id, scheduled_date)');
  await runQuery(db, 'CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status)');

  // Push subscription indexes
  await runQuery(db, 'CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id)');

  console.log('Indexes created successfully');
}

// Run initialization if called directly
if (require.main === module) {
  initializeDatabase().catch(console.error);
}

module.exports = { initializeDatabase };
