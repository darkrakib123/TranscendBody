import { db } from '../server/db';
import { users, dailyTrackers, trackerEntries, activities } from '../shared/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';

async function populateDemoUsers() {
  console.log('Creating demo users with different achievement levels...');

  // Hash password for all demo users
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create demo users at different achievement levels
  const demoUsers = [
    {
      email: 'beginner@demo.com',
      password: hashedPassword,
      firstName: 'Alex',
      lastName: 'Beginner',
      role: 'client',
      targetLevel: 'Beginner' // 0 activities
    },
    {
      email: 'starter@demo.com', 
      password: hashedPassword,
      firstName: 'Sam',
      lastName: 'Starter',
      role: 'client',
      targetLevel: 'Starter' // 5 activities
    },
    {
      email: 'intermediate@demo.com',
      password: hashedPassword,
      firstName: 'Jordan',
      lastName: 'Intermediate', 
      role: 'client',
      targetLevel: 'Intermediate' // 15 activities
    },
    {
      email: 'advanced@demo.com',
      password: hashedPassword,
      firstName: 'Taylor',
      lastName: 'Advanced',
      role: 'client', 
      targetLevel: 'Advanced' // 35 activities
    },
    {
      email: 'expert@demo.com',
      password: hashedPassword,
      firstName: 'Morgan',
      lastName: 'Expert',
      role: 'client',
      targetLevel: 'Expert' // 75 activities
    },
    {
      email: 'master@demo.com',
      password: hashedPassword,
      firstName: 'Casey',
      lastName: 'Master',
      role: 'client',
      targetLevel: 'Master' // 150 activities
    }
  ];

  // Get all activities
  const allActivities = await db.select().from(activities);
  
  for (const userData of demoUsers) {
    try {
      // Create user with generated ID
      const userId = nanoid();
      const [user] = await db.insert(users).values({
        id: userId,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role,
        password: userData.password
      }).returning();

      console.log(`Created user: ${user.email} (${userData.targetLevel})`);

      // Determine activity count based on target level
      let activityCount = 0;
      let streakDays = 0;
      
      switch (userData.targetLevel) {
        case 'Beginner':
          activityCount = 0;
          streakDays = 0;
          break;
        case 'Starter':
          activityCount = 5;
          streakDays = 2;
          break;
        case 'Intermediate':
          activityCount = 15;
          streakDays = 5;
          break;
        case 'Advanced':
          activityCount = 35;
          streakDays = 12;
          break;
        case 'Expert':
          activityCount = 75;
          streakDays = 25;
          break;
        case 'Master':
          activityCount = 150;
          streakDays = 45;
          break;
      }

      if (activityCount > 0) {
        // Create historical data over multiple days
        const daysToCreate = Math.min(streakDays + 5, 30); // Create up to 30 days of history
        
        for (let dayOffset = daysToCreate; dayOffset >= 0; dayOffset--) {
          const date = new Date();
          date.setDate(date.getDate() - dayOffset);
          const dateStr = date.toISOString().split('T')[0];
          
          // Create daily tracker
          const [tracker] = await db.insert(dailyTrackers).values({
            userId: user.id,
            date: dateStr,
            completionRate: 0
          }).returning();

          // Add activities for this day (simulate realistic usage)
          const activitiesForDay = Math.min(
            Math.floor(Math.random() * 4) + 1, // 1-4 activities per day
            Math.floor(activityCount / daysToCreate) + 1
          );

          let completedCount = 0;
          
          for (let i = 0; i < activitiesForDay && activityCount > 0; i++) {
            const randomActivity = allActivities[Math.floor(Math.random() * allActivities.length)];
            const timeSlots = ['morning', 'afternoon', 'evening'];
            const randomTimeSlot = timeSlots[Math.floor(Math.random() * timeSlots.length)];
            
            // Higher completion rate for recent days and higher level users
            const isRecent = dayOffset <= streakDays;
            const completionProbability = userData.targetLevel === 'Master' ? 0.9 : 
                                        userData.targetLevel === 'Expert' ? 0.8 :
                                        userData.targetLevel === 'Advanced' ? 0.7 :
                                        isRecent ? 0.8 : 0.6;
            
            const isCompleted = Math.random() < completionProbability;
            
            await db.insert(trackerEntries).values({
              trackerId: tracker.id,
              activityId: randomActivity.id,
              timeSlot: randomTimeSlot,
              status: isCompleted ? 'completed' : 'pending'
            });

            if (isCompleted) {
              completedCount++;
              activityCount--;
            }
          }

          // Update tracker completion rate
          const completionRate = activitiesForDay > 0 ? Math.round((completedCount / activitiesForDay) * 100) : 0;
          await db.update(dailyTrackers)
            .set({ completionRate })
            .where(eq(dailyTrackers.id, tracker.id));
        }
      }

      console.log(`  → Generated ${userData.targetLevel} level progress for ${user.firstName} ${user.lastName}`);
      
    } catch (error) {
      console.error(`Error creating user ${userData.email}:`, error);
    }
  }

  console.log('\nDemo users created successfully!');
  console.log('\nLogin credentials (all use password: password123):');
  console.log('• beginner@demo.com - Beginner (0 activities)');
  console.log('• starter@demo.com - Starter (5 activities)'); 
  console.log('• intermediate@demo.com - Intermediate (15 activities)');
  console.log('• advanced@demo.com - Advanced (35 activities)');
  console.log('• expert@demo.com - Expert (75 activities)');
  console.log('• master@demo.com - Master (150 activities)');
}

// Run the script
populateDemoUsers()
  .then(() => {
    console.log('\nPopulation complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error populating demo users:', error);
    process.exit(1);
  });