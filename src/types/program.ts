// AI Program Intelligence Center - Core Types

export type Goal = 'muscle_gain' | 'fat_loss' | 'recomp' | 'endurance' | 'strength';
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';
export type RecoveryQuality = 'excellent' | 'good' | 'fair' | 'poor';

export interface UserProgramProfile {
  primaryGoal: Goal;
  experienceLevel: Difficulty;
  daysPerWeek: number;
  equipment: string[];
  recoveryQuality: RecoveryQuality;
  preferredTime?: 'morning' | 'afternoon' | 'evening';
  injuries?: string;
}

export interface VolumeProfile {
  setsPerWeek: number;
  repsRange: [number, number];
  intensityLevel: 'low' | 'medium' | 'high';
}

export interface WorkoutSplit {
  day: number;
  name: string;
  muscleGroups: string[];
  exercises: number;
  estimatedDuration: number;
}

export interface Program {
  id: string;
  name: string;
  description: string;
  goal: Goal;
  difficulty: Difficulty;
  duration: number;  // weeks
  daysPerWeek: number;
  equipment: string[];
  volumeProfile: VolumeProfile;
  splits: WorkoutSplit[];
  deloadWeeks: number[];
  tags: string[];
}

export interface ProgramScore {
  programId: string;
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
  rank: number;
}

export interface ProgressPrediction {
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

export interface ComplianceMetrics {
  weeklyCompletionRate: number;  // 0-100%
  missedWorkouts: number;
  consecutiveMisses: number;
  onTimeCompletions: number;
  earlyCompletions: number;
  lateCompletions: number;
}

export interface Adaptation {
  date: Date;
  type: 'volume' | 'intensity' | 'frequency' | 'deload';
  reason: string;
  changes: string[];
  userNotified: boolean;
}

export interface UserProgramState {
  userId: string;
  programId: string;
  startDate: Date;
  currentWeek: number;
  adaptations: Adaptation[];
  complianceScore: number;
  progressMetrics: any;
  predictions: ProgressPrediction;
  schedule: any;
}

export interface PlateauIndicators {
  strengthStagnation: boolean;
  volumeStagnation: boolean;
  motivationDrop: boolean;
  fatigueIncrease: boolean;
  plateauScore: number;  // 0-100
}

export interface UserXP {
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
