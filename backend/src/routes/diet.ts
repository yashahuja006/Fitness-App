import { Router } from 'express';
import { DietController } from '../controllers/DietController';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const dietController = new DietController();

// All diet routes require authentication
router.use(authenticateToken);

// Diet plan management
router.get('/plans', dietController.getUserDietPlans);
router.post('/plans/generate', dietController.generateDietPlan);
router.get('/plans/:planId', dietController.getDietPlan);
router.put('/plans/:planId', dietController.updateDietPlan);
router.delete('/plans/:planId', dietController.deleteDietPlan);

// Meal management
router.get('/plans/:planId/meals', dietController.getPlanMeals);
router.put('/plans/:planId/meals/:day', dietController.updateDayMeals);
router.post('/plans/:planId/meals/:day/substitute', dietController.substituteMeal);

// Nutrition tracking
router.post('/log', dietController.logFood);
router.get('/log', dietController.getFoodLog);
router.get('/nutrition/summary', dietController.getNutritionSummary);

// Recipe and meal suggestions
router.get('/recipes/search', dietController.searchRecipes);
router.get('/recipes/:recipeId', dietController.getRecipe);
router.post('/recipes/:recipeId/favorite', dietController.addRecipeToFavorites);
router.get('/recipes/favorites', dietController.getFavoriteRecipes);

export { router as dietRoutes };