import fs from 'fs/promises';
import path from 'path';
const pdf = require('pdf-parse');
import Tesseract from 'tesseract.js';
import mammoth from 'mammoth';
const officeParser = require('officeparser');
import Papa from 'papaparse';
import { RagService } from '../chat/rag.service';
import { GuardrailService } from '../chat/guardrail';
import prisma from '../../lib/prisma';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

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

        // 4. Chunk and Embed using LangChain's RecursiveCharacterTextSplitter
        const chunks = await this.chunkText(text);
        await this.ragService.addChunks(chunks, newFile.id, userId);

        return newFile;
    }

    private getFileType(mimetype: string, ext: string): string {
        if (mimetype.includes('pdf')) return 'pdf';
        if (mimetype.includes('image')) return 'image';
        if (ext === '.docx' || ext === '.doc') return 'word';
        if (ext === '.pptx' || ext === '.ppt') return 'powerpoint';
        if (ext === '.xlsx' || ext === '.xls') return 'excel';
        if (ext === '.csv') return 'csv';
        if (ext === '.txt' || ext === '.md') return 'text';
        return 'other';
    }

    private async extractText(filePath: string, type: string): Promise<string> {
        const absolutePath = path.resolve(filePath);

        switch (type) {
            case 'pdf':
                const dataBuffer = await fs.readFile(absolutePath);
                const data = await pdf(dataBuffer);
                return data.text;

            case 'word':
                const wordResult = await mammoth.extractRawText({ path: absolutePath });
                return wordResult.value;

            case 'powerpoint':
            case 'excel':
                return new Promise((resolve, reject) => {
                    officeParser.parseOffice(absolutePath, (data: any, err: any) => {
                        if (err) return reject(new Error(`Office parsing failed: ${err}`));
                        resolve(data);
                    });
                });

            case 'csv':
                const csvData = await fs.readFile(absolutePath, 'utf8');
                const parsedCsv = Papa.parse(csvData, { header: true });
                return JSON.stringify(parsedCsv.data, null, 2);

            case 'text':
                return await fs.readFile(absolutePath, 'utf8');

            case 'image':
                const { data: { text } } = await Tesseract.recognize(absolutePath, 'eng');
                return text;

            default:
                // try office parser as last resort for "other" types
                try {
                    return await new Promise((resolve, reject) => {
                        officeParser.parseOffice(absolutePath, (data: any, err: any) => {
                            if (err) return reject(err);
                            resolve(data);
                        });
                    });
                } catch (e) {
                    return ""; // fallback to empty instead of crashing
                }
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

