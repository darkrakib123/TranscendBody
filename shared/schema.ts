/**
 * TranscendBody - Database Schema
 * 
 * This file defines the database schema using Drizzle ORM for SQLite.
 * It includes all tables and relationships for the personal transformation
 * tracking application.
 */

import { sqliteTable, text, integer, blob } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for express-session
const sessions = sqliteTable("sessions", {
  sid: text("sid").primaryKey(),
  sess: text("sess").notNull(),
  expire: integer("expire").notNull(),
});

// Users table - core user information and gamification data
const users = sqliteTable("users", {
  id: text("id").primaryKey().notNull(),
  email: text("email").unique().notNull(),
  password: text("password").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  preferredName: text("preferred_name"),
  gender: text("gender"),
  age: integer("age"),
  role: text("role").notNull().default("user"),
  plan: text("plan"),
  accountabilityLevel: text("accountability_level"),
  tier: text("tier"),
  isAdmin: integer("is_admin", { mode: "boolean" }).default(false),
  activitiesCount: integer("activities_count").default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

// Global activities table - master list of all available activities
const globalActivities = sqliteTable("global_activities", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull(), // workout, nutrition, recovery, mindset
  timeOfDay: text("time_of_day").notNull(), // morning, afternoon, evening, night
  isCustom: integer("is_custom", { mode: "boolean" }).default(false),
  difficulty: text("difficulty"), // easy, medium, hard
  createdBy: text("created_by").references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

// Daily trackers table - one record per user per day
const dailyTrackers = sqliteTable("daily_trackers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().references(() => users.id),
  date: text("date").notNull(), // YYYY-MM-DD format
  completionRate: integer("completion_rate").default(0), // 0-100
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

// Tracker entries table - individual activity assignments and completions
const trackerEntries = sqliteTable("tracker_entries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  trackerId: integer("tracker_id").notNull().references(() => dailyTrackers.id),
  activityId: integer("activity_id").notNull().references(() => globalActivities.id),
  timeSlot: text("time_slot").notNull(), // morning, afternoon, evening, night
  status: text("status").notNull().default("pending"), // pending, completed
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

// Define relationships
const usersRelations = relations(users, ({ many }) => ({
  dailyTrackers: many(dailyTrackers),
  createdActivities: many(globalActivities),
}));

const globalActivitiesRelations = relations(globalActivities, ({ one, many }) => ({
  creator: one(users, {
    fields: [globalActivities.createdBy],
    references: [users.id],
  }),
  trackerEntries: many(trackerEntries),
}));

const dailyTrackersRelations = relations(dailyTrackers, ({ one, many }) => ({
  user: one(users, {
    fields: [dailyTrackers.userId],
    references: [users.id],
  }),
  entries: many(trackerEntries),
}));

const trackerEntriesRelations = relations(trackerEntries, ({ one }) => ({
  tracker: one(dailyTrackers, {
    fields: [trackerEntries.trackerId],
    references: [dailyTrackers.id],
  }),
  activity: one(globalActivities, {
    fields: [trackerEntries.activityId],
    references: [globalActivities.id],
  }),
}));

// Export schema for Drizzle
export const drizzleSchema = {
  sessions,
  users,
  globalActivities,
  dailyTrackers,
  trackerEntries,
  usersRelations,
  globalActivitiesRelations,
  dailyTrackersRelations,
  trackerEntriesRelations,
};

// Export tables for direct use
export {
  sessions,
  users,
  globalActivities,
  dailyTrackers,
  trackerEntries,
};

// Validation schemas using Zod
export const insertUserSchema = createInsertSchema(users);
export const insertGlobalActivitySchema = createInsertSchema(globalActivities);
export const insertDailyTrackerSchema = createInsertSchema(dailyTrackers);
export const insertTrackerEntrySchema = createInsertSchema(trackerEntries);

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type GlobalActivity = typeof globalActivities.$inferSelect;
export type NewGlobalActivity = typeof globalActivities.$inferInsert;
export type DailyTracker = typeof dailyTrackers.$inferSelect;
export type NewDailyTracker = typeof dailyTrackers.$inferInsert;
export type TrackerEntry = typeof trackerEntries.$inferSelect;
export type NewTrackerEntry = typeof trackerEntries.$inferInsert;