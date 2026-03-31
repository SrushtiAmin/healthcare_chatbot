import { Request, Response } from 'express';
import { FileService } from './file.service';
import { fileUploadMiddleware } from './file.middleware';

const fileService = FileService.getInstance();

export const fileController = {
    uploadMiddleware: fileUploadMiddleware,

    async uploadFile(req: Request, res: Response) {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No file uploaded' });
            }

            const userId = (req as any).user?.userId || (req as any).user?.id || 'guest';
            const sessionId = req.body.sessionId;

            const file = await fileService.upload(req.file, userId, sessionId);

            res.status(201).json({
                message: 'File uploaded and processed successfully',
                file
            });
        } catch (error: any) {
            console.error('Upload Error:', error);
            res.status(400).json({ error: error.message || 'File processing failed' });
        }
    },

    async getFiles(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.userId || (req as any).user?.id || 'guest';
            const sessionId = req.query.sessionId as string;

            let files;
            if (sessionId) {
                files = await fileService.getFilesBySession(sessionId, userId);
            } else {
                files = await fileService.getFiles(userId);
            }

            res.json(files);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
};
