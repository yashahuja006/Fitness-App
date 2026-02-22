/**
 * Diet Plan Service
 * 
 * Frontend service for interacting with the diet plan API endpoints.
 * Handles diet plan generation, retrieval, and management.
 * 
 * Requirements: 2.1, 2.3
 */

import { 
  DietPlan, 
  DailyMealPlan, 
  Meal, 
  PersonalMetrics, 
  DietaryRestriction 
} from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface DietPlanGenerationRequest {
  personalMetrics: PersonalMetrics;
  planType: 'weight_loss' | 'muscle_gain' | 'maintenance' | 'endurance';
  duration?: number; // days, defaults to 7
  restrictions?: DietaryRestriction[];
  preferences?: {
    mealsPerDay?: number;
    snacksPerDay?: number;
    cookingTime?: 'quick' | 'moderate' | 'elaborate';
    cuisinePreferences?: string[];
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    message: string;
    code?: string;
  };
}

/**
 * Get authentication token from localStorage or session
 */
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
}

/**
 * Make authenticated API request
 */
async function apiRequest<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getAuthToken();
  
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.warn('API request failed (backend not available):', error);
    // Return a failed response instead of throwing to prevent crashes
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Backend service unavailable',
        code: 'BACKEND_UNAVAILABLE'
      }
    } as ApiResponse<T>;
  }
}

export class DietPlanService {
  /**
   * Generate a new personalized diet plan
   */
  static async generateDietPlan(request: DietPlanGenerationRequest): Promise<DietPlan> {
    const response = await apiRequest<{ plan: DietPlan }>('/diet/plans/generate', {
      method: 'POST',
      body: JSON.stringify(request),
    });

    if (!response.success || !response.data?.plan) {
      // If backend is unavailable, generate a mock diet plan
      if (response.error?.code === 'BACKEND_UNAVAILABLE') {
        console.warn('Backend unavailable, generating mock diet plan');
        return this.generateMockDietPlan(request);
      }
      throw new Error(response.error?.message || 'Failed to generate diet plan');
    }

    return response.data.plan;
  }

  /**
   * Get all diet plans for the current user
   */
  static async getUserDietPlans(): Promise<DietPlan[]> {
    const response = await apiRequest<{ plans: DietPlan[] }>('/diet/plans');

    if (!response.success) {
      // If backend is unavailable, return empty array instead of throwing
      if (response.error?.code === 'BACKEND_UNAVAILABLE') {
        console.warn('Backend unavailable, returning empty diet plans');
        return [];
      }
      throw new Error(response.error?.message || 'Failed to retrieve diet plans');
    }

    return response.data?.plans || [];
  }

  /**
   * Get a specific diet plan by ID
   */
  static async getDietPlan(planId: string): Promise<DietPlan> {
    const response = await apiRequest<{ plan: DietPlan }>(`/diet/plans/${planId}`);

    if (!response.success || !response.data?.plan) {
      throw new Error('Failed to retrieve diet plan');
    }

    return response.data.plan;
  }

  /**
   * Update an existing diet plan
   */
  static async updateDietPlan(planId: string, updates: Partial<DietPlan>): Promise<DietPlan> {
    const response = await apiRequest<{ plan: DietPlan }>(`/diet/plans/${planId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });

    if (!response.success || !response.data?.plan) {
      throw new Error('Failed to update diet plan');
    }

    return response.data.plan;
  }

  /**
   * Delete a diet plan
   */
  static async deleteDietPlan(planId: string): Promise<void> {
    const response = await apiRequest(`/diet/plans/${planId}`, {
      method: 'DELETE',
    });

    if (!response.success) {
      throw new Error('Failed to delete diet plan');
    }
  }

  /**
   * Get meals for a specific diet plan
   */
  static async getPlanMeals(planId: string): Promise<DailyMealPlan[]> {
    const response = await apiRequest<{ meals: DailyMealPlan[] }>(`/diet/plans/${planId}/meals`);

    if (!response.success || !response.data?.meals) {
      throw new Error('Failed to retrieve plan meals');
    }

    return response.data.meals;
  }

  /**
   * Update meals for a specific day in a diet plan
   */
  static async updateDayMeals(
    planId: string, 
    day: number, 
    meals: DailyMealPlan['meals']
  ): Promise<DietPlan> {
    const response = await apiRequest<{ plan: DietPlan }>(`/diet/plans/${planId}/meals/${day}`, {
      method: 'PUT',
      body: JSON.stringify({ meals }),
    });

    if (!response.success || !response.data?.plan) {
      throw new Error('Failed to update day meals');
    }

    return response.data.plan;
  }

  /**
   * Substitute a specific meal in a diet plan
   */
  static async substituteMeal(
    planId: string,
    day: number,
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snacks',
    newMeal: Meal
  ): Promise<DietPlan> {
    const response = await apiRequest<{ plan: DietPlan }>(`/diet/plans/${planId}/meals/${day}/substitute`, {
      method: 'POST',
      body: JSON.stringify({ mealType, newMeal }),
    });

    if (!response.success || !response.data?.plan) {
      throw new Error('Failed to substitute meal');
    }

    return response.data.plan;
  }

  /**
   * Calculate nutrition summary for a diet plan
   */
  static calculateNutritionSummary(plan: DietPlan): {
    averageDailyCalories: number;
    averageMacros: {
      protein: number;
      carbohydrates: number;
      fats: number;
      fiber: number;
    };
    macroPercentages: {
      protein: number;
      carbohydrates: number;
      fats: number;
    };
  } {
    if (!plan.meals || plan.meals.length === 0) {
      return {
        averageDailyCalories: 0,
        averageMacros: { protein: 0, carbohydrates: 0, fats: 0, fiber: 0 },
        macroPercentages: { protein: 0, carbohydrates: 0, fats: 0 }
      };
    }

    const totalCalories = plan.meals.reduce((sum, day) => sum + day.totalCalories, 0);
    const totalMacros = plan.meals.reduce(
      (sum, day) => ({
        protein: sum.protein + day.macroBreakdown.protein,
        carbohydrates: sum.carbohydrates + day.macroBreakdown.carbohydrates,
        fats: sum.fats + day.macroBreakdown.fats,
        fiber: sum.fiber + day.macroBreakdown.fiber,
      }),
      { protein: 0, carbohydrates: 0, fats: 0, fiber: 0 }
    );

    const averageDailyCalories = totalCalories / plan.meals.length;
    const averageMacros = {
      protein: totalMacros.protein / plan.meals.length,
      carbohydrates: totalMacros.carbohydrates / plan.meals.length,
      fats: totalMacros.fats / plan.meals.length,
      fiber: totalMacros.fiber / plan.meals.length,
    };

    // Calculate macro percentages (protein and carbs = 4 cal/g, fats = 9 cal/g)
    const proteinCalories = averageMacros.protein * 4;
    const carbCalories = averageMacros.carbohydrates * 4;
    const fatCalories = averageMacros.fats * 9;
    const totalMacroCalories = proteinCalories + carbCalories + fatCalories;

    const macroPercentages = {
      protein: totalMacroCalories > 0 ? (proteinCalories / totalMacroCalories) * 100 : 0,
      carbohydrates: totalMacroCalories > 0 ? (carbCalories / totalMacroCalories) * 100 : 0,
      fats: totalMacroCalories > 0 ? (fatCalories / totalMacroCalories) * 100 : 0,
    };

    return {
      averageDailyCalories: Math.round(averageDailyCalories),
      averageMacros: {
        protein: Math.round(averageMacros.protein * 10) / 10,
        carbohydrates: Math.round(averageMacros.carbohydrates * 10) / 10,
        fats: Math.round(averageMacros.fats * 10) / 10,
        fiber: Math.round(averageMacros.fiber * 10) / 10,
      },
      macroPercentages: {
        protein: Math.round(macroPercentages.protein),
        carbohydrates: Math.round(macroPercentages.carbohydrates),
        fats: Math.round(macroPercentages.fats),
      }
    };
  }

  /**
   * Validate diet plan generation request
   */
  static validateGenerationRequest(request: DietPlanGenerationRequest): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Validate personal metrics
    if (!request.personalMetrics) {
      errors.push('Personal metrics are required');
    } else {
      const { height, weight, age, gender, activityLevel } = request.personalMetrics;
      
      if (!height || height < 100 || height > 250) {
        errors.push('Height must be between 100-250 cm');
      }
      
      if (!weight || weight < 30 || weight > 300) {
        errors.push('Weight must be between 30-300 kg');
      }
      
      if (!age || age < 13 || age > 120) {
        errors.push('Age must be between 13-120 years');
      }
      
      if (!['male', 'female', 'other'].includes(gender)) {
        errors.push('Gender must be male, female, or other');
      }
      
      if (!['sedentary', 'light', 'moderate', 'active', 'very_active'].includes(activityLevel)) {
        errors.push('Invalid activity level');
      }
    }

    // Validate plan type
    if (!['weight_loss', 'muscle_gain', 'maintenance', 'endurance'].includes(request.planType)) {
      errors.push('Invalid plan type');
    }

    // Validate duration
    if (request.duration && (request.duration < 1 || request.duration > 365)) {
      errors.push('Duration must be between 1-365 days');
    }

    // Validate restrictions
    if (request.restrictions) {
      const validRestrictions = [
        'vegetarian', 'vegan', 'gluten-free', 'dairy-free', 
        'nut-free', 'low-carb', 'keto', 'paleo'
      ];
      const invalidRestrictions = request.restrictions.filter(
        restriction => !validRestrictions.includes(restriction)
      );
      if (invalidRestrictions.length > 0) {
        errors.push(`Invalid dietary restrictions: ${invalidRestrictions.join(', ')}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Format meal for display
   */
  static formatMealForDisplay(meal: Meal): {
    name: string;
    calories: string;
    macros: string;
    prepTime: string;
    ingredientCount: number;
  } {
    return {
      name: meal.name,
      calories: `${meal.calories} cal`,
      macros: `P: ${meal.macros.protein}g | C: ${meal.macros.carbohydrates}g | F: ${meal.macros.fats}g`,
      prepTime: `${meal.prepTime} min`,
      ingredientCount: meal.ingredients.length
    };
  }

  /**
   * Get plan type display name
   */
  static getPlanTypeDisplayName(planType: DietPlan['planType']): string {
    const displayNames = {
      weight_loss: 'Weight Loss',
      muscle_gain: 'Muscle Gain',
      maintenance: 'Maintenance',
      endurance: 'Endurance'
    };
    return displayNames[planType] || planType;
  }

  /**
   * Get dietary restriction display name
   */
  static getDietaryRestrictionDisplayName(restriction: DietaryRestriction): string {
    const displayNames = {
      vegetarian: 'Vegetarian',
      vegan: 'Vegan',
      'gluten-free': 'Gluten-Free',
      'dairy-free': 'Dairy-Free',
      'nut-free': 'Nut-Free',
      'low-carb': 'Low-Carb',
      keto: 'Keto',
      paleo: 'Paleo'
    };
    return displayNames[restriction] || restriction;
  }

  /**
   * Generate a mock diet plan when backend is unavailable
   */
  private static generateMockDietPlan(request: DietPlanGenerationRequest): DietPlan {
    const { personalMetrics, planType, duration = 7 } = request;
    
    // Calculate basic calorie needs (simplified BMR calculation)
    const bmr = personalMetrics.gender === 'male' 
      ? 88.362 + (13.397 * personalMetrics.weight) + (4.799 * personalMetrics.height) - (5.677 * personalMetrics.age)
      : 447.593 + (9.247 * personalMetrics.weight) + (3.098 * personalMetrics.height) - (4.330 * personalMetrics.age);
    
    const activityMultipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9
    };
    
    let targetCalories = Math.round(bmr * activityMultipliers[personalMetrics.activityLevel]);
    
    // Adjust for plan type
    switch (planType) {
      case 'weight_loss':
        targetCalories -= 500; // 500 calorie deficit
        break;
      case 'muscle_gain':
        targetCalories += 300; // 300 calorie surplus
        break;
      case 'endurance':
        targetCalories += 200; // Slight surplus for endurance
        break;
      // maintenance stays the same
    }

    // Generate mock meals for each day
    const meals: DailyMealPlan[] = [];
    for (let day = 1; day <= duration; day++) {
      meals.push(this.generateMockDayMeals(day, targetCalories, planType));
    }

    return {
      id: `mock-plan-${Date.now()}`,
      userId: 'mock-user',
      name: `${this.getPlanTypeDisplayName(planType)} Plan`,
      planType,
      duration,
      targetCalories,
      personalMetrics,
      restrictions: request.restrictions || [],
      meals,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    };
  }

  /**
   * Generate mock meals for a single day
   */
  private static generateMockDayMeals(day: number, targetCalories: number, planType: string): DailyMealPlan {
    const breakfastCalories = Math.round(targetCalories * 0.25);
    const lunchCalories = Math.round(targetCalories * 0.35);
    const dinnerCalories = Math.round(targetCalories * 0.30);
    const snackCalories = Math.round(targetCalories * 0.10);

    const mockMeals = {
      breakfast: {
        id: `breakfast-${day}`,
        name: day % 2 === 0 ? 'Oatmeal with Berries' : 'Greek Yogurt Parfait',
        calories: breakfastCalories,
        macros: {
          protein: Math.round(breakfastCalories * 0.2 / 4),
          carbohydrates: Math.round(breakfastCalories * 0.5 / 4),
          fats: Math.round(breakfastCalories * 0.3 / 9),
          fiber: 8
        },
        ingredients: ['Oats', 'Berries', 'Milk', 'Honey'],
        instructions: ['Mix ingredients', 'Heat and serve'],
        prepTime: 10,
        servings: 1,
        tags: ['breakfast', 'healthy']
      },
      lunch: {
        id: `lunch-${day}`,
        name: day % 3 === 0 ? 'Grilled Chicken Salad' : 'Quinoa Bowl',
        calories: lunchCalories,
        macros: {
          protein: Math.round(lunchCalories * 0.3 / 4),
          carbohydrates: Math.round(lunchCalories * 0.4 / 4),
          fats: Math.round(lunchCalories * 0.3 / 9),
          fiber: 12
        },
        ingredients: ['Chicken', 'Quinoa', 'Vegetables', 'Olive Oil'],
        instructions: ['Grill chicken', 'Mix with quinoa and vegetables'],
        prepTime: 20,
        servings: 1,
        tags: ['lunch', 'protein']
      },
      dinner: {
        id: `dinner-${day}`,
        name: day % 2 === 0 ? 'Salmon with Sweet Potato' : 'Lean Beef Stir-fry',
        calories: dinnerCalories,
        macros: {
          protein: Math.round(dinnerCalories * 0.35 / 4),
          carbohydrates: Math.round(dinnerCalories * 0.35 / 4),
          fats: Math.round(dinnerCalories * 0.3 / 9),
          fiber: 10
        },
        ingredients: ['Salmon/Beef', 'Sweet Potato/Rice', 'Vegetables'],
        instructions: ['Cook protein', 'Prepare sides', 'Combine and serve'],
        prepTime: 25,
        servings: 1,
        tags: ['dinner', 'protein']
      },
      snacks: [{
        id: `snack-${day}`,
        name: 'Mixed Nuts and Fruit',
        calories: snackCalories,
        macros: {
          protein: Math.round(snackCalories * 0.15 / 4),
          carbohydrates: Math.round(snackCalories * 0.45 / 4),
          fats: Math.round(snackCalories * 0.4 / 9),
          fiber: 5
        },
        ingredients: ['Mixed Nuts', 'Apple', 'Berries'],
        instructions: ['Combine and enjoy'],
        prepTime: 2,
        servings: 1,
        tags: ['snack', 'healthy']
      }]
    };

    const totalCalories = mockMeals.breakfast.calories + mockMeals.lunch.calories + 
                         mockMeals.dinner.calories + mockMeals.snacks[0].calories;
    
    const macroBreakdown = {
      protein: mockMeals.breakfast.macros.protein + mockMeals.lunch.macros.protein + 
               mockMeals.dinner.macros.protein + mockMeals.snacks[0].macros.protein,
      carbohydrates: mockMeals.breakfast.macros.carbohydrates + mockMeals.lunch.macros.carbohydrates + 
                     mockMeals.dinner.macros.carbohydrates + mockMeals.snacks[0].macros.carbohydrates,
      fats: mockMeals.breakfast.macros.fats + mockMeals.lunch.macros.fats + 
            mockMeals.dinner.macros.fats + mockMeals.snacks[0].macros.fats,
      fiber: mockMeals.breakfast.macros.fiber + mockMeals.lunch.macros.fiber + 
             mockMeals.dinner.macros.fiber + mockMeals.snacks[0].macros.fiber
    };

    return {
      day,
      date: new Date(Date.now() + (day - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      meals: mockMeals,
      totalCalories,
      macroBreakdown
    };
  }
}