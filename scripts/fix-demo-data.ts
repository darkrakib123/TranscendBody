import { db } from '../server/db';
import { users, dailyTrackers, trackerEntries, activities } from '../shared/schema';
import { eq, and, desc } from 'drizzle-orm';

async function fixDemoUserData() {
  console.log('Fixing demo user progress data...');

  // Target levels and their required completed activities
  const targetLevels = {
    'beginner@demo.com': { level: 'Beginner', target: 0, streak: 0 },
    'starter@demo.com': { level: 'Starter', target: 5, streak: 2 },
    'intermediate@demo.com': { level: 'Intermediate', target: 15, streak: 4 },
    'advanced@demo.com': { level: 'Advanced', target: 35, streak: 8 },
    'expert@demo.com': { level: 'Expert', target: 75, streak: 15 },
    'master@demo.com': { level: 'Master', target: 150, streak: 25 }
  };

  // Get all activities to use
  const allActivities = await db.select().from(activities);
  
  for (const [email, config] of Object.entries(targetLevels)) {
    console.log(`Processing ${email} for ${config.level} level (${config.target} activities)...`);
    
    // Get user
    const [user] = await db.select().from(users).where(eq(users.email, email));
    if (!user) {
      console.log(`  User ${email} not found, skipping...`);
      continue;
    }

    // Clear existing data for clean start
    await db.delete(trackerEntries)
      .where(eq(trackerEntries.trackerId, 
        db.select({ id: dailyTrackers.id })
          .from(dailyTrackers)
          .where(eq(dailyTrackers.userId, user.id))
      ));
    
    await db.delete(dailyTrackers).where(eq(dailyTrackers.userId, user.id));

    if (config.target === 0) {
      // Beginner - create today's tracker with no activities
      await db.insert(dailyTrackers).values({
        userId: user.id,
        date: new Date().toISOString().split('T')[0],
        completionRate: 0
      });
      console.log(`  Created empty tracker for ${config.level}`);
      continue;
    }

    // Create streak days + some additional history
    const totalDays = Math.max(config.streak + 5, 14);
    let activitiesRemaining = config.target;
    
    for (let dayOffset = totalDays - 1; dayOffset >= 0; dayOffset--) {
      const date = new Date();
      date.setDate(date.getDate() - dayOffset);
      const dateStr = date.toISOString().split('T')[0];
      
      // Create daily tracker
      const [tracker] = await db.insert(dailyTrackers).values({
        userId: user.id,
        date: dateStr,
        completionRate: 0
      }).returning();

      // Determine activities for this day
      const isStreakDay = dayOffset < config.streak;
      const activitiesPerDay = Math.min(
        Math.ceil(activitiesRemaining / Math.max(dayOffset + 1, 1)),
        6 // Max 6 activities per day
      );

      let completedToday = 0;
      const totalToday = Math.max(activitiesPerDay, isStreakDay ? 1 : 0);

      for (let i = 0; i < totalToday && activitiesRemaining > 0; i++) {
        const randomActivity = allActivities[Math.floor(Math.random() * allActivities.length)];
        const timeSlots = ['morning', 'afternoon', 'evening'];
        const timeSlot = timeSlots[i % 3];
        
        // Ensure streak days have completed activities
        const shouldComplete = isStreakDay || (activitiesRemaining > 0 && Math.random() < 0.8);
        
        await db.insert(trackerEntries).values({
          trackerId: tracker.id,
          activityId: randomActivity.id,
          timeSlot: timeSlot,
          status: shouldComplete ? 'completed' : 'pending'
        });

        if (shouldComplete) {
          completedToday++;
          activitiesRemaining--;
        }
      }

      // Update completion rate
      const completionRate = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;
      await db.update(dailyTrackers)
        .set({ completionRate })
        .where(eq(dailyTrackers.id, tracker.id));
    }

    console.log(`  Created ${config.target} activities with ${config.streak}-day streak for ${config.level}`);
  }

  console.log('\nDemo user data fixed! Testing stats calculation...');
  
  // Verify the data
  for (const [email, config] of Object.entries(targetLevels)) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    if (!user) continue;

    // Get recent trackers for streak calculation
    const recentTrackers = await db
      .select()
      .from(dailyTrackers)
      .where(eq(dailyTrackers.userId, user.id))
      .orderBy(desc(dailyTrackers.date))
      .limit(30);

    // Calculate current streak
    let currentStreak = 0;
    for (const tracker of recentTrackers) {
      if (tracker.completionRate > 0) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Calculate weekly average
    const weekTrackers = recentTrackers.slice(0, 7);
    const weeklyAverage = weekTrackers.length > 0 
      ? Math.round(weekTrackers.reduce((sum, t) => sum + t.completionRate, 0) / weekTrackers.length)
      : 0;

    // Total completed activities
    const totalActivities = await db
      .select()
      .from(trackerEntries)
      .innerJoin(dailyTrackers, eq(trackerEntries.trackerId, dailyTrackers.id))
      .where(and(
        eq(dailyTrackers.userId, user.id),
        eq(trackerEntries.status, "completed")
      ));

    console.log(`${email}: ${totalActivities.length} completed, ${currentStreak} streak, ${weeklyAverage}% weekly avg`);
  }
}

// Run the fix
fixDemoUserData()
  .then(() => {
    console.log('\nDemo data fix complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error fixing demo data:', error);
    process.exit(1);
  });