import { Request, Response, NextFunction } from 'express';
import { createError, asyncHandler } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';
import { ApiResponse } from '../types';
import { DietPlanService, DietPlanGenerationRequest } from '../services/DietPlanService';

export class DietController {
  private dietPlanService: DietPlanService;

  constructor() {
    this.dietPlanService = new DietPlanService();
  }

  getUserDietPlans = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.uid;
    
    try {
      const plans = await this.dietPlanService.getUserDietPlans(userId);
      res.status(200).json({ 
        success: true, 
        data: { plans },
        message: `Retrieved ${plans.length} diet plans`
      });
    } catch (error) {
      next(createError(500, `Failed to retrieve diet plans: ${error}`));
    }
  });

  generateDietPlan = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.uid;
    const { personalMetrics, planType, duration, restrictions, preferences } = req.body;

    // Validate required fields
    if (!personalMetrics || !planType) {
      return next(createError(400, 'Personal metrics and plan type are required'));
    }

    if (!['weight_loss', 'muscle_gain', 'maintenance', 'endurance'].includes(planType)) {
      return next(createError(400, 'Invalid plan type'));
    }

    try {
      const request: DietPlanGenerationRequest = {
        userId,
        personalMetrics,
        planType,
        duration: duration || 7, // Default to 7 days
        restrictions: restrictions || [],
        preferences
      };

      const dietPlan = await this.dietPlanService.generateDietPlan(request);
      await this.dietPlanService.saveDietPlan(dietPlan);

      res.status(201).json({ 
        success: true, 
        data: { plan: dietPlan },
        message: 'Diet plan generated successfully'
      });
    } catch (error) {
      next(createError(500, `Failed to generate diet plan: ${error}`));
    }
  });

  getDietPlan = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.uid;
    const { planId } = req.params;

    if (!planId) {
      return next(createError(400, 'Plan ID is required'));
    }

    try {
      const plan = await this.dietPlanService.getDietPlan(planId, userId);
      
      if (!plan) {
        return next(createError(404, 'Diet plan not found'));
      }

      res.status(200).json({ 
        success: true, 
        data: { plan },
        message: 'Diet plan retrieved successfully'
      });
    } catch (error) {
      next(createError(500, `Failed to retrieve diet plan: ${error}`));
    }
  });

  updateDietPlan = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.uid;
    const { planId } = req.params;
    const updates = req.body;

    if (!planId) {
      return next(createError(400, 'Plan ID is required'));
    }

    try {
      const updatedPlan = await this.dietPlanService.updateDietPlan(planId, userId, updates);
      
      res.status(200).json({ 
        success: true, 
        data: { plan: updatedPlan },
        message: 'Diet plan updated successfully'
      });
    } catch (error) {
      next(createError(500, `Failed to update diet plan: ${error}`));
    }
  });

  deleteDietPlan = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.uid;
    const { planId } = req.params;

    if (!planId) {
      return next(createError(400, 'Plan ID is required'));
    }

    try {
      await this.dietPlanService.deleteDietPlan(planId, userId);
      
      res.status(200).json({ 
        success: true, 
        message: 'Diet plan deleted successfully'
      });
    } catch (error) {
      next(createError(500, `Failed to delete diet plan: ${error}`));
    }
  });

  getPlanMeals = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.uid;
    const { planId } = req.params;

    if (!planId) {
      return next(createError(400, 'Plan ID is required'));
    }

    try {
      const plan = await this.dietPlanService.getDietPlan(planId, userId);
      
      if (!plan) {
        return next(createError(404, 'Diet plan not found'));
      }

      res.status(200).json({ 
        success: true, 
        data: { meals: plan.meals },
        message: 'Plan meals retrieved successfully'
      });
    } catch (error) {
      next(createError(500, `Failed to retrieve plan meals: ${error}`));
    }
  });

  updateDayMeals = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.uid;
    const { planId, day } = req.params;
    const { meals } = req.body;

    if (!planId || !day) {
      return next(createError(400, 'Plan ID and day are required'));
    }

    const dayNumber = parseInt(day);
    if (isNaN(dayNumber) || dayNumber < 1) {
      return next(createError(400, 'Invalid day number'));
    }

    try {
      const plan = await this.dietPlanService.getDietPlan(planId, userId);
      
      if (!plan) {
        return next(createError(404, 'Diet plan not found'));
      }

      // Update the specific day's meals
      const updatedMeals = plan.meals.map(dailyPlan => 
        dailyPlan.day === dayNumber 
          ? { ...dailyPlan, meals, lastModified: new Date() }
          : dailyPlan
      );

      const updatedPlan = await this.dietPlanService.updateDietPlan(planId, userId, { 
        meals: updatedMeals 
      });

      res.status(200).json({ 
        success: true, 
        data: { plan: updatedPlan },
        message: 'Day meals updated successfully'
      });
    } catch (error) {
      next(createError(500, `Failed to update day meals: ${error}`));
    }
  });

  substituteMeal = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.uid;
    const { planId, day } = req.params;
    const { mealType, newMeal } = req.body;

    if (!planId || !day || !mealType || !newMeal) {
      return next(createError(400, 'Plan ID, day, meal type, and new meal are required'));
    }

    const dayNumber = parseInt(day);
    if (isNaN(dayNumber) || dayNumber < 1) {
      return next(createError(400, 'Invalid day number'));
    }

    if (!['breakfast', 'lunch', 'dinner', 'snacks'].includes(mealType)) {
      return next(createError(400, 'Invalid meal type'));
    }

    try {
      const plan = await this.dietPlanService.getDietPlan(planId, userId);
      
      if (!plan) {
        return next(createError(404, 'Diet plan not found'));
      }

      // Update the specific meal
      const updatedMeals = plan.meals.map(dailyPlan => {
        if (dailyPlan.day === dayNumber) {
          const updatedDayPlan = { ...dailyPlan };
          if (mealType === 'snacks') {
            updatedDayPlan.meals.snacks = [newMeal];
          } else {
            updatedDayPlan.meals[mealType as 'breakfast' | 'lunch' | 'dinner'] = newMeal;
          }
          return updatedDayPlan;
        }
        return dailyPlan;
      });

      const updatedPlan = await this.dietPlanService.updateDietPlan(planId, userId, { 
        meals: updatedMeals 
      });

      res.status(200).json({ 
        success: true, 
        data: { plan: updatedPlan },
        message: 'Meal substituted successfully'
      });
    } catch (error) {
      next(createError(500, `Failed to substitute meal: ${error}`));
    }
  });

  logFood = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Food logging functionality - placeholder for future implementation
    res.status(201).json({ success: true, message: 'Food logged (feature coming soon)' });
  });

  getFoodLog = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Food log retrieval - placeholder for future implementation
    res.status(200).json({ success: true, data: { log: [] }, message: 'Food log (feature coming soon)' });
  });

  getNutritionSummary = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Nutrition summary - placeholder for future implementation
    res.status(200).json({ success: true, data: { summary: {} }, message: 'Nutrition summary (feature coming soon)' });
  });

  searchRecipes = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Recipe search - placeholder for future implementation
    res.status(200).json({ success: true, data: { recipes: [] }, message: 'Recipe search (feature coming soon)' });
  });

  getRecipe = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Recipe retrieval - placeholder for future implementation
    res.status(200).json({ success: true, data: { recipe: {} }, message: 'Recipe details (feature coming soon)' });
  });

  addRecipeToFavorites = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Add to favorites - placeholder for future implementation
    res.status(200).json({ success: true, message: 'Recipe favorites (feature coming soon)' });
  });

  getFavoriteRecipes = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Get favorites - placeholder for future implementation
    res.status(200).json({ success: true, data: { recipes: [] }, message: 'Favorite recipes (feature coming soon)' });
  });
}