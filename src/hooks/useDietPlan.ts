/**
 * Diet Plan Hooks
 * 
 * Custom React hooks for managing diet plan state and operations.
 * Provides hooks for generating, retrieving, and managing diet plans.
 * 
 * Requirements: 2.1, 2.3
 */

import { useState, useEffect, useCallback } from 'react';
import { DietPlan, DailyMealPlan, Meal } from '../types';
import { 
  DietPlanService, 
  DietPlanGenerationRequest 
} from '../lib/dietPlanService';

export interface UseDietPlanState {
  plans: DietPlan[];
  currentPlan: DietPlan | null;
  loading: boolean;
  error: string | null;
}

export interface UseDietPlanActions {
  generatePlan: (request: DietPlanGenerationRequest) => Promise<DietPlan>;
  loadUserPlans: () => Promise<void>;
  loadPlan: (planId: string) => Promise<void>;
  updatePlan: (planId: string, updates: Partial<DietPlan>) => Promise<void>;
  deletePlan: (planId: string) => Promise<void>;
  substituteMeal: (planId: string, day: number, mealType: string, newMeal: Meal) => Promise<void>;
  clearError: () => void;
  setCurrentPlan: (plan: DietPlan | null) => void;
}

/**
 * Main diet plan management hook
 */
export function useDietPlan(): UseDietPlanState & UseDietPlanActions {
  const [state, setState] = useState<UseDietPlanState>({
    plans: [],
    currentPlan: null,
    loading: false,
    error: null,
  });

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, loading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, [setError]);

  const setCurrentPlan = useCallback((plan: DietPlan | null) => {
    setState(prev => ({ ...prev, currentPlan: plan }));
  }, []);

  const generatePlan = useCallback(async (request: DietPlanGenerationRequest): Promise<DietPlan> => {
    setLoading(true);
    setError(null);

    try {
      // Validate request
      const validation = DietPlanService.validateGenerationRequest(request);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      const plan = await DietPlanService.generateDietPlan(request);
      
      setState(prev => ({
        ...prev,
        plans: [plan, ...prev.plans],
        currentPlan: plan,
        loading: false
      }));

      return plan;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate diet plan';
      setError(errorMessage);
      setLoading(false);
      throw error;
    }
  }, [setLoading, setError]);

  const loadUserPlans = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const plans = await DietPlanService.getUserDietPlans();
      setState(prev => ({
        ...prev,
        plans,
        loading: false
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load diet plans';
      console.warn('Diet plans not available:', errorMessage);
      setError(errorMessage);
      setLoading(false);
      // Set empty plans array so UI doesn't break
      setState(prev => ({
        ...prev,
        plans: [],
        loading: false
      }));
    }
  }, [setLoading, setError]);

  const loadPlan = useCallback(async (planId: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const plan = await DietPlanService.getDietPlan(planId);
      setState(prev => ({
        ...prev,
        currentPlan: plan,
        loading: false
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load diet plan';
      setError(errorMessage);
      setLoading(false);
    }
  }, [setLoading, setError]);

  const updatePlan = useCallback(async (planId: string, updates: Partial<DietPlan>): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const updatedPlan = await DietPlanService.updateDietPlan(planId, updates);
      
      setState(prev => ({
        ...prev,
        plans: prev.plans.map(plan => plan.id === planId ? updatedPlan : plan),
        currentPlan: prev.currentPlan?.id === planId ? updatedPlan : prev.currentPlan,
        loading: false
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update diet plan';
      setError(errorMessage);
      setLoading(false);
    }
  }, [setLoading, setError]);

  const deletePlan = useCallback(async (planId: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      await DietPlanService.deleteDietPlan(planId);
      
      setState(prev => ({
        ...prev,
        plans: prev.plans.filter(plan => plan.id !== planId),
        currentPlan: prev.currentPlan?.id === planId ? null : prev.currentPlan,
        loading: false
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete diet plan';
      setError(errorMessage);
      setLoading(false);
    }
  }, [setLoading, setError]);

  const substituteMeal = useCallback(async (
    planId: string, 
    day: number, 
    mealType: string, 
    newMeal: Meal
  ): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const updatedPlan = await DietPlanService.substituteMeal(
        planId, 
        day, 
        mealType as 'breakfast' | 'lunch' | 'dinner' | 'snacks', 
        newMeal
      );
      
      setState(prev => ({
        ...prev,
        plans: prev.plans.map(plan => plan.id === planId ? updatedPlan : plan),
        currentPlan: prev.currentPlan?.id === planId ? updatedPlan : prev.currentPlan,
        loading: false
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to substitute meal';
      setError(errorMessage);
      setLoading(false);
    }
  }, [setLoading, setError]);

  return {
    ...state,
    generatePlan,
    loadUserPlans,
    loadPlan,
    updatePlan,
    deletePlan,
    substituteMeal,
    clearError,
    setCurrentPlan,
  };
}

/**
 * Hook for diet plan generation form state
 */
export function useDietPlanGeneration() {
  const [formData, setFormData] = useState<DietPlanGenerationRequest>({
    personalMetrics: {
      height: 170,
      weight: 70,
      age: 30,
      gender: 'other',
      activityLevel: 'moderate',
      fitnessGoals: []
    },
    planType: 'maintenance',
    duration: 7,
    restrictions: [],
    preferences: {
      mealsPerDay: 3,
      snacksPerDay: 1,
      cookingTime: 'moderate',
      cuisinePreferences: []
    }
  });

  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const updateFormData = useCallback((updates: Partial<DietPlanGenerationRequest>) => {
    setFormData(prev => ({
      ...prev,
      ...updates,
      personalMetrics: updates.personalMetrics 
        ? { ...prev.personalMetrics, ...updates.personalMetrics }
        : prev.personalMetrics,
      preferences: updates.preferences
        ? { ...prev.preferences, ...updates.preferences }
        : prev.preferences
    }));
  }, []);

  const validateForm = useCallback((): boolean => {
    const validation = DietPlanService.validateGenerationRequest(formData);
    setValidationErrors(validation.errors);
    return validation.isValid;
  }, [formData]);

  const resetForm = useCallback(() => {
    setFormData({
      personalMetrics: {
        height: 170,
        weight: 70,
        age: 30,
        gender: 'other',
        activityLevel: 'moderate',
        fitnessGoals: []
      },
      planType: 'maintenance',
      duration: 7,
      restrictions: [],
      preferences: {
        mealsPerDay: 3,
        snacksPerDay: 1,
        cookingTime: 'moderate',
        cuisinePreferences: []
      }
    });
    setValidationErrors([]);
  }, []);

  return {
    formData,
    validationErrors,
    updateFormData,
    validateForm,
    resetForm,
    isValid: validationErrors.length === 0
  };
}

/**
 * Hook for managing diet plan nutrition calculations
 */
export function useDietPlanNutrition(plan: DietPlan | null) {
  const [nutritionSummary, setNutritionSummary] = useState<{
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
  } | null>(null);

  useEffect(() => {
    if (plan) {
      const summary = DietPlanService.calculateNutritionSummary(plan);
      setNutritionSummary(summary);
    } else {
      setNutritionSummary(null);
    }
  }, [plan]);

  const getMealNutrition = useCallback((meal: Meal) => {
    return DietPlanService.formatMealForDisplay(meal);
  }, []);

  const getDayNutrition = useCallback((dayPlan: DailyMealPlan) => {
    return {
      totalCalories: dayPlan.totalCalories,
      macros: dayPlan.macroBreakdown,
      mealCount: 3 + dayPlan.meals.snacks.length, // breakfast, lunch, dinner + snacks
      proteinPercentage: Math.round((dayPlan.macroBreakdown.protein * 4 / dayPlan.totalCalories) * 100),
      carbPercentage: Math.round((dayPlan.macroBreakdown.carbohydrates * 4 / dayPlan.totalCalories) * 100),
      fatPercentage: Math.round((dayPlan.macroBreakdown.fats * 9 / dayPlan.totalCalories) * 100),
    };
  }, []);

  return {
    nutritionSummary,
    getMealNutrition,
    getDayNutrition,
  };
}

/**
 * Hook for diet plan filtering and searching
 */
export function useDietPlanFilters(plans: DietPlan[]) {
  const [filters, setFilters] = useState({
    planType: '' as DietPlan['planType'] | '',
    searchTerm: '',
    sortBy: 'newest' as 'newest' | 'oldest' | 'name',
  });

  const filteredPlans = useCallback(() => {
    let filtered = [...plans];

    // Filter by plan type
    if (filters.planType) {
      filtered = filtered.filter(plan => plan.planType === filters.planType);
    }

    // Filter by search term
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(plan => 
        DietPlanService.getPlanTypeDisplayName(plan.planType).toLowerCase().includes(searchLower) ||
        plan.restrictions.some(restriction => 
          DietPlanService.getDietaryRestrictionDisplayName(restriction).toLowerCase().includes(searchLower)
        )
      );
    }

    // Sort plans
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'newest':
          return new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime();
        case 'oldest':
          return new Date(a.generatedAt).getTime() - new Date(b.generatedAt).getTime();
        case 'name':
          return DietPlanService.getPlanTypeDisplayName(a.planType)
            .localeCompare(DietPlanService.getPlanTypeDisplayName(b.planType));
        default:
          return 0;
      }
    });

    return filtered;
  }, [plans, filters]);

  const updateFilters = useCallback((newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      planType: '',
      searchTerm: '',
      sortBy: 'newest',
    });
  }, []);

  return {
    filters,
    filteredPlans: filteredPlans(),
    updateFilters,
    clearFilters,
  };
}