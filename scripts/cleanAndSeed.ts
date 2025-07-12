// Clean and seed all data for TranscendBodyCursor
import { db } from '../server/db.ts';
import { users, activities, dailyTrackers, trackerEntries } from '../shared/schema.ts';
import { spawnSync } from 'child_process';

async function cleanAllData() {
  console.log('🧹 Cleaning all data...');
  
  // Delete in correct order (respecting foreign keys)
  await db.delete(trackerEntries);
  console.log('✅ Deleted tracker entries');
  
  await db.delete(dailyTrackers);
  console.log('✅ Deleted daily trackers');
  
  await db.delete(activities);
  console.log('✅ Deleted activities');
  
  await db.delete(users);
  console.log('✅ Deleted users');
  
  console.log('🎉 All data cleaned successfully!');
}

async function seedAllData() {
  console.log('\n🌱 Starting complete seeding process...');
  
  // Step 1: Seed master activities first
  console.log('\n📋 Step 1: Seeding master activities...');
  const masterResult = spawnSync('node', ['--loader', 'ts-node/esm', 'scripts/seedMasterActivities.ts'], { stdio: 'inherit' });
  if (masterResult.status !== 0) {
    console.error('❌ Failed to seed master activities. Exiting.');
    process.exit(1);
  }
  console.log('✅ Master activities seeded successfully');
  
  // Step 2: Seed demo data (users, demo activities, tracker data)
  console.log('\n👥 Step 2: Seeding demo data...');
  const demoResult = spawnSync('node', ['--loader', 'ts-node/esm', 'scripts/seedDemoData.ts'], { stdio: 'inherit' });
  if (demoResult.status !== 0) {
    console.error('❌ Failed to seed demo data. Exiting.');
    process.exit(1);
  }
  console.log('✅ Demo data seeded successfully');
  
  console.log('\n🎉 Complete seeding process finished!');
  console.log('\n📊 Expected totals:');
  console.log('- 40 Master Activities');
  console.log('- 16 Demo Activities');
  console.log('- 5 Demo Users');
  console.log('- Multiple days of tracker data for each user');
}

async function main() {
  try {
    await cleanAllData();
    await seedAllData();
    console.log('\n✨ Database is now clean and properly seeded!');
  } catch (error) {
    console.error('❌ Error during clean and seed process:', error);
    process.exit(1);
  }
}

main(); 