/**
 * Database Connection Configuration
 * 
 * This module establishes the connection to the PostgreSQL database using
 * Neon serverless technology with Drizzle ORM. It provides a configured
 * database instance that can be imported throughout the application.
 * 
 * Configuration:
 * - Uses Neon serverless PostgreSQL for scalability
 * - WebSocket constructor for optimal connection handling
 * - Includes complete schema for type-safe operations
 * - Environment-based connection string
 * 
 * Security:
 * - DATABASE_URL is required and validated
 * - Connection pooling for optimal performance
 * - Proper error handling for connection failures
 */

import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure Neon for WebSocket connections
neonConfig.webSocketConstructor = ws;

// Validate required environment variables
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL environment variable is required. Please ensure the database is properly configured."
  );
}

// Create connection pool with proper configuration
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  // Additional pool configuration for optimal performance
  max: 20, // Maximum number of connections in pool
  idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
  connectionTimeoutMillis: 2000, // Timeout after 2 seconds if no connection available
});

// Initialize Drizzle ORM with schema and connection pool
export const db = drizzle({ 
  client: pool, 
  schema,
  // Enable query logging in development
  logger: process.env.NODE_ENV === 'development'
});

// Graceful shutdown handling
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