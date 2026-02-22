# AI Program Intelligence Center - Technical Design

## Overview

This document outlines the technical architecture for transforming the Programs page into an intelligent, adaptive system that personalizes workout programs, predicts results, and drives user retention through AI-powered recommendations and gamification.

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend Layer                        │
├─────────────────────────────────────────────────────────────┤
│  Programs Page  │  Recommendations  │  Predictions  │  XP    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Intelligence Layer                      │
├─────────────────────────────────────────────────────────────┤
│  Scoring Engine  │  Prediction Service  │  Adaptive Engine  │
│  Gamification    │  Profile Converter   │  Plateau Detector │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                         Data Layer                           │
├─────────────────────────────────────────────────────────────┤
│  Program DB  │  User Profiles  │  Workout History  │  State │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Design

### 1. Program Scoring Engine

**Purpose:** Intelligently score and rank programs based on user profile

**Location:** `src/lib/programScoringEngine.ts`

**Key Methods:**
```typescript
class ProgramScoringEngine {
  // Score a single program
  static scoreProgram(program: Program, userProfile: UserProgramProfile): ProgramScore
  
  // Score all programs and return ranked list
  static scoreAllPrograms(programs: Program[], userProfile: UserProgramProfile): ProgramScore[]
  
  // Get top N recommendations
  static getTopRecommendations(programs: Program[], userProfile: UserProgramProfile, count: number): ProgramScore[]
  
  // Check if user should upgrade program
  static shouldUpgradeProgram(currentProgram: Program, userProfile: UserProgramProfile, weeksCompleted: number, complianceRate: number): UpgradeRecommendation
}
```

**Scoring Algorithm:**
- Goal Alignment: 0-30 points
- Experience Match: 0-25 points
- Time Commitment: 0-20 points
- Equipment Match: 0-15 points
- Recovery Fit: 0-10 points
- Total: 0-100 points

**Confidence Levels:**
- High: ≥80 points
- Medium: 60-79 points
- Low: <60 points

---

### 2. Progress Prediction Service

**Purpose:** Generate accurate predictions for muscle gain, fat loss, and strength increases

**Location:** `src/lib/progressPredictionService.ts`

**Key Methods:**
```typescript
class ProgressPredictionService {
  // Generate initial prediction
  static generatePrediction(program: Program, userProfile: UserProgramProfile, complianceHistory: number, userHistoryMonths: number): ProgressPrediction
  
  // Update prediction based on actual progress
  static updatePrediction(originalPrediction: ProgressPrediction, actualProgress: ActualProgress): ProgressPrediction
}
```

**Prediction Models:**

**Muscle Gain (lbs/week):**
- Beginner: 0.5-1.0
- Intermediate: 0.25-0.5
- Advanced: 0.1-0.25
- Adjusted by: goal, compliance, recovery

**Fat Loss (lbs/week):**
- Aggressive: 1.5-2.0
- Moderate: 1.0-1.5
- Conservative: 0.5-1.0
- Adjusted by: goal, intensity, compliance

**Strength Gain (% over program):**
- Beginner: 15-25%
- Intermediate: 8-15%
- Advanced: 3-8%
- Adjusted by: goal, volume, frequency

---

### 3. Adaptive Program Engine

**Purpose:** Automatically adjust programs based on compliance and performance

**Location:** `src/lib/adaptiveProgramEngine.ts`

**Key Methods:**
```typescript
class AdaptiveProgramEngine {
  // Analyze compliance and determine adaptations
  static analyzeAndAdapt(complianceMetrics: ComplianceMetrics, currentWeek: number, userState: UserProgramState): Adaptation | null
  
  // Calculate overall compliance score
  static calculateComplianceScore(metrics: ComplianceMetrics): number
  
  // Check if recovery week needed
  static needsRecoveryWeek(fatigueReports: number, poorSleepDays: number, performanceDecline: boolean): boolean
  
  // Generate weekly recommendations
  static generateWeeklyAdjustments(complianceMetrics: ComplianceMetrics, currentWeek: number, userFeedback: UserFeedback): string[]
  
  // Predict upgrade readiness
  static predictUpgradeReadiness(weeksCompleted: number, programDuration: number, complianceRate: number, progressRate: number): UpgradeReadiness
}
```

**Adaptation Triggers:**

1. **Missed Workouts** (consecutiveMisses ≥ 2)
   - Reduce volume by 15%
   - Extend deload by 1 week

2. **High Compliance** (weeklyRate ≥ 95% for 3 weeks)
   - Increase volume by 10%
   - Suggest progression

3. **Low Recovery** (poor sleep 3+ days OR high fatigue)
   - Reduce intensity by 20%
   - Add extra rest day

4. **Scheduled Deload** (weeks 4, 8, 12)
   - Reduce volume by 40%
   - Reduce intensity by 20%

---

### 4. Gamification Engine

**Purpose:** Drive engagement through XP, levels, achievements, and streaks

**Location:** `src/lib/gamificationEngine.ts`

**Key Methods:**
```typescript
class GamificationEngine {
  // Calculate workout XP
  static calculateWorkoutXP(workout: WorkoutCompletion): number
  
  // Calculate streak bonus
  static calculateStreakBonus(streakDays: number): number
  
  // Calculate perfect week bonus
  static calculatePerfectWeekBonus(week: WeekCompletion): number
  
  // Calculate milestone XP
  static calculateMilestoneXP(milestone: string): number
  
  // Calculate user level from XP
  static calculateLevel(totalXP: number): number
  
  // Update user XP
  static updateUserXP(currentXP: UserXP, xpToAdd: number, source: XPSource): UserXP
  
  // Get achievements
  static getAchievements(userStats: UserStats): Achievement[]
  
  // Calculate weekly performance score
  static calculateWeeklyScore(weekData: WeekData): WeeklyScore
}
```

**XP System:**
- Base workout: 100 XP
- On-time bonus: +20 XP
- All sets completed: +30 XP
- Personal record: +50 XP
- Streak bonuses: 200-3000 XP
- Perfect week: up to 600 XP

**Level Progression:**
- Level 1: 0 XP
- Level 2: 1,000 XP
- Level 3: 2,500 XP
- Level 4: 5,000 XP
- Level 5+: Exponential scaling

---

### 5. Profile Converter

**Purpose:** Convert workout profiles to program profiles seamlessly

**Location:** `src/lib/profileConverter.ts`

**Key Methods:**
```typescript
class ProfileConverter {
  // Convert workout profile to program profile
  static workoutToProgram(workoutProfile: UserWorkoutProfile): UserProgramProfile
  
  // Save program profile
  static saveProgramProfile(profile: UserProgramProfile): void
  
  // Load program profile (with fallback to workout profile)
  static loadProgramProfile(): UserProgramProfile | null
}
```

**Conversion Mapping:**
- lose_weight → fat_loss
- build_muscle → muscle_gain
- get_fit → recomp
- maintain → recomp

---

## UI Component Design

### 1. ProgramRecommendations Component

**Location:** `src/components/programs/ProgramRecommendations.tsx`

**Props:**
```typescript
interface ProgramRecommendationsProps {
  userProfile: UserProgramProfile;
  onSelectProgram: (program: Program, score: ProgramScore) => void;
  isPro?: boolean;
}
```

**Features:**
- Displays top 3 programs (Pro) or top 1 (Free)
- Shows total score with color coding
- Confidence badges
- Score breakdown with animated progress bars
- Human-readable reasoning
- Pro upgrade prompts
- Blur effect for locked content

**Layout:**
```
┌─────────────────────────────────────────┐
│  AI-Powered Recommendations             │
│  ┌───────────────────────────────────┐  │
│  │ ⭐ Best Match                     │  │
│  │ Program Name              Score   │  │
│  │ Description                  85   │  │
│  │                                   │  │
│  │ Score Breakdown:                  │  │
│  │ ▓▓▓▓▓▓▓▓░░ Goal Alignment   30/30│  │
│  │ ▓▓▓▓▓▓░░░░ Experience       20/25│  │
│  │                                   │  │
│  │ Why This Program?                 │  │
│  │ • Perfect match for muscle gain   │  │
│  │ • Designed for intermediate       │  │
│  │                                   │  │
│  │ [Select Program] [View Details]   │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

---

### 2. ProgressPredictionCard Component

**Location:** `src/components/programs/ProgressPredictionCard.tsx`

**Props:**
```typescript
interface ProgressPredictionCardProps {
  prediction: ProgressPrediction;
  isPro?: boolean;
}
```

**Features:**
- 8-week predictions display
- Muscle gain, fat loss, strength gains
- Time commitment breakdown
- Confidence percentage
- Pro tier gating with lock overlay
- Color-coded metric cards

**Layout:**
```
┌─────────────────────────────────────┐
│  8-Week Predictions      85% conf   │
│  ┌─────────────┐  ┌─────────────┐  │
│  │ Muscle Gain │  │  Fat Loss   │  │
│  │   +4.5 lbs  │  │  -8.0 lbs   │  │
│  │ Range: 3-6  │  │ Range: 6-10 │  │
│  └─────────────┘  └─────────────┘  │
│                                     │
│  Strength Gains:                    │
│  Bench: +15%  Squat: +18%          │
│  Deadlift: +16%                     │
│                                     │
│  Time: 4.5 hrs/week (36 hrs total) │
└─────────────────────────────────────┘
```

---

### 3. Programs Page

**Location:** `src/app/programs/page.tsx`

**State Management:**
```typescript
const [userProfile, setUserProfile] = useState<UserProgramProfile | null>(null);
const [selectedProgram, setSelectedProgram] = useState<SelectedProgram | null>(null);
const [isPro, setIsPro] = useState(false);
const [showProfileSetup, setShowProfileSetup] = useState(false);
```

**Page Sections:**
1. Hero with profile summary
2. Main recommendations area
3. Sidebar with selected program details
4. Progress predictions
5. Pro feature highlights

---

## Data Models

### Core Types

**Location:** `src/types/program.ts`

```typescript
// User profile for program matching
interface UserProgramProfile {
  primaryGoal: Goal;
  experienceLevel: Difficulty;
  daysPerWeek: number;
  equipment: string[];
  recoveryQuality: RecoveryQuality;
  preferredTime?: 'morning' | 'afternoon' | 'evening';
  injuries?: string;
}

// Program definition
interface Program {
  id: string;
  name: string;
  description: string;
  goal: Goal;
  difficulty: Difficulty;
  duration: number;
  daysPerWeek: number;
  equipment: string[];
  volumeProfile: VolumeProfile;
  splits: WorkoutSplit[];
  deloadWeeks: number[];
  tags: string[];
}

// Program score with breakdown
interface ProgramScore {
  programId: string;
  totalScore: number;
  breakdown: {
    goalAlignment: number;
    experienceMatch: number;
    timeCommitment: number;
    equipmentMatch: number;
    recoveryFit: number;
  };
  confidence: 'high' | 'medium' | 'low';
  reasoning: string[];
  rank: number;
}

// Progress prediction
interface ProgressPrediction {
  timeframe: number;
  muscleMassGain: MetricRange;
  fatLoss: MetricRange;
  strengthGain: StrengthGains;
  timeCommitment: TimeCommitment;
  confidence: number;
}

// User XP and gamification
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

---

## Data Storage

### LocalStorage Schema

```typescript
// User program profile
localStorage.setItem('userProgramProfile', JSON.stringify(profile));

// Active program
localStorage.setItem('activeProgram', JSON.stringify(program));
localStorage.setItem('programStartDate', isoString);

// Pro status
localStorage.setItem('isProUser', 'true' | 'false');

// User XP
localStorage.setItem('userXP', JSON.stringify(xp));

// Workout history (for compliance)
localStorage.setItem('workoutHistory', JSON.stringify(workouts));
```

### Future Database Schema (Firebase)

```typescript
// users/{userId}/programs/{programId}
{
  programId: string;
  startDate: Timestamp;
  currentWeek: number;
  complianceScore: number;
  adaptations: Adaptation[];
  predictions: ProgressPrediction;
  actualProgress: ActualProgress;
}

// users/{userId}/xp
{
  totalXP: number;
  level: number;
  achievements: string[];
  streaks: {
    current: number;
    longest: number;
  };
}

// users/{userId}/workouts/{workoutId}
{
  date: Timestamp;
  programId: string;
  completed: boolean;
  onTime: boolean;
  exercises: Exercise[];
  xpEarned: number;
}
```

---

## State Management

### Client-Side State Flow

```
User Profile Load
       ↓
Profile Converter (if needed)
       ↓
Scoring Engine → Ranked Programs
       ↓
User Selects Program
       ↓
Prediction Service → Generate Predictions
       ↓
Display Recommendations + Predictions
       ↓
User Starts Program
       ↓
Save to LocalStorage/Database
```

### Weekly Recalculation Flow (Future)

```
Cron Job (Monday 12:00 AM)
       ↓
Fetch User Program State
       ↓
Analyze Compliance Metrics
       ↓
Adaptive Engine → Check Triggers
       ↓
Generate Adaptations (if needed)
       ↓
Update Predictions
       ↓
Send Notification
       ↓
Save Updated State
```

---

## Subscription Tier Logic

### Feature Gating

**Free Tier:**
- 1 program recommendation (top match only)
- No scoring breakdown
- No predictions
- No adaptive adjustments
- Basic progress tracking

**Pro Tier ($9.99/month):**
- 3 program recommendations
- Full scoring breakdown
- Progress predictions
- Adaptive adjustments
- Smart scheduling
- Advanced analytics
- Streak protection

### Implementation

```typescript
// Component-level gating
{isPro ? (
  <FullFeature />
) : (
  <LockedFeature />
)}

// Blur effect for locked content
<div className={!isPro ? 'blur-sm pointer-events-none' : ''}>
  <PremiumContent />
</div>

// Upgrade prompts
{!isPro && (
  <UpgradeCard
    feature="Progress Predictions"
    benefit="See expected results before you start"
  />
)}
```

---

## Performance Optimization

### Client-Side Optimizations

1. **Memoization**
```typescript
const scoredPrograms = useMemo(
  () => ProgramScoringEngine.scoreAllPrograms(programs, userProfile),
  [programs, userProfile]
);
```

2. **Lazy Loading**
```typescript
const ProgramDetail = lazy(() => import('./ProgramDetail'));
```

3. **Debouncing**
```typescript
const debouncedProfileUpdate = useDebouncedCallback(
  (profile) => updateProfile(profile),
  500
);
```

### Future Backend Optimizations

1. **Caching**
- Cache scored programs per profile hash
- TTL: 1 hour
- Invalidate on profile update

2. **Batch Processing**
- Weekly recalculation in batches
- Process 100 users per batch
- Queue-based processing

3. **Indexing**
- Index on userId + programId
- Index on userId + date (for workouts)
- Composite index for queries

---

## Error Handling

### Client-Side Errors

```typescript
try {
  const scores = ProgramScoringEngine.scoreAllPrograms(programs, userProfile);
} catch (error) {
  console.error('Scoring failed:', error);
  // Fallback to default recommendations
  return defaultPrograms;
}
```

### Validation

```typescript
// Profile validation
if (!userProfile.primaryGoal || !userProfile.experienceLevel) {
  throw new Error('Invalid user profile');
}

// Score validation
if (score.totalScore < 0 || score.totalScore > 100) {
  throw new Error('Invalid score calculation');
}

// Prediction validation
if (prediction.confidence < 0 || prediction.confidence > 100) {
  throw new Error('Invalid confidence score');
}
```

---

## Testing Strategy

### Unit Tests

```typescript
describe('ProgramScoringEngine', () => {
  it('should score program correctly', () => {
    const score = ProgramScoringEngine.scoreProgram(program, profile);
    expect(score.totalScore).toBeGreaterThanOrEqual(0);
    expect(score.totalScore).toBeLessThanOrEqual(100);
  });
  
  it('should rank programs by score', () => {
    const scores = ProgramScoringEngine.scoreAllPrograms(programs, profile);
    expect(scores[0].totalScore).toBeGreaterThanOrEqual(scores[1].totalScore);
  });
});

describe('ProgressPredictionService', () => {
  it('should generate valid predictions', () => {
    const prediction = ProgressPredictionService.generatePrediction(program, profile);
    expect(prediction.muscleMassGain.expected).toBeGreaterThan(0);
    expect(prediction.confidence).toBeGreaterThan(0);
  });
});

describe('GamificationEngine', () => {
  it('should calculate workout XP correctly', () => {
    const xp = GamificationEngine.calculateWorkoutXP(workout);
    expect(xp).toBeGreaterThanOrEqual(100);
  });
  
  it('should calculate level from XP', () => {
    const level = GamificationEngine.calculateLevel(5000);
    expect(level).toBe(4);
  });
});
```

### Integration Tests

```typescript
describe('Program Selection Flow', () => {
  it('should complete full selection flow', async () => {
    // Load profile
    const profile = ProfileConverter.loadProgramProfile();
    
    // Score programs
    const scores = ProgramScoringEngine.scoreAllPrograms(programs, profile);
    
    // Generate prediction
    const prediction = ProgressPredictionService.generatePrediction(
      programs[0],
      profile
    );
    
    expect(prediction).toBeDefined();
    expect(scores.length).toBeGreaterThan(0);
  });
});
```

---

## Security Considerations

### Data Privacy

1. **LocalStorage Encryption** (Future)
- Encrypt sensitive user data
- Use Web Crypto API
- Secure key management

2. **API Authentication** (Future)
- JWT tokens for API calls
- Refresh token rotation
- Rate limiting

3. **Input Validation**
- Sanitize all user inputs
- Validate profile data
- Prevent XSS attacks

---

## Accessibility

### WCAG Compliance

1. **Keyboard Navigation**
- All interactive elements focusable
- Logical tab order
- Skip links for main content

2. **Screen Reader Support**
- ARIA labels on all components
- Semantic HTML structure
- Alt text for visual elements

3. **Color Contrast**
- Minimum 4.5:1 for text
- 3:1 for UI components
- Color-blind friendly palette

---

## Monitoring & Analytics

### Key Metrics to Track

1. **Product Metrics**
- Program selection rate
- Completion rate
- Feature adoption rate
- Time to first program

2. **Business Metrics**
- Free-to-Pro conversion rate
- Churn rate
- Customer lifetime value
- Feature-driven upgrades

3. **Technical Metrics**
- Scoring engine performance
- Prediction accuracy
- API response times
- Error rates

---

## Future Enhancements

### Phase 2: Advanced Features

1. **Calendar Auto-Scheduler**
- Visual calendar interface
- Drag-and-drop scheduling
- Conflict resolution
- Smart rescheduling

2. **Program Comparison Tool**
- Side-by-side comparison
- Radar charts for muscle focus
- Decision guidance system

3. **Plateau Detection**
- Performance trend analysis
- Automatic intervention
- Program change suggestions

### Phase 3: ML Integration

1. **Personalized Predictions**
- Train models on user data
- Improve accuracy over time
- A/B test prediction models

2. **Collaborative Filtering**
- Recommend based on similar users
- Community insights
- Social proof

---

## Conclusion

This design provides a comprehensive, scalable architecture for the AI Program Intelligence Center. The system is:

- **Modular**: Each component has a single responsibility
- **Testable**: Clear interfaces and pure functions
- **Scalable**: Ready for backend integration
- **User-Focused**: Drives engagement and retention
- **Business-Aligned**: Strategic feature gating for monetization

The implementation follows best practices for TypeScript, React, and Next.js, ensuring maintainability and performance.
