import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();
const userController = new UserController();

// All user routes require authentication
router.use(authenticateToken);

// User profile management
router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.patch('/preferences', userController.updatePreferences);
router.patch('/metrics', userController.updatePersonalMetrics);

// User search and social features
router.get('/search', userController.searchUsers);
router.get('/:userId/public-profile', userController.getPublicProfile);

// Admin only routes
router.get('/', requireRole(['admin']), userController.getAllUsers);
router.delete('/:userId', requireRole(['admin']), userController.deleteUser);
router.patch('/:userId/role', requireRole(['admin']), userController.updateUserRole);

export { router as userRoutes };