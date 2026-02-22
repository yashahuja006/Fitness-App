export interface UserProfile {
    uid: string;
    email: string;
    displayName: string;
    photoURL?: string;
    personalMetrics: {
        height: number;
        weight: number;
        age: number;
        gender: 'male' | 'female' | 'other';
        activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
        fitnessGoals: string[];
    };
    preferences: {
        units: 'metric' | 'imperial';
        theme: 'light' | 'dark' | 'auto';
        notifications: NotificationSettings;
        privacy: PrivacySettings;
    };
    createdAt: Date;
    updatedAt: Date;
}
export interface NotificationSettings {
    workoutReminders: boolean;
    progressUpdates: boolean;
    socialUpdates: boolean;
    systemUpdates: boolean;
    email: boolean;
    push: boolean;
}
export interface PrivacySettings {
    profileVisibility: 'public' | 'friends' | 'private';
    shareProgress: boolean;
    shareWorkouts: boolean;
    allowLeaderboards: boolean;
}
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
    mediaAssets: {
        images: string[];
        videos: string[];
        demonstrations: string[];
    };
    poseKeypoints: PoseKeypoint[];
    metadata: {
        createdBy: string;
        verified: boolean;
        popularity: number;
        tags: string[];
    };
}
export type ExerciseCategory = 'strength' | 'cardio' | 'flexibility' | 'balance' | 'sports' | 'rehabilitation';
export type MuscleGroup = 'chest' | 'back' | 'shoulders' | 'arms' | 'core' | 'legs' | 'glutes' | 'full_body';
export type Equipment = 'none' | 'dumbbells' | 'barbell' | 'resistance_bands' | 'kettlebell' | 'pull_up_bar' | 'bench' | 'machine';
export interface PoseKeypoint {
    name: string;
    x: number;
    y: number;
    z: number;
    visibility: number;
}
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
    type: 'posture' | 'alignment' | 'range_of_motion' | 'timing';
    severity: 'low' | 'medium' | 'high';
    description: string;
    correction: string;
    affectedJoints: string[];
}
export interface DietPlan {
    id: string;
    userId: string;
    planType: 'weight_loss' | 'muscle_gain' | 'maintenance' | 'endurance';
    dailyCalories: number;
    macronutrients: {
        protein: number;
        carbohydrates: number;
        fats: number;
        fiber: number;
    };
    meals: DailyMealPlan[];
    duration: number;
    restrictions: DietaryRestriction[];
    generatedAt: Date;
    lastModified: Date;
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
}
export interface MacronutrientBreakdown {
    protein: number;
    carbohydrates: number;
    fats: number;
    fiber: number;
}
export type DietaryRestriction = 'vegetarian' | 'vegan' | 'gluten_free' | 'dairy_free' | 'nut_free' | 'low_carb' | 'keto' | 'paleo';
export interface ProgressMetrics {
    userId: string;
    date: Date;
    measurements: {
        weight?: number;
        bodyFat?: number;
        muscleMass?: number;
        measurements?: BodyMeasurements;
    };
    performance: {
        workoutFrequency: number;
        averageFormScore: number;
        totalWorkoutTime: number;
        caloriesBurned: number;
    };
    goals: {
        target: FitnessGoal;
        progress: number;
        deadline?: Date;
    }[];
}
export interface BodyMeasurements {
    chest: number;
    waist: number;
    hips: number;
    biceps: number;
    thighs: number;
}
export interface FitnessGoal {
    type: 'weight_loss' | 'muscle_gain' | 'strength' | 'endurance' | 'flexibility';
    target: number;
    unit: string;
    description: string;
}
export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    metadata: {
        confidence?: number;
        sources?: string[];
        actions?: ChatAction[];
    };
}
export interface ChatAction {
    type: 'exercise_search' | 'workout_start' | 'diet_plan' | 'progress_view';
    data: any;
}
export interface ConversationContext {
    userId: string;
    sessionId: string;
    history: ChatMessage[];
    currentTopic: 'exercise' | 'nutrition' | 'form' | 'general';
    userIntent: string;
    entities: ExtractedEntity[];
    preferences: UserProfile['preferences'];
}
export interface ExtractedEntity {
    type: string;
    value: string;
    confidence: number;
}
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: {
        message: string;
        code?: string;
        details?: any;
    };
    meta?: {
        timestamp: string;
        requestId?: string;
        pagination?: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    };
}
//# sourceMappingURL=index.d.ts.map