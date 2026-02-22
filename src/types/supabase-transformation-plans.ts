/**
 * TypeScript types for the transformation_plans table
 * Generated for the AI Nutrition Engine feature
 */

// Subscription tier types
export type SubscriptionTier = 'free' | 'pro';

// Plan status types
export type PlanStatus = 'active' | 'completed' | 'archived' | 'paused';

// Metabolic strategy types
export type MetabolicStrategy = 'deficit' | 'surplus' | 'maintenance' | 'cycling';

// Activity level types
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

// Goal types
export type FitnessGoal = 'fat_loss' | 'muscle_gain' | 'recomposition' | 'endurance';

/**
 * Metabolic Analysis structure
 */
export interface MetabolicAnalysis {
  bmr: number;
  maintenance_calories: number;
  target_calories_week1: number;
  strategy: MetabolicStrategy;
  body_composition_factor?: number;
  activity_level: ActivityLevel;
  goal: FitnessGoal;
}

/**
 * Macro distribution for a specific day type
 */
export interface MacroDistribution {
  calories: number;
  protein_grams: number;
  carbs_grams: number;
  fats_grams: number;
  carb_percentage: number;
  protein_percentage: number;
  fat_percentage: number;
}

/**
 * Macro cycling strategy
 */
export interface MacroCycling {
  training_day: MacroDistribution;
  rest_day: MacroDistribution;
}

/**
 * Macro Strategy structure
 */
export interface MacroStrategy {
  protein_grams: number;
  carbs_grams: number;
  fats_grams: number;
  macro_cycling: MacroCycling | null;
}

/**
 * Weekly progression entry
 */
export interface WeeklyProgression {
  week: number;
  target_calories: number;
  adjustment_reason: string;
  plateau_prevention: boolean;
  refeed_scheduled?: boolean;
  expected_weight_change?: number;
}

/**
 * Meal structure
 */
export interface Meal {
  name: string;
  time?: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  ingredients: Array<{
    name: string;
    quantity: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  }>;
  preparation?: string;
  cooking_time?: number;
}

/**
 * Day meal plan
 */
export interface DayMealPlan {
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fats: number;
  meals: Meal[];
  snacks?: Meal[];
}

/**
 * Meal Plan structure
 */
export interface MealPlan {
  training_day: DayMealPlan;
  rest_day: DayMealPlan;
}

/**
 * Exercise in workout
 */
export interface Exercise {
  name: string;
  sets: number;
  reps: string;
  rpe: number;
  rest_seconds: number;
  notes?: string;
}

/**
 * Workout session
 */
export interface WorkoutSession {
  day: string;
  focus: string;
  exercises: Exercise[];
  total_duration_minutes?: number;
}

/**
 * Workout Plan structure
 */
export interface WorkoutPlan {
  split_type: string;
  weekly_schedule: WorkoutSession[];
  exercise_structure: string;
  progression_scheme: string;
  rpe_range: [number, number];
}

/**
 * Progress Projection structure
 */
export interface ProgressProjection {
  expected_weight_change: number;
  expected_bf_change?: number;
  muscle_gain_potential?: number;
  confidence_level: 'high' | 'medium' | 'low';
  timeline_weeks: number;
  assumptions: string[];
}

/**
 * Grocery item
 */
export interface GroceryItem {
  name: string;
  quantity: string;
  category: string;
  estimated_cost?: number;
  alternatives?: string[];
}

/**
 * Grocery Optimization structure (Pro feature)
 */
export interface GroceryOptimization {
  consolidated_list: GroceryItem[];
  cost_optimization?: {
    total_estimated_cost: number;
    savings_tips: string[];
  };
  seasonal_substitutions?: Array<{
    original: string;
    substitute: string;
    reason: string;
  }>;
  bulk_buying?: Array<{
    item: string;
    recommended_quantity: string;
    savings: string;
  }>;
}

/**
 * Main TransformationPlan database row type
 */
export interface TransformationPlan {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  
  // Plan metadata
  duration_weeks: number;
  subscription_tier: SubscriptionTier;
  
  // JSONB fields
  metabolic_analysis: MetabolicAnalysis;
  macro_strategy: MacroStrategy;
  weekly_progression: WeeklyProgression[];
  meal_plan: MealPlan;
  workout_plan: WorkoutPlan;
  progress_projection: ProgressProjection;
  grocery_optimization?: GroceryOptimization;
  
  // Status
  status: PlanStatus;
  completion_percentage: number;
}

/**
 * Insert type (omits auto-generated fields)
 */
export type TransformationPlanInsert = Omit<
  TransformationPlan,
  'id' | 'created_at' | 'updated_at'
>;

/**
 * Update type (all fields optional except id)
 */
export type TransformationPlanUpdate = Partial<
  Omit<TransformationPlan, 'id' | 'user_id' | 'created_at'>
>;

/**
 * Database response type
 */
export interface TransformationPlanResponse {
  data: TransformationPlan | null;
  error: Error | null;
}

/**
 * Database list response type
 */
export interface TransformationPlanListResponse {
  data: TransformationPlan[] | null;
  error: Error | null;
}
