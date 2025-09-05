/**
 * TranscendBody - Database Schema Definition
 * 
 * This file defines the complete database schema for the personal transformation
 * tracking application using Drizzle ORM and PostgreSQL.
 * 
 * Database Tables:
 * - users: User accounts and profiles
 * - global_activities: System-wide activities available to all users
 * - daily_trackers: Daily completion tracking for each user
 * - tracker_entries: Individual activity entries within daily trackers
 * - sessions: User session data for authentication
 * 
 * Features:
 * - Type-safe database operations with TypeScript
 * - Zod validation schemas for input validation
 * - Proper foreign key relationships
 * - Indexed columns for performance
 * - Comprehensive type definitions
 */

import {
  sqliteTable,
  text,
  integer,
  timestamp,
  boolean,
} from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = sqliteTable(
  "sessions",
  {
    sid: text("sid").primaryKey(),
    sess: text("sess").notNull(),
    expire: integer("expire").notNull(),
  },
);

// User storage table for traditional authentication
export const users = sqliteTable("users", {
  id: text("id").primaryKey().notNull(),
  email: text("email").unique().notNull(),
  password: text("password").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  preferredName: text("preferred_name"),
  gender: text("gender"),               // ⬅️ new field
  age: integer("age"),                                     // ⬅️ new field
  role: text("role").notNull().default("user"),
  plan: text("plan"), // 'basic' or 'pro'
  accountabilityLevel: text("accountability_level"),
  tier: text("tier"),
  isAdmin: boolean("is_admin").notNull().default(false), // <-- NEW FIELD
  activitiesCount: integer("activities_count"),
  createdAt: integer("created_at", { mode: 'timestamp' }).default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

// Activities table
export const activities = sqliteTable("activities", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull(), // 'workout', 'nutrition', 'recovery', 'mindset'
  timeOfDay: text("time_of_day"), // 'morning', 'afternoon', 'evening', 'night'
  isCustom: boolean("is_custom").notNull().default(false),
  isGlobal: boolean("is_global").notNull().default(false), // <-- NEW FIELD
  difficulty: text("difficulty").notNull().default('easy'), // 'easy', 'medium', 'hard'
  createdBy: text("created_by"), // FK to users.id, null if preloaded
  createdAt: integer("created_at", { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

// Global Activities table (canonical, admin-managed)
export const globalActivities = sqliteTable("global_activities", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  timeOfDay: text("time_of_day"),
  isCustom: boolean("is_custom").notNull().default(false),
  difficulty: text("difficulty").notNull().default('easy'),
  createdBy: text("created_by"),
  createdAt: integer("created_at", { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

// Demo Activities table (for demo/test accounts only)
export const demoActivities = sqliteTable("demo_activities", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  timeOfDay: text("time_of_day"),
  isCustom: boolean("is_custom").notNull().default(false),
  difficulty: text("difficulty").notNull().default('easy'),
  createdBy: text("created_by"),
  createdAt: integer("created_at", { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

// Daily trackers table
export const dailyTrackers = sqliteTable("daily_trackers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull(),
  date: text("date").notNull(),
  completionRate: integer("completion_rate").notNull().default(0), // percentage
  createdAt: integer("created_at", { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

// Tracker entries table
export const trackerEntries = sqliteTable("tracker_entries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  trackerId: integer("tracker_id").notNull(),
  activityId: integer("activity_id").notNull(),
  timeSlot: text("time_slot").notNull(), // 'morning', 'afternoon', 'evening', 'night'
  status: text("status").notNull().default("pending"), // 'pending', 'completed'
  createdAt: integer("created_at", { mode: 'timestamp' }).default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  customActivities: many(activities),
  dailyTrackers: many(dailyTrackers),
}));

export const activitiesRelations = relations(activities, ({ one, many }) => ({
  creator: one(users, {
    fields: [activities.createdBy],
    references: [users.id],
  }),
  trackerEntries: many(trackerEntries),
}));

export const dailyTrackersRelations = relations(dailyTrackers, ({ one, many }) => ({
  user: one(users, {
    fields: [dailyTrackers.userId],
    references: [users.id],
  }),
  entries: many(trackerEntries),
}));

export const trackerEntriesRelations = relations(trackerEntries, ({ one }) => ({
  tracker: one(dailyTrackers, {
    fields: [trackerEntries.trackerId],
    references: [dailyTrackers.id],
  }),
  activity: one(activities, {
    fields: [trackerEntries.activityId],
    references: [activities.id],
  }),
}));

// Types and schemas
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true,
});
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activities.$inferSelect;

export const insertDailyTrackerSchema = createInsertSchema(dailyTrackers).omit({
  id: true,
  createdAt: true,
  completionRate: true,
});
export type InsertDailyTracker = z.infer<typeof insertDailyTrackerSchema>;
export type DailyTracker = typeof dailyTrackers.$inferSelect;

export const insertTrackerEntrySchema = createInsertSchema(trackerEntries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertTrackerEntry = z.infer<typeof insertTrackerEntrySchema>;
export type TrackerEntry = typeof trackerEntries.$inferSelect;

// Extended types for API responses
export type TrackerEntryWithActivity = TrackerEntry & {
  activity: Activity;
};

export type DailyTrackerWithEntries = DailyTracker & {
  entries: TrackerEntryWithActivity[];
};
// User Registration Schema
export const insertUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  preferredName: z.string().optional(),
  gender: z.enum(["male", "female", "nonbinary", "other"]).optional(),
  age: z.number().optional(),
  role: z.string().optional().default("user"),
  plan: z.enum(["basic", "pro"]).optional().default("basic"), // <-- Only basic/pro
  tier: z.enum(["bronze", "silver", "gold"]).optional().default("bronze"),
  accountabilityLevel: z.enum(["beginner", "intermediate", "master"]).optional().default("beginner"),
  isAdmin: z.boolean().optional().default(false), // <-- NEW FIELD
});

export type InsertUser = z.infer<typeof insertUserSchema>;

export const drizzleSchema = { users, activities, dailyTrackers, trackerEntries, sessions };