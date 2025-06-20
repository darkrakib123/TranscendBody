import { db } from '../server/db';
import * as schema from '../shared/schema';
import { eq, and } from 'drizzle-orm';
const { activities } = schema;

const seedActivities = [
  // Workout Activities
  { title: 'HIIT Training', description: 'High-intensity interval training session', category: 'workout' },
  { title: 'Push-ups', description: 'Upper body strength exercise', category: 'workout' },
  { title: 'Squats', description: 'Lower body strength exercise', category: 'workout' },
  { title: 'Planks', description: 'Core strengthening exercise', category: 'workout' },
  { title: '30-min Walk', description: 'Moderate cardio activity', category: 'workout' },
  { title: 'Yoga Session', description: 'Flexibility and mindfulness practice', category: 'workout' },
  { title: 'Weight Training', description: 'Resistance training session', category: 'workout' },
  
  // Nutrition Activities
  { title: 'Healthy Breakfast', description: 'Nutritious morning meal', category: 'nutrition' },
  { title: 'Protein Shake', description: 'Post-workout protein supplement', category: 'nutrition' },
  { title: 'Meal Prep', description: 'Prepare healthy meals in advance', category: 'nutrition' },
  { title: 'Track Calories', description: 'Log daily caloric intake', category: 'nutrition' },
  { title: 'Drink 8 Glasses Water', description: 'Stay hydrated throughout the day', category: 'nutrition' },
  { title: 'Take Vitamins', description: 'Daily vitamin supplementation', category: 'nutrition' },
  
  // Recovery Activities
  { title: '8 Hours Sleep', description: 'Quality sleep for recovery', category: 'recovery' },
  { title: 'Foam Rolling', description: 'Muscle recovery and flexibility', category: 'recovery' },
  { title: 'Hot Bath', description: 'Relaxation and muscle recovery', category: 'recovery' },
  { title: 'Massage', description: 'Professional or self-massage', category: 'recovery' },
  { title: 'Stretching', description: 'Daily flexibility routine', category: 'recovery' },
  
  // Mindset Activities
  { title: 'Morning Meditation', description: 'Start day with mindfulness', category: 'mindset' },
  { title: 'Goal Visualization', description: 'Visualize achieving fitness goals', category: 'mindset' },
  { title: 'Gratitude Journal', description: 'Write down three things you\'re grateful for', category: 'mindset' },
  { title: 'Positive Affirmations', description: 'Reinforce positive self-talk', category: 'mindset' },
  { title: 'Progress Photos', description: 'Track visual progress', category: 'mindset' }
];

async function seedDatabase() {
  console.log('Starting database seeding...');
  
  try {
    // Check if activities already exist
    const existingActivities = await db.select().from(activities);
    
    if (existingActivities.length > 0) {
      console.log('Activities already exist. Skipping seed.');
      return;
    }
    
    // Insert seed activities
    await db.insert(activities).values(seedActivities);
    
    console.log(`Successfully seeded ${seedActivities.length} activities`);
    
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seed function
seedDatabase()
  .then(() => {
    console.log('Database seeding completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Database seeding failed:', error);
    process.exit(1);
  });