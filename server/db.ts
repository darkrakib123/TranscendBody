/**
 * TranscendBody - Database Connection and ORM Setup
 * 
 * This file configures the database connection using PostgreSQL and Drizzle ORM
 * for the personal transformation tracking application.
 * 
 * Features:
 * - PostgreSQL connection pool for efficient database connections
 * - Drizzle ORM configuration with schema
 * - Environment-based database URL configuration
 * - Type-safe database operations
 * - Graceful shutdown handling
 */

import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { drizzleSchema } from '../shared/schema.ts';
import dotenv from 'dotenv';

dotenv.config(); // Load .env

// Ensure DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set in .env");
}

// Create PostgreSQL connection pool
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create Drizzle instance with only table definitions
export const db = drizzle(pool, {
  schema: drizzleSchema,
  logger: process.env.NODE_ENV === 'development',
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Closing database pool...');
  await pool.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Closing database pool...');
  await pool.end();
  process.exit(0);
});
