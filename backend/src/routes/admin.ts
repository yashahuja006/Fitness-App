import { Router } from 'express';
import { AdminController } from '../controllers/AdminController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();
const adminController = new AdminController();

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(requireRole(['admin']));

// User management
router.get('/users', adminController.getAllUsers);
router.get('/users/:userId', adminController.getUserDetails);
router.patch('/users/:userId/status', adminController.updateUserStatus);
router.delete('/users/:userId', adminController.deleteUser);
router.post('/users/:userId/reset-password', adminController.resetUserPassword);

// Content management
router.get('/exercises/pending', adminController.getPendingExercises);
router.patch('/exercises/:exerciseId/approve', adminController.approveExercise);
router.patch('/exercises/:exerciseId/reject', adminController.rejectExercise);
router.get('/content/reports', adminController.getContentReports);
router.post('/content/moderate', adminController.moderateContent);

// System analytics
router.get('/analytics/overview', adminController.getSystemOverview);
router.get('/analytics/users', adminController.getUserAnalytics);
router.get('/analytics/workouts', adminController.getWorkoutAnalytics);
router.get('/analytics/performance', adminController.getSystemPerformance);

// System health and monitoring
router.get('/health/database', adminController.getDatabaseHealth);
router.get('/health/services', adminController.getServicesHealth);
router.get('/logs/errors', adminController.getErrorLogs);
router.get('/logs/activity', adminController.getActivityLogs);

// Configuration management
router.get('/config', adminController.getSystemConfig);
router.put('/config', adminController.updateSystemConfig);
router.post('/maintenance/start', adminController.startMaintenance);
router.post('/maintenance/end', adminController.endMaintenance);

// Backup and data management
router.post('/backup/create', adminController.createBackup);
router.get('/backup/list', adminController.listBackups);
router.post('/backup/:backupId/restore', adminController.restoreBackup);
router.delete('/backup/:backupId', adminController.deleteBackup);

export { router as adminRoutes };