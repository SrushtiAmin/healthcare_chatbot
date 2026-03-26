import { Request, Response } from 'express';
import { FileService } from './file.service';
import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    },
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'application/pdf',
            'image/jpeg',
            'image/png',
            'image/webp',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
            'text/csv',
            'text/plain',
            'text/markdown'
        ];
        if (allowedTypes.includes(file.mimetype) || file.originalname.match(/\.(docx|doc|pptx|ppt|xlsx|xls|csv|txt|md)$/i)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Supported: PDF, Images, Word, PPT, Excel, CSV, and Text.'));
        }
    }
});

const fileService = FileService.getInstance();

export const fileController = {
    uploadMiddleware: upload.single('file'),

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
