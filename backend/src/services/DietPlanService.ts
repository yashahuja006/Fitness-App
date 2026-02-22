/**
 * Diet Plan Generation Service
 * 
 * This service handles the generation of personalized diet plans based on user metrics,
 * caloric needs, and macronutrient requirements. It also manages storage and retrieval
 * of diet plans in Firestore.
 * 
 * Requirements: 2.1, 2.3
 */

import { db } from '../config/firebase';
import admin from '../config/firebase';
import { 
  DietPlan, 
  DailyMealPlan, 
  Meal, 
  Ingredient, 
  MacronutrientBreakdown,
  PersonalMetrics,
  DietaryRestriction 
} from '../types';
import { 
  calculateNutritionProfile, 
  CalorieRequirements,
  NutritionCalculationResult 
} from '../../../src/lib/nutritionCalculationService';

export interface DietPlanGenerationRequest {
  userId: string;
  personalMetrics: PersonalMetrics;
  planType: 'weight_loss' | 'muscle_gain' | 'maintenance' | 'endurance';
  duration: number; // days
  restrictions: DietaryRestriction[];
  preferences?: {
    mealsPerDay: number;
    snacksPerDay: number;
    cookingTime: 'quick' | 'moderate' | 'elaborate';
    cuisinePreferences: string[];
  };
}

export interface MealGenerationOptions {
  targetCalories: number;
  macroTargets: MacronutrientBreakdown;
  restrictions: DietaryRestriction[];
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  cookingTime?: 'quick' | 'moderate' | 'elaborate';
}

// Sample meal database - In production, this would be a comprehensive database
const MEAL_DATABASE: Meal[] = [
  // Breakfast options
  {
    id: 'breakfast-oatmeal-1',
    name: 'Protein-Packed Oatmeal',
    ingredients: [
      { name: 'Rolled oats', amount: 50, unit: 'g', calories: 190, macros: { protein: 6.5, carbohydrates: 32, fats: 3.5, fiber: 5 } },
      { name: 'Greek yogurt', amount: 100, unit: 'g', calories: 100, macros: { protein: 10, carbohydrates: 6, fats: 0.4, fiber: 0 } },
      { name: 'Banana', amount: 120, unit: 'g', calories: 105, macros: { protein: 1.3, carbohydrates: 27, fats: 0.4, fiber: 3.1 } },
      { name: 'Almonds', amount: 15, unit: 'g', calories: 87, macros: { protein: 3.2, carbohydrates: 3.3, fats: 7.5, fiber: 1.8 } }
    ],
    instructions: [
      'Cook oats with water or milk according to package directions',
      'Stir in Greek yogurt while oats are still warm',
      'Top with sliced banana and chopped almonds',
      'Add honey or maple syrup if desired'
    ],
    prepTime: 10,
    calories: 482,
    macros: { protein: 20.9, carbohydrates: 68.3, fats: 11.8, fiber: 9.9 }
  },
  {
    id: 'breakfast-eggs-1',
    name: 'Vegetable Scramble',
    ingredients: [
      { name: 'Eggs', amount: 2, unit: 'large', calories: 140, macros: { protein: 12, carbohydrates: 1, fats: 10, fiber: 0 } },
      { name: 'Spinach', amount: 50, unit: 'g', calories: 12, macros: { protein: 1.5, carbohydrates: 1.8, fats: 0.2, fiber: 1.1 } },
      { name: 'Bell pepper', amount: 60, unit: 'g', calories: 12, macros: { protein: 0.5, carbohydrates: 2.8, fats: 0.1, fiber: 1.2 } },
      { name: 'Olive oil', amount: 5, unit: 'ml', calories: 40, macros: { protein: 0, carbohydrates: 0, fats: 4.5, fiber: 0 } },
      { name: 'Whole grain toast', amount: 30, unit: 'g', calories: 80, macros: { protein: 3, carbohydrates: 15, fats: 1, fiber: 2 } }
    ],
    instructions: [
      'Heat olive oil in a non-stick pan',
      'Sauté bell pepper for 2-3 minutes',
      'Add spinach and cook until wilted',
      'Beat eggs and pour into pan, scramble gently',
      'Serve with toasted whole grain bread'
    ],
    prepTime: 15,
    calories: 284,
    macros: { protein: 17, carbohydrates: 20.6, fats: 15.8, fiber: 4.3 }
  },
  // Lunch options
  {
    id: 'lunch-chicken-1',
    name: 'Grilled Chicken Salad',
    ingredients: [
      { name: 'Chicken breast', amount: 120, unit: 'g', calories: 198, macros: { protein: 37, carbohydrates: 0, fats: 4.3, fiber: 0 } },
      { name: 'Mixed greens', amount: 100, unit: 'g', calories: 20, macros: { protein: 2, carbohydrates: 4, fats: 0.3, fiber: 2.5 } },
      { name: 'Cherry tomatoes', amount: 100, unit: 'g', calories: 18, macros: { protein: 0.9, carbohydrates: 3.9, fats: 0.2, fiber: 1.2 } },
      { name: 'Cucumber', amount: 80, unit: 'g', calories: 13, macros: { protein: 0.5, carbohydrates: 3.1, fats: 0.1, fiber: 0.8 } },
      { name: 'Avocado', amount: 50, unit: 'g', calories: 80, macros: { protein: 1, carbohydrates: 4.3, fats: 7.3, fiber: 3.4 } },
      { name: 'Olive oil vinaigrette', amount: 15, unit: 'ml', calories: 90, macros: { protein: 0, carbohydrates: 1, fats: 10, fiber: 0 } }
    ],
    instructions: [
      'Season and grill chicken breast until cooked through',
      'Let chicken rest, then slice',
      'Combine mixed greens, tomatoes, and cucumber in a bowl',
      'Top with sliced chicken and avocado',
      'Drizzle with vinaigrette before serving'
    ],
    prepTime: 20,
    calories: 419,
    macros: { protein: 41.4, carbohydrates: 16.3, fats: 22.2, fiber: 7.9 }
  },
  {
    id: 'lunch-quinoa-1',
    name: 'Mediterranean Quinoa Bowl',
    ingredients: [
      { name: 'Quinoa', amount: 60, unit: 'g', calories: 222, macros: { protein: 8, carbohydrates: 39, fats: 3.6, fiber: 2.8 } },
      { name: 'Chickpeas', amount: 80, unit: 'g', calories: 130, macros: { protein: 7, carbohydrates: 20, fats: 2.1, fiber: 6 } },
      { name: 'Feta cheese', amount: 30, unit: 'g', calories: 75, macros: { protein: 4, carbohydrates: 1.2, fats: 6, fiber: 0 } },
      { name: 'Olives', amount: 20, unit: 'g', calories: 30, macros: { protein: 0.2, carbohydrates: 1.6, fats: 3, fiber: 0.8 } },
      { name: 'Red onion', amount: 30, unit: 'g', calories: 12, macros: { protein: 0.3, carbohydrates: 2.8, fats: 0, fiber: 0.5 } },
      { name: 'Lemon juice', amount: 15, unit: 'ml', calories: 4, macros: { protein: 0.1, carbohydrates: 1.3, fats: 0, fiber: 0.1 } }
    ],
    instructions: [
      'Cook quinoa according to package directions',
      'Drain and rinse chickpeas',
      'Combine cooked quinoa with chickpeas',
      'Add diced red onion, olives, and crumbled feta',
      'Dress with lemon juice and olive oil',
      'Season with herbs and spices to taste'
    ],
    prepTime: 25,
    calories: 473,
    macros: { protein: 19.6, carbohydrates: 65.9, fats: 14.7, fiber: 10.2 }
  },
  // Dinner options
  {
    id: 'dinner-salmon-1',
    name: 'Baked Salmon with Vegetables',
    ingredients: [
      { name: 'Salmon fillet', amount: 150, unit: 'g', calories: 309, macros: { protein: 43, carbohydrates: 0, fats: 14, fiber: 0 } },
      { name: 'Broccoli', amount: 150, unit: 'g', calories: 51, macros: { protein: 4.3, carbohydrates: 10, fats: 0.6, fiber: 3.8 } },
      { name: 'Sweet potato', amount: 120, unit: 'g', calories: 103, macros: { protein: 2.3, carbohydrates: 24, fats: 0.1, fiber: 3.9 } },
      { name: 'Olive oil', amount: 10, unit: 'ml', calories: 80, macros: { protein: 0, carbohydrates: 0, fats: 9, fiber: 0 } }
    ],
    instructions: [
      'Preheat oven to 400°F (200°C)',
      'Cut sweet potato into cubes and toss with half the olive oil',
      'Roast sweet potato for 15 minutes',
      'Add broccoli to the pan and season salmon with remaining oil',
      'Bake for another 12-15 minutes until salmon flakes easily',
      'Season with herbs, lemon, salt, and pepper'
    ],
    prepTime: 30,
    calories: 543,
    macros: { protein: 49.6, carbohydrates: 34, fats: 23.7, fiber: 7.7 }
  },
  {
    id: 'dinner-turkey-1',
    name: 'Turkey and Vegetable Stir-fry',
    ingredients: [
      { name: 'Ground turkey', amount: 120, unit: 'g', calories: 200, macros: { protein: 27, carbohydrates: 0, fats: 9, fiber: 0 } },
      { name: 'Brown rice', amount: 60, unit: 'g', calories: 216, macros: { protein: 5, carbohydrates: 45, fats: 1.8, fiber: 1.8 } },
      { name: 'Mixed vegetables', amount: 150, unit: 'g', calories: 40, macros: { protein: 2, carbohydrates: 8, fats: 0.3, fiber: 3 } },
      { name: 'Sesame oil', amount: 5, unit: 'ml', calories: 40, macros: { protein: 0, carbohydrates: 0, fats: 4.5, fiber: 0 } },
      { name: 'Soy sauce', amount: 15, unit: 'ml', calories: 8, macros: { protein: 1.3, carbohydrates: 0.8, fats: 0, fiber: 0.1 } }
    ],
    instructions: [
      'Cook brown rice according to package directions',
      'Heat sesame oil in a large pan or wok',
      'Cook ground turkey until browned and cooked through',
      'Add mixed vegetables and stir-fry for 3-4 minutes',
      'Add soy sauce and seasonings',
      'Serve over brown rice'
    ],
    prepTime: 25,
    calories: 504,
    macros: { protein: 35.3, carbohydrates: 53.8, fats: 15.6, fiber: 4.9 }
  },
  // Snack options
  {
    id: 'snack-protein-1',
    name: 'Greek Yogurt with Berries',
    ingredients: [
      { name: 'Greek yogurt', amount: 150, unit: 'g', calories: 150, macros: { protein: 15, carbohydrates: 9, fats: 0.6, fiber: 0 } },
      { name: 'Mixed berries', amount: 80, unit: 'g', calories: 35, macros: { protein: 0.5, carbohydrates: 8.5, fats: 0.2, fiber: 2.4 } },
      { name: 'Honey', amount: 10, unit: 'g', calories: 30, macros: { protein: 0, carbohydrates: 8, fats: 0, fiber: 0 } }
    ],
    instructions: [
      'Place Greek yogurt in a bowl',
      'Top with mixed berries',
      'Drizzle with honey',
      'Mix gently before eating'
    ],
    prepTime: 2,
    calories: 215,
    macros: { protein: 15.5, carbohydrates: 25.5, fats: 0.8, fiber: 2.4 }
  },
  {
    id: 'snack-nuts-1',
    name: 'Trail Mix',
    ingredients: [
      { name: 'Almonds', amount: 15, unit: 'g', calories: 87, macros: { protein: 3.2, carbohydrates: 3.3, fats: 7.5, fiber: 1.8 } },
      { name: 'Walnuts', amount: 10, unit: 'g', calories: 65, macros: { protein: 1.5, carbohydrates: 1.4, fats: 6.5, fiber: 0.7 } },
      { name: 'Dried cranberries', amount: 15, unit: 'g', calories: 46, macros: { protein: 0, carbohydrates: 12, fats: 0.2, fiber: 0.7 } }
    ],
    instructions: [
      'Mix all ingredients in a small bowl',
      'Store in an airtight container for freshness'
    ],
    prepTime: 1,
    calories: 198,
    macros: { protein: 4.7, carbohydrates: 16.7, fats: 14.2, fiber: 3.2 }
  }
];

export class DietPlanService {
  /**
   * Generate a complete personalized diet plan
   */
  async generateDietPlan(request: DietPlanGenerationRequest): Promise<DietPlan> {
    // Calculate nutrition profile using existing service
    const nutritionProfile = calculateNutritionProfile(
      request.personalMetrics,
      request.planType
    );

    // Generate daily meal plans
    const dailyMealPlans = await this.generateDailyMealPlans(
      request.duration,
      nutritionProfile.calorieRequirements.targetCalories,
      nutritionProfile.macronutrients,
      request.restrictions,
      request.preferences
    );

    // Create diet plan object
    const dietPlan: DietPlan = {
      id: this.generatePlanId(),
      userId: request.userId,
      planType: request.planType,
      dailyCalories: nutritionProfile.calorieRequirements.targetCalories,
      macronutrients: nutritionProfile.macronutrients,
      meals: dailyMealPlans,
      duration: request.duration,
      restrictions: request.restrictions,
      generatedAt: new Date(),
      lastModified: new Date()
    };

    return dietPlan;
  }

  /**
   * Save diet plan to Firestore
   */
  async saveDietPlan(dietPlan: DietPlan): Promise<void> {
    try {
      const planRef = db.collection('dietPlans').doc(dietPlan.id);
      await planRef.set({
        ...dietPlan,
        generatedAt: new Date(dietPlan.generatedAt),
        lastModified: new Date(dietPlan.lastModified)
      });

      // Also save a reference in the user's document
      const userRef = db.collection('users').doc(dietPlan.userId);
      await userRef.update({
        [`dietPlans.${dietPlan.id}`]: {
          planId: dietPlan.id,
          planType: dietPlan.planType,
          createdAt: new Date(dietPlan.generatedAt),
          isActive: true
        }
      });
    } catch (error) {
      throw new Error(`Failed to save diet plan: ${error}`);
    }
  }

  /**
   * Retrieve diet plan from Firestore
   */
  async getDietPlan(planId: string, userId: string): Promise<DietPlan | null> {
    try {
      const planRef = db.collection('dietPlans').doc(planId);
      const planDoc = await planRef.get();

      if (!planDoc.exists) {
        return null;
      }

      const planData = planDoc.data() as DietPlan;
      
      // Verify the plan belongs to the requesting user
      if (planData.userId !== userId) {
        throw new Error('Unauthorized access to diet plan');
      }

      return {
        ...planData,
        generatedAt: planData.generatedAt instanceof Date ? planData.generatedAt : new Date(planData.generatedAt),
        lastModified: planData.lastModified instanceof Date ? planData.lastModified : new Date(planData.lastModified)
      };
    } catch (error) {
      throw new Error(`Failed to retrieve diet plan: ${error}`);
    }
  }

  /**
   * Get all diet plans for a user
   */
  async getUserDietPlans(userId: string): Promise<DietPlan[]> {
    try {
      const plansQuery = db.collection('dietPlans')
        .where('userId', '==', userId)
        .orderBy('generatedAt', 'desc');
      
      const plansSnapshot = await plansQuery.get();
      
      return plansSnapshot.docs.map(doc => {
        const data = doc.data() as DietPlan;
        return {
          ...data,
          generatedAt: data.generatedAt instanceof Date ? data.generatedAt : new Date(data.generatedAt),
          lastModified: data.lastModified instanceof Date ? data.lastModified : new Date(data.lastModified)
        };
      });
    } catch (error) {
      throw new Error(`Failed to retrieve user diet plans: ${error}`);
    }
  }

  /**
   * Update an existing diet plan
   */
  async updateDietPlan(planId: string, userId: string, updates: Partial<DietPlan>): Promise<DietPlan> {
    try {
      const planRef = db.collection('dietPlans').doc(planId);
      const planDoc = await planRef.get();

      if (!planDoc.exists) {
        throw new Error('Diet plan not found');
      }

      const existingPlan = planDoc.data() as DietPlan;
      
      // Verify ownership
      if (existingPlan.userId !== userId) {
        throw new Error('Unauthorized access to diet plan');
      }

      const updatedPlan = {
        ...existingPlan,
        ...updates,
        lastModified: new Date()
      };

      await planRef.update(updatedPlan);
      
      return updatedPlan;
    } catch (error) {
      throw new Error(`Failed to update diet plan: ${error}`);
    }
  }

  /**
   * Delete a diet plan
   */
  async deleteDietPlan(planId: string, userId: string): Promise<void> {
    try {
      const planRef = db.collection('dietPlans').doc(planId);
      const planDoc = await planRef.get();

      if (!planDoc.exists) {
        throw new Error('Diet plan not found');
      }

      const planData = planDoc.data() as DietPlan;
      
      // Verify ownership
      if (planData.userId !== userId) {
        throw new Error('Unauthorized access to diet plan');
      }

      // Delete the plan
      await planRef.delete();

      // Remove reference from user document
      const userRef = db.collection('users').doc(userId);
      await userRef.update({
        [`dietPlans.${planId}`]: admin.firestore.FieldValue.delete()
      });
    } catch (error) {
      throw new Error(`Failed to delete diet plan: ${error}`);
    }
  }

  /**
   * Generate daily meal plans for the specified duration
   */
  private async generateDailyMealPlans(
    duration: number,
    dailyCalories: number,
    macroTargets: MacronutrientBreakdown,
    restrictions: DietaryRestriction[],
    preferences?: DietPlanGenerationRequest['preferences']
  ): Promise<DailyMealPlan[]> {
    const dailyPlans: DailyMealPlan[] = [];
    const mealsPerDay = preferences?.mealsPerDay || 3;
    const snacksPerDay = preferences?.snacksPerDay || 1;

    // Calculate calorie distribution
    const calorieDistribution = this.calculateCalorieDistribution(
      dailyCalories,
      mealsPerDay,
      snacksPerDay
    );

    for (let day = 1; day <= duration; day++) {
      const dailyPlan = await this.generateSingleDayMealPlan(
        day,
        calorieDistribution,
        macroTargets,
        restrictions,
        preferences
      );
      dailyPlans.push(dailyPlan);
    }

    return dailyPlans;
  }

  /**
   * Generate meal plan for a single day
   */
  private async generateSingleDayMealPlan(
    day: number,
    calorieDistribution: { breakfast: number; lunch: number; dinner: number; snacks: number },
    macroTargets: MacronutrientBreakdown,
    restrictions: DietaryRestriction[],
    preferences?: DietPlanGenerationRequest['preferences']
  ): Promise<DailyMealPlan> {
    // Calculate macro distribution for each meal
    const macroDistribution = this.calculateMacroDistribution(macroTargets);

    // Generate meals
    const breakfast = this.selectMeal('breakfast', calorieDistribution.breakfast, macroDistribution.breakfast, restrictions);
    const lunch = this.selectMeal('lunch', calorieDistribution.lunch, macroDistribution.lunch, restrictions);
    const dinner = this.selectMeal('dinner', calorieDistribution.dinner, macroDistribution.dinner, restrictions);
    const snacks = [this.selectMeal('snack', calorieDistribution.snacks, macroDistribution.snacks, restrictions)];

    // Calculate actual totals
    const totalCalories = breakfast.calories + lunch.calories + dinner.calories + snacks.reduce((sum, snack) => sum + snack.calories, 0);
    const macroBreakdown: MacronutrientBreakdown = {
      protein: breakfast.macros.protein + lunch.macros.protein + dinner.macros.protein + snacks.reduce((sum, snack) => sum + snack.macros.protein, 0),
      carbohydrates: breakfast.macros.carbohydrates + lunch.macros.carbohydrates + dinner.macros.carbohydrates + snacks.reduce((sum, snack) => sum + snack.macros.carbohydrates, 0),
      fats: breakfast.macros.fats + lunch.macros.fats + dinner.macros.fats + snacks.reduce((sum, snack) => sum + snack.macros.fats, 0),
      fiber: breakfast.macros.fiber + lunch.macros.fiber + dinner.macros.fiber + snacks.reduce((sum, snack) => sum + snack.macros.fiber, 0)
    };

    return {
      day,
      meals: {
        breakfast,
        lunch,
        dinner,
        snacks
      },
      totalCalories: Math.round(totalCalories),
      macroBreakdown: {
        protein: Math.round(macroBreakdown.protein * 10) / 10,
        carbohydrates: Math.round(macroBreakdown.carbohydrates * 10) / 10,
        fats: Math.round(macroBreakdown.fats * 10) / 10,
        fiber: Math.round(macroBreakdown.fiber * 10) / 10
      }
    };
  }

  /**
   * Calculate calorie distribution across meals
   */
  private calculateCalorieDistribution(
    dailyCalories: number,
    mealsPerDay: number,
    snacksPerDay: number
  ): { breakfast: number; lunch: number; dinner: number; snacks: number } {
    // Standard distribution: 25% breakfast, 35% lunch, 30% dinner, 10% snacks
    return {
      breakfast: Math.round(dailyCalories * 0.25),
      lunch: Math.round(dailyCalories * 0.35),
      dinner: Math.round(dailyCalories * 0.30),
      snacks: Math.round(dailyCalories * 0.10)
    };
  }

  /**
   * Calculate macro distribution across meals
   */
  private calculateMacroDistribution(macroTargets: MacronutrientBreakdown): {
    breakfast: MacronutrientBreakdown;
    lunch: MacronutrientBreakdown;
    dinner: MacronutrientBreakdown;
    snacks: MacronutrientBreakdown;
  } {
    return {
      breakfast: {
        protein: Math.round(macroTargets.protein * 0.25),
        carbohydrates: Math.round(macroTargets.carbohydrates * 0.25),
        fats: Math.round(macroTargets.fats * 0.25),
        fiber: Math.round(macroTargets.fiber * 0.25)
      },
      lunch: {
        protein: Math.round(macroTargets.protein * 0.35),
        carbohydrates: Math.round(macroTargets.carbohydrates * 0.35),
        fats: Math.round(macroTargets.fats * 0.35),
        fiber: Math.round(macroTargets.fiber * 0.35)
      },
      dinner: {
        protein: Math.round(macroTargets.protein * 0.30),
        carbohydrates: Math.round(macroTargets.carbohydrates * 0.30),
        fats: Math.round(macroTargets.fats * 0.30),
        fiber: Math.round(macroTargets.fiber * 0.30)
      },
      snacks: {
        protein: Math.round(macroTargets.protein * 0.10),
        carbohydrates: Math.round(macroTargets.carbohydrates * 0.10),
        fats: Math.round(macroTargets.fats * 0.10),
        fiber: Math.round(macroTargets.fiber * 0.10)
      }
    };
  }

  /**
   * Select appropriate meal from database based on criteria
   */
  private selectMeal(
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack',
    targetCalories: number,
    macroTargets: MacronutrientBreakdown,
    restrictions: DietaryRestriction[]
  ): Meal {
    // Filter meals by type and restrictions
    const availableMeals = MEAL_DATABASE.filter(meal => {
      // Check if meal matches the type (based on meal ID prefix)
      const matchesType = meal.id.startsWith(mealType);
      
      // Check dietary restrictions
      const meetsRestrictions = this.checkDietaryRestrictions(meal, restrictions);
      
      // Check if calories are within reasonable range (±30%)
      const calorieRange = targetCalories * 0.3;
      const withinCalorieRange = Math.abs(meal.calories - targetCalories) <= calorieRange;
      
      return matchesType && meetsRestrictions && withinCalorieRange;
    });

    if (availableMeals.length === 0) {
      // Fallback: return the first meal of the correct type if no perfect match
      const fallbackMeals = MEAL_DATABASE.filter(meal => meal.id.startsWith(mealType));
      return fallbackMeals[0] || MEAL_DATABASE[0];
    }

    // Score meals based on how well they match macro targets
    const scoredMeals = availableMeals.map(meal => ({
      meal,
      score: this.calculateMealScore(meal, targetCalories, macroTargets)
    }));

    // Sort by score and return the best match
    scoredMeals.sort((a, b) => b.score - a.score);
    return scoredMeals[0].meal;
  }

  /**
   * Check if meal meets dietary restrictions
   */
  private checkDietaryRestrictions(meal: Meal, restrictions: DietaryRestriction[]): boolean {
    if (restrictions.length === 0) return true;

    // Simple restriction checking - in production, this would be more sophisticated
    const mealIngredients = meal.ingredients.map(ing => ing.name.toLowerCase());
    
    for (const restriction of restrictions) {
      switch (restriction) {
        case 'vegetarian':
          if (mealIngredients.some(ing => 
            ing.includes('chicken') || ing.includes('beef') || ing.includes('pork') || 
            ing.includes('fish') || ing.includes('salmon') || ing.includes('turkey')
          )) {
            return false;
          }
          break;
        case 'vegan':
          if (mealIngredients.some(ing => 
            ing.includes('chicken') || ing.includes('beef') || ing.includes('pork') || 
            ing.includes('fish') || ing.includes('salmon') || ing.includes('turkey') ||
            ing.includes('egg') || ing.includes('milk') || ing.includes('cheese') || 
            ing.includes('yogurt') || ing.includes('honey')
          )) {
            return false;
          }
          break;
        case 'gluten-free':
          if (mealIngredients.some(ing => 
            ing.includes('wheat') || ing.includes('bread') || ing.includes('pasta') || 
            ing.includes('oats') || ing.includes('barley')
          )) {
            return false;
          }
          break;
        case 'dairy-free':
          if (mealIngredients.some(ing => 
            ing.includes('milk') || ing.includes('cheese') || ing.includes('yogurt') || 
            ing.includes('butter') || ing.includes('cream')
          )) {
            return false;
          }
          break;
        case 'nut-free':
          if (mealIngredients.some(ing => 
            ing.includes('almond') || ing.includes('walnut') || ing.includes('peanut') || 
            ing.includes('cashew') || ing.includes('pecan')
          )) {
            return false;
          }
          break;
      }
    }
    
    return true;
  }

  /**
   * Calculate how well a meal matches the target criteria
   */
  private calculateMealScore(
    meal: Meal,
    targetCalories: number,
    macroTargets: MacronutrientBreakdown
  ): number {
    // Calculate calorie score (closer to target = higher score)
    const calorieScore = 1 - Math.abs(meal.calories - targetCalories) / targetCalories;
    
    // Calculate macro scores
    const proteinScore = 1 - Math.abs(meal.macros.protein - macroTargets.protein) / Math.max(macroTargets.protein, 1);
    const carbScore = 1 - Math.abs(meal.macros.carbohydrates - macroTargets.carbohydrates) / Math.max(macroTargets.carbohydrates, 1);
    const fatScore = 1 - Math.abs(meal.macros.fats - macroTargets.fats) / Math.max(macroTargets.fats, 1);
    
    // Weighted average (calories 40%, protein 25%, carbs 20%, fats 15%)
    return (calorieScore * 0.4) + (proteinScore * 0.25) + (carbScore * 0.2) + (fatScore * 0.15);
  }

  /**
   * Generate unique plan ID
   */
  private generatePlanId(): string {
    return `diet_plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}