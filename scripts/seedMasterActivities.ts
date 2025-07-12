import * as dotenv from 'dotenv';
dotenv.config();
console.log('Script started');
console.log('Using DB URL:', process.env.DATABASE_URL);

import { db } from "../server/db.ts";
import { globalActivities, users } from "../shared/schema.ts";
import { sql } from 'drizzle-orm';

async function main() {
  try {
    console.log('DB and activities imported successfully');
    
    // Get admin user to assign as creator of global activities
    const adminUser = await db.select().from(users).where(sql`is_admin = true`).limit(1);
    const adminId = adminUser[0]?.id || 'admin-demo';
    
    console.log(`Using admin user: ${adminId}`);
    
    // Insert full canonical set of activities as global activities
    const masterActivities = [
    // 🏋️ WORKOUT
      { title: "Upper Body Push-Pull", description: "Lat pulldown, pushups, seated rows", category: "workout", timeOfDay: "morning" },
      { title: "Chest + Core Circuit", description: "Chest press, sit-ups, incline cardio walk", category: "workout", timeOfDay: "morning" },
      { title: "Leg Day Strength", description: "Goblet squats, leg extension, calf raises", category: "workout", timeOfDay: "morning" },
      { title: "Arms & Shoulders", description: "Biceps, triceps, lateral raises", category: "workout", timeOfDay: "morning" },
      { title: "Cardio Incline Walk", description: "Treadmill cardio at incline – 4x/week", category: "workout", timeOfDay: "morning" },
      { title: "Core Blaster", description: "Planks, sit-ups, hanging leg raises", category: "workout", timeOfDay: "evening" },
      { title: "Lower Body Sculpt", description: "Sumo squats, Bulgarian splits, step-ups", category: "workout", timeOfDay: "morning" },
      { title: "Push Day", description: "Chest, shoulders, triceps", category: "workout", timeOfDay: "morning" },
      { title: "Pull Day", description: "Back, biceps, rear delts", category: "workout", timeOfDay: "morning" },
      { title: "Mobility + Foam Rolling", description: "Stretch & roll for recovery and flexibility", category: "workout", timeOfDay: "evening" },
    // 🍎 NUTRITION
      { title: "Protein-Packed Breakfast", description: "Eggs, tofu, or protein shake", category: "nutrition", timeOfDay: "morning" },
      { title: "Power Lunch", description: "Lentils, paneer, quinoa, vegetables", category: "nutrition", timeOfDay: "afternoon" },
      { title: "Clean Dinner", description: "Fish or tofu, salad, sweet potato", category: "nutrition", timeOfDay: "evening" },
      { title: "Healthy Snacks", description: "Fruits, nuts, yogurt, roasted chickpeas", category: "nutrition", timeOfDay: "afternoon" },
      { title: "Foods to Avoid", description: "Skip junk food, sugar drinks, biscuits", category: "nutrition", timeOfDay: "any" },
      { title: "Meal Prep Ritual", description: "Plan and prepare clean meals for the week", category: "nutrition", timeOfDay: "afternoon" },
      { title: "Hydration Reminder", description: "Drink at least 2–3L water daily", category: "nutrition", timeOfDay: "any" },
      { title: "No Eating After 8PM", description: "Digestive reset before sleep", category: "nutrition", timeOfDay: "night" },
      { title: "Mindful Eating", description: "Chew slowly, pause, feel the fullness", category: "nutrition", timeOfDay: "any" },
      { title: "Intermittent Fasting", description: "16:8 fasting window", category: "nutrition", timeOfDay: "any" },
    // 🔋 RECOVERY
      { title: "Sleep Ritual", description: "Phone off 10PM, sleep 7–8 hrs", category: "recovery", timeOfDay: "night" },
      { title: "Shakti Chalana Kriya", description: "Reset nervous system with energy kriya", category: "recovery", timeOfDay: "evening" },
      { title: "Shoonya Meditation", description: "Non-doing awareness practice", category: "recovery", timeOfDay: "afternoon" },
      { title: "Heart-Crown Meditation", description: "Presence-based stillness practice", category: "recovery", timeOfDay: "afternoon" },
      { title: "Cold Showers", description: "Post-workout cold therapy", category: "recovery", timeOfDay: "morning" },
      { title: "Meridian Massage", description: "Stimulate energetic lines in body", category: "recovery", timeOfDay: "evening" },
      { title: "Grounding Walk", description: "15 min barefoot nature walk", category: "recovery", timeOfDay: "morning" },
      { title: "Journaling Before Bed", description: "Reflect and release mentally", category: "recovery", timeOfDay: "night" },
      { title: "Aromatherapy", description: "Use calming scents for body/mind", category: "recovery", timeOfDay: "night" },
      { title: "Afternoon Nap / Reset", description: "Short recharge nap or lying down", category: "recovery", timeOfDay: "afternoon" },
    // 🧠 MINDSET
      { title: "Mirror Affirmations", description: "Daily statements to your ideal self", category: "mindset", timeOfDay: "morning" },
      { title: "Observe Cravings", description: "Ask “What do I need?” before eating", category: "mindset", timeOfDay: "afternoon" },
      { title: "Micro Goal Setting", description: "Choose 1 win to focus on today", category: "mindset", timeOfDay: "morning" },
      { title: "Self-Reflection Weekly", description: "What worked? Where did I sabotage?", category: "mindset", timeOfDay: "evening" },
      { title: "Self-Forgiveness Ritual", description: "Release guilt from past slips", category: "mindset", timeOfDay: "night" },
      { title: "Visualize Ideal Body", description: "Feel your best future self", category: "mindset", timeOfDay: "morning" },
      { title: "Gratitude Journal (Body)", description: "Appreciate your body’s journey", category: "mindset", timeOfDay: "evening" },
      { title: "Sleep Audio Reprogramming", description: "Affirmations/hypnosis audio", category: "mindset", timeOfDay: "night" },
      { title: "Shadow Work Prompt", description: "Explore and rewrite 1 belief", category: "mindset", timeOfDay: "evening" },
      { title: "Celebrate Micro Wins", description: "Track small progress moments", category: "mindset", timeOfDay: "night" },
    ];
    
    // Insert master activities as global activities
    for (const activity of masterActivities) {
      await db.insert(globalActivities).values({
        ...activity,
        isCustom: false,
        difficulty: 'medium',
        createdBy: adminId,
      });
    }
    
    console.log('✅ Seeded 40 master activities as global activities');
  } catch (err) {
    console.error('❌ Error in main:', err);
  }
}

main().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
