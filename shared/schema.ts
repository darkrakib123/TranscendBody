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

// Enhanced validation constants with proper typing
// Define allowed values for validation
export const allowedPlans = ['trial', 'basic', 'pro'] as const;
export const allowedTiers = ['bronze', 'silver', 'gold'] as const;
export const allowedAccountabilityLevels = ['beginner', 'intermediate', 'master'] as const;
export const allowedCategories = ['workout', 'nutrition', 'recovery', 'mindset'] as const;
export const allowedTimeSlots = ['morning', 'afternoon', 'evening', 'night'] as const;
export const allowedDifficulties = ['easy', 'medium', 'hard'] as const;
export const allowedRoles = ['user', 'admin'] as const;
export const allowedStatuses = ['pending', 'completed', 'skipped'] as const;
export const allowedGenders = ['male', 'female', 'nonbinary', 'other', 'prefer-not-to-say'] as const;

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
  gender: text("gender", { enum: allowedGenders }),
  age: integer("age"),
  role: text("role", { enum: allowedRoles }).notNull().default("user"),
  plan: text("plan", { enum: allowedPlans }).default("trial"),
  accountabilityLevel: text("accountability_level", { enum: allowedAccountabilityLevels }).default("beginner"),
  tier: text("tier", { enum: allowedTiers }).default("bronze"),
  isAdmin: integer("is_admin", { mode: "boolean" }).default(false),
  activitiesCount: integer("activities_count").default(0),
  lastLoginAt: integer("last_login_at", { mode: "timestamp" }),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

// Global activities table - master list of all available activities
const globalActivities = sqliteTable("global_activities", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category", { enum: allowedCategories }).notNull(),
  timeOfDay: text("time_of_day", { enum: allowedTimeSlots }).notNull(),
  isCustom: integer("is_custom", { mode: "boolean" }).default(false),
  difficulty: text("difficulty", { enum: allowedDifficulties }).default("medium"),
  createdBy: text("created_by").references(() => users.id),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  usageCount: integer("usage_count").default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

// Daily trackers table - one record per user per day
const dailyTrackers = sqliteTable("daily_trackers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().references(() => users.id),
  date: text("date").notNull(), // YYYY-MM-DD format
  completionRate: integer("completion_rate").default(0), // 0-100
  totalActivities: integer("total_activities").default(0),
  completedActivities: integer("completed_activities").default(0),
  streak: integer("streak").default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

// Tracker entries table - individual activity assignments and completions
const trackerEntries = sqliteTable("tracker_entries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  trackerId: integer("tracker_id").notNull().references(() => dailyTrackers.id),
  activityId: integer("activity_id").notNull().references(() => globalActivities.id),
  timeSlot: text("time_slot", { enum: allowedTimeSlots }).notNull(),
  status: text("status", { enum: allowedStatuses }).notNull().default("pending"),
  completedAt: integer("completed_at", { mode: "timestamp" }),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

// User preferences table for customization
const userPreferences = sqliteTable("user_preferences", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().references(() => users.id),
  theme: text("theme").default("light"),
  notifications: integer("notifications", { mode: "boolean" }).default(true),
  timezone: text("timezone").default("UTC"),
  language: text("language").default("en"),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

// Define relationships
const usersRelations = relations(users, ({ many }) => ({
  dailyTrackers: many(dailyTrackers),
  createdActivities: many(globalActivities),
  preferences: many(userPreferences),
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

const userPreferencesRelations = relations(userPreferences, ({ one }) => ({
  user: one(users, {
    fields: [userPreferences.userId],
    references: [users.id],
  }),
}));

// Export schema for Drizzle
export const drizzleSchema = {
  sessions,
  users,
  globalActivities,
  dailyTrackers,
  trackerEntries,
  userPreferences,
  usersRelations,
  globalActivitiesRelations,
  dailyTrackersRelations,
  trackerEntriesRelations,
  userPreferencesRelations,
};

// Export tables for direct use
export {
  sessions,
  users,
  globalActivities,
  dailyTrackers,
  trackerEntries,
  userPreferences,
};

// Validation schemas using Zod
export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  age: z.number().min(13).max(120).optional(),
  plan: z.enum(allowedPlans).optional(),
  tier: z.enum(allowedTiers).optional(),
  accountabilityLevel: z.enum(allowedAccountabilityLevels).optional(),
  gender: z.enum(allowedGenders).optional(),
  role: z.enum(allowedRoles).optional(),
});

export const insertGlobalActivitySchema = createInsertSchema(globalActivities, {
  title: z.string().min(1, "Title is required"),
  category: z.enum(allowedCategories),
  timeOfDay: z.enum(allowedTimeSlots),
  difficulty: z.enum(allowedDifficulties).optional(),
});

export const insertDailyTrackerSchema = createInsertSchema(dailyTrackers, {
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  completionRate: z.number().min(0).max(100),
});

export const insertTrackerEntrySchema = createInsertSchema(trackerEntries, {
  timeSlot: z.enum(allowedTimeSlots),
  status: z.enum(allowedStatuses),
});

export const insertUserPreferencesSchema = createInsertSchema(userPreferences);

// Additional validation schemas
export const updateUserSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  preferredName: z.string().min(1).optional(),
  gender: z.enum(allowedGenders).optional(),
  age: z.number().min(13).max(120).optional(),
  plan: z.enum(allowedPlans).optional(),
  tier: z.enum(allowedTiers).optional(),
  accountabilityLevel: z.enum(allowedAccountabilityLevels).optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type GlobalActivity = typeof globalActivities.$inferSelect;
export type NewGlobalActivity = typeof globalActivities.$inferInsert;
export type DailyTracker = typeof dailyTrackers.$inferSelect;
export type NewDailyTracker = typeof dailyTrackers.$inferInsert;
export type TrackerEntry = typeof trackerEntries.$inferSelect;
export type NewTrackerEntry = typeof trackerEntries.$inferInsert;
export type UserPreferences = typeof userPreferences.$inferSelect;
export type NewUserPreferences = typeof userPreferences.$inferInsert;

// Additional type exports for better type safety
export type Activity = GlobalActivity;
export type InsertActivity = NewGlobalActivity;
export type UpsertUser = Partial<User> & { id: string };
export type TrackerEntryWithActivity = TrackerEntry & { activity: GlobalActivity };
export type DailyTrackerWithEntries = DailyTracker & { entries: TrackerEntryWithActivity[] };
export type UserWithPreferences = User & { preferences?: UserPreferences };

// API Response types
export type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

export type PaginatedResponse<T = any> = ApiResponse<{
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}>;

// Dashboard types
export type DashboardStats = {
  currentStreak: number;
  weeklyAverage: number;
  totalActivities: number;
  completionRate: number;
  tier: string;
  accountabilityLevel: string;
  daysToNextLevel: number;
  recentActivities: TrackerEntryWithActivity[];
};