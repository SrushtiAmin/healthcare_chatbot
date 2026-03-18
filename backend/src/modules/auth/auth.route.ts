import { Router } from 'express';
import { AuthController } from './auth.controller';
import { authenticateToken } from './auth.middleware';

const router = Router();

// POST /api/auth/signup - Register a new user
router.post('/signup', AuthController.signup);

// POST /api/auth/login - Login user
router.post('/login', AuthController.login);

// GET /api/auth/me - Get current user (protected)
router.get('/me', authenticateToken, AuthController.getMe);

export default router;
