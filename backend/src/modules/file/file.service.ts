import fs from 'fs/promises';
import path from 'path';
const pdf = require('pdf-parse');
import Tesseract from 'tesseract.js';
import mammoth from 'mammoth';
const officeParser = require('officeparser');
import Papa from 'papaparse';
import { RagService } from '../chat/rag.service';
import { GuardrailService } from '../chat/guardrail.service';
import prisma from '../../lib/prisma';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

import { FILE_ERROR_MESSAGES, EXTENSION_TO_TYPE, SUPPORTED_FILE_TYPES, MIMETYPE_TO_TYPE } from './file.constants';

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
        // 1. Detect File Type and Ext
        const ext = path.extname(file.originalname).toLowerCase();
        let type = this.getFileType(file.mimetype, ext);

        let text = '';
        try {
            text = await this.extractText(file.path, type);
        } catch (error: any) {
            await fs.unlink(file.path).catch(console.error);
            throw new Error(`${FILE_ERROR_MESSAGES.EXTRACTION_FAILED}: ${error.message}`);
        }

        if (!text || text.trim().length < 20) {
            await fs.unlink(file.path).catch(console.error);
            throw new Error(FILE_ERROR_MESSAGES.FILE_EMPTY);
        }

        // 2. Check for Medical Relevance
        console.log(`[FileService] Checking medical relevance for type: ${type}`);
        const snippet = text.substring(0, 100).replace(/\n/g, ' ');
        console.log(`[FileService] Extracted text snippet: "${snippet}..."`);

        const relevanceCheck = await GuardrailService.checkMessage(text.substring(0, 2000));
        console.log(`[FileService] Relevance Check Result:`, relevanceCheck);

        if (!relevanceCheck.isAllowed) {
            await fs.unlink(file.path).catch(console.error);
            console.warn(`[FileService] File rejected: ${relevanceCheck.reason}`);
            throw new Error(`${FILE_ERROR_MESSAGES.FILE_NOT_HEALTH_RELATED} ${relevanceCheck.reason || ""}`);
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

        // 4. Chunk and Embed using LangChain's RecursiveCharacterTextSplitter
        const chunks = await this.chunkText(text);
        await this.ragService.addChunks(chunks, newFile.id, userId);

        return newFile;
    }

    private getFileType(mimetype: string, ext: string): string {
        return MIMETYPE_TO_TYPE[mimetype] || EXTENSION_TO_TYPE[ext] || SUPPORTED_FILE_TYPES.OTHER;
    }

    private extractionHandlers: Record<string, (path: string) => Promise<string>> = {
        [SUPPORTED_FILE_TYPES.PDF]: async (path) => {
            const buffer = await fs.readFile(path);
            const data = await pdf(buffer);
            return data.text;
        },
        [SUPPORTED_FILE_TYPES.WORD]: async (path) => {
            const result = await mammoth.extractRawText({ path });
            return result.value;
        },
        [SUPPORTED_FILE_TYPES.POWERPOINT]: async (path) => this.parseOfficeFile(path),
        [SUPPORTED_FILE_TYPES.EXCEL]: async (path) => this.parseOfficeFile(path),
        [SUPPORTED_FILE_TYPES.CSV]: async (path) => {
            const data = await fs.readFile(path, 'utf8');
            return JSON.stringify(Papa.parse(data, { header: true }).data, null, 2);
        },
        [SUPPORTED_FILE_TYPES.TEXT]: async (path) => fs.readFile(path, 'utf8'),
        [SUPPORTED_FILE_TYPES.IMAGE]: async (path) => {
            const { data: { text } } = await Tesseract.recognize(path, 'eng');
            return text;
        }
    };

    private async parseOfficeFile(path: string): Promise<string> {
        return new Promise((resolve, reject) => {
            officeParser.parseOffice(path, (data: any, err: any) => {
                if (err) return reject(new Error(`Office parsing failed: ${err}`));
                resolve(data);
            });
        });
    }

    private async extractText(filePath: string, type: string): Promise<string> {
        const absolutePath = path.resolve(filePath);
        const handler = this.extractionHandlers[type];

        if (handler) {
            return handler(absolutePath);
        }

        // Fallback for "other" types
        try {
            return await this.parseOfficeFile(absolutePath);
        } catch {
            return "";
        }
    }

    private async chunkText(text: string): Promise<string[]> {
        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200,
        });

        const output = await splitter.createDocuments([text]);
        return output.map(doc => doc.pageContent);
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

