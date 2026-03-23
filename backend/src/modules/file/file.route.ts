import express from 'express';
import { fileController } from './file.controller';
import { authenticateToken } from '../auth/auth.middleware';

const router = express.Router();

router.post('/upload', authenticateToken as any, fileController.uploadMiddleware, fileController.uploadFile);
router.get('/', authenticateToken as any, fileController.getFiles);

export default router;
