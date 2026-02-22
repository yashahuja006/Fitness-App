/**
 * Diet Plan Service Unit Tests
 * 
 * Unit tests for the diet plan service functionality including
 * API interactions, data validation, and utility functions.
 */

import { DietPlanService, DietPlanGenerationRequest } from '../../../lib/dietPlanService';
import { DietPlan, PersonalMetrics } from '../../../types';

// Mock fetch globally
global.fetch = jest.fn();

describe('DietPlanService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(() => 'mock-token'),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true,
    });
  });

  describe('generateDietPlan', () => {
    const mockRequest: DietPlanGenerationRequest = {
      personalMetrics: {
        height: 170,
        weight: 70,
        age: 30,
        gender: 'male',
        activityLevel: 'moderate',
        fitnessGoals: ['weight_loss']
      },
      planType: 'weight_loss',
      duration: 7,
      restrictions: ['vegetarian'],
      preferences: {
        mealsPerDay: 3,
        snacksPerDay: 1,
        cookingTime: 'moderate'
      }
    };

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

    it('should generate a diet plan successfully', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { plan: mockPlan }
        })
      });

      const result = await DietPlanService.generateDietPlan(mockRequest);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/diet/plans/generate'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token'
          }),
          body: JSON.stringify(mockRequest)
        })
      );

      expect(result).toEqual(mockPlan);
    });

    it('should throw error when API request fails', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          error: { message: 'Invalid request' }
        })
      });

      await expect(DietPlanService.generateDietPlan(mockRequest))
        .rejects.toThrow('Invalid request');
    });

    it('should throw error when response is missing plan data', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {}
        })
      });

      await expect(DietPlanService.generateDietPlan(mockRequest))
        .rejects.toThrow('Failed to generate diet plan');
    });
  });

  describe('getUserDietPlans', () => {
    it('should retrieve user diet plans successfully', async () => {
      const mockPlans: DietPlan[] = [
        {
          id: 'plan-1',
          userId: 'user-123',
          planType: 'weight_loss',
          dailyCalories: 1800,
          macronutrients: { protein: 135, carbohydrates: 180, fats: 60, fiber: 25 },
          meals: [],
          duration: 7,
          restrictions: [],
          generatedAt: new Date(),
          lastModified: new Date()
        }
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { plans: mockPlans }
        })
      });

      const result = await DietPlanService.getUserDietPlans();

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/diet/plans'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token'
          })
        })
      );

      expect(result).toEqual(mockPlans);
    });
  });

  describe('validateGenerationRequest', () => {
    const validRequest: DietPlanGenerationRequest = {
      personalMetrics: {
        height: 170,
        weight: 70,
        age: 30,
        gender: 'male',
        activityLevel: 'moderate',
        fitnessGoals: []
      },
      planType: 'maintenance'
    };

    it('should validate a correct request', () => {
      const result = DietPlanService.validateGenerationRequest(validRequest);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject request with invalid height', () => {
      const invalidRequest = {
        ...validRequest,
        personalMetrics: {
          ...validRequest.personalMetrics,
          height: 50 // Too low
        }
      };

      const result = DietPlanService.validateGenerationRequest(invalidRequest);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Height must be between 100-250 cm');
    });

    it('should reject request with invalid weight', () => {
      const invalidRequest = {
        ...validRequest,
        personalMetrics: {
          ...validRequest.personalMetrics,
          weight: 400 // Too high
        }
      };

      const result = DietPlanService.validateGenerationRequest(invalidRequest);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Weight must be between 30-300 kg');
    });

    it('should reject request with invalid age', () => {
      const invalidRequest = {
        ...validRequest,
        personalMetrics: {
          ...validRequest.personalMetrics,
          age: 10 // Too young
        }
      };

      const result = DietPlanService.validateGenerationRequest(invalidRequest);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Age must be between 13-120 years');
    });

    it('should reject request with invalid plan type', () => {
      const invalidRequest = {
        ...validRequest,
        planType: 'invalid_type' as any
      };

      const result = DietPlanService.validateGenerationRequest(invalidRequest);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid plan type');
    });

    it('should reject request with invalid duration', () => {
      const invalidRequest = {
        ...validRequest,
        duration: 500 // Too long
      };

      const result = DietPlanService.validateGenerationRequest(invalidRequest);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Duration must be between 1-365 days');
    });
  });

  describe('calculateNutritionSummary', () => {
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

    it('should calculate nutrition summary correctly', () => {
      const result = DietPlanService.calculateNutritionSummary(mockPlan);

      expect(result.averageDailyCalories).toBe(1700);
      expect(result.averageMacros.protein).toBe(85);
      expect(result.averageMacros.carbohydrates).toBe(200);
      expect(result.averageMacros.fats).toBe(60);
      expect(result.averageMacros.fiber).toBe(23);

      // Check macro percentages (protein: 4 cal/g, carbs: 4 cal/g, fats: 9 cal/g)
      const totalMacroCalories = (85 * 4) + (200 * 4) + (60 * 9); // 340 + 800 + 540 = 1680
      expect(result.macroPercentages.protein).toBe(Math.round((340 / 1680) * 100)); // ~20%
      expect(result.macroPercentages.carbohydrates).toBe(Math.round((800 / 1680) * 100)); // ~48%
      expect(result.macroPercentages.fats).toBe(Math.round((540 / 1680) * 100)); // ~32%
    });

    it('should handle empty meal plan', () => {
      const emptyPlan = { ...mockPlan, meals: [] };
      const result = DietPlanService.calculateNutritionSummary(emptyPlan);

      expect(result.averageDailyCalories).toBe(0);
      expect(result.averageMacros.protein).toBe(0);
      expect(result.macroPercentages.protein).toBe(0);
    });
  });

  describe('utility functions', () => {
    it('should format meal for display correctly', () => {
      const meal = {
        id: 'meal-1',
        name: 'Test Meal',
        ingredients: [
          { name: 'Ingredient 1', amount: 100, unit: 'g', calories: 50, macros: { protein: 5, carbohydrates: 10, fats: 2, fiber: 1 } },
          { name: 'Ingredient 2', amount: 50, unit: 'g', calories: 30, macros: { protein: 3, carbohydrates: 5, fats: 1, fiber: 0.5 } }
        ],
        instructions: ['Step 1', 'Step 2'],
        prepTime: 15,
        calories: 300,
        macros: { protein: 25, carbohydrates: 30, fats: 10, fiber: 5 }
      };

      const result = DietPlanService.formatMealForDisplay(meal);

      expect(result.name).toBe('Test Meal');
      expect(result.calories).toBe('300 cal');
      expect(result.macros).toBe('P: 25g | C: 30g | F: 10g');
      expect(result.prepTime).toBe('15 min');
      expect(result.ingredientCount).toBe(2);
    });

    it('should get correct plan type display names', () => {
      expect(DietPlanService.getPlanTypeDisplayName('weight_loss')).toBe('Weight Loss');
      expect(DietPlanService.getPlanTypeDisplayName('muscle_gain')).toBe('Muscle Gain');
      expect(DietPlanService.getPlanTypeDisplayName('maintenance')).toBe('Maintenance');
      expect(DietPlanService.getPlanTypeDisplayName('endurance')).toBe('Endurance');
    });

    it('should get correct dietary restriction display names', () => {
      expect(DietPlanService.getDietaryRestrictionDisplayName('vegetarian')).toBe('Vegetarian');
      expect(DietPlanService.getDietaryRestrictionDisplayName('gluten-free')).toBe('Gluten-Free');
      expect(DietPlanService.getDietaryRestrictionDisplayName('dairy-free')).toBe('Dairy-Free');
    });
  });
});