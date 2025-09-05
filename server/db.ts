/**
 * TranscendBody - Database Connection and ORM Setup
 * 
 * This file configures the database connection using SQLite
 * and Drizzle ORM for the personal transformation tracking application.
 * 
 * Features:
 * - SQLite connection with better-sqlite3
 * - Drizzle ORM configuration with schema
 * - Type-safe database operations
 * - Automatic database file creation
 * - Graceful shutdown handling
 */

import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { drizzleSchema } from '../shared/schema.ts';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create SQLite database connection
const sqlite = new Database('transcendbody.db');

// Enable WAL mode for better performance
sqlite.pragma('journal_mode = WAL');

// Create Drizzle instance
export const db = drizzle(sqlite, {
  schema: drizzleSchema,
  logger: process.env.NODE_ENV === 'development',
});

// Run migrations on startup
try {
  migrate(db, { migrationsFolder: path.join(__dirname, '../drizzle') });
  console.log('Database migrations completed successfully');
} catch (error) {
  console.log('No migrations to run or migrations already applied');
}

console.log('Connected to SQLite database');

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Closing database connection...');
  sqlite.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Closing database connection...');
  sqlite.close();
  process.exit(0);
});