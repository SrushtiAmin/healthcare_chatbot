"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatController = void 0;
const chat_schema_1 = require("./chat.schema");
const chat_service_1 = require("./chat.service");
const errors_1 = require("../../utils/errors");
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
                (0, errors_1.handleApiError)(parseResult.error, res, 'ChatController.handleChat');
                return;
            }
            const validatedData = parseResult.data;
            // 3. Prepare ChatRequest type
            const chatRequest = {
                userId: user.id,
                message: validatedData.message,
                provider: validatedData.provider,
                model: validatedData.model,
                sessionId: validatedData.sessionId, // PASS SESSION ID
            };
            // 4. Call service logic
            const chatResponse = await chat_service_1.ChatService.processChat(chatRequest);
            // Handle guardrail blocking
            if (chatResponse.type === 'blocked') {
                res.status(403).json({
                    success: false,
                    message: chatResponse.responseText,
                    reason: chatResponse.reason,
                    data: chatResponse, // Include sessionId even if blocked
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
            (0, errors_1.handleApiError)(error, res, 'ChatController.handleChat');
        }
    }
    /**
     * Fetch all chat sessions for the logged-in user.
     */
    static async handleGetSessions(req, res) {
        try {
            const user = req.user;
            if (!user) {
                res.status(401).json({ success: false, message: 'User authentication context is missing.' });
                return;
            }
            const sessions = await chat_service_1.ChatService.getSessions(user.id);
            res.status(200).json({
                success: true,
                data: sessions,
            });
        }
        catch (error) {
            (0, errors_1.handleApiError)(error, res, 'ChatController.handleGetSessions');
        }
    }
    /**
     * Fetch all messages for a specific session.
     */
    static async handleGetSessionMessages(req, res) {
        try {
            const user = req.user;
            if (!user) {
                res.status(401).json({ success: false, message: 'User authentication context is missing.' });
                return;
            }
            const { sessionId } = req.params;
            if (!sessionId) {
                res.status(400).json({ success: false, message: 'Session ID is required.' });
                return;
            }
            const messages = await chat_service_1.ChatService.getSessionMessages(sessionId, user.id);
            res.status(200).json({
                success: true,
                data: messages,
            });
        }
        catch (error) {
            (0, errors_1.handleApiError)(error, res, 'ChatController.handleGetSessionMessages');
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
            (0, errors_1.handleApiError)(error, res, 'ChatController.handleGetHistory');
        }
    }
}
exports.ChatController = ChatController;
//# sourceMappingURL=chat.controller.js.map