/**
 * TranscendBody - Database Connection and ORM Setup
 * 
 * This file configures the database connection using libsql
 * and Drizzle ORM for the personal transformation tracking application.
 * 
 * Features:
 * - libsql connection (WebContainer compatible)
 * - Drizzle ORM configuration with schema
 * - Type-safe database operations
 * - Automatic database file creation
 * - Graceful shutdown handling
 */

import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { drizzleSchema } from '../shared/schema.js';
import { migrate } from 'drizzle-orm/libsql/migrator';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create libsql database connection
const client = createClient({
  url: 'file:transcendbody.db'
});

// Create Drizzle instance
export const db = drizzle(client, {
  schema: drizzleSchema,
  logger: process.env.NODE_ENV === 'development',
});

// Run migrations on startup
try {
  await migrate(db, { migrationsFolder: path.join(__dirname, '../drizzle') });
  console.log('Database migrations completed successfully');
} catch (error) {
  console.log('No migrations to run or migrations already applied');
}

console.log('Connected to libsql database');

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Closing database connection...');
  client.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Closing database connection...');
  client.close();
  process.exit(0);
});