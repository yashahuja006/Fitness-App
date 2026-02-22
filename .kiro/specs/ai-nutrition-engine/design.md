# AI Performance Nutrition & Training Engine - Technical Design

## System Architecture

### Core Engine Components

#### 1. Metabolic Analysis Engine
```typescript
interface MetabolicAnalysis {
  bmr: number;
  maintenance_calories: number;
  target_calories_week1: number;
  strategy: 'deficit' | 'surplus' | 'maintenance' | 'cycling';
  body_composition_factor?: number;
}
```

**Key Algorithms:**
- Mifflin-St Jeor BMR calculation with body fat adjustments
- Activity factor application with precision multipliers
- Goal-specific calorie strategies with progressive adjustments

#### 2. Macro Intelligence System
```typescript
interface MacroStrategy {
  protein_grams: number;
  carbs_grams: number;
  fats_grams: number;
  macro_cycling: {
    training_day: MacroDistribution;
    rest_day: MacroDistribution;
  };
}
```

**Intelligence Rules:**
- Dynamic protein targets based on goal and lean body mass
- Carb cycling with training day optimization
- Fat allocation within healthy ranges (20-30%)

#### 3. Progressive Programming Engine
```typescript
interface WeeklyProgression {
  week: number;
  target_calories: number;
  adjustment_reason: string;
  plateau_prevention: boolean;
  refeed_scheduled?: boolean;
}
```

**Adaptation Logic:**
- Predictive weight change modeling
- Automatic plateau detection and prevention
- Progressive calorie tapering for fat loss
- Surplus adjustments for muscle gain

### Data Models

#### User Profile Extended
```typescript
interface UserProfileExtended {
  // Basic metrics
  height: number; // cm
  weight: number; // kg
  age: number;
  gender: 'male' | 'female' | 'other';
  body_fat_percentage?: number;
  
  // Activity & Goals
  activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  goal: 'fat_loss' | 'muscle_gain' | 'recomposition' | 'endurance';
  
  // Preferences
  diet_type: 'standard' | 'vegetarian' | 'vegan' | 'keto' | 'paleo' | 'mediterranean';
  meals_per_day: 3 | 4 | 5 | 6;
  snacks_per_day: 0 | 1 | 2 | 3;
  cooking_time: 'quick' | 'moderate' | 'elaborate';
  cuisine_preference: string[];
  budget_level: 'low' | 'medium' | 'high';
  
  // Training
  training_level: 'beginner' | 'intermediate' | 'advanced';
  workout_days_per_week: number;
  
  // Subscription
  subscription_tier: 'free' | 'pro';
  plan_duration_weeks: number;
}
```

#### Transformation Plan
```typescript
interface TransformationPlan {
  id: string;
  user_id: string;
  created_at: Date;
  
  metabolic_analysis: MetabolicAnalysis;
  macro_strategy: MacroStrategy;
  weekly_progression_plan: WeeklyProgression[];
  
  meal_plan: {
    training_day: DayMealPlan;
    rest_day: DayMealPlan;
  };
  
  workout_plan: WorkoutPlan;
  progress_projection: ProgressProjection;
  
  // Pro features
  grocery_optimization?: GroceryList[];
  meal_prep_strategy?: string;
  
  // Lifestyle
  hydration_strategy: string;
  supplement_suggestions: Supplement[];
  
  tier_features_unlocked: string[];
}
```

### AI Engine Architecture

#### 1. Plan Generation Pipeline
```typescript
class TransformationEngine {
  async generatePlan(userProfile: UserProfileExtended): Promise<TransformationPlan> {
    // Step 1: Metabolic Analysis
    const metabolics = await this.calculateMetabolics(userProfile);
    
    // Step 2: Macro Strategy
    const macros = await this.calculateMacroStrategy(userProfile, metabolics);
    
    // Step 3: Progressive Programming
    const progression = await this.generateProgression(userProfile, metabolics);
    
    // Step 4: Meal Planning
    const meals = await this.generateMealPlans(userProfile, macros);
    
    // Step 5: Workout Programming
    const workouts = await this.generateWorkoutPlan(userProfile);
    
    // Step 6: Progress Prediction
    const projections = await this.predictProgress(userProfile, metabolics);
    
    // Step 7: Optimization (Pro only)
    const optimizations = await this.generateOptimizations(userProfile);
    
    return this.assemblePlan({
      metabolics,
      macros,
      progression,
      meals,
      workouts,
      projections,
      optimizations
    });
  }
}
```

#### 2. Intelligent Calculation Modules

**Metabolic Calculator:**
```typescript
class MetabolicCalculator {
  calculateBMR(profile: UserProfileExtended): number {
    const { weight, height, age, gender } = profile;
    const base = (10 * weight) + (6.25 * height) - (5 * age);
    return gender === 'male' ? base + 5 : base - 161;
  }
  
  calculateTDEE(bmr: number, activityLevel: string): number {
    const multipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9
    };
    return bmr * multipliers[activityLevel];
  }
  
  calculateTargetCalories(tdee: number, goal: string, week: number): number {
    switch (goal) {
      case 'fat_loss':
        const deficit = tdee * 0.2; // 20% deficit
        const taper = week > 3 ? (week - 3) * 50 : 0; // -50 kcal after week 3
        return tdee - deficit - taper;
        
      case 'muscle_gain':
        return tdee * 1.15; // 15% surplus
        
      case 'recomposition':
        return tdee; // Maintenance base
        
      case 'endurance':
        return tdee * 1.1; // 10% surplus
        
      default:
        return tdee;
    }
  }
}
```

**Macro Intelligence:**
```typescript
class MacroCalculator {
  calculateProtein(profile: UserProfileExtended): number {
    const { weight, goal } = profile;
    const proteinPerKg = {
      fat_loss: 2.2,
      muscle_gain: 1.8,
      recomposition: 2.2,
      endurance: 1.6
    };
    return weight * proteinPerKg[goal];
  }
  
  calculateMacroCycling(profile: UserProfileExtended, baseCalories: number) {
    if (profile.subscription_tier === 'free') {
      return null; // No cycling for free users
    }
    
    return {
      training_day: {
        calories: baseCalories * 1.1,
        carb_percentage: 0.45
      },
      rest_day: {
        calories: baseCalories * 0.9,
        carb_percentage: 0.25
      }
    };
  }
}
```

#### 3. Meal Planning AI

**Meal Generator:**
```typescript
class MealPlanGenerator {
  async generateMealPlan(
    profile: UserProfileExtended,
    macros: MacroStrategy
  ): Promise<MealPlan> {
    
    const mealStructure = this.createMealStructure(profile);
    const ingredients = await this.getCompatibleIngredients(profile.diet_type);
    
    return {
      training_day: await this.generateDayPlan(macros.training_day, mealStructure, ingredients),
      rest_day: await this.generateDayPlan(macros.rest_day, mealStructure, ingredients)
    };
  }
  
  private createMealStructure(profile: UserProfileExtended) {
    const { meals_per_day, snacks_per_day } = profile;
    
    return {
      meals: Array(meals_per_day).fill(null).map((_, i) => ({
        name: this.getMealName(i),
        calorie_percentage: this.getMealCalorieDistribution(i, meals_per_day)
      })),
      snacks: Array(snacks_per_day).fill(null).map((_, i) => ({
        name: `Snack ${i + 1}`,
        calorie_percentage: 0.1
      }))
    };
  }
}
```

#### 4. Workout Programming Engine

**Training Plan Generator:**
```typescript
class WorkoutPlanGenerator {
  generateWorkoutPlan(profile: UserProfileExtended): WorkoutPlan {
    const { training_level, workout_days_per_week, goal } = profile;
    
    switch (training_level) {
      case 'beginner':
        return this.generateBeginnerPlan(workout_days_per_week, goal);
      case 'intermediate':
        return this.generateIntermediatePlan(workout_days_per_week, goal);
      case 'advanced':
        return this.generateAdvancedPlan(workout_days_per_week, goal);
    }
  }
  
  private generateBeginnerPlan(days: number, goal: string): WorkoutPlan {
    return {
      split_type: 'full_body',
      weekly_schedule: this.createFullBodySchedule(days),
      exercise_structure: this.getBeginnerExercises(goal),
      progression_scheme: 'linear',
      rpe_range: [6, 7]
    };
  }
}
```

### API Architecture

#### Core Endpoints

**Plan Generation:**
```typescript
POST /api/transformation/generate
{
  user_profile: UserProfileExtended
}
→ TransformationPlan
```

**Plan Updates:**
```typescript
PATCH /api/transformation/{planId}/week/{weekNumber}
{
  progress_data: ProgressUpdate
}
→ UpdatedWeekPlan
```

**Progress Tracking:**
```typescript
POST /api/transformation/{planId}/progress
{
  weight: number,
  body_fat?: number,
  measurements?: Measurements,
  adherence_score: number
}
→ ProgressAnalysis
```

### Database Schema

#### Supabase Tables

**transformation_plans:**
```sql
CREATE TABLE transformation_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Plan metadata
  duration_weeks INTEGER,
  subscription_tier TEXT,
  
  -- Metabolic data
  metabolic_analysis JSONB,
  macro_strategy JSONB,
  weekly_progression JSONB,
  
  -- Plans
  meal_plan JSONB,
  workout_plan JSONB,
  
  -- Predictions & optimizations
  progress_projection JSONB,
  grocery_optimization JSONB,
  
  -- Status
  status TEXT DEFAULT 'active',
  completion_percentage DECIMAL DEFAULT 0
);
```

**progress_tracking:**
```sql
CREATE TABLE progress_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES transformation_plans(id),
  week_number INTEGER,
  recorded_at TIMESTAMP DEFAULT NOW(),
  
  -- Measurements
  weight DECIMAL,
  body_fat_percentage DECIMAL,
  measurements JSONB,
  
  -- Adherence
  nutrition_adherence DECIMAL,
  workout_adherence DECIMAL,
  
  -- Adjustments made
  calorie_adjustment INTEGER DEFAULT 0,
  macro_adjustment JSONB
);
```

### Subscription Tier Logic

#### Feature Gating
```typescript
class FeatureGate {
  static getAvailableFeatures(tier: 'free' | 'pro'): string[] {
    const freeFeatures = [
      'basic_meal_plan',
      'simple_workout',
      'basic_macros',
      'progress_tracking'
    ];
    
    const proFeatures = [
      ...freeFeatures,
      'macro_cycling',
      'refeed_strategy',
      'grocery_optimization',
      'meal_prep_batching',
      'advanced_progression',
      'plateau_prevention',
      'progress_projection'
    ];
    
    return tier === 'pro' ? proFeatures : freeFeatures;
  }
  
  static limitPlanComplexity(plan: TransformationPlan, tier: 'free' | 'pro'): TransformationPlan {
    if (tier === 'free') {
      // Simplify meal plan to 3-day rotation
      plan.meal_plan = this.simplifyMealPlan(plan.meal_plan);
      
      // Remove advanced features
      delete plan.grocery_optimization;
      delete plan.meal_prep_strategy;
      plan.macro_strategy.macro_cycling = null;
    }
    
    return plan;
  }
}
```

### Performance Optimizations

#### Caching Strategy
- Redis cache for frequently generated plans
- Meal plan templates cached by diet type
- Workout templates cached by experience level
- User profile caching for quick plan updates

#### AI Response Optimization
- Pre-computed meal combinations for common macros
- Template-based plan generation with AI customization
- Batch processing for multiple plan generations
- Streaming responses for large plan data

### Error Handling & Validation

#### Input Validation
```typescript
class PlanValidator {
  static validateUserProfile(profile: UserProfileExtended): ValidationResult {
    const errors: string[] = [];
    
    // Physical metrics validation
    if (profile.height < 100 || profile.height > 250) {
      errors.push('Height must be between 100-250 cm');
    }
    
    if (profile.weight < 30 || profile.weight > 300) {
      errors.push('Weight must be between 30-300 kg');
    }
    
    // Body fat validation
    if (profile.body_fat_percentage && 
        (profile.body_fat_percentage < 3 || profile.body_fat_percentage > 50)) {
      errors.push('Body fat percentage must be between 3-50%');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
```

### Testing Strategy

#### Unit Tests
- Metabolic calculation accuracy
- Macro distribution algorithms
- Progression logic validation
- Subscription tier feature gating

#### Integration Tests
- End-to-end plan generation
- Database operations
- API response validation
- Subscription flow testing

#### Property-Based Tests
- Calorie calculation properties
- Macro distribution constraints
- Progressive adjustment bounds
- Plan consistency validation

### Deployment Architecture

#### Vercel Deployment
- Next.js app with API routes
- Edge functions for plan generation
- Static asset optimization
- Environment variable management

#### Supabase Integration
- Row Level Security for user data
- Real-time subscriptions for progress updates
- Database functions for complex queries
- Automated backups

#### Monitoring & Analytics
- Plan generation success rates
- User engagement metrics
- Subscription conversion tracking
- Performance monitoring

This design provides a comprehensive foundation for building an elite AI nutrition and training engine that delivers personalized transformation systems rather than simple diet plans.