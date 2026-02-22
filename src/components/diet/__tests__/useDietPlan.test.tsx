/**
 * Diet Plan Hooks Unit Tests
 * 
 * Unit tests for the diet plan React hooks including state management,
 * API interactions, and form validation.
 */

import { renderHook, act } from '@testing-library/react';
import { useDietPlan, useDietPlanGeneration, useDietPlanNutrition } from '../../../hooks/useDietPlan';
import { DietPlanService } from '../../../lib/dietPlanService';
import { DietPlan } from '../../../types';

// Mock the DietPlanService
jest.mock('../../../lib/dietPlanService');
const mockDietPlanService = DietPlanService as jest.Mocked<typeof DietPlanService>;

describe('useDietPlan', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockPlan: DietPlan = {
    id: 'plan-123',
    userId: 'user-123',
    planType: 'weight_loss',
    dailyCalories: 1800,
    macronutrients: {
      protein: 135,
      carbohydrates: 180,
      fats: 60,
      fiber: 25
    },
    meals: [],
    duration: 7,
    restrictions: ['vegetarian'],
    generatedAt: new Date(),
    lastModified: new Date()
  };

  describe('generatePlan', () => {
    it('should generate a plan successfully', async () => {
      mockDietPlanService.validateGenerationRequest.mockReturnValue({
        isValid: true,
        errors: []
      });
      mockDietPlanService.generateDietPlan.mockResolvedValue(mockPlan);

      const { result } = renderHook(() => useDietPlan());

      expect(result.current.loading).toBe(false);
      expect(result.current.plans).toHaveLength(0);

      await act(async () => {
        const plan = await result.current.generatePlan({
          personalMetrics: {
            height: 170,
            weight: 70,
            age: 30,
            gender: 'male',
            activityLevel: 'moderate',
            fitnessGoals: []
          },
          planType: 'weight_loss'
        });

        expect(plan).toEqual(mockPlan);
      });

      expect(result.current.plans).toHaveLength(1);
      expect(result.current.plans[0]).toEqual(mockPlan);
      expect(result.current.currentPlan).toEqual(mockPlan);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle validation errors', async () => {
      mockDietPlanService.validateGenerationRequest.mockReturnValue({
        isValid: false,
        errors: ['Height must be between 100-250 cm']
      });

      const { result } = renderHook(() => useDietPlan());

      await act(async () => {
        try {
          await result.current.generatePlan({
            personalMetrics: {
              height: 50, // Invalid height
              weight: 70,
              age: 30,
              gender: 'male',
              activityLevel: 'moderate',
              fitnessGoals: []
            },
            planType: 'weight_loss'
          });
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
        }
      });

      expect(result.current.error).toBe('Height must be between 100-250 cm');
      expect(result.current.loading).toBe(false);
    });

    it('should handle API errors', async () => {
      mockDietPlanService.validateGenerationRequest.mockReturnValue({
        isValid: true,
        errors: []
      });
      mockDietPlanService.generateDietPlan.mockRejectedValue(new Error('API Error'));

      const { result } = renderHook(() => useDietPlan());

      await act(async () => {
        try {
          await result.current.generatePlan({
            personalMetrics: {
              height: 170,
              weight: 70,
              age: 30,
              gender: 'male',
              activityLevel: 'moderate',
              fitnessGoals: []
            },
            planType: 'weight_loss'
          });
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
        }
      });

      expect(result.current.error).toBe('API Error');
      expect(result.current.loading).toBe(false);
    });
  });

  describe('loadUserPlans', () => {
    it('should load user plans successfully', async () => {
      const mockPlans = [mockPlan];
      mockDietPlanService.getUserDietPlans.mockResolvedValue(mockPlans);

      const { result } = renderHook(() => useDietPlan());

      await act(async () => {
        await result.current.loadUserPlans();
      });

      expect(result.current.plans).toEqual(mockPlans);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle load errors', async () => {
      mockDietPlanService.getUserDietPlans.mockRejectedValue(new Error('Load failed'));

      const { result } = renderHook(() => useDietPlan());

      await act(async () => {
        await result.current.loadUserPlans();
      });

      expect(result.current.error).toBe('Load failed');
      expect(result.current.loading).toBe(false);
    });
  });

  describe('deletePlan', () => {
    it('should delete a plan successfully', async () => {
      mockDietPlanService.deleteDietPlan.mockResolvedValue();

      const { result } = renderHook(() => useDietPlan());

      // Set initial state with a plan
      act(() => {
        result.current.setCurrentPlan(mockPlan);
      });

      await act(async () => {
        await result.current.deletePlan('plan-123');
      });

      expect(mockDietPlanService.deleteDietPlan).toHaveBeenCalledWith('plan-123');
      expect(result.current.currentPlan).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });
});

describe('useDietPlanGeneration', () => {
  it('should initialize with default form data', () => {
    const { result } = renderHook(() => useDietPlanGeneration());

    expect(result.current.formData.personalMetrics.height).toBe(170);
    expect(result.current.formData.personalMetrics.weight).toBe(70);
    expect(result.current.formData.planType).toBe('maintenance');
    expect(result.current.formData.duration).toBe(7);
    expect(result.current.validationErrors).toHaveLength(0);
  });

  it('should update form data correctly', () => {
    const { result } = renderHook(() => useDietPlanGeneration());

    act(() => {
      result.current.updateFormData({
        planType: 'weight_loss',
        personalMetrics: {
          height: 180
        }
      });
    });

    expect(result.current.formData.planType).toBe('weight_loss');
    expect(result.current.formData.personalMetrics.height).toBe(180);
    // Other fields should remain unchanged
    expect(result.current.formData.personalMetrics.weight).toBe(70);
  });

  it('should validate form correctly', () => {
    mockDietPlanService.validateGenerationRequest.mockReturnValue({
      isValid: false,
      errors: ['Height must be between 100-250 cm']
    });

    const { result } = renderHook(() => useDietPlanGeneration());

    act(() => {
      const isValid = result.current.validateForm();
      expect(isValid).toBe(false);
    });

    expect(result.current.validationErrors).toContain('Height must be between 100-250 cm');
    expect(result.current.isValid).toBe(false);
  });

  it('should reset form to defaults', () => {
    const { result } = renderHook(() => useDietPlanGeneration());

    // Modify form data
    act(() => {
      result.current.updateFormData({
        planType: 'muscle_gain',
        personalMetrics: { height: 200 }
      });
    });

    // Reset form
    act(() => {
      result.current.resetForm();
    });

    expect(result.current.formData.planType).toBe('maintenance');
    expect(result.current.formData.personalMetrics.height).toBe(170);
    expect(result.current.validationErrors).toHaveLength(0);
  });
});

describe('useDietPlanNutrition', () => {
  const mockPlan: DietPlan = {
    id: 'plan-123',
    userId: 'user-123',
    planType: 'maintenance',
    dailyCalories: 2000,
    macronutrients: { protein: 150, carbohydrates: 250, fats: 67, fiber: 30 },
    meals: [
      {
        day: 1,
        meals: {
          breakfast: {
            id: 'meal-1',
            name: 'Breakfast',
            ingredients: [],
            instructions: [],
            prepTime: 10,
            calories: 400,
            macros: { protein: 20, carbohydrates: 50, fats: 15, fiber: 5 }
          },
          lunch: {
            id: 'meal-2',
            name: 'Lunch',
            ingredients: [],
            instructions: [],
            prepTime: 20,
            calories: 600,
            macros: { protein: 30, carbohydrates: 70, fats: 20, fiber: 8 }
          },
          dinner: {
            id: 'meal-3',
            name: 'Dinner',
            ingredients: [],
            instructions: [],
            prepTime: 30,
            calories: 700,
            macros: { protein: 35, carbohydrates: 80, fats: 25, fiber: 10 }
          },
          snacks: []
        },
        totalCalories: 1700,
        macroBreakdown: { protein: 85, carbohydrates: 200, fats: 60, fiber: 23 }
      }
    ],
    duration: 1,
    restrictions: [],
    generatedAt: new Date(),
    lastModified: new Date()
  };

  it('should calculate nutrition summary when plan is provided', () => {
    mockDietPlanService.calculateNutritionSummary.mockReturnValue({
      averageDailyCalories: 1700,
      averageMacros: { protein: 85, carbohydrates: 200, fats: 60, fiber: 23 },
      macroPercentages: { protein: 20, carbohydrates: 48, fats: 32 }
    });

    const { result } = renderHook(() => useDietPlanNutrition(mockPlan));

    expect(result.current.nutritionSummary).toEqual({
      averageDailyCalories: 1700,
      averageMacros: { protein: 85, carbohydrates: 200, fats: 60, fiber: 23 },
      macroPercentages: { protein: 20, carbohydrates: 48, fats: 32 }
    });
  });

  it('should return null when no plan is provided', () => {
    const { result } = renderHook(() => useDietPlanNutrition(null));

    expect(result.current.nutritionSummary).toBeNull();
  });

  it('should format meal for display', () => {
    mockDietPlanService.formatMealForDisplay.mockReturnValue({
      name: 'Test Meal',
      calories: '300 cal',
      macros: 'P: 25g | C: 30g | F: 10g',
      prepTime: '15 min',
      ingredientCount: 2
    });

    const { result } = renderHook(() => useDietPlanNutrition(mockPlan));

    const meal = mockPlan.meals[0].meals.breakfast;
    const formatted = result.current.getMealNutrition(meal);

    expect(formatted.name).toBe('Test Meal');
    expect(formatted.calories).toBe('300 cal');
  });

  it('should calculate day nutrition correctly', () => {
    const { result } = renderHook(() => useDietPlanNutrition(mockPlan));

    const dayPlan = mockPlan.meals[0];
    const dayNutrition = result.current.getDayNutrition(dayPlan);

    expect(dayNutrition.totalCalories).toBe(1700);
    expect(dayNutrition.macros).toEqual({ protein: 85, carbohydrates: 200, fats: 60, fiber: 23 });
    expect(dayNutrition.mealCount).toBe(3); // breakfast, lunch, dinner (no snacks)
    
    // Check percentage calculations
    expect(dayNutrition.proteinPercentage).toBe(Math.round((85 * 4 / 1700) * 100));
    expect(dayNutrition.carbPercentage).toBe(Math.round((200 * 4 / 1700) * 100));
    expect(dayNutrition.fatPercentage).toBe(Math.round((60 * 9 / 1700) * 100));
  });
});