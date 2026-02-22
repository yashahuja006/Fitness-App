import { Router } from 'express';
import { ChatController } from '../controllers/ChatController';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const chatController = new ChatController();

// All chat routes require authentication
router.use(authenticateToken);

// Chat session management
router.get('/sessions', chatController.getChatSessions);
router.post('/sessions', chatController.createChatSession);
router.get('/sessions/:sessionId', chatController.getChatSession);
router.delete('/sessions/:sessionId', chatController.deleteChatSession);

// Message handling
router.post('/sessions/:sessionId/messages', chatController.sendMessage);
router.get('/sessions/:sessionId/messages', chatController.getMessages);

// Quick actions and suggestions
router.get('/suggestions', chatController.getSuggestions);
router.post('/quick-actions/exercise-search', chatController.quickExerciseSearch);
router.post('/quick-actions/workout-help', chatController.getWorkoutHelp);
router.post('/quick-actions/form-guidance', chatController.getFormGuidance);

// Context and preferences
router.get('/context', chatController.getChatContext);
router.put('/context', chatController.updateChatContext);

export { router as chatRoutes };