/**
 * TranscendBody - Database Connection and ORM Setup
 * 
 * This file configures the database connection using PostgreSQL
 * and Drizzle ORM for the personal transformation tracking application.
 * 
 * Features:
 * - PostgreSQL connection with environment-based configuration
 * - Drizzle ORM configuration with schema
 * - Type-safe database operations
 * - Connection pooling and error handling
 * - Graceful shutdown handling
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { drizzleSchema } from '../shared/schema.js';
import dotenv from 'dotenv';

dotenv.config();

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create Drizzle instance
export const db = drizzle(pool, {
  schema: drizzleSchema,
  logger: process.env.NODE_ENV === 'development',
});

// Test connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('PostgreSQL connection error:', err);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Closing database connection...');
  await pool.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Closing database connection...');
  await pool.end();
  process.exit(0);
});