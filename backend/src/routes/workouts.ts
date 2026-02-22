import { Router } from 'express';
import { WorkoutController } from '../controllers/WorkoutController';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const workoutController = new WorkoutController();

// All workout routes require authentication
router.use(authenticateToken);

// Workout session management
router.get('/', workoutController.getUserWorkouts);
router.post('/', workoutController.createWorkout);
router.get('/:workoutId', workoutController.getWorkout);
router.put('/:workoutId', workoutController.updateWorkout);
router.delete('/:workoutId', workoutController.deleteWorkout);

// Workout session actions
router.post('/:workoutId/start', workoutController.startWorkout);
router.post('/:workoutId/complete', workoutController.completeWorkout);
router.post('/:workoutId/pause', workoutController.pauseWorkout);
router.post('/:workoutId/resume', workoutController.resumeWorkout);

// Exercise performance tracking
router.post('/:workoutId/exercises/:exerciseId/sets', workoutController.recordSet);
router.post('/:workoutId/exercises/:exerciseId/feedback', workoutController.recordFormFeedback);

// Workout templates and sharing
router.get('/templates', workoutController.getWorkoutTemplates);
router.post('/templates', workoutController.createWorkoutTemplate);
router.post('/:workoutId/share', workoutController.shareWorkout);

export { router as workoutRoutes };