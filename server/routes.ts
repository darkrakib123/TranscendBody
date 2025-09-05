/**
 * TranscendBody - API Routes and Request Handlers
 * 
 * This file contains all the Express.js routes for the personal transformation
 * tracking application, including authentication, dashboard, API endpoints,
 * and admin functionality.
 * 
 * Route Categories:
 * - Authentication (login, register, logout)
 * - Dashboard and user interface
 * - API endpoints for activities and tracking
 * - Admin panel functionality
 * - User management and analytics
 * 
 * Features:
 * - Session-based authentication
 * - Input validation with Zod schemas
 * - Password hashing with bcrypt
 * - Database operations with Drizzle ORM
 * - Error handling and user feedback
 */

import express from "express";
import bcrypt from "bcrypt";
import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "./db.js";
import { users, insertUserSchema, globalActivities, demoActivities, dailyTrackers, trackerEntries } from '../shared/schema.ts';
import { isValidPlan } from "./validators.js"; // Plan validation utility
import { setFlash } from "./auth.js"; // Flash message middleware
import crypto from "crypto";
import { computeUserProgress } from './progress.js';
import { inArray } from 'drizzle-orm';

const router = express.Router();

// ---------- Landing Page ----------
router.get("/", (req, res) => {
  // Determine which tab to show based on query param
  const tab = req.query.tab === "signup" ? "signup" : "signin";
  res.render("landing", {
    tab,
    signinError: null,
    signupError: null,
    signinData: {},
    signupData: {},
    validationErrors: {},
    successMessage: null,
  });
});

// Redirect GET /login and /register to / with tab param
router.get("/login", (req, res) => {
  res.redirect("/?tab=signin");
});
router.get("/register", (req, res) => {
  res.redirect("/?tab=signup");
});

// ---------- Registration POST ----------
router.post("/register", async (req, res) => {
  const { confirmPassword, ...formData } = req.body;
  const parsed = insertUserSchema.safeParse(formData);

  if (!parsed.success) {
    return res.status(400).render("landing", {
      tab: "signup",
      signupError: "Please correct the highlighted errors.",
      signinError: null,
      signupData: formData,
      signinData: {},
      validationErrors: parsed.error.flatten().fieldErrors,
      successMessage: null,
    });
  }

  if (req.body.password !== confirmPassword) {
    return res.status(400).render("landing", {
      tab: "signup",
      signupError: "Passwords do not match.",
      signinError: null,
      signupData: formData,
      signinData: {},
      validationErrors: {},
      successMessage: null,
    });
  }

  // Set sensible defaults for optional fields
  const userData = {
    ...parsed.data,
    preferredName: parsed.data.preferredName || parsed.data.firstName,
    gender: parsed.data.gender || "",
    age: parsed.data.age || null,
    plan: parsed.data.plan || "trial",
    tier: parsed.data.tier || "bronze",
    accountabilityLevel: parsed.data.accountabilityLevel || "beginner",
  };

  // Remove isAdmin field to let database default handle it
  if ('isAdmin' in userData) {
    delete userData.isAdmin;
  }

  // Generate a unique id for the new user
  const userId = crypto.randomUUID();

  // Hash password and try to insert
  const hashedPassword = await bcrypt.hash(req.body.password, 10);
  try {
    await db.insert(users).values({
      id: userId,
      ...userData,
      password: hashedPassword,
      activitiesCount: 0,
    });
    // After successful registration, show success message and switch to login tab
    return res.render("landing", {
      tab: "signin",
      signinError: null,
      signupError: null,
      signinData: { email: userData.email },
      signupData: {},
      validationErrors: {},
      successMessage: "Account created successfully! Please log in.",
    });
  } catch (error) {
    return res.status(400).render("landing", {
      tab: "signup",
      signupError: "User already exists or database error.",
      signinError: null,
      signupData: formData,
      signinData: {},
      validationErrors: {},
      successMessage: null,
    });
  }
});

// ---------- Login POST ----------
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  
  console.log('Login attempt for:', email);
  
  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  console.log('User found:', user ? 'Yes' : 'No');
  
  if (!user || !(await bcrypt.compare(password, user.password))) {
    console.log('Authentication failed');
    return res.status(401).render("landing", {
      tab: "signin",
      signinError: "Invalid credentials.",
      signupError: null,
      signinData: { email },
      signupData: {},
      validationErrors: {},
      successMessage: null,
    });
  }

  // Use Passport.js login method to properly authenticate the user
  console.log('Attempting to log in user:', user.email);
  req.login(user, (err) => {
    if (err) {
      console.error('Login error:', err);
      return res.status(500).render("landing", {
        tab: "signin",
        signinError: "Login failed. Please try again.",
        signupError: null,
        signinData: { email },
        signupData: {},
        validationErrors: {},
        successMessage: null,
      });
    }
    console.log('Login successful, redirecting to dashboard');
    res.redirect("/dashboard");
  });
});

// ---------- Logout ----------
router.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

// ---------- Dashboard ----------
router.get("/dashboard", async (req, res) => {
  console.log('Dashboard route accessed');
  console.log('Is authenticated:', req.isAuthenticated());
  console.log('User:', req.user ? req.user.email : 'None');
  
  if (!req.isAuthenticated()) {
    console.log('Not authenticated, redirecting to login');
    return res.redirect("/login");
  }

  const user = req.user as any;
  console.log('Rendering dashboard for user:', user.email);

  // Get user's progress data for template rendering
  try {
    const trackers = await db.select().from(dailyTrackers).where(eq(dailyTrackers.userId, user.id)).orderBy(desc(dailyTrackers.date));
    const trackerIds = trackers.map(d => d.id);
    let entries = [];
    if (trackerIds.length > 0) {
      entries = await db.select().from(trackerEntries).where(inArray(trackerEntries.trackerId, trackerIds));
    }
    const progress = computeUserProgress(user, trackers, entries);
    
    res.render("dashboard_modern", { 
      user, 
      streak: progress.currentStreak,
      completionRate: progress.completionRate,
      accountabilityCountdown: progress.accountabilityCountdown,
      accountabilityMessage: progress.accountabilityMessage,
      activitiesCompleted: progress.activitiesCompleted,
      weeklyAverage: progress.weeklyAverage,
      // Add any other fields needed by the dashboard
    });
  } catch (err) {
    console.error("Error fetching user progress for dashboard:", String(err));
    // Fallback with default values
    res.render("dashboard_modern", { 
      user, 
      streak: 0,
      completionRate: 0
    });
  }
});

// ---------- API: Get All Activities ----------
router.get("/api/activities", async (req, res) => {
  try {
    // Only return global activities for all users
    const globalActivitiesList = await db.select().from(globalActivities);
    res.json(globalActivitiesList);
  } catch (err) {
    console.error("Error fetching activities:", String(err));
    res.status(500).json({ error: "Failed to fetch activities" });
  }
});

// ---------- API: Get User Stats ----------
router.get("/api/stats", async (req, res) => {
  let targetUserId = req.user?.id;
  if (req.query.userId && req.user && req.user.role === 'admin') {
    targetUserId = req.query.userId;
  }
  if (!targetUserId) return res.status(401).json({ error: "Unauthorized" });
  try {
    const user = await db.query.users.findFirst({ where: eq(users.id, targetUserId) });
    if (!user) return res.status(404).json({ error: "User not found" });
    const trackers = await db.select().from(dailyTrackers).where(eq(dailyTrackers.userId, user.id)).orderBy(desc(dailyTrackers.date));
    const trackerIds = trackers.map(d => d.id);
    let entries = [];
    if (trackerIds.length > 0) {
      entries = await db.select().from(trackerEntries).where(inArray(trackerEntries.trackerId, trackerIds));
    }
    const progress = computeUserProgress(user, trackers, entries);
    res.json(progress);
  } catch (err) {
    console.error("Error fetching stats:", String(err));
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// ---------- API: Get Today's Tracker ----------
router.get("/api/tracker/today", async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });

  const today = new Date().toISOString().slice(0, 10);

  try {
    // Find today's tracker
    const tracker = await db.query.dailyTrackers.findFirst({
      where: and(
        eq(dailyTrackers.userId, req.user.id),
        eq(dailyTrackers.date, today)
      ),
      orderBy: [desc(dailyTrackers.id)],
    });

    if (!tracker) return res.status(404).json({ error: "No tracker for today" });

    // Always join trackerEntries with globalActivities for all users
    const entries = await db
      .select({
        id: trackerEntries.id,
        trackerId: trackerEntries.trackerId,
        activityId: trackerEntries.activityId,
        timeSlot: trackerEntries.timeSlot,
        status: trackerEntries.status,
        createdAt: trackerEntries.createdAt,
        updatedAt: trackerEntries.updatedAt,
        activity: globalActivities,
      })
      .from(trackerEntries)
      .innerJoin(globalActivities, eq(trackerEntries.activityId, globalActivities.id))
      .where(eq(trackerEntries.trackerId, tracker.id));

    res.json({ ...tracker, entries });
  } catch (err) {
    console.error("Error fetching today's tracker:", String(err));
    res.status(500).json({ error: "Failed to fetch today's tracker" });
  }
});

// PATCH: Update tracker entry status
router.patch('/api/tracker/entries/:entryId/status', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Unauthorized' });
  const { entryId } = req.params;
  const entryIdInt = parseInt(entryId);
  if (isNaN(entryIdInt)) {
    return res.status(400).json({ error: 'Invalid entry ID' });
  }
  const { status } = req.body;
  try {
    // Check ownership or admin
    const entry = await db.query.trackerEntries.findFirst({ where: eq(trackerEntries.id, entryIdInt) });
    if (!entry) return res.status(404).json({ error: 'Entry not found' });
    const tracker = await db.query.dailyTrackers.findFirst({ where: eq(dailyTrackers.id, entry.trackerId) });
    if (!tracker) return res.status(404).json({ error: 'Tracker not found' });
    const user = await db.query.users.findFirst({ where: eq(users.id, req.session.userId) });
    if (!user || (tracker.userId !== req.session.userId && user.role !== 'admin')) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    await db.update(trackerEntries).set({ status, updatedAt: new Date() }).where(eq(trackerEntries.id, entryIdInt));
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating tracker entry status:', String(err));
    res.status(500).json({ error: 'Failed to update tracker entry status' });
  }
});

// DELETE: Remove tracker entry
router.delete('/api/tracker/entries/:entryId', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Unauthorized' });
  const { entryId } = req.params;
  const entryIdInt = parseInt(entryId);
  if (isNaN(entryIdInt)) {
    return res.status(400).json({ error: 'Invalid entry ID' });
  }
  try {
    // Check ownership or admin
    const entry = await db.query.trackerEntries.findFirst({ where: eq(trackerEntries.id, entryIdInt) });
    if (!entry) return res.status(404).json({ error: 'Entry not found' });
    const tracker = await db.query.dailyTrackers.findFirst({ where: eq(dailyTrackers.id, entry.trackerId) });
    if (!tracker) return res.status(404).json({ error: 'Tracker not found' });
    const user = await db.query.users.findFirst({ where: eq(users.id, req.session.userId) });
    if (!user || (tracker.userId !== req.session.userId && user.role !== 'admin')) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    await db.delete(trackerEntries).where(eq(trackerEntries.id, entryIdInt));
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting tracker entry:', String(err));
    res.status(500).json({ error: 'Failed to delete tracker entry' });
  }
});

// ---------- API: Add Tracker Entry ----------
router.post('/api/tracker/entries', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Unauthorized' });
  const { trackerId, activityId, timeSlot, status } = req.body;
  const trackerIdInt = parseInt(trackerId);
  const activityIdInt = parseInt(activityId);
  if (isNaN(trackerIdInt) || isNaN(activityIdInt)) {
    return res.status(400).json({ error: 'Invalid tracker ID or activity ID' });
  }
  if (!trackerId || !activityId || !timeSlot) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }
  try {
    // Optionally: check that tracker belongs to user
    const tracker = await db.query.dailyTrackers.findFirst({ where: eq(dailyTrackers.id, trackerIdInt) });
    if (!tracker || tracker.userId !== req.session.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const [entry] = await db.insert(trackerEntries).values({
      trackerId: trackerIdInt,
      activityId: activityIdInt,
      timeSlot,
      status: status || 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    res.json(entry);
  } catch (err) {
    console.error('Error adding tracker entry:', String(err));
    res.status(500).json({ error: 'Failed to add tracker entry' });
  }
});

// Middleware to check admin
async function requireAdmin(req, res, next) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const user = await db.query.users.findFirst({
    where: eq(users.id, req.user.id),
  });
  
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  req.user = user; // Add user to request for convenience
  next();
}

// ---------- ADMIN API: Get All Users ----------
router.get('/api/admin/users', requireAdmin, async (req, res) => {
  try {
    const allUsers = await db.select().from(users);
    // For each user, fetch their trackers and tracker entries, then compute progress
    const userProgressList = await Promise.all(allUsers.map(async (user) => {
      const trackers = await db.select().from(dailyTrackers).where(eq(dailyTrackers.userId, user.id)).orderBy(desc(dailyTrackers.date));
      const trackerIds = trackers.map(d => d.id);
      let entries = [];
      if (trackerIds.length > 0) {
        entries = await db.select().from(trackerEntries).where(inArray(trackerEntries.trackerId, trackerIds));
      }
      const progress = computeUserProgress(user, trackers, entries);
      return {
        ...user,
        ...progress,
      };
    }));
    res.json(userProgressList);
  } catch (err) {
    console.error('Error fetching users:', String(err));
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// ---------- ADMIN API: Delete User ----------
router.delete('/api/admin/users/:userId', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    await db.delete(users).where(eq(users.id, userId));
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting user:', String(err));
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// ---------- ADMIN API: Update User Role ----------
router.patch('/api/admin/users/:userId/role', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    await db.update(users).set({ role }).where(eq(users.id, userId));
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating user role:', String(err));
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

// ---------- ADMIN API: Get Single User ----------
router.get('/api/admin/users/:userId', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('Error fetching user:', String(err));
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// ---------- ADMIN API: Update User Details ----------
router.patch('/api/admin/users/:userId', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { firstName, lastName, preferredName, gender, age, role, plan, accountabilityLevel, tier } = req.body;
    const updateData = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (preferredName !== undefined) updateData.preferredName = preferredName;
    if (gender !== undefined) updateData.gender = gender;
    if (age !== undefined) updateData.age = age;
    if (role !== undefined) updateData.role = role;
    if (plan !== undefined) updateData.plan = plan;
    if (accountabilityLevel !== undefined) updateData.accountabilityLevel = accountabilityLevel;
    if (tier !== undefined) updateData.tier = tier;
    await db.update(users).set(updateData).where(eq(users.id, userId));
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating user:', String(err));
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// ---------- ADMIN API: Get User Stats ----------
router.get('/api/admin/user-stats/:userId', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    // Total activities completed
    const totalResult = await db.execute(
      `SELECT COUNT(*) AS total FROM tracker_entries te
       JOIN daily_trackers dt ON te.tracker_id = dt.id
       WHERE dt.user_id = $1 AND te.status = 'completed'`,
      [userId]
    );
    const totalActivities = totalResult.rows?.[0]?.total || 0;
    // Current streak (simplified)
    const streakResult = await db.execute(
      `SELECT COUNT(*) AS streak
       FROM (
         SELECT date, COUNT(*) AS completed
         FROM daily_trackers dt
         JOIN tracker_entries te ON te.tracker_id = dt.id
         WHERE dt.user_id = $1 AND te.status = 'completed'
         GROUP BY date
         ORDER BY date DESC
       ) AS streaks
       WHERE completed > 0`,
      [userId]
    );
    const currentStreak = streakResult.rows?.[0]?.streak || 0;
    res.json({ totalActivities, currentStreak });
  } catch (err) {
    console.error('Error fetching user stats:', String(err));
    res.status(500).json({ error: 'Failed to fetch user stats' });
  }
});

// ---------- ADMIN API: Get All Activities ----------
router.get('/api/admin/activities', requireAdmin, async (req, res) => {
  try {
    const allActivities = await db.select().from(globalActivities);
    res.json(allActivities);
  } catch (err) {
    console.error('Error fetching activities:', String(err));
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

// ---------- ADMIN API: Add Activity ----------
router.post('/api/admin/activities', requireAdmin, async (req, res) => {
  try {
    const { title, description, category, difficulty } = req.body;
    // Check for duplicate (title + category)
    const existing = await db.select().from(globalActivities).where(and(eq(globalActivities.title, title), eq(globalActivities.category, category)));
    if (existing.length > 0) {
      return res.status(400).json({ error: 'An activity with this title and category already exists.' });
    }
    const [activity] = await db.insert(globalActivities).values({ title, description, category, difficulty }).returning();
    res.json(activity);
  } catch (err) {
    console.error('Error adding activity:', String(err));
    res.status(500).json({ error: 'Failed to add activity' });
  }
});

// ---------- ADMIN API: Delete Activity ----------
router.delete('/api/admin/activities/:activityId', requireAdmin, async (req, res) => {
  try {
    const { activityId } = req.params;
    const activityIdInt = parseInt(activityId);
    if (isNaN(activityIdInt)) {
      return res.status(400).json({ error: 'Invalid activity ID' });
    }
    await db.delete(globalActivities).where(eq(globalActivities.id, activityIdInt));
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting activity:', String(err));
    res.status(500).json({ error: 'Failed to delete activity' });
  }
});

// ---------- ADMIN API: Update Activity ----------
router.patch('/api/admin/activities/:activityId', requireAdmin, async (req, res) => {
  try {
    const { activityId } = req.params;
    const activityIdInt = parseInt(activityId);
    if (isNaN(activityIdInt)) {
      return res.status(400).json({ error: 'Invalid activity ID' });
    }
    const { title, description, category, difficulty } = req.body;
    // Check for duplicate (title + category), excluding this activity
    if (title && category) {
      const existing = await db.select().from(globalActivities)
        .where(and(eq(globalActivities.title, title), eq(globalActivities.category, category), sql`id != ${activityIdInt}`));
      if (existing.length > 0) {
        return res.status(400).json({ error: 'An activity with this title and category already exists.' });
      }
    }
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (difficulty !== undefined) updateData.difficulty = difficulty;
    const [updated] = await db.update(globalActivities).set(updateData).where(eq(globalActivities.id, activityIdInt)).returning();
    if (!updated) return res.status(404).json({ error: 'Activity not found' });
    res.json({ success: true, activity: updated });
  } catch (err) {
    console.error('Error updating activity:', String(err));
    res.status(500).json({ error: 'Failed to update activity' });
  }
});

// ---------- ADMIN API: Get All User Stats (Batch) ----------
router.get('/api/admin/user-stats', requireAdmin, async (req, res) => {
  try {
    const allUsers = await db.select().from(users);
    const allTrackers = await db.select().from(dailyTrackers);
    const allEntries = await db.select().from(trackerEntries);
    // For each user, compute their stats
    const userStats = allUsers.map(user => {
      const trackers = allTrackers.filter(t => t.userId === user.id);
      const trackerIds = trackers.map(t => t.id);
      const entries = allEntries.filter(e => trackerIds.includes(e.trackerId));
      const progress = computeUserProgress(user, trackers, entries);
      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        preferredName: user.preferredName,
        plan: user.plan,
        tier: user.tier,
        accountabilityLevel: user.accountabilityLevel,
        role: user.role,
        activitiesCompleted: progress.activitiesCompleted,
        currentStreak: progress.currentStreak,
      };
    });
    res.json(userStats);
  } catch (err) {
    console.error('Error fetching all user stats:', String(err));
    res.status(500).json({ error: 'Failed to fetch user stats' });
  }
});

// ---------- ADMIN API: Reset Demo Data ----------
router.post('/api/admin/reset-demo-data', requireAdmin, async (req, res) => {
  try {
    const result = await seedDemoData(db);
    if (result.success) {
      res.json({ success: true });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (err) {
    console.error('Error resetting demo data:', String(err));
    res.status(500).json({ success: false, error: err });
  }
});

// ---------- API: Add Activity (for all users, e.g. custom) ----------
router.post('/api/activities', async (req, res) => {
  try {
    const { title, description, category, timeSlot, isCustom, difficulty } = req.body;
    if (!title || !category) {
      return res.status(400).json({ error: 'Title and category are required.' });
    }
    // Check for duplicate (title + category)
    const existing = await db.select().from(globalActivities).where(and(eq(globalActivities.title, title), eq(globalActivities.category, category)));
    if (existing.length > 0) {
      return res.status(400).json({ error: 'An activity with this title and category already exists.' });
    }
    const [activity] = await db.insert(globalActivities).values({
      title,
      description,
      category,
      timeOfDay: timeSlot,
      isCustom: isCustom ?? true,
      difficulty: difficulty || 'easy',
      createdBy: req.user?.id || null
    }).returning();
    res.json(activity);
  } catch (err) {
    console.error('Error adding activity:', String(err));
    res.status(500).json({ error: 'Failed to add activity' });
  }
});

// Admin panel page (UI)
router.get("/admin", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect("/login");
  }
  
  const user = req.user as any;
  
  if (!user || user.role !== "admin") {
    return res.status(403).render("landing", { 
      tab: "signin",
      signinError: "Admin access required",
      signupError: null,
      signinData: {},
      signupData: {},
      validationErrors: {},
      successMessage: null
    });
  }
  
  res.render("admin", { user });
});

export default router;