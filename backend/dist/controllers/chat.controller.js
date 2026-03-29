"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatController = void 0;
const chat_schema_1 = require("../schemas/chat.schema");
const chat_service_1 = require("../services/chat.service");
const errors_utils_1 = require("../utils/errors.utils");
class ChatController {
    static async handleChat(req, res) {
        try {
            const user = req.user;
            if (!user) {
                res.status(401).json({ success: false, message: 'User authentication context is missing.' });
                return;
            }
            const parseResult = chat_schema_1.chatRequestSchema.safeParse(req.body);
            if (!parseResult.success) {
                (0, errors_utils_1.handleApiError)(parseResult.error, res, 'ChatController.handleChat');
                return;
            }
            const validatedData = parseResult.data;
            const { message, provider, model, sessionId } = validatedData;
            const chatRequest = {
                userId: user.id,
                message,
                provider: provider || 'groq',
                model: model || 'llama-3.3-70b-versatile',
                sessionId: sessionId || 'legacy_session'
            };
            const chatResponse = await chat_service_1.ChatService.processChat(chatRequest);
            // Handle guardrail blocking
            if (chatResponse.type === 'blocked') {
                res.status(403).json({
                    success: false,
                    message: chatResponse.responseText,
                    reason: chatResponse.reason
                });
                return;
            }
            // 5. Return JSON response
            res.status(200).json({
                success: true,
                data: chatResponse,
            });
        }
        catch (error) {
            (0, errors_utils_1.handleApiError)(error, res, 'ChatController.handleChat');
        }
    }
    static async handleGetHistory(req, res) {
        try {
            const user = req.user;
            if (!user) {
                res.status(401).json({ success: false, message: 'User authentication context is missing.' });
                return;
            }
            const history = await chat_service_1.ChatService.getChatHistory(user.id);
            res.status(200).json({
                success: true,
                data: history,
            });
        }
        catch (error) {
            (0, errors_utils_1.handleApiError)(error, res, 'ChatController.handleGetHistory');
        }
    }
    static async handleUpload(req, res) {
        try {
            const user = req.user;
            if (!user) {
                res.status(401).json({ success: false, message: 'User authentication context is missing.' });
                return;
            }
            // Initialize busboy for streamlined multipart parsing
            const Busboy = require('busboy');
            const busboy = Busboy({ headers: req.headers });
            let fileBuffer = null;
            let fileMimeType = '';
            let fileParsed = false;
            let requestedProvider = 'groq';
            let requestedModel = 'llama-3.3-70b-versatile';
            let userPrompt = '';
            let requestedSessionId = 'legacy_session';
            let originalFileName = 'document';
            busboy.on('field', (name, val) => {
                if (name === 'provider')
                    requestedProvider = val;
                if (name === 'model')
                    requestedModel = val;
                if (name === 'message')
                    userPrompt = val;
                if (name === 'sessionId')
                    requestedSessionId = val;
            });
            busboy.on('file', (name, file, info) => {
                const { mimeType } = info;
                const chunks = [];
                // Stream reading directly to memory
                file.on('data', (data) => {
                    chunks.push(data);
                });
                file.on('end', () => {
                    fileBuffer = Buffer.concat(chunks);
                    fileMimeType = mimeType;
                    originalFileName = info.filename || 'document';
                    fileParsed = true;
                });
            });
            busboy.on('finish', async () => {
                console.log(`[Upload] Busboy finished. Parsed: ${fileParsed}, Mime: ${fileMimeType}, Buffer size: ${fileBuffer?.length}`);
                if (!fileParsed || !fileBuffer) {
                    res.status(400).json({ success: false, message: 'No file uploaded or file was empty.' });
                    return;
                }
                let extractedText = '';
                try {
                    if (fileMimeType === 'application/pdf') {
                        const pdf = require('pdf-parse');
                        const pdfData = await pdf(fileBuffer);
                        extractedText = pdfData.text;
                    }
                    else if (fileMimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                        const mammoth = require('mammoth');
                        const result = await mammoth.extractRawText({ buffer: fileBuffer });
                        extractedText = result.value;
                    }
                    else if (fileMimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || fileMimeType === 'application/vnd.ms-excel') {
                        const xlsx = require('xlsx');
                        const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
                        extractedText = workbook.SheetNames.map((name) => {
                            const sheet = workbook.Sheets[name];
                            return xlsx.utils.sheet_to_csv(sheet);
                        }).join('\n\n');
                        console.log(`[Upload] Spreadsheet parsed. Len: ${extractedText.length}`);
                    }
                    else {
                        extractedText = fileBuffer.toString('utf-8');
                    }
                    console.log(`[Upload] File parsed. Extracted length: ${extractedText?.length}`);
                }
                catch (parseError) {
                    console.error('[Upload] Parse error:', parseError);
                    return res.status(200).json({
                        success: true,
                        data: {
                            responseText: "I'm sorry, I encountered an error while reading this document. Please ensure it's not password protected or corrupted.",
                            type: 'blocked',
                            reason: "Parsing Failure"
                        }
                    });
                }
                if (!extractedText || extractedText.trim().length === 0) {
                    console.warn('[Upload] Extraction produced empty text');
                    return res.status(200).json({
                        success: true,
                        data: {
                            responseText: "I'm sorry, I couldn't find any readable text in this document. Please make sure it's a valid PDF, Word, or Excel file.",
                            type: 'blocked',
                            reason: "Empty Document"
                        }
                    });
                }
                const combinedMessage = userPrompt
                    ? `${userPrompt}\n\nDocument contents:\n\n${extractedText.substring(0, 15000)}`
                    : `Please analyze this medical document:\n\n${extractedText.substring(0, 15000)}`;
                const chatRequest = {
                    userId: user.id,
                    message: combinedMessage,
                    provider: requestedProvider,
                    model: requestedModel,
                    sessionId: requestedSessionId || 'legacy_session',
                    documentContext: extractedText
                };
                try {
                    const chatService = require('../services/chat.service').ChatService;
                    const chatResponse = await chatService.processChat(chatRequest);
                    // Unified Guardrail Blocking Check
                    if (chatResponse.type === 'blocked') {
                        return res.status(403).json({
                            success: false,
                            message: chatResponse.responseText,
                            reason: chatResponse.reason
                        });
                    }
                    // 2. Index the document in Vector Store after successful guardrail check
                    const { VectorService } = require('../services/vector.service');
                    try {
                        await VectorService.addDocument(extractedText, {
                            sessionId: requestedSessionId,
                            userId: user.id,
                            fileName: originalFileName,
                            mimeType: fileMimeType,
                            uploadedAt: new Date().toISOString()
                        });
                        console.log('[Upload] Document indexed in ChromaDB');
                    }
                    catch (vectorError) {
                        console.error('[Upload] Vector indexing failed:', vectorError);
                        // We don't block the response if indexing fails, but we should log it
                    }
                    res.status(200).json({ success: true, data: chatResponse });
                }
                catch (error) {
                    console.error('[Upload] ChatService processing failed:', error);
                    res.status(500).json({ success: false, message: 'Internal Server Error during AI processing.' });
                }
            });
            req.pipe(busboy);
        }
        catch (error) {
            (0, errors_utils_1.handleApiError)(error, res, 'ChatController.handleUpload');
        }
    }
}
exports.ChatController = ChatController;
//# sourceMappingURL=chat.controller.js.map