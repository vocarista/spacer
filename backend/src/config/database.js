/**
 * Database configuration and connection management
 * Provides SQLite database connection with proper configuration
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

class Database {
  constructor() {
    this.db = null;
    this.dbPath = process.env.DATABASE_URL?.replace('sqlite:///', '') || './data/spacer.db';
  }

  /**
   * Initialize database connection
   */
  async connect() {
    return new Promise((resolve, reject) => {
      // Ensure data directory exists
      const fs = require('fs');
      const dataDir = path.dirname(this.dbPath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('Error opening database:', err.message);
          reject(err);
        } else {
          console.log('Connected to SQLite database at:', this.dbPath);
          
          // Enable foreign keys
          this.db.run('PRAGMA foreign_keys = ON', (err) => {
            if (err) {
              console.error('Error enabling foreign keys:', err.message);
              reject(err);
            } else {
              resolve();
            }
          });
        }
      });
    });
  }

  /**
   * Close database connection
   */
  async close() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            console.error('Error closing database:', err.message);
            reject(err);
          } else {
            console.log('Database connection closed');
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * Execute a query and return results
   */
  async all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  /**
   * Execute a query and return the first result
   */
  async get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  /**
   * Execute a query and return the run result
   */
  async run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({
            id: this.lastID,
            changes: this.changes
          });
        }
      });
    });
  }

  /**
   * Begin transaction
   */
  async beginTransaction() {
    return this.run('BEGIN TRANSACTION');
  }

  /**
   * Commit transaction
   */
  async commit() {
    return this.run('COMMIT');
  }

  /**
   * Rollback transaction
   */
  async rollback() {
    return this.run('ROLLBACK');
  }

  /**
   * Execute multiple queries in a transaction
   */
  async transaction(queries) {
    await this.beginTransaction();
    
    try {
      const results = [];
      for (const query of queries) {
        const result = await this.run(query.sql, query.params);
        results.push(result);
      }
      await this.commit();
      return results;
    } catch (error) {
      await this.rollback();
      throw error;
    }
  }

  /**
   * Check if database is connected
   */
  isConnected() {
    return this.db !== null;
  }

  /**
   * Get database instance for direct access (use with caution)
   */
  getDB() {
    return this.db;
  }
}

// Create singleton instance
const database = new Database();

// Auto-connect when module is loaded
database.connect().catch(console.error);

// Handle process exit
process.on('SIGINT', async () => {
  await database.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await database.close();
  process.exit(0);
});

module.exports = database;
