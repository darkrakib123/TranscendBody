import { User, DailyTracker, TrackerEntry } from '../shared/schema.ts';

// Business Logic Constants
const ACCOUNTABILITY_LEVELS = {
  beginner: { minActivities: 6, maxActivities: 8 },
  intermediate: { minActivities: 8, maxActivities: 10 },
  master: { minActivities: 10, maxActivities: 12 }
};

// --- Updated boundaries and logic ---
const LEVEL_THRESHOLDS = { beginner: 0, intermediate: 91, master: 181 };
const TIER_THRESHOLDS = { bronze: 0, silver: 31, gold: 61 };
const TIER_MAX = 90;
const LEVEL_MAX = 189;

function getTier(streak: number) {
  if (streak >= 61) return 'gold';
  if (streak >= 31) return 'silver';
  return 'bronze';
}
function getLevel(streak: number) {
  if (streak >= 181) return 'master';
  if (streak >= 91) return 'intermediate';
  return 'beginner';
}

// Helper function to get day completion rate
function getDayCompletionRate(tracker: DailyTracker, entries: TrackerEntry[]) {
  const dayEntries = entries.filter(e => e.trackerId === tracker.id);
  if (dayEntries.length === 0) return 0;
  
  const completed = dayEntries.filter(e => e.status === 'completed').length;
  return completed / dayEntries.length;
}

// Helper function to get first N days of trackers
function getFirstNDays(trackers: DailyTracker[], n: number) {
  return trackers.slice(0, n);
}

// Helper function to check if a day is successful (≥80% completion)
function isSuccessfulDay(tracker: DailyTracker, entries: TrackerEntry[]) {
  const rate = getDayCompletionRate(tracker, entries);
  return rate >= 0.8;
}

// --- Updated streak reset logic ---
function calculateCurrentStreak(trackers: DailyTracker[], entries: TrackerEntry[]) {
  let streak = 0;
  const sortedTrackers = [...trackers].sort((a, b) => b.date.localeCompare(a.date));
  const todayStr = new Date().toISOString().slice(0, 10);
  let startIndex = 0;
  
  // Skip today's tracker if it exists (don't count incomplete day)
  if (sortedTrackers[0]?.date === todayStr) startIndex = 1;
  
  let missed = 0;
  let consecutiveMissed = 0;
  
  for (let i = startIndex; i < sortedTrackers.length; i++) {
    const tracker = sortedTrackers[i];
    if (isSuccessfulDay(tracker, entries)) {
      streak++;
      consecutiveMissed = 0; // Reset consecutive missed counter
    } else {
      missed++;
      consecutiveMissed++;
      
      // Break streak if 3 consecutive days missed OR more than 2 missed in last 7 days
      if (consecutiveMissed >= 3) break;
      if (i < 7 && missed > 2) break;
    }
    
    // Don't count beyond reasonable streak calculation window
    if (i >= 90) break;
  }
  
  return streak;
}

// --- Patch for accountability reset if missed days exceed allowed in the tier window ---
function resetAccountabilityIfMissed(trackers: DailyTracker[], entries: TrackerEntry[], threshold: number, window: number) {
  // Only consider the last 'window' days
  const sortedTrackers = [...trackers].sort((a, b) => b.date.localeCompare(a.date)).slice(0, window);
  let missed = 0;
  for (const tracker of sortedTrackers) {
    if (!isSuccessfulDay(tracker, entries)) missed++;
  }
  // If missed days exceed allowed, reset accountability
  return missed > threshold;
}

// Calculate tier progression based on successful days
function calculateTierProgress(trackers: DailyTracker[], entries: TrackerEntry[], currentTier: string) {
  const sortedTrackers = [...trackers].sort((a, b) => a.date.localeCompare(b.date));
  
  // Get first 30 and 60 days
  const first30Days = getFirstNDays(sortedTrackers, 30);
  const first60Days = getFirstNDays(sortedTrackers, 60);
  
  // Count successful days
  const successfulDays30 = first30Days.filter(tracker => isSuccessfulDay(tracker, entries)).length;
  const successfulDays60 = first60Days.filter(tracker => isSuccessfulDay(tracker, entries)).length;
  
  // Calculate progress percentages
  const progress30 = Math.min(100, (successfulDays30 / 30) * 100);
  const progress60 = Math.min(100, (successfulDays60 / 60) * 100);
  
  // Determine next tier target
  let nextTierTarget = '';
  let currentProgress = 0;
  let targetDays = 0;
  
  if (currentTier === 'bronze') {
    nextTierTarget = 'silver';
    currentProgress = progress30;
    targetDays = 30;
  } else if (currentTier === 'silver') {
    nextTierTarget = 'gold';
    currentProgress = progress60;
    targetDays = 60;
  } else if (currentTier === 'gold') {
    nextTierTarget = 'max';
    currentProgress = 100;
    targetDays = 0;
  } else {
    nextTierTarget = 'max';
    currentProgress = 100;
    targetDays = 0;
  }
  
  return {
    successfulDays30,
    successfulDays60,
    progress30,
    progress60,
    nextTierTarget,
    currentProgress,
    targetDays
  };
}

// Calculate accountability level progression
function calculateAccountabilityProgress(trackers: DailyTracker[], entries: TrackerEntry[], currentLevel: string) {
  const sortedTrackers = [...trackers].sort((a, b) => a.date.localeCompare(b.date));
  
  // Get first 90 days
  const first90Days = getFirstNDays(sortedTrackers, 90);
  const successfulDays90 = first90Days.filter(tracker => isSuccessfulDay(tracker, entries)).length;
  
  // Calculate progress percentage
  const progress90 = Math.min(100, (successfulDays90 / 90) * 100);
  
  // Determine next level target
  let nextLevelTarget = '';
  let currentProgress = 0;
  let targetDays = 0;
  
  if (currentLevel === 'beginner') {
    nextLevelTarget = 'intermediate';
    currentProgress = progress90;
    targetDays = 90;
  } else if (currentLevel === 'intermediate') {
    nextLevelTarget = 'master';
    currentProgress = progress90;
    targetDays = 90;
  } else {
    nextLevelTarget = 'max';
    currentProgress = 100;
    targetDays = 0;
  }
  
  return {
    successfulDays90,
    progress90,
    nextLevelTarget,
    currentProgress,
    targetDays
  };
}

// Calculate weekly average completion rate
function calculateWeeklyAverage(trackers: DailyTracker[], entries: TrackerEntry[]) {
  const sortedTrackers = [...trackers].sort((a, b) => b.date.localeCompare(a.date));
  const last7Days = sortedTrackers.slice(0, 7);
  
  if (last7Days.length === 0) return 0;
  
  const weeklyCompletionRates = last7Days.map(tracker => getDayCompletionRate(tracker, entries));
  const average = weeklyCompletionRates.reduce((sum, rate) => sum + rate, 0) / weeklyCompletionRates.length;
  
  return Math.round(average * 100);
}

// --- Accountability countdown logic ---
function getAccountabilityCountdown(streak: number) {
  if (streak >= TIER_MAX) return 0;
  if (streak >= 61) return TIER_MAX - streak; // Gold
  if (streak >= 31) return 61 - streak; // Silver
  return 31 - streak; // Bronze
}

// Main progression logic
export function computeUserProgress(user: User, trackers: DailyTracker[], entries: TrackerEntry[]) {
  // Sort trackers by date
  const sortedTrackers = [...trackers].sort((a, b) => a.date.localeCompare(b.date));
  
  // Total activities completed
  const activitiesCompleted = entries.filter(e => e.status === 'completed' && 
    trackers.some(d => d.id === e.trackerId && d.userId === user.id)).length;
  
  // Total activities assigned
  const totalActivitiesAssigned = entries.filter(e => 
    trackers.some(d => d.id === e.trackerId && d.userId === user.id)).length;
  
  // Overall completion rate
  const completionRate = totalActivitiesAssigned > 0 ? activitiesCompleted / totalActivitiesAssigned : 0;
  
  // Current streak (consecutive successful days, excluding today)
  const currentStreak = calculateCurrentStreak(sortedTrackers, entries);
  const tier = getTier(currentStreak);
  const level = getLevel(currentStreak);
  const accountabilityCountdown = getAccountabilityCountdown(currentStreak);
  const accountabilityMessage = accountabilityCountdown === 0 ? 'You have reached the highest accountability level!' : 'more days to next level!';
  
  // Weekly average completion rate
  const weeklyAverage = calculateWeeklyAverage(sortedTrackers, entries);
  
  // Tier progression
  const tierProgress = calculateTierProgress(sortedTrackers, entries, user.tier);
  
  // Accountability level progression
  const accountabilityProgress = calculateAccountabilityProgress(sortedTrackers, entries, user.accountabilityLevel);
  
  // Calculate activities per day based on accountability level
  const accountabilityConfig = ACCOUNTABILITY_LEVELS[user.accountabilityLevel as keyof typeof ACCOUNTABILITY_LEVELS];
  const avgActivitiesPerDay = accountabilityConfig ? 
    (accountabilityConfig.minActivities + accountabilityConfig.maxActivities) / 2 : 8;
  
  // --- New logic for accountability, daysToNextLevel, and levelUpMessage ---
  // Define tier/level thresholds and next names
  const tierThresholds: Record<string, number> = { bronze: 0, silver: 30, gold: 60 };
  const tierOrder = ['bronze', 'silver', 'gold'];
  const tierDisplay: Record<string, string> = { bronze: 'Bronze', silver: 'Silver', gold: 'Gold' };
  // Special handling for Master level progression
  let currentThreshold = 0;
  let nextThreshold = undefined;
  let nextTierDisplay = undefined;
  let daysToNextLevel = 0;
  let levelUpMessage = '';
  let accountability = 0;
  if (user.accountabilityLevel === 'master') {
    if (user.tier === 'bronze') {
      currentThreshold = 0;
      nextThreshold = 30;
      nextTierDisplay = 'Master/Silver';
      daysToNextLevel = Math.max(0, nextThreshold - currentStreak);
      levelUpMessage = daysToNextLevel > 0 ? `${daysToNextLevel} more days to Master/Silver!` : 'You have reached Master/Silver!';
    } else if (user.tier === 'silver') {
      currentThreshold = 30;
      nextThreshold = 60;
      nextTierDisplay = 'Master/Gold';
      daysToNextLevel = Math.max(0, nextThreshold - currentStreak);
      levelUpMessage = daysToNextLevel > 0 ? `${daysToNextLevel} more days to Master/Gold!` : 'You have reached Master/Gold!';
    } else if (user.tier === 'gold') {
      currentThreshold = 60;
      nextThreshold = undefined;
      daysToNextLevel = 90 - currentStreak;
      levelUpMessage = daysToNextLevel > 0 ? `${daysToNextLevel} more days to hit the highest level!` : 'You have reached the highest accountability level!';
    }
  } else {
    const currentTierIdx = tierOrder.indexOf(user.tier);
    const nextTier = tierOrder[currentTierIdx + 1];
    nextTierDisplay = nextTier ? tierDisplay[nextTier] : undefined;
    currentThreshold = tierThresholds[user.tier] || 0;
    nextThreshold = nextTier ? tierThresholds[nextTier] : undefined;
    daysToNextLevel = nextThreshold ? Math.max(0, nextThreshold - currentStreak) : 0;
    if (nextTier && daysToNextLevel > 0) {
      levelUpMessage = `${daysToNextLevel} more days to ${nextTierDisplay}!`;
    } else if (!nextTier) {
      levelUpMessage = 'You have reached the highest tier!';
    }
  }
  // Accountability: streak minus threshold for current tier (never below zero)
  accountability = Math.max(0, currentStreak - currentThreshold);
  // Reset accountability if missed days exceed allowed in the tier window (example: 3 missed in 30 days)
  if (resetAccountabilityIfMissed(trackers, entries, 3, 30)) {
    accountability = 0;
  }
  
  // Return comprehensive progress data
  return {
    // Core metrics
    activitiesCompleted,
    totalActivitiesAssigned,
    completionRate: Math.round(completionRate * 100),
    currentStreak,
    weeklyAverage,
    
    // Tier progression
    tier: user.tier,
    successfulDays30: tierProgress.successfulDays30,
    successfulDays60: tierProgress.successfulDays60,
    tierProgress30: Math.round(tierProgress.progress30),
    tierProgress60: Math.round(tierProgress.progress60),
    nextTierTarget: tierProgress.nextTierTarget,
    tierCurrentProgress: Math.round(tierProgress.currentProgress),
    tierTargetDays: tierProgress.targetDays,
    
    // Accountability level progression
    accountabilityLevel: user.accountabilityLevel,
    successfulDays90: accountabilityProgress.successfulDays90,
    accountabilityProgress90: Math.round(accountabilityProgress.progress90),
    nextAccountabilityTarget: accountabilityProgress.nextLevelTarget,
    accountabilityCurrentProgress: Math.round(accountabilityProgress.currentProgress),
    accountabilityTargetDays: accountabilityProgress.targetDays,
    
    // Additional metrics
    avgActivitiesPerDay: Math.round(avgActivitiesPerDay),
    totalDays: sortedTrackers.length,
    
    // New fields for all demo accounts
    accountability,
    daysToNextLevel,
    levelUpMessage,
    accountabilityCountdown,
    accountabilityMessage,
    
    // For backward compatibility
    totalActivities: activitiesCompleted,
    activitiesCount: activitiesCompleted
  };
} 