import fs from 'fs/promises';
import path from 'path';
const pdf = require('pdf-parse');
import Tesseract from 'tesseract.js';
import { RagService } from '../chat/rag.service';
import { GuardrailService } from '../chat/guardrail';
import prisma from '../../lib/prisma';

export class FileService {
    private static instance: FileService;
    private ragService: RagService;

    private constructor() {
        this.ragService = RagService.getInstance();
    }

    public static getInstance(): FileService {
        if (!FileService.instance) {
            FileService.instance = new FileService();
        }
        return FileService.instance;
    }

    public async upload(file: Express.Multer.File, userId: string, sessionId?: string) {
        // 1. Extract content first
        let type: 'pdf' | 'image' = file.mimetype.includes('pdf') ? 'pdf' : 'image';

        let text = '';
        try {
            text = await this.extractText(file.path, type);
        } catch (error: any) {
            await fs.unlink(file.path).catch(console.error);
            throw new Error(`Extraction failed: ${error.message}`);
        }

        if (!text || text.trim().length < 20) {
            await fs.unlink(file.path).catch(console.error);
            throw new Error("Rejection: The uploaded file appears to be empty or contains no extractable text.");
        }

        // 2. Check for Medical Relevance
        const relevanceCheck = await GuardrailService.checkMessage(text.substring(0, 2000));
        if (!relevanceCheck.isAllowed) {
            await fs.unlink(file.path).catch(console.error);
            throw new Error(`Rejection: The uploaded document does not appear to be healthcare-related. ${relevanceCheck.reason || ""}`);
        }

        // 3. Save file model to DB verified
        const newFile = await (prisma as any).file.create({
            data: {
                name: file.originalname,
                url: `/uploads/${file.filename}`,
                type,
                userId,
                sessionId,
            },
        });

        // 4. Chunk and Embed
        const chunks = this.chunkText(text);
        await this.ragService.addChunks(chunks, newFile.id, userId);

        return newFile;
    }

    private async extractText(filePath: string, type: string): Promise<string> {
        const absolutePath = path.resolve(filePath);
        if (type === 'pdf') {
            const dataBuffer = await fs.readFile(absolutePath);
            const data = await pdf(dataBuffer);
            return data.text;
        } else {
            // Image processing with Tesseract
            const { data: { text } } = await Tesseract.recognize(absolutePath, 'eng');
            return text;
        }
    }

    private chunkText(text: string, size: number = 1000, overlap: number = 200): string[] {
        const chunks: string[] = [];
        let start = 0;
        while (start < text.length) {
            let end = start + size;
            if (end < text.length) {
                const lastSpace = text.lastIndexOf(' ', end);
                if (lastSpace > start) {
                    end = lastSpace;
                }
            }
            chunks.push(text.substring(start, end).trim());
            start = end - overlap;
            if (start < 0) start = 0;
            if (end >= text.length) break;
        }
        return chunks.filter(c => c.length > 50);
    }

    public async getFiles(userId: string) {
        return (prisma as any).file.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }

    public async getFilesBySession(sessionId: string, userId: string) {
        return (prisma as any).file.findMany({
            where: { sessionId, userId },
            orderBy: { createdAt: 'desc' },
        });
    }
}
