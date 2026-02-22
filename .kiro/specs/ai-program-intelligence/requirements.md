# AI Program Intelligence Center - Requirements

## Overview
Transform the Programs page into an intelligent, adaptive system that personalizes workout programs, predicts results, and drives user retention through AI-powered recommendations and gamification.

## Core Philosophy
- **Data-Driven**: Every recommendation backed by scoring algorithms
- **Adaptive**: Programs evolve with user progress
- **Predictive**: Show expected outcomes before commitment
- **Retention-First**: Design for long-term engagement
- **Subscription-Aware**: Strategic feature gating for monetization

---

## PART 1: Smart Program Matching System

### User Profile Collection
**Onboarding Questions:**
1. Primary Goal
   - Muscle Gain (Hypertrophy focus)
   - Fat Loss (Caloric deficit + cardio)
   - Body Recomposition (Balanced approach)
   - Endurance (Cardiovascular focus)
   - Strength (Powerlifting focus)

2. Experience Level
   - Beginner (0-6 months)
   - Intermediate (6-24 months)
   - Advanced (2+ years)

3. Weekly Availability
   - 3 days/week
   - 4 days/week
   - 5 days/week
   - 6 days/week

4. Equipment Access
   - Full gym
   - Home gym (dumbbells, bench, rack)
   - Minimal (dumbbells, bands)
   - Bodyweight only

5. Recovery Quality
   - Excellent (8+ hours sleep, low stress)
   - Good (7-8 hours sleep, moderate stress)
   - Fair (6-7 hours sleep, high stress)
   - Poor (<6 hours sleep, very high stress)

### Program Scoring Algorithm

```typescript
interface ProgramScore {
  totalScore: number;
  breakdown: {
    goalAlignment: number;      // 0-30 points
    experienceMatch: number;    // 0-25 points
    timeCommitment: number;     // 0-20 points
    equipmentMatch: number;     // 0-15 points
    recoveryFit: number;        // 0-10 points
  };
  confidence: 'high' | 'medium' | 'low';
  reasoning: string[];
}
```

**Scoring Logic:**

1. **Goal Alignment (30 points)**
   - Perfect match: 30 points
   - Compatible: 20 points
   - Suboptimal: 10 points
   - Mismatch: 0 points

2. **Experience Match (25 points)**
   - Program difficulty matches user level: 25 points
   - One level difference: 15 points
   - Two levels difference: 5 points

3. **Time Commitment (20 points)**
   - User availability >= program requirement: 20 points
   - 1 day short: 12 points
   - 2+ days short: 0 points

4. **Equipment Match (15 points)**
   - All equipment available: 15 points
   - 80%+ available: 10 points
   - 50-80% available: 5 points
   - <50% available: 0 points

5. **Recovery Fit (10 points)**
   - Program volume matches recovery capacity: 10 points
   - Slightly high volume: 6 points
   - Too high volume: 0 points

**Confidence Scoring:**
- High: totalScore >= 80
- Medium: totalScore 60-79
- Low: totalScore < 60

**Recommendation Display:**
- Top 3 programs shown
- #1 marked as "Best Match"
- Each shows score breakdown
- Reasoning bullets explain why recommended

---

## PART 2: Adaptive Program Engine

### Compliance Tracking

```typescript
interface ComplianceMetrics {
  weeklyCompletionRate: number;  // 0-100%
  missedWorkouts: number;
  consecutiveMisses: number;
  onTimeCompletions: number;
  earlyCompletions: number;
  lateCompletions: number;
}
```

### Auto-Adjustment Triggers

**Trigger 1: Missed Workouts**
- IF consecutiveMisses >= 2
- THEN reduce volume by 15%
- AND extend deload by 1 week
- NOTIFY user of adjustment

**Trigger 2: High Compliance + Fast Progress**
- IF weeklyCompletionRate >= 95% for 3 weeks
- AND user reports "too easy" or completes ahead of time
- THEN increase volume by 10%
- OR suggest progression to next phase

**Trigger 3: Low Recovery Score**
- IF user logs poor sleep 3+ days
- OR reports high fatigue
- THEN reduce intensity by 20%
- AND add extra rest day

**Trigger 4: Automatic Deload**
- Every 4-6 weeks (based on program)
- Reduce volume by 40%
- Reduce intensity by 20%
- Focus on technique and mobility

### Weekly Recalculation
- Runs every Monday 12:00 AM
- Analyzes previous week's data
- Adjusts current week if needed
- Sends notification of changes

---

## PART 3: Progress Prediction System

### Prediction Models

```typescript
interface ProgressPrediction {
  timeframe: number;  // weeks
  muscleMassGain: {
    min: number;
    max: number;
    expected: number;
    unit: 'lbs' | 'kg';
  };
  fatLoss: {
    min: number;
    max: number;
    expected: number;
    unit: 'lbs' | 'kg';
  };
  strengthGain: {
    bench: number;
    squat: number;
    deadlift: number;
    unit: '%';
  };
  timeCommitment: {
    hoursPerWeek: number;
    totalHours: number;
  };
  confidence: number;  // 0-100%
}
```

### Prediction Calculation Logic

**Muscle Gain (8 weeks):**
- Beginner: 0.5-1.0 lbs/week
- Intermediate: 0.25-0.5 lbs/week
- Advanced: 0.1-0.25 lbs/week
- Adjusted by: goal alignment, compliance history, recovery quality

**Fat Loss (8 weeks):**
- Aggressive: 1.5-2.0 lbs/week (high deficit)
- Moderate: 1.0-1.5 lbs/week (moderate deficit)
- Conservative: 0.5-1.0 lbs/week (small deficit)
- Adjusted by: starting body fat %, compliance, cardio volume

**Strength Gain (8 weeks):**
- Beginner: 15-25% increase
- Intermediate: 8-15% increase
- Advanced: 3-8% increase
- Adjusted by: program specificity, volume, frequency

**Confidence Scoring:**
- Based on: user history length, compliance rate, data quality
- New users: 60% confidence
- 3+ months data: 80% confidence
- 6+ months data: 95% confidence

**Update Triggers:**
- After each completed week
- When user updates profile
- When compliance drops significantly

---

## PART 4: Program Comparison Feature

### Comparison Matrix

```typescript
interface ProgramComparison {
  programs: Program[];
  metrics: {
    weeklyVolume: number[];
    muscleGroupFocus: MuscleGroupDistribution[];
    timePerWeek: number[];
    recoveryDemand: 'low' | 'medium' | 'high'[];
    equipmentRequired: string[][];
    predictedResults: ProgressPrediction[];
  };
  recommendations: string[];
}
```

### Comparison Logic

**Volume Comparison:**
- Calculate total sets per week
- Highlight highest/lowest
- Show as bar chart

**Muscle Group Focus:**
- Calculate % distribution
- Show radar chart
- Highlight differences >15%

**Time Demand:**
- Sum session durations
- Include warm-up/cool-down
- Flag if exceeds user availability

**Recovery Demand:**
- Low: <15 sets per muscle per week
- Medium: 15-20 sets
- High: >20 sets
- Consider frequency and intensity

**Decision Guidance:**
- "Program A better for muscle gain"
- "Program B fits your schedule better"
- "Program C requires less equipment"

---

## PART 5: Calendar Auto-Scheduler

### Scheduling Algorithm

```typescript
interface WorkoutSchedule {
  userId: string;
  programId: string;
  weeklySchedule: {
    monday?: WorkoutSession;
    tuesday?: WorkoutSession;
    wednesday?: WorkoutSession;
    thursday?: WorkoutSession;
    friday?: WorkoutSession;
    saturday?: WorkoutSession;
    sunday?: WorkoutSession;
  };
  conflicts: ScheduleConflict[];
  suggestions: string[];
}
```

### Scheduling Rules

**Rule 1: Muscle Group Spacing**
- Minimum 48 hours between same muscle group
- Exception: Small muscles (arms, calves) can be 24 hours

**Rule 2: Intensity Distribution**
- Don't schedule 2 high-intensity days back-to-back
- Alternate heavy/light days

**Rule 3: Recovery Days**
- Minimum 1 full rest day per week
- Recommend 2 for beginners

**Rule 4: Preferred Time Slots**
- Use user's preferred workout time
- Avoid scheduling during blocked times

### Conflict Resolution

**Missed Workout:**
- Option 1: Reschedule to next available day
- Option 2: Skip and continue (if not critical)
- Option 3: Combine with next workout (if compatible)

**Back-to-Back Overload:**
- Detect if 2 consecutive days target same muscles
- Suggest swap with another day
- Or reduce volume on second day

**Smart Recovery Spacing:**
- After leg day: suggest upper body next
- After heavy day: suggest light/cardio next
- After high volume: suggest lower volume next

---

## PART 6: User Evolution System

### Plateau Detection

```typescript
interface PlateauIndicators {
  strengthStagnation: boolean;  // No PR in 4 weeks
  volumeStagnation: boolean;    // Same volume 6 weeks
  motivationDrop: boolean;      // Missed 3+ workouts
  fatigueIncrease: boolean;     // High fatigue reports
  plateauScore: number;         // 0-100
}
```

### Detection Logic

**Strength Plateau:**
- No personal record in 4 consecutive weeks
- Weight hasn't increased in 6 weeks
- Reps haven't increased in 6 weeks

**Volume Plateau:**
- Total weekly volume unchanged for 6 weeks
- No progression in exercises

**Motivation Plateau:**
- Missed 3+ scheduled workouts in 2 weeks
- Completion rate drops below 70%
- User reports low motivation

**Fatigue Accumulation:**
- User reports high fatigue 4+ times in 2 weeks
- Recovery score consistently low
- Performance declining despite effort

### Upgrade Triggers

**Trigger 1: Program Completion**
- User completes 8-12 week program
- Suggest next level program
- Or specialization phase

**Trigger 2: Rapid Progress**
- User exceeds predicted progress by 20%
- Compliance rate >90%
- Suggest advanced program

**Trigger 3: Plateau Detected**
- plateauScore > 70
- Suggest program change
- Or deload + new stimulus

**Trigger 4: Goal Change**
- User updates primary goal
- Immediately suggest aligned programs
- Explain why change recommended

---

## PART 7: Gamification Integration

### XP System

```typescript
interface UserXP {
  totalXP: number;
  level: number;
  currentLevelXP: number;
  nextLevelXP: number;
  xpSources: {
    workoutCompletion: number;
    streakBonus: number;
    milestones: number;
    perfectWeeks: number;
  };
}
```

### XP Calculation Rules

**Workout Completion:**
- Base: 100 XP per workout
- Bonus: +20 XP if completed on time
- Bonus: +30 XP if all sets completed
- Bonus: +50 XP if personal record set

**Streak Bonuses:**
- 7-day streak: +200 XP
- 14-day streak: +500 XP
- 30-day streak: +1000 XP
- 90-day streak: +3000 XP

**Perfect Week:**
- All scheduled workouts completed: +300 XP
- All on correct days: +100 XP bonus
- All with full intensity: +200 XP bonus

**Milestone Achievements:**
- First program completion: +500 XP
- 10 programs completed: +2000 XP
- 100 workouts: +1000 XP
- 500 workouts: +5000 XP

### Level System
- Level 1: 0-1000 XP (Beginner)
- Level 2: 1000-2500 XP
- Level 3: 2500-5000 XP
- Level 4: 5000-10000 XP (Intermediate)
- Level 5+: Exponential scaling

### Streak Protection
- 1 free "freeze" per month (Pro tier)
- Can miss 1 day without breaking streak
- Must be activated before miss
- Notification sent when available

### Weekly Performance Score

```typescript
interface WeeklyScore {
  week: number;
  score: number;  // 0-100
  breakdown: {
    completion: number;      // 40 points
    consistency: number;     // 30 points
    intensity: number;       // 20 points
    progression: number;     // 10 points
  };
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
}
```

**Scoring:**
- Completion: (completed / scheduled) * 40
- Consistency: Points for completing on correct days
- Intensity: Based on RPE/effort ratings
- Progression: Weight/rep increases

---

## PART 8: Subscription Strategy

### Free Tier Features
- Access to 3 static programs
- Basic recommendations (no scoring shown)
- Manual workout logging
- Basic progress tracking
- No predictions
- No adaptive adjustments
- No calendar scheduling
- No comparison tool

### Pro Tier Features ($9.99/month)
- Access to ALL programs (20+)
- AI-powered recommendations with scoring
- Progress predictions
- Adaptive program adjustments
- Smart calendar scheduling
- Program comparison tool
- Advanced analytics dashboard
- Weekly AI adjustments
- Streak protection
- Priority support

### Feature Gating Logic

**Recommendation Page:**
- Free: Show top 1 program, hide scoring
- Pro: Show top 3, full scoring breakdown

**Program Detail:**
- Free: Basic info only
- Pro: Predictions, adaptive features, scheduling

**Comparison:**
- Free: "Upgrade to compare programs"
- Pro: Full comparison matrix

**Calendar:**
- Free: Manual scheduling only
- Pro: Auto-scheduler with conflict resolution

**Analytics:**
- Free: Basic charts (last 4 weeks)
- Pro: Advanced analytics (all time)

### Upgrade Nudges Placement

**Nudge 1: After Program Selection**
- "Unlock AI predictions for this program"
- Show blurred prediction data
- CTA: "Upgrade to Pro"

**Nudge 2: When Plateau Detected**
- "Your progress has slowed. Pro users get automatic adjustments"
- Show what adjustment would be made
- CTA: "Get AI Coaching"

**Nudge 3: Comparison Attempt**
- "Compare up to 5 programs side-by-side"
- Show comparison preview (locked)
- CTA: "Unlock Comparisons"

**Nudge 4: Missed Workout**
- "Pro users get smart rescheduling"
- Show what reschedule would suggest
- CTA: "Never Miss Progress"

### Lock UI Behavior
- Blur content behind lock icon
- Show "Pro Feature" badge
- Tooltip explains benefit
- Click opens upgrade modal
- Track which features drive upgrades

---

## AI Integration Points

### 1. Recommendation Engine
- Input: User profile, history, preferences
- Output: Ranked program list with reasoning
- Model: Collaborative filtering + rule-based

### 2. Adaptive Adjustment System
- Input: Compliance data, performance metrics
- Output: Program modifications
- Model: Decision tree + threshold rules

### 3. Progress Prediction
- Input: User stats, program details, historical data
- Output: Expected outcomes with confidence
- Model: Regression models per goal type

### 4. Plateau Detection
- Input: Performance time series
- Output: Plateau probability + recommendations
- Model: Anomaly detection + trend analysis

### 5. Smart Scheduling
- Input: Program structure, user availability, constraints
- Output: Optimal weekly schedule
- Model: Constraint satisfaction + optimization

### 6. Personalization Engine
- Input: All user interactions, preferences, feedback
- Output: Tailored experience, content, recommendations
- Model: User embedding + content-based filtering

---

## System-Level Architecture

### Data Models

```typescript
// Core Program Model
interface Program {
  id: string;
  name: string;
  goal: Goal;
  difficulty: Difficulty;
  duration: number;  // weeks
  daysPerWeek: number;
  equipment: string[];
  volumeProfile: VolumeProfile;
  splits: WorkoutSplit[];
  deloadWeeks: number[];
}

// User Program State
interface UserProgramState {
  userId: string;
  programId: string;
  startDate: Date;
  currentWeek: number;
  adaptations: Adaptation[];
  complianceScore: number;
  progressMetrics: ProgressMetrics;
  predictions: ProgressPrediction;
  schedule: WorkoutSchedule;
}

// Adaptation Record
interface Adaptation {
  date: Date;
  type: 'volume' | 'intensity' | 'frequency' | 'deload';
  reason: string;
  changes: AdaptationChange[];
  userNotified: boolean;
}
```

### State Management Flow

1. **Program Selection**
   - User completes onboarding
   - System scores all programs
   - Top recommendations displayed
   - User selects program
   - UserProgramState created

2. **Weekly Cycle**
   - Monday: Recalculation runs
   - Analyze previous week compliance
   - Check for adaptation triggers
   - Apply adjustments if needed
   - Update predictions
   - Notify user of changes

3. **Workout Completion**
   - User logs workout
   - Update compliance metrics
   - Award XP
   - Check for milestones
   - Update weekly score
   - Trigger real-time adaptations if needed

4. **Progress Review**
   - Every 4 weeks: comprehensive review
   - Compare actual vs predicted
   - Adjust prediction models
   - Check for plateau
   - Suggest program changes if needed

### Retention Mechanics

**Week 1-2: Onboarding**
- Daily check-ins
- Celebrate first workouts
- Explain features gradually
- Build habit

**Week 3-4: Engagement**
- Introduce gamification
- Show early progress
- Encourage streak building
- Social features (if applicable)

**Week 5-8: Commitment**
- Mid-program check-in
- Show predictions vs actual
- Highlight improvements
- Offer program extension

**Week 9+: Loyalty**
- Program completion celebration
- Suggest next challenge
- Unlock advanced features
- Community recognition

### Churn Prevention

**Early Warning Signs:**
- 2 consecutive missed workouts
- Compliance drops below 60%
- No app opens for 3 days
- Negative feedback

**Intervention Actions:**
- Send motivational notification
- Offer easier program variant
- Suggest rest week
- Personal coach message (Pro)
- Discount offer (if churning)

---

## Success Metrics

### Product Metrics
- Program completion rate: Target 65%
- Weekly active users: Target 80%
- Average session duration: Target 45min
- Feature adoption rate: Target 70%

### Business Metrics
- Free-to-Pro conversion: Target 8%
- Monthly recurring revenue growth: Target 15%
- Churn rate: Target <5%
- Customer lifetime value: Target $180

### Engagement Metrics
- 7-day streak rate: Target 40%
- 30-day streak rate: Target 15%
- Programs completed per user: Target 3/year
- XP earned per week: Target 800

---

## Implementation Priority

### Phase 1: Foundation (Weeks 1-4)
- User profile system
- Program database
- Basic recommendation engine
- Program detail pages

### Phase 2: Intelligence (Weeks 5-8)
- Scoring algorithm
- Progress predictions
- Compliance tracking
- Basic adaptations

### Phase 3: Engagement (Weeks 9-12)
- Gamification system
- Calendar scheduler
- Comparison tool
- Weekly recalculation

### Phase 4: Optimization (Weeks 13-16)
- Advanced adaptations
- Plateau detection
- Subscription gating
- Analytics dashboard

### Phase 5: Scale (Weeks 17+)
- ML model training
- A/B testing framework
- Performance optimization
- Advanced personalization
