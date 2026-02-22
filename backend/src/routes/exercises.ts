import { Router } from 'express';
import { ExerciseController } from '../controllers/ExerciseController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();
const exerciseController = new ExerciseController();

// Public routes (no authentication required)
router.get('/', exerciseController.searchExercises);
router.get('/:exerciseId', exerciseController.getExercise);
router.get('/categories', exerciseController.getCategories);
router.get('/muscle-groups', exerciseController.getMuscleGroups);
router.get('/equipment', exerciseController.getEquipmentTypes);

// Protected routes
router.use(authenticateToken);

// User-specific exercise features
router.get('/:exerciseId/recommendations', exerciseController.getRecommendations);
router.post('/:exerciseId/favorite', exerciseController.addToFavorites);
router.delete('/:exerciseId/favorite', exerciseController.removeFromFavorites);
router.get('/favorites', exerciseController.getUserFavorites);

// Exercise feedback and ratings
router.post('/:exerciseId/rating', exerciseController.rateExercise);
router.get('/:exerciseId/ratings', exerciseController.getExerciseRatings);

// Admin and instructor routes
router.post('/', requireRole(['admin', 'instructor']), exerciseController.createExercise);
router.put('/:exerciseId', requireRole(['admin', 'instructor']), exerciseController.updateExercise);
router.delete('/:exerciseId', requireRole(['admin']), exerciseController.deleteExercise);
router.patch('/:exerciseId/verify', requireRole(['admin']), exerciseController.verifyExercise);

export { router as exerciseRoutes };