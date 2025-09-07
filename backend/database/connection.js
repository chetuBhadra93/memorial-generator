import sqlite3 from 'sqlite3';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class Database {
  constructor() {
    this.db = null;
    this.isConnected = false;
  }

  /**
   * Initialize database connection and create tables
   */
  async initialize() {
    return new Promise((resolve, reject) => {
      try {
        // Ensure database directory exists
        const dbPath = path.join(process.cwd(), 'data');
        if (!fs.existsSync(dbPath)) {
          fs.mkdirSync(dbPath, { recursive: true });
        }

        // Open database connection
        const dbFile = path.join(dbPath, 'memorial_generator.db');
        this.db = new sqlite3.Database(dbFile, (err) => {
          if (err) {
            console.error('❌ Database connection failed:', err);
            reject(err);
            return;
          }

          console.log('📄 Database connected');
          
          // Enable foreign keys
          this.db.run('PRAGMA foreign_keys = ON;', (err) => {
            if (err) {
              console.error('❌ Failed to enable foreign keys:', err);
              reject(err);
              return;
            }

            // Create tables from schema
            try {
              const schemaPath = path.join(__dirname, 'schema.sql');
              const schema = fs.readFileSync(schemaPath, 'utf8');
              
              this.db.exec(schema, (err) => {
                if (err) {
                  console.error('❌ Schema creation failed:', err);
                  reject(err);
                  return;
                }

                // Seed initial data
                this.seedInitialData().then(() => {
                  this.isConnected = true;
                  console.log('✅ Database initialized successfully');
                  resolve(this.db);
                }).catch(reject);
              });
            } catch (error) {
              console.error('❌ Failed to read schema:', error);
              reject(error);
            }
          });
        });

      } catch (error) {
        console.error('❌ Database initialization failed:', error);
        reject(error);
      }
    });
  }

  /**
   * Seed initial cultural knowledge and quality benchmarks
   */
  async seedInitialData() {
    return new Promise((resolve) => {
      // For now, skip seeding to get the basic structure working
      // We can add seeding later once the basic database connection is stable
      console.log('✅ Database seeding completed (skipped for initial setup)');
      resolve();
    });
  }

  /**
   * Get database instance
   */
  getDb() {
    if (!this.isConnected) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.db;
  }

  /**
   * Close database connection
   */
  async close() {
    return new Promise((resolve) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            console.error('Error closing database:', err);
          } else {
            console.log('Database connection closed');
          }
          this.isConnected = false;
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * Helper method to run queries with promises
   */
  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ lastID: this.lastID, changes: this.changes });
        }
      });
    });
  }

  /**
   * Helper method to get single row with promises
   */
  get(sql, params = []) {
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
   * Helper method to get all rows with promises
   */
  all(sql, params = []) {
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
}

// Export singleton instance
const database = new Database();
export default database;