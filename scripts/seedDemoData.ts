// Seed demo data for TranscendBodyCursor (Simplified version)
import { db } from '../server/db.ts';
import { users, demoActivities, dailyTrackers, trackerEntries } from '../shared/schema.ts';
import { sql } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { format, subDays } from 'date-fns';

// Demo users with hardcoded values
const demoUsers = [
  {
    id: 'admin-demo',
    email: 'admin@demo.com',
    password: 'test',
    firstName: 'Admin',
    lastName: 'User',
    preferredName: 'Admin',
    role: 'admin',
    plan: 'pro',
    tier: 'gold',
    accountabilityLevel: 'master',
    isAdmin: true,
    age: 40,
    gender: 'other',
  },
  {
    id: 'master-bronze',
    email: 'master@demo.com',
    password: 'test',
    firstName: 'Master',
    lastName: 'Bronze',
    preferredName: 'Master',
    role: 'user',
    plan: 'pro',
    tier: 'bronze',
    accountabilityLevel: 'master',
    isAdmin: false,
    age: 35,
    gender: 'male',
  },
  {
    id: 'beginner-bronze',
    email: 'bronze@demo.com',
    password: 'test',
    firstName: 'Bronze',
    lastName: 'Beginner',
    preferredName: 'Bronze',
    role: 'user',
    plan: 'basic',
    tier: 'bronze',
    accountabilityLevel: 'beginner',
    isAdmin: false,
    age: 25,
    gender: 'male',
  },
  {
    id: 'beginner-gold',
    email: 'gold@demo.com',
    password: 'test',
    firstName: 'Gold',
    lastName: 'Beginner',
    preferredName: 'Gold',
    role: 'user',
    plan: 'basic',
    tier: 'gold',
    accountabilityLevel: 'beginner',
    isAdmin: false,
    age: 28,
    gender: 'female',
  },
  {
    id: 'intermediate-silver',
    email: 'silver@demo.com',
    password: 'test',
    firstName: 'Silver',
    lastName: 'Intermediate',
    preferredName: 'Silver',
    role: 'user',
    plan: 'pro',
    tier: 'silver',
    accountabilityLevel: 'intermediate',
    isAdmin: false,
    age: 32,
    gender: 'nonbinary',
  },
];

// Hardcoded global activities
const globalActivities = [
  { title: 'Morning Push-ups', description: '3 sets of 10 push-ups', category: 'workout', timeOfDay: 'morning', isGlobal: true, isCustom: false, difficulty: 'easy' },
  { title: 'Protein Shake', description: '30g protein with water', category: 'nutrition', timeOfDay: 'morning', isGlobal: true, isCustom: false, difficulty: 'easy' },
  { title: 'Stretching', description: '10 minutes full body stretch', category: 'recovery', timeOfDay: 'evening', isGlobal: true, isCustom: false, difficulty: 'easy' },
  { title: 'Gratitude Journal', description: 'Write 3 things you\'re grateful for', category: 'mindset', timeOfDay: 'night', isGlobal: true, isCustom: false, difficulty: 'easy' },
  { title: 'Squats', description: '3 sets of 15 bodyweight squats', category: 'workout', timeOfDay: 'afternoon', isGlobal: true, isCustom: false, difficulty: 'medium' },
  { title: 'Meal Prep', description: 'Prepare healthy meals for the week', category: 'nutrition', timeOfDay: 'afternoon', isGlobal: true, isCustom: false, difficulty: 'medium' },
];

// Hardcoded custom activities per user
const customActivities = {
  'admin-demo': [
    { title: 'Advanced Workout', description: 'Complex training routine', category: 'workout', timeOfDay: 'morning', isGlobal: false, isCustom: true, difficulty: 'hard' },
    { title: 'Meal Planning', description: 'Plan weekly nutrition', category: 'nutrition', timeOfDay: 'morning', isGlobal: false, isCustom: true, difficulty: 'medium' },
  ],
  'master-bronze': [
    { title: 'Master Level Training', description: 'Advanced fitness routine', category: 'workout', timeOfDay: 'morning', isGlobal: false, isCustom: true, difficulty: 'hard' },
    { title: 'Elite Nutrition', description: 'Precision meal planning', category: 'nutrition', timeOfDay: 'morning', isGlobal: false, isCustom: true, difficulty: 'hard' },
  ],
  'beginner-bronze': [
    { title: 'Walking', description: '30 minute walk', category: 'workout', timeOfDay: 'morning', isGlobal: false, isCustom: true, difficulty: 'easy' },
    { title: 'Water Intake', description: 'Drink 8 glasses of water', category: 'nutrition', timeOfDay: 'morning', isGlobal: false, isCustom: true, difficulty: 'easy' },
  ],
  'beginner-gold': [
    { title: 'Light Jogging', description: '20 minute jog', category: 'workout', timeOfDay: 'morning', isGlobal: false, isCustom: true, difficulty: 'easy' },
    { title: 'Healthy Snack', description: 'Eat a piece of fruit', category: 'nutrition', timeOfDay: 'afternoon', isGlobal: false, isCustom: true, difficulty: 'easy' },
  ],
  'intermediate-silver': [
    { title: 'Weight Training', description: 'Upper body workout', category: 'workout', timeOfDay: 'morning', isGlobal: false, isCustom: true, difficulty: 'medium' },
    { title: 'Protein Meal', description: 'High protein lunch', category: 'nutrition', timeOfDay: 'afternoon', isGlobal: false, isCustom: true, difficulty: 'medium' },
  ],
};

// Generate tracker data for a user
function generateTrackerData(days: number, min: number, max: number): { date: string, completionRate: number, activities: number }[] {
  const today = new Date();
  const data = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = format(subDays(today, i), 'yyyy-MM-dd');
    // Cycle completion rates for realism
    const completionRate = Math.round(min + Math.random() * (max - min));
    data.push({ date, completionRate, activities: 8 });
  }
  return data;
}

const demoTrackerData = {
  'admin-demo': generateTrackerData(88, 90, 100), // 88 days for admin
  'master-bronze': generateTrackerData(25, 85, 95), // 25 days for master/bronze
  'beginner-bronze': generateTrackerData(30, 50, 80),
  'beginner-gold': generateTrackerData(30, 60, 85),
  'intermediate-silver': generateTrackerData(60, 75, 90),
};

// --- Patch demoTrackerData for correct streak/accountability logic for all demo accounts ---
// Helper to patch tracker data for a user
function patchTrackerDataForStreak(trackerData: any[], streak: number, completionRate: number, perDay: number) {
  const totalDays = trackerData.length;
  for (let i = 0; i < totalDays; i++) {
    if (i < totalDays - streak - 1) {
      // Earlier days: set to 0% completion
      trackerData[i] = { ...trackerData[i], completionRate: 0, activities: perDay };
    } else if (i < totalDays - 1) {
      // Streak days: set to completionRate (90 or 100)
      trackerData[i] = { ...trackerData[i], completionRate, activities: perDay };
    } else {
      // Today: set to 0% (pending)
      trackerData[i] = { ...trackerData[i], completionRate: 0, activities: perDay };
    }
  }
}
// Patch for each demo user
patchTrackerDataForStreak(demoTrackerData['admin-demo'], 87, 95, 10); // admin/master/gold
patchTrackerDataForStreak(demoTrackerData['master-bronze'], 24, 92, 10); // master/bronze
patchTrackerDataForStreak(demoTrackerData['beginner-bronze'], 29, 90, 6); // beginner/bronze
patchTrackerDataForStreak(demoTrackerData['beginner-gold'], 89, 90, 6); // beginner/gold
patchTrackerDataForStreak(demoTrackerData['intermediate-silver'], 59, 88, 8); // intermediate/silver

// Helper: Get activities by dimension and time slot
function pickActivitiesForUser(level: string, globalActs: any[], customActs: any[]) {
  // Filter by dimension
  const movement = globalActs.filter(a => a.category === 'movement');
  const nutrition = globalActs.filter(a => a.category === 'nutrition');
  const mindset = globalActs.filter(a => a.category === 'mindset');
  const recovery = globalActs.filter(a => a.category === 'recovery');
  // Pick activities for each slot
  let perDay = 6;
  if (level === 'master') perDay = 10;
  else if (level === 'intermediate') perDay = 8;
  // Always at least 1 per dimension, fill rest from movement/nutrition
  const picks = [
    ...movement.slice(0, 2),
    ...nutrition.slice(0, 2),
    ...mindset.slice(0, 2),
    ...recovery.slice(0, 2),
    ...customActs.slice(0, 2)
  ].slice(0, perDay);
  // Distribute across slots
  const slots = ['morning', 'afternoon', 'evening', 'night'];
  return picks.map((a, i) => ({ ...a, timeSlot: slots[i % 4] }));
}

async function clearDemoData() {
  console.log('🧹 Clearing existing data...');
  await db.delete(trackerEntries);
  await db.delete(dailyTrackers);
  // Don't delete activities - preserve master activities
  await db.delete(users);
  console.log('✅ Data cleared (preserving master activities)');
}

async function insertDemoUsers() {
  console.log('👥 Inserting demo users...');
  for (const user of demoUsers) {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    await db.insert(users).values({
      ...user,
      password: hashedPassword,
    });
    console.log(`✅ Created user: ${user.email} (${user.tier}/${user.accountabilityLevel})`);
  }
}

async function insertDemoActivities() {
  console.log('📋 Inserting activities...');
  
  // Insert global activities (created by admin)
  const admin = demoUsers.find(u => u.isAdmin);
  for (const activity of globalActivities) {
    await db.insert(demoActivities).values({
      ...activity,
      createdBy: admin!.id,
    });
  }
  console.log(`✅ Inserted ${globalActivities.length} global activities`);
  
  // Insert custom activities for each user
  for (const [userId, userActivities] of Object.entries(customActivities)) {
    for (const activity of userActivities) {
      await db.insert(demoActivities).values({
        ...activity,
        createdBy: userId,
      });
    }
    console.log(`✅ Inserted ${userActivities.length} custom activities for ${userId}`);
  }
}

async function insertDemoTrackersAndEntries() {
  console.log('📊 Inserting tracker data...');
  
  for (const user of demoUsers) {
    const userTrackerData = demoTrackerData[user.id as keyof typeof demoTrackerData];
    // Get both global activities (created by admin) and user's custom activities
    const userActivities = await db.select().from(demoActivities).where(
      sql`created_by = ${user.id} OR created_by = 'admin-demo'`
    );
    
    for (const dayData of userTrackerData) {
      // Create daily tracker
      const [tracker] = await db.insert(dailyTrackers).values({
        userId: user.id,
        date: dayData.date,
        completionRate: dayData.completionRate,
      }).returning();
      
      // For admin, only assign 10 activities per day (mix of global/custom, all slots)
      // For beginner-bronze, only assign 6 activities per day (mix of global/custom, all slots)
      let activitiesForDay = userActivities;
      if (user.id === 'admin-demo') {
        // Pick 10 activities, distributed across all time slots and categories
        const slots = ['morning', 'afternoon', 'evening', 'night'];
        const categories = ['workout', 'nutrition', 'recovery', 'mindset'];
        let picked: any[] = [];
        for (let i = 0; i < 10; i++) {
          const slot = slots[i % slots.length];
          const cat = categories[i % categories.length];
          const found = userActivities.find(a => a.timeOfDay === slot && a.category === cat);
          if (found && !picked.includes(found)) picked.push(found);
        }
        if (picked.length < 10) {
          for (const a of userActivities) {
            if (!picked.includes(a)) picked.push(a);
            if (picked.length === 10) break;
          }
        }
        activitiesForDay = picked.slice(0, 10);
      } else if (user.id === 'beginner-bronze') {
        // Pick 6 activities, distributed across all time slots and categories
        const slots = ['morning', 'afternoon', 'evening', 'night'];
        const categories = ['workout', 'nutrition', 'recovery', 'mindset'];
        let picked: any[] = [];
        for (let i = 0; i < 6; i++) {
          const slot = slots[i % slots.length];
          const cat = categories[i % categories.length];
          const found = userActivities.find(a => a.timeOfDay === slot && a.category === cat);
          if (found && !picked.includes(found)) picked.push(found);
        }
        if (picked.length < 6) {
          for (const a of userActivities) {
            if (!picked.includes(a)) picked.push(a);
            if (picked.length === 6) break;
          }
        }
        activitiesForDay = picked.slice(0, 6);
      } else if (user.id === 'beginner-gold') {
        // Pick 6 activities, distributed across all time slots and categories
        const slots = ['morning', 'afternoon', 'evening', 'night'];
        const categories = ['workout', 'nutrition', 'recovery', 'mindset'];
        let picked: any[] = [];
        for (let i = 0; i < 6; i++) {
          const slot = slots[i % slots.length];
          const cat = categories[i % categories.length];
          const found = userActivities.find(a => a.timeOfDay === slot && a.category === cat);
          if (found && !picked.includes(found)) picked.push(found);
        }
        if (picked.length < 6) {
          for (const a of userActivities) {
            if (!picked.includes(a)) picked.push(a);
            if (picked.length === 6) break;
          }
        }
        activitiesForDay = picked.slice(0, 6);
      } else if (user.id === 'intermediate-silver') {
        // Pick 8 activities, distributed across all time slots and categories
        const slots = ['morning', 'afternoon', 'evening', 'night'];
        const categories = ['workout', 'nutrition', 'recovery', 'mindset'];
        let picked: any[] = [];
        for (let i = 0; i < 8; i++) {
          const slot = slots[i % slots.length];
          const cat = categories[i % categories.length];
          const found = userActivities.find(a => a.timeOfDay === slot && a.category === cat);
          if (found && !picked.includes(found)) picked.push(found);
        }
        if (picked.length < 8) {
          for (const a of userActivities) {
            if (!picked.includes(a)) picked.push(a);
            if (picked.length === 8) break;
          }
        }
        activitiesForDay = picked.slice(0, 8);
      }
      // Create tracker entries
      const completedCount = Math.round((dayData.completionRate / 100) * activitiesForDay.length);
      for (let i = 0; i < activitiesForDay.length; i++) {
        const activity = activitiesForDay[i];
        const status = i < completedCount ? 'completed' : 'pending';
        await db.insert(trackerEntries).values({
          trackerId: tracker.id,
          activityId: activity.id,
          timeSlot: activity.timeOfDay || 'morning',
          status,
        });
      }
    }
    console.log(`✅ Inserted ${userTrackerData.length} days of tracker data for ${user.email}`);
  }
}

async function seedDemoData() {
  try {
    console.log('🚀 Starting simplified demo data seeding...');
    
    await clearDemoData();
    await insertDemoUsers();
    await insertDemoActivities();
    await insertDemoTrackersAndEntries();
    
    console.log('🎉 Demo data seeded successfully!');
    console.log('\n📊 Demo Users (All passwords: "test"):');
    console.log('Admin (admin@demo.com): Master/Gold/Pro - High completion rates');
    console.log('Master (master@demo.com): Master/Bronze/Pro - 25-day streak, progressing to Master/Silver');
    console.log('Bronze (bronze@demo.com): Beginner/Bronze/Basic - Lower completion rates');
    console.log('Gold (gold@demo.com): Beginner/Gold/Basic - Moderate completion rates');
    console.log('Silver (silver@demo.com): Intermediate/Silver/Pro - Good completion rates');
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding demo data:', err);
    process.exit(1);
  }
}

// Run the demo data seeding
await seedDemoData(); 