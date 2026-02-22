import { Timestamp } from 'firebase/firestore';

// Core exercise data types
export type ExerciseCategory = 
  | 'strength'
  | 'cardio'
  | 'flexibility'
  | 'balance'
  | 'sports'
  | 'rehabilitation'
  | 'functional';

export type MuscleGroup = 
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'abs'
  | 'obliques'
  | 'lower_back'
  | 'glutes'
  | 'quadriceps'
  | 'hamstrings'
  | 'calves'
  | 'full_body'
  | 'core';

export type Equipment = 
  | 'none'
  | 'dumbbells'
  | 'barbell'
  | 'kettlebell'
  | 'resistance_bands'
  | 'pull_up_bar'
  | 'bench'
  | 'cable_machine'
  | 'smith_machine'
  | 'treadmill'
  | 'stationary_bike'
  | 'rowing_machine'
  | 'yoga_mat'
  | 'stability_ball'
  | 'medicine_ball'
  | 'foam_roller'
  | 'suspension_trainer'
  | 'battle_ropes'
  | 'plyo_box'
  | 'agility_ladder';

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

// Pose detection related types
export interface PoseKeypoint {
  name: string;
  x: number;
  y: number;
  z: number;
  visibility: number;
}

export interface MediaAssets {
  images: string[];
  videos: string[];
  demonstrations: string[];
}

export interface ExerciseMetadata {
  createdBy: string;
  verified: boolean;
  popularity: number;
  tags: string[];
  averageRating?: number;
  totalRatings?: number;
}

// Main Exercise interface
export interface Exercise {
  id: string;
  name: string;
  category: ExerciseCategory;
  targetMuscles: MuscleGroup[];
  secondaryMuscles?: MuscleGroup[];
  equipment: Equipment[];
  difficulty: DifficultyLevel;
  instructions: string[];
  commonMistakes: string[];
  safetyTips: string[];
  mediaAssets: MediaAssets;
  poseKeypoints?: PoseKeypoint[];
  metadata: ExerciseMetadata;
  // Firestore timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  // Exercise specific details
  duration?: number; // in seconds for timed exercises
  repetitions?: {
    min: number;
    max: number;
  };
  sets?: {
    min: number;
    max: number;
  };
  restTime?: number; // in seconds
  caloriesPerMinute?: number;
  // Alternative exercises
  alternatives?: string[]; // Array of exercise IDs
}

// Exercise category information
export interface ExerciseCategoryInfo {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  exerciseCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Exercise search and filtering types
export interface ExerciseSearchFilters {
  category?: ExerciseCategory;
  difficulty?: DifficultyLevel;
  equipment?: Equipment[];
  targetMuscles?: MuscleGroup[];
  duration?: {
    min?: number;
    max?: number;
  };
  tags?: string[];
}

export interface ExerciseSearchResult {
  exercises: Exercise[];
  totalCount: number;
  hasMore: boolean;
  filters: ExerciseSearchFilters;
}

// Workout session related types
export interface SetPerformance {
  setNumber: number;
  repetitions?: number;
  weight?: number; // in kg
  duration?: number; // in seconds
  distance?: number; // in meters
  restTime?: number; // in seconds
  formScore?: number; // 0-1 score
  notes?: string;
}

export interface ExercisePerformance {
  exerciseId: string;
  exerciseName: string;
  sets: SetPerformance[];
  formScores: number[];
  feedback: FormFeedback[];
  duration: number; // total time spent on exercise
  caloriesBurned?: number;
  personalRecord?: boolean;
}

// Form analysis types
export interface FormFeedback {
  timestamp: number;
  type: 'posture' | 'alignment' | 'range_of_motion' | 'timing';
  severity: 'low' | 'medium' | 'high';
  description: string;
  correction: string;
  affectedJoints: string[];
}

export interface FormAnalysis {
  exerciseId: string;
  correctness: number; // 0-1 score
  issues: FormIssue[];
  suggestions: string[];
  keyPointAccuracy: KeyPointAccuracy[];
}

export interface FormIssue {
  type: 'posture' | 'alignment' | 'range_of_motion' | 'timing';
  severity: 'low' | 'medium' | 'high';
  description: string;
  correction: string;
  affectedJoints: string[];
}

export interface KeyPointAccuracy {
  keypoint: string;
  accuracy: number; // 0-1 score
  expectedPosition: { x: number; y: number; z: number };
  actualPosition: { x: number; y: number; z: number };
}

// Exercise recommendation types
export interface ExerciseRecommendation {
  exercise: Exercise;
  score: number; // 0-1 relevance score
  reason: string;
  matchedCriteria: string[];
}

export interface RecommendationContext {
  userFitnessLevel: DifficultyLevel;
  availableEquipment: Equipment[];
  targetMuscles?: MuscleGroup[];
  workoutDuration?: number;
  previousExercises?: string[]; // Exercise IDs
  fitnessGoals?: string[];
  injuries?: string[];
}

// Exercise statistics and analytics
export interface ExerciseStats {
  exerciseId: string;
  totalSessions: number;
  averageFormScore: number;
  averageDuration: number;
  personalBest?: {
    weight?: number;
    repetitions?: number;
    duration?: number;
  };
  progressTrend: 'improving' | 'stable' | 'declining';
  lastPerformed?: Timestamp;
}

// Custom workout types
export interface WorkoutExercise {
  exerciseId: string;
  exercise?: Exercise; // Populated when fetched
  order: number;
  sets: number;
  repetitions?: number;
  duration?: number;
  weight?: number;
  restTime?: number;
  notes?: string;
}

export interface CustomWorkout {
  id: string;
  name: string;
  description: string;
  createdBy: string; // User ID
  exercises: WorkoutExercise[];
  estimatedDuration: number; // in minutes
  difficulty: DifficultyLevel;
  targetMuscles: MuscleGroup[];
  equipment: Equipment[];
  tags: string[];
  isPublic: boolean;
  likes: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}