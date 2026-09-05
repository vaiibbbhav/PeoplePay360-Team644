import { Router } from 'express';
import * as authController from './auth.controller';
import { authenticateToken } from '../../shared/auth-middleware';

const router = Router();

router.post('/login', authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.get('/me', authenticateToken, authController.me);
router.post('/verify-email', authController.verifyEmail);
router.get('/verify-email', authController.verifyEmail);

export default router;
