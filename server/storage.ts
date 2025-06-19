import {
  users,
  activities,
  dailyTrackers,
  trackerEntries,
  type User,
  type UpsertUser,
  type Activity,
  type InsertActivity,
  type DailyTracker,
  type InsertDailyTracker,
  type TrackerEntry,
  type InsertTrackerEntry,
  type TrackerEntryWithActivity,
  type DailyTrackerWithEntries,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  // User operations for traditional authentication
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUserRole(id: string, role: string): Promise<User>;
  
  // Activity operations
  getActivities(): Promise<Activity[]>;
  getActivityById(id: number): Promise<Activity | undefined>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  updateActivity(id: number, activity: Partial<InsertActivity>): Promise<Activity>;
  deleteActivity(id: number): Promise<boolean>;
  
  // Daily tracker operations
  getDailyTracker(userId: string, date: string): Promise<DailyTrackerWithEntries | undefined>;
  createDailyTracker(tracker: InsertDailyTracker): Promise<DailyTracker>;
  updateTrackerCompletion(trackerId: number, completionRate: number): Promise<void>;
  
  // Tracker entry operations
  createTrackerEntry(entry: InsertTrackerEntry): Promise<TrackerEntry>;
  updateTrackerEntryStatus(id: number, status: string): Promise<TrackerEntry>;
  deleteTrackerEntry(id: number): Promise<boolean>;
  
  // Statistics
  getUserStats(userId: string): Promise<{
    currentStreak: number;
    weeklyAverage: number;
    totalActivities: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        id: userId,
      })
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(users.createdAt);
  }

  async updateUserRole(id: string, role: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Activity operations
  async getActivities(): Promise<Activity[]> {
    return await db.select().from(activities).orderBy(activities.title);
  }

  async getActivityById(id: number): Promise<Activity | undefined> {
    const [activity] = await db.select().from(activities).where(eq(activities.id, id));
    return activity;
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    const [newActivity] = await db
      .insert(activities)
      .values(activity)
      .returning();
    return newActivity;
  }

  async updateActivity(id: number, activity: Partial<InsertActivity>): Promise<Activity> {
    const [updatedActivity] = await db
      .update(activities)
      .set(activity)
      .where(eq(activities.id, id))
      .returning();
    return updatedActivity;
  }

  async deleteActivity(id: number): Promise<boolean> {
    const result = await db.delete(activities).where(eq(activities.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Daily tracker operations
  async getDailyTracker(userId: string, date: string): Promise<DailyTrackerWithEntries | undefined> {
    const [tracker] = await db
      .select()
      .from(dailyTrackers)
      .where(and(eq(dailyTrackers.userId, userId), eq(dailyTrackers.date, date)));

    if (!tracker) return undefined;

    const entries = await db
      .select({
        id: trackerEntries.id,
        trackerId: trackerEntries.trackerId,
        activityId: trackerEntries.activityId,
        timeSlot: trackerEntries.timeSlot,
        status: trackerEntries.status,
        createdAt: trackerEntries.createdAt,
        updatedAt: trackerEntries.updatedAt,
        activity: activities,
      })
      .from(trackerEntries)
      .innerJoin(activities, eq(trackerEntries.activityId, activities.id))
      .where(eq(trackerEntries.trackerId, tracker.id));

    return {
      ...tracker,
      entries: entries as TrackerEntryWithActivity[],
    };
  }

  async createDailyTracker(tracker: InsertDailyTracker): Promise<DailyTracker> {
    const [newTracker] = await db
      .insert(dailyTrackers)
      .values(tracker)
      .returning();
    return newTracker;
  }

  async updateTrackerCompletion(trackerId: number, completionRate: number): Promise<void> {
    await db
      .update(dailyTrackers)
      .set({ completionRate })
      .where(eq(dailyTrackers.id, trackerId));
  }

  // Tracker entry operations
  async createTrackerEntry(entry: InsertTrackerEntry): Promise<TrackerEntry> {
    const [newEntry] = await db
      .insert(trackerEntries)
      .values(entry)
      .returning();
    return newEntry;
  }

  async updateTrackerEntryStatus(id: number, status: string): Promise<TrackerEntry> {
    const [updatedEntry] = await db
      .update(trackerEntries)
      .set({ status, updatedAt: new Date() })
      .where(eq(trackerEntries.id, id))
      .returning();
    return updatedEntry;
  }

  async deleteTrackerEntry(id: number): Promise<boolean> {
    const result = await db.delete(trackerEntries).where(eq(trackerEntries.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Statistics
  async getUserStats(userId: string): Promise<{
    currentStreak: number;
    weeklyAverage: number;
    totalActivities: number;
  }> {
    // This is a simplified implementation - in production you'd want more sophisticated streak calculation
    const recentTrackers = await db
      .select()
      .from(dailyTrackers)
      .where(eq(dailyTrackers.userId, userId))
      .orderBy(desc(dailyTrackers.date))
      .limit(30);

    // Calculate current streak (consecutive days with >0% completion)
    let currentStreak = 0;
    for (const tracker of recentTrackers) {
      if (tracker.completionRate > 0) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Calculate weekly average (last 7 days)
    const weekTrackers = recentTrackers.slice(0, 7);
    const weeklyAverage = weekTrackers.length > 0 
      ? Math.round(weekTrackers.reduce((sum, t) => sum + t.completionRate, 0) / weekTrackers.length)
      : 0;

    // Total completed activities - use a simpler approach
    const allCompletedEntries = await db
      .select()
      .from(trackerEntries)
      .innerJoin(dailyTrackers, eq(trackerEntries.trackerId, dailyTrackers.id))
      .where(and(
        eq(dailyTrackers.userId, userId),
        eq(trackerEntries.status, "completed")
      ));

    const totalActivities = allCompletedEntries.length;

    return {
      currentStreak,
      weeklyAverage,
      totalActivities,
    };
  }
}

export const storage = new DatabaseStorage();
