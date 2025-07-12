// Script to clean duplicate activities from the database
import { db } from '../server/db.ts';
import { globalActivities, demoActivities } from '../shared/schema.ts';
import { sql } from 'drizzle-orm';

async function cleanDuplicates() {
  console.log('🧹 Cleaning duplicate activities...\n');
  
  try {
    // Clean global_activities duplicates
    console.log('📋 Cleaning global_activities duplicates...');
    
    // Delete duplicates from global_activities, keeping the first occurrence
    const globalResult = await db.execute(sql`
      DELETE FROM global_activities 
      WHERE id NOT IN (
        SELECT MIN(id) 
        FROM global_activities 
        GROUP BY title, category, time_of_day
      )
    `);
    
    console.log(`✅ Removed ${globalResult.rowCount} duplicate global activities`);
    
    // Clean demo_activities duplicates
    console.log('📋 Cleaning demo_activities duplicates...');
    
    // Delete duplicates from demo_activities, keeping the first occurrence
    const demoResult = await db.execute(sql`
      DELETE FROM demo_activities 
      WHERE id NOT IN (
        SELECT MIN(id) 
        FROM demo_activities 
        GROUP BY title, category, time_of_day
      )
    `);
    
    console.log(`✅ Removed ${demoResult.rowCount} duplicate demo activities`);
    
    // Verify the cleanup
    const globalCount = await db.select().from(globalActivities);
    const demoCount = await db.select().from(demoActivities);
    
    console.log('\n📊 After cleanup:');
    console.log(`  Global Activities: ${globalCount.length} (should be ~40)`);
    console.log(`  Demo Activities: ${demoCount.length} (should be ~48)`);
    
    console.log('\n🎉 Duplicate cleanup completed!');
    
  } catch (error) {
    console.error('❌ Error cleaning duplicates:', error);
  }
}

cleanDuplicates(); 