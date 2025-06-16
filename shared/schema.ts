import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  boolean,
  date,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull().default("user"), // 'admin' or 'user'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Activities table
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  category: varchar("category").notNull(), // 'workout', 'nutrition', 'recovery', 'mindset'
  isCustom: boolean("is_custom").notNull().default(false),
  createdBy: varchar("created_by"), // FK to users.id, null if preloaded
  createdAt: timestamp("created_at").defaultNow(),
});

// Daily trackers table
export const dailyTrackers = pgTable("daily_trackers", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  date: date("date").notNull(),
  completionRate: serial("completion_rate").default(0), // percentage
  createdAt: timestamp("created_at").defaultNow(),
});

// Tracker entries table
export const trackerEntries = pgTable("tracker_entries", {
  id: serial("id").primaryKey(),
  trackerId: serial("tracker_id").notNull(),
  activityId: serial("activity_id").notNull(),
  timeSlot: varchar("time_slot").notNull(), // 'morning', 'afternoon', 'evening'
  status: varchar("status").notNull().default("pending"), // 'pending', 'completed'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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
