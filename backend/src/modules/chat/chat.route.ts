import { Router } from 'express';
import { ChatController } from './chat.controller';
import { authenticateToken } from '../auth/auth.middleware';

const router = Router();

// POST /api/chat -> call controller
// Protect route with Auth middleware
router.post('/', authenticateToken, ChatController.handleChat);
router.get('/history', authenticateToken, ChatController.handleGetHistory);

export default router;
