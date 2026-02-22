// Core user types
export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  personalMetrics: PersonalMetrics;
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

export interface PersonalMetrics {
  height: number;
  weight: number;
  age: number;
  gender: 'male' | 'female' | 'other';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  fitnessGoals: string[];
}

export interface UserPreferences {
  units: 'metric' | 'imperial';
  theme: 'light' | 'dark' | 'auto';
  notifications: NotificationSettings;
  privacy: PrivacySettings;
}

export interface NotificationSettings {
  workoutReminders: boolean;
  progressUpdates: boolean;
  systemUpdates: boolean;
  emailNotifications: boolean;
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'private' | 'friends';
  shareProgress: boolean;
  allowLeaderboards: boolean;
}

// Exercise and workout types
export interface Exercise {
  id: string;
  name: string;
  category: ExerciseCategory;
  targetMuscles: MuscleGroup[];
  equipment: Equipment[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  instructions: string[];
  commonMistakes: string[];
  safetyTips: string[];
  mediaAssets: MediaAssets;
  poseKeypoints: PoseKeypoint[];
  metadata: ExerciseMetadata;
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
}

export type ExerciseCategory =
  | 'strength'
  | 'cardio'
  | 'flexibility'
  | 'balance'
  | 'sports'
  | 'rehabilitation';

export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'arms'
  | 'core'
  | 'legs'
  | 'glutes'
  | 'full-body';

export type Equipment =
  | 'none'
  | 'dumbbells'
  | 'barbell'
  | 'resistance-bands'
  | 'kettlebell'
  | 'pull-up-bar'
  | 'bench'
  | 'mat';

// Pose detection types
export interface PoseKeypoint {
  x: number;
  y: number;
  z: number;
  visibility: number;
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
  joint: string;
  accuracy: number;
  expected: PoseKeypoint;
  actual: PoseKeypoint;
}

// Workout session types
export interface WorkoutSession {
  id: string;
  userId: string;
  exercises: ExercisePerformance[];
  startTime: Date;
  endTime: Date;
  totalDuration: number;
  averageFormScore: number;
  caloriesBurned: number;
  notes?: string;
}

export interface ExercisePerformance {
  exerciseId: string;
  sets: SetPerformance[];
  formScores: number[];
  feedback: FormFeedback[];
  duration: number;
}

export interface SetPerformance {
  reps: number;
  weight?: number;
  duration?: number;
  restTime?: number;
  formScore: number;
}

export interface FormFeedback {
  timestamp: number;
  type: 'correction' | 'encouragement' | 'warning';
  message: string;
  severity?: 'low' | 'medium' | 'high';
}

export interface FormScore {
  overall: number;
  breakdown: {
    alignment: number;
    rangeOfMotion: number;
    posture: number;
    timing: number;
    consistency: number;
  };
  grade: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F';
  improvements: ImprovementSuggestion[];
  strengths: string[];
  priority: 'high' | 'medium' | 'low';
}

export interface ImprovementSuggestion {
  category: 'alignment' | 'range_of_motion' | 'posture' | 'timing' | 'consistency';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  actionSteps: string[];
  expectedImprovement: number; // Percentage improvement expected
  difficulty: 'easy' | 'moderate' | 'challenging';
  timeToImprove: string; // e.g., "1-2 weeks", "2-4 sessions"
}

// Diet and nutrition types
export interface DietPlan {
  id: string;
  userId: string;
  planType: 'weight_loss' | 'muscle_gain' | 'maintenance' | 'endurance';
  dailyCalories: number;
  macronutrients: MacronutrientBreakdown;
  meals: DailyMealPlan[];
  duration: number; // days
  restrictions: DietaryRestriction[];
  generatedAt: Date;
  lastModified: Date;
}

export interface MacronutrientBreakdown {
  protein: number;
  carbohydrates: number;
  fats: number;
  fiber: number;
}

export interface DailyMealPlan {
  day: number;
  meals: {
    breakfast: Meal;
    lunch: Meal;
    dinner: Meal;
    snacks: Meal[];
  };
  totalCalories: number;
  macroBreakdown: MacronutrientBreakdown;
}

export interface Meal {
  id: string;
  name: string;
  ingredients: Ingredient[];
  instructions: string[];
  prepTime: number;
  calories: number;
  macros: MacronutrientBreakdown;
}

export interface Ingredient {
  name: string;
  amount: number;
  unit: string;
  calories: number;
  macros: MacronutrientBreakdown;
}

export type DietaryRestriction =
  | 'vegetarian'
  | 'vegan'
  | 'gluten-free'
  | 'dairy-free'
  | 'nut-free'
  | 'low-carb'
  | 'keto'
  | 'paleo';

// Chatbot types
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata: ChatMessageMetadata;
}

export interface ChatMessageMetadata {
  confidence?: number;
  sources?: string[];
  actions?: ChatAction[];
}

export interface ChatAction {
  type: 'exercise_search' | 'workout_start' | 'diet_plan' | 'form_help';
  data: Record<string, unknown>;
}

export interface ConversationContext {
  userId: string;
  sessionId: string;
  history: ChatMessage[];
  currentTopic: 'exercise' | 'nutrition' | 'form' | 'general';
  userIntent: string;
  entities: ExtractedEntity[];
  preferences: UserPreferences;
}

export interface ExtractedEntity {
  type: string;
  value: string;
  confidence: number;
}

// Progress tracking types
export interface ProgressMetrics {
  userId: string;
  date: Date;
  measurements: BodyMeasurements;
  performance: PerformanceMetrics;
  goals: FitnessGoal[];
}

export interface BodyMeasurements {
  weight?: number;
  bodyFat?: number;
  muscleMass?: number;
  measurements?: {
    chest?: number;
    waist?: number;
    hips?: number;
    arms?: number;
    thighs?: number;
  };
}

export interface PerformanceMetrics {
  workoutFrequency: number;
  averageFormScore: number;
  totalWorkoutTime: number;
  caloriesBurned: number;
}

export interface FitnessGoal {
  id: string;
  target: string;
  progress: number; // percentage
  deadline?: Date;
  type:
    | 'weight_loss'
    | 'muscle_gain'
    | 'strength'
    | 'endurance'
    | 'flexibility';
}

// Re-export pose detection types
export * from './pose';

// Re-export nutrition types
export * from './nutrition';
