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

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { drizzleSchema } from '../shared/schema.ts';
import dotenv from 'dotenv';

dotenv.config(); // Load .env

// Ensure DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set in .env");
}

// Create PostgreSQL connection
const sql = neon(process.env.DATABASE_URL);

// Create Drizzle instance
export const db = drizzle(sql, {
  schema: drizzleSchema,
  logger: process.env.NODE_ENV === 'development',
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Closing database connection...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Closing database connection...');
  process.exit(0);
});
