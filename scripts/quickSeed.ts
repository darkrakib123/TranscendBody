import { db } from '../server/db.ts';
import { users, globalActivities, dailyTrackers, trackerEntries } from '../shared/schema.ts';
import bcrypt from 'bcryptjs';

async function quickSeed() {
  console.log('🌱 Quick seeding demo data...');
  
  try {
    // Create admin user
    const hashedPassword = await bcrypt.hash('test', 10);
    
    await db.insert(users).values({
      id: 'admin-demo',
      email: 'admin@demo.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      preferredName: 'Admin',
      role: 'admin',
      plan: 'pro',
      tier: 'gold',
      accountabilityLevel: 'master',
      isAdmin: true,
    }).onConflictDoNothing();
    
    // Create basic activities
    const activities = [
      { title: 'Morning Push-ups', description: '3 sets of 10', category: 'workout', timeOfDay: 'morning' },
      { title: 'Protein Shake', description: '30g protein', category: 'nutrition', timeOfDay: 'morning' },
      { title: 'Evening Stretch', description: '10 min stretch', category: 'recovery', timeOfDay: 'evening' },
      { title: 'Gratitude Journal', description: 'Write 3 things', category: 'mindset', timeOfDay: 'night' },
    ];
    
    for (const activity of activities) {
      await db.insert(globalActivities).values({
        ...activity,
        isCustom: false,
        difficulty: 'medium',
        createdBy: 'admin-demo',
      }).onConflictDoNothing();
    }
    
    console.log('✅ Quick seed completed!');
    console.log('🎯 Login with: admin@demo.com / test');
    
  } catch (error) {
    console.error('❌ Quick seed error:', error);
  }
}

quickSeed().then(() => process.exit(0));