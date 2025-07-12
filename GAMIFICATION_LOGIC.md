# 🎮 Gamification Logic - TranscendBody

This document outlines the complete gamification system for TranscendBody, explaining how users progress through levels, tiers, and achieve their fitness transformation goals.

## 📊 System Overview

TranscendBody uses a **dual-tier progression system** that rewards consistency and accountability:

- **Accountability Levels**: Long-term progression (Beginner → Intermediate → Master)
- **Tiers**: Short-term milestones within each level (Bronze → Silver → Gold)
- **Total Journey**: 270 days to reach maximum achievement

## 🏆 Accountability Levels

### **Beginner Level** (Days 1-90)
- **Bronze Tier**: Days 1-30
- **Silver Tier**: Days 31-60  
- **Gold Tier**: Days 61-90
- **Activities Required**: 6-8 activities per day
- **Progression**: 90 days of consistency unlocks Intermediate level

### **Intermediate Level** (Days 91-180)
- **Bronze Tier**: Days 91-120
- **Silver Tier**: Days 121-150
- **Gold Tier**: Days 151-180
- **Activities Required**: 8-10 activities per day
- **Progression**: 90 days of consistency unlocks Master level

### **Master Level** (Days 181-270)
- **Bronze Tier**: Days 181-210
- **Silver Tier**: Days 211-240
- **Gold Tier**: Days 241-270 (Maximum achievement)
- **Activities Required**: 10-12 activities per day
- **Progression**: Complete transformation journey

## 🎯 Progression Requirements

### **Daily Success Criteria**
- Complete **>80%** of assigned activities
- Maintain consistency across all time slots
- Balance activities across all categories (Workout, Nutrition, Recovery, Mindset)

### **Level Advancement**
- **90 days** of consistent activity (>80% completion rate)
- Meet minimum activity requirements for current level
- Maintain streak without extended breaks (>2 missed days in 30-day window)

### **Tier Progression**
- **30-day** consistency periods for tier advancement
- Consistent weekly averages above 80%
- Regular engagement with all activity categories

## 📈 Key Metrics & Statistics

### **Current Streak**
- **Definition**: Consecutive days with >80% activity completion
- **Purpose**: Primary driver for tier and level progression
- **Reset Condition**: Streak resets if more than 2 days missed in 30-day window
- **Display**: Shows as number in dashboard

### **Weekly Average**
- **Definition**: Average daily completion rate over the past 7 days
- **Target**: Aim for 80%+ to maintain progression
- **Calculation**: Sum of last 7 days completion rates ÷ 7
- **Display**: Shows as percentage in dashboard

### **Accountability Score**
- **Definition**: Countdown to next tier/level milestone
- **Purpose**: Motivates users to stay consistent
- **Display**: Shows "X more days to [Next Tier/Level]"
- **Reset**: Resets to 0 when milestone is reached

### **Activities Completed**
- **Definition**: Total number of activities completed all-time
- **Purpose**: Tracks overall progress and engagement
- **Display**: Running total in dashboard
- **Persistence**: Never resets, continues accumulating

## 🏋️ Activity Requirements by Level

### **Beginner Level** (6-8 activities/day)
- **Minimum**: 6 activities per day
- **Maximum**: 8 activities per day
- **Distribution**: Across all 4 categories
- **Time Slots**: Morning, Afternoon, Evening, Night
- **Focus**: Building foundational habits

### **Intermediate Level** (8-10 activities/day)
- **Minimum**: 8 activities per day
- **Maximum**: 10 activities per day
- **Distribution**: Balanced across all categories
- **Time Slots**: All 4 time slots utilized
- **Focus**: Expanding routine and consistency

### **Master Level** (10-12 activities/day)
- **Minimum**: 10 activities per day
- **Maximum**: 12 activities per day
- **Distribution**: Comprehensive coverage of all dimensions
- **Time Slots**: Full daily schedule optimization
- **Focus**: Maximum transformation and habit mastery

## 💎 Subscription Tiers

### **Basic Plan** (Free)
- **Features**: Standard MVP dashboard and tracking
- **Access**: Core gamification system
- **Limitations**: Basic activity library
- **Progression**: Full access to level/tier system

### **Pro Plan** (Paid)
- **Features**: Enhanced analytics and premium features
- **Access**: Advanced tracking and customization
- **Benefits**: Priority support and exclusive content
- **Progression**: Same gamification system with enhanced features

## 🎖️ Journey Completion

### **Full Transformation Journey**
- **Total Duration**: 270 days (9 months)
- **Complete Path**: 
  1. Beginner Bronze (Days 1-30)
  2. Beginner Silver (Days 31-60)
  3. Beginner Gold (Days 61-90)
  4. Intermediate Bronze (Days 91-120)
  5. Intermediate Silver (Days 121-150)
  6. Intermediate Gold (Days 151-180)
  7. Master Bronze (Days 181-210)
  8. Master Silver (Days 211-240)
  9. Master Gold (Days 241-270)
- **Achievement**: Complete transformation with maximum accountability

### **Post-Completion**
- **Restart**: After reaching Master Gold, users restart at Master Bronze Day 1
- **Continued Progress**: Maintain streak and continue building habits
- **Legacy**: All achievements and stats are preserved
- **Motivation**: Continuous improvement and habit maintenance

## 🔄 Streak Logic

### **Streak Calculation**
- **Definition**: Consecutive days with successful completion (>80%)
- **Exclusion**: Today's activities are not counted (pending completion)
- **Reset**: Breaks after missing more than 2 days in 30-day window

### **Streak Maintenance**
- **Daily Target**: Complete >80% of assigned activities
- **Time Slots**: Activities spread across Morning, Afternoon, Evening, Night
- **Categories**: Balance across Workout, Nutrition, Recovery, Mindset

### **Streak Recovery**
- **Grace Period**: 2 missed days allowed in 30-day window
- **Reset Point**: 3+ missed days triggers streak reset
- **Recovery**: Start building new streak from current day

## 📊 Progress Tracking

### **Real-time Updates**
- **Dashboard**: Live updates of all metrics
- **Completion Rate**: Instant feedback on daily progress
- **Streak Counter**: Real-time streak calculation
- **Level Progress**: Visual indicators of advancement

### **Historical Data**
- **Activity History**: Complete record of all completed activities
- **Streak History**: Longest streaks and current streaks
- **Level History**: Progression through levels and tiers
- **Performance Trends**: Weekly and monthly averages

## 🎯 Success Strategies

### **For Beginners**
- Start with 6 activities per day
- Focus on consistency over quantity
- Build habits in all 4 categories
- Aim for 80%+ daily completion

### **For Intermediate Users**
- Increase to 8-10 activities per day
- Optimize time slot distribution
- Maintain high weekly averages
- Prepare for Master level requirements

### **For Master Users**
- Maximize to 10-12 activities per day
- Perfect daily routine optimization
- Maintain >90% weekly averages
- Focus on long-term habit sustainability

## 🔧 Technical Implementation

### **Database Schema**
- **Users Table**: Stores level, tier, and progression data
- **Daily Trackers**: Tracks daily completion rates
- **Tracker Entries**: Individual activity completion status
- **Progress Calculation**: Real-time computation of all metrics

### **Algorithm Logic**
- **Streak Calculation**: Consecutive day counting with reset conditions
- **Level Progression**: 90-day consistency windows
- **Tier Advancement**: 30-day milestone periods
- **Activity Requirements**: Dynamic based on current level

### **User Experience**
- **Visual Feedback**: Progress bars, badges, and indicators
- **Motivational Messages**: Dynamic encouragement based on progress
- **Achievement Unlocks**: Clear milestone celebrations
- **Continuous Engagement**: Never-ending progression system

---

*This gamification system creates a structured, long-term journey that rewards consistency, builds sustainable habits, and provides clear milestones for users to achieve their fitness transformation goals.* 