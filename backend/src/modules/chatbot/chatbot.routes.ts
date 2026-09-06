import { Router } from 'express';
import { authenticateToken } from '../../shared/auth-middleware';
import * as chatbotController from './chatbot.controller';

const router = Router();

router.use(authenticateToken);

router.post('/message', chatbotController.handleChatMessage);
router.post('/action', chatbotController.executeAction);
router.get('/insights', chatbotController.getQuickInsights);
router.get('/suggestions', chatbotController.getSuggestions);

export default router;
