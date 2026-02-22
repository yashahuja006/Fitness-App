// Enhanced workout types inspired by Hevy's approach
export interface WorkoutSet {
  id: string;
  reps: number;
  weight?: number; // in kg or lbs
  duration?: number; // in seconds for time-based exercises
  distance?: number; // in meters for cardio
  restTime?: number; // in seconds
  completed: boolean;
  rpe?: number; // Rate of Perceived Exertion (1-10)
  notes?: string;
}

export interface WorkoutExercise {
  id: string;
  exerciseId: string; // Reference to Exercise
  exerciseName: string;
  sets: WorkoutSet[];
  targetSets: number;
  targetReps?: number;
  targetWeight?: number;
  personalRecord?: {
    weight: number;
    reps: number;
    date: Date;
  };
  notes?: string;
}

export interface WorkoutSession {
  id: string;
  userId: string;
  name: string;
  routineId?: string; // Reference to saved routine
  exercises: WorkoutExercise[];
  startTime: Date;
  endTime?: Date;
  duration?: number; // in minutes
  totalVolume: number; // total weight lifted
  caloriesBurned?: number;
  notes?: string;
  mood?: 'great' | 'good' | 'okay' | 'tired' | 'poor';
  bodyweight?: number;
  tags: string[];
  isTemplate: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkoutRoutine {
  id: string;
  userId: string;
  name: string;
  description?: string;
  exercises: {
    exerciseId: string;
    exerciseName: string;
    targetSets: number;
    targetReps?: number;
    targetWeight?: number;
    restTime?: number;
    order: number;
  }[];
  category: 'strength' | 'cardio' | 'flexibility' | 'mixed';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration: number; // in minutes
  equipment: string[];
  muscleGroups: string[];
  isPublic: boolean;
  timesUsed: number;
  averageRating?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PersonalRecord {
  id: string;
  userId: string;
  exerciseId: string;
  exerciseName: string;
  type: 'max_weight' | 'max_reps' | 'max_volume' | 'best_time' | 'longest_distance';
  value: number;
  unit: 'kg' | 'lbs' | 'reps' | 'seconds' | 'minutes' | 'meters' | 'km';
  workoutSessionId: string;
  achievedAt: Date;
  previousRecord?: {
    value: number;
    achievedAt: Date;
  };
}

export interface ProgressMetrics {
  userId: string;
  period: 'week' | 'month' | 'quarter' | 'year';
  totalWorkouts: number;
  totalVolume: number; // total weight lifted
  totalDuration: number; // total workout time in minutes
  averageWorkoutDuration: number;
  strongestLifts: PersonalRecord[];
  mostImprovedExercises: {
    exerciseId: string;
    exerciseName: string;
    improvementPercentage: number;
    startValue: number;
    currentValue: number;
  }[];
  consistencyScore: number; // 0-100 based on workout frequency
  caloriesBurned: number;
  muscleGroupsWorked: Record<string, number>; // muscle group -> times worked
}