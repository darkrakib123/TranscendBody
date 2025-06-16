import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertActivitySchema, insertTrackerEntrySchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Activity routes
  app.get('/api/activities', isAuthenticated, async (req, res) => {
    try {
      const activities = await storage.getActivities();
      res.json(activities);
    } catch (error) {
      console.error("Error fetching activities:", error);
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  app.post('/api/activities', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const activityData = insertActivitySchema.parse({
        ...req.body,
        createdBy: req.body.isCustom ? userId : null,
      });
      
      const activity = await storage.createActivity(activityData);
      res.json(activity);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid activity data", errors: error.errors });
      }
      console.error("Error creating activity:", error);
      res.status(500).json({ message: "Failed to create activity" });
    }
  });

  app.delete('/api/activities/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const id = parseInt(req.params.id);
      const success = await storage.deleteActivity(id);
      
      if (success) {
        res.json({ message: "Activity deleted successfully" });
      } else {
        res.status(404).json({ message: "Activity not found" });
      }
    } catch (error) {
      console.error("Error deleting activity:", error);
      res.status(500).json({ message: "Failed to delete activity" });
    }
  });

  // Daily tracker routes
  app.get('/api/tracker/today', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const today = new Date().toISOString().split('T')[0];
      
      let tracker = await storage.getDailyTracker(userId, today);
      
      // Create tracker if it doesn't exist
      if (!tracker) {
        const newTracker = await storage.createDailyTracker({
          userId,
          date: today,
        });
        tracker = { ...newTracker, entries: [] };
      }
      
      res.json(tracker);
    } catch (error) {
      console.error("Error fetching daily tracker:", error);
      res.status(500).json({ message: "Failed to fetch daily tracker" });
    }
  });

  // Tracker entry routes
  app.post('/api/tracker/entries', isAuthenticated, async (req: any, res) => {
    try {
      const entryData = insertTrackerEntrySchema.parse(req.body);
      const entry = await storage.createTrackerEntry(entryData);
      
      // Update completion rate
      if (entryData.trackerId) {
        await updateTrackerCompletion(entryData.trackerId);
      }
      
      res.json(entry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid entry data", errors: error.errors });
      }
      console.error("Error creating tracker entry:", error);
      res.status(500).json({ message: "Failed to create tracker entry" });
    }
  });

  app.patch('/api/tracker/entries/:id/status', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!['pending', 'completed'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const entry = await storage.updateTrackerEntryStatus(id, status);
      
      // Update completion rate
      await updateTrackerCompletion(entry.trackerId);
      
      res.json(entry);
    } catch (error) {
      console.error("Error updating tracker entry:", error);
      res.status(500).json({ message: "Failed to update tracker entry" });
    }
  });

  app.delete('/api/tracker/entries/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteTrackerEntry(id);
      
      if (success) {
        res.json({ message: "Entry deleted successfully" });
      } else {
        res.status(404).json({ message: "Entry not found" });
      }
    } catch (error) {
      console.error("Error deleting tracker entry:", error);
      res.status(500).json({ message: "Failed to delete tracker entry" });
    }
  });

  // Statistics routes
  app.get('/api/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getUserStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Admin routes
  app.get('/api/admin/users', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.patch('/api/admin/users/:id/role', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const { id } = req.params;
      const { role } = req.body;
      
      if (!['admin', 'user'].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      
      const updatedUser = await storage.updateUserRole(id, role);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  // Helper function to update completion rate
  async function updateTrackerCompletion(trackerId: number) {
    // This is a simplified calculation - you might want to fetch all entries for the tracker
    // and calculate the actual completion percentage
    const userId = ""; // You'd need to get this from the tracker
    const today = new Date().toISOString().split('T')[0];
    const tracker = await storage.getDailyTracker(userId, today);
    
    if (tracker) {
      const totalEntries = tracker.entries.length;
      const completedEntries = tracker.entries.filter(e => e.status === 'completed').length;
      const completionRate = totalEntries > 0 ? Math.round((completedEntries / totalEntries) * 100) : 0;
      
      await storage.updateTrackerCompletion(trackerId, completionRate);
    }
  }

  const httpServer = createServer(app);
  return httpServer;
}
