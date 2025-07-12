// Verify database counts after seeding
import { db } from '../server/db.ts';
import { users, globalActivities, demoActivities, dailyTrackers, trackerEntries } from '../shared/schema.ts';
import { eq } from 'drizzle-orm';

async function verifyCounts() {
  console.log('🔍 Verifying database counts...\n');
  
  try {
    // Count users
    const userCount = await db.select().from(users);
    console.log(`👥 Users: ${userCount.length}`);
    userCount.forEach(user => {
      console.log(`  - ${user.email} (${user.tier}/${user.level}/${user.plan})`);
    });
    
    // Count global activities
    const globalActivityCount = await db.select().from(globalActivities);
    console.log(`\n📋 Global Activities: ${globalActivityCount.length}`);
    
    // Count demo activities
    const demoActivityCount = await db.select().from(demoActivities);
    console.log(`📋 Demo Activities: ${demoActivityCount.length}`);
    
    // Count daily trackers
    const trackerCount = await db.select().from(dailyTrackers);
    console.log(`📊 Daily Trackers: ${trackerCount.length}`);
    
    // Count tracker entries
    const entryCount = await db.select().from(trackerEntries);
    console.log(`✅ Tracker Entries: ${entryCount.length}`);
    
    // Check specific demo accounts
    console.log('\n🎯 Three Main Demo Accounts:');
    const adminDemo = userCount.find(u => u.email === 'admin@demo.com');
    const masterDemo = userCount.find(u => u.email === 'master@demo.com');
    const silverDemo = userCount.find(u => u.email === 'silver@demo.com');
    
    if (adminDemo) {
      const adminTrackers = await db.select().from(dailyTrackers).where(eq(dailyTrackers.userId, adminDemo.id));
      console.log(`  - Admin (${adminDemo.email}): ${adminTrackers.length} trackers`);
    }
    
    if (masterDemo) {
      const masterTrackers = await db.select().from(dailyTrackers).where(eq(dailyTrackers.userId, masterDemo.id));
      console.log(`  - Master (${masterDemo.email}): ${masterTrackers.length} trackers`);
    }
    
    if (silverDemo) {
      const silverTrackers = await db.select().from(dailyTrackers).where(eq(dailyTrackers.userId, silverDemo.id));
      console.log(`  - Silver (${silverDemo.email}): ${silverTrackers.length} trackers`);
    }
    
    console.log('\n🎯 Expected totals:');
    console.log('- 5 Demo Users');
    console.log('- 40 Global Activities (canonical set)');
    console.log('- 16 Demo Activities (for demo accounts)');
    console.log('- Multiple daily trackers per user');
    console.log('- Multiple tracker entries per day');
    
    console.log('\n✨ Database verification complete!');
    
  } catch (error) {
    console.error('❌ Error verifying counts:', error);
  }
}

verifyCounts(); 