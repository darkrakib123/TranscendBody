// Test script to verify demo accounts work correctly
import { db } from '../server/db.ts';
import { users, globalActivities, demoActivities, dailyTrackers, trackerEntries } from '../shared/schema.ts';
import { eq, and } from 'drizzle-orm';

async function testDemoAccounts() {
  console.log('🧪 Testing Demo Accounts...\n');
  
  try {
    // Test the three main demo accounts
    const demoEmails = ['admin@demo.com', 'bronze@demo.com', 'silver@demo.com'];
    const expectedCounts = {
      'admin@demo.com': 10,
      'bronze@demo.com': 6,
      'silver@demo.com': 8
    };
    
    for (const email of demoEmails) {
      console.log(`📧 Testing ${email}:`);
      
      // Get user
      const user = await db.query.users.findFirst({
        where: eq(users.email, email),
      });
      
      if (!user) {
        console.log(`  ❌ User not found`);
        continue;
      }
      
      console.log(`  ✅ User found: ${user.tier}/${user.level}/${user.plan}`);
      
      // Get today's tracker
      const today = new Date().toISOString().slice(0, 10);
      const tracker = await db.query.dailyTrackers.findFirst({
        where: and(
          eq(dailyTrackers.userId, user.id),
          eq(dailyTrackers.date, today)
        ),
      });
      
      if (!tracker) {
        console.log(`  ❌ No tracker for today`);
        continue;
      }
      
      console.log(`  ✅ Today's tracker found (ID: ${tracker.id})`);
      
      // Get tracker entries with activities
      const entries = await db
        .select({
          id: trackerEntries.id,
          timeSlot: trackerEntries.timeSlot,
          status: trackerEntries.status,
          activityTitle: demoActivities.title,
          activityCategory: demoActivities.category,
        })
        .from(trackerEntries)
        .innerJoin(demoActivities, eq(trackerEntries.activityId, demoActivities.id))
        .where(eq(trackerEntries.trackerId, tracker.id));
      
      const expectedCount = expectedCounts[email as keyof typeof expectedCounts];
      const status = entries.length === expectedCount ? '✅' : '❌';
      console.log(`  ${status} Activities for today: ${entries.length} (expected: ${expectedCount})`);
      
      // Group by time slot
      const byTimeSlot = entries.reduce((acc, entry) => {
        if (!acc[entry.timeSlot]) acc[entry.timeSlot] = [];
        acc[entry.timeSlot].push(entry);
        return acc;
      }, {} as Record<string, any[]>);
      
      Object.entries(byTimeSlot).forEach(([slot, activities]) => {
        console.log(`    ${slot}: ${activities.length} activities`);
      });
      
      console.log('');
    }
    
    // Test global activities for dropdown
    console.log('🌐 Testing Global Activities (for dropdown):');
    const globalActivitiesList = await db.select().from(globalActivities);
    console.log(`  📋 Total global activities: ${globalActivitiesList.length}`);
    
    // Test demo activities
    console.log('\n🎭 Testing Demo Activities:');
    const demoActivitiesList = await db.select().from(demoActivities);
    console.log(`  📋 Total demo activities: ${demoActivitiesList.length}`);
    
    console.log('\n✅ Demo account testing complete!');
    
  } catch (error) {
    console.error('❌ Error testing demo accounts:', error);
  }
}

testDemoAccounts(); 