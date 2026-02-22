import { Router } from 'express';
import { ProgressController } from '../controllers/ProgressController';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const progressController = new ProgressController();

// All progress routes require authentication
router.use(authenticateToken);

// Progress tracking
router.get('/', progressController.getProgressOverview);
router.post('/metrics', progressController.recordMetrics);
router.get('/metrics', progressController.getMetricsHistory);
router.put('/metrics/:metricId', progressController.updateMetrics);
router.delete('/metrics/:metricId', progressController.deleteMetrics);

// Goal management
router.get('/goals', progressController.getGoals);
router.post('/goals', progressController.createGoal);
router.put('/goals/:goalId', progressController.updateGoal);
router.delete('/goals/:goalId', progressController.deleteGoal);
router.post('/goals/:goalId/complete', progressController.completeGoal);

// Analytics and insights
router.get('/analytics/workout-frequency', progressController.getWorkoutFrequencyAnalytics);
router.get('/analytics/performance-trends', progressController.getPerformanceTrends);
router.get('/analytics/goal-progress', progressController.getGoalProgressAnalytics);
router.get('/analytics/body-composition', progressController.getBodyCompositionTrends);

// Reports and exports
router.get('/reports/summary', progressController.getProgressSummaryReport);
router.get('/reports/detailed', progressController.getDetailedProgressReport);
router.post('/reports/export', progressController.exportProgressData);

// Achievements and milestones
router.get('/achievements', progressController.getAchievements);
router.get('/milestones', progressController.getMilestones);

export { router as progressRoutes };