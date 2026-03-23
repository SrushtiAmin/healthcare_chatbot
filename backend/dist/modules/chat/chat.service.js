"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
const prisma_1 = __importDefault(require("../../lib/prisma"));
const guardrail_1 = require("./guardrail");
const classifier_1 = require("./classifier");
const router_1 = require("./router");
class ChatService {
    /**
     * Main entry point for processing a chat message.
     */
    static async processChat(request) {
        try {
            // 1. Guardrail (BLOCK non-healthcare queries)
            const guardrail = await guardrail_1.GuardrailService.checkMessage(request.message);
            if (!guardrail.isAllowed) {
                return {
                    responseText: "Please be restricted toward healthcare queries only.",
                    type: 'blocked',
                    reason: guardrail.reason,
                    sessionId: request.sessionId || 'temporary',
                };
            }
            // 2. Classifier (Determine query type)
            const queryType = await classifier_1.ClassifierService.classifyMessage(request.message);
            // 3. Router Module (Centralized routing based on classification)
            const routerResponse = await router_1.RouterModule.routeQuery({
                message: request.message,
                type: queryType,
                provider: request.provider,
                model: request.model,
                userId: request.userId,
            });
            // 4. SESSION HANDLING
            let currentSessionId = request.sessionId;
            if (!currentSessionId) {
                // Create a new session if not provided
                // Use first message as title (truncated)
                const title = request.message.length > 30
                    ? request.message.substring(0, 27) + "..."
                    : request.message;
                const session = await prisma_1.default.chatSession.create({
                    data: {
                        userId: request.userId,
                        title: title,
                    }
                });
                currentSessionId = session.id;
            }
            // 5. SAVE TO DATABASE (Include all new fields)
            await prisma_1.default.chat.create({
                data: {
                    userId: request.userId,
                    sessionId: currentSessionId,
                    message: request.message,
                    response: routerResponse.response,
                    type: queryType,
                    provider: request.provider,
                    model: request.model,
                    source: routerResponse.source,
                    context: routerResponse.context || null,
                },
            });
            // Update session timestamp
            await prisma_1.default.chatSession.update({
                where: { id: currentSessionId },
                data: { updatedAt: new Date() }
            });
            return {
                responseText: routerResponse.response,
                type: queryType,
                sessionId: currentSessionId,
            };
        }
        catch (error) {
            console.error('Error in ChatService:', error);
            throw error;
        }
    }
    /**
     * Fetch all sessions for a specific user.
     */
    static async getSessions(userId) {
        return prisma_1.default.chatSession.findMany({
            where: { userId },
            orderBy: { updatedAt: 'desc' },
        });
    }
    /**
     * Fetch all messages for a specific session.
     */
    static async getSessionMessages(sessionId, userId) {
        return prisma_1.default.chat.findMany({
            where: {
                sessionId,
                userId // Ensure user owns the session
            },
            orderBy: { createdAt: 'asc' },
        });
    }
    /**
     * OBSOLETE: Old method to fetch chat history (all at once)
     */
    static async getChatHistory(userId) {
        return prisma_1.default.chat.findMany({
            where: { userId },
            orderBy: { createdAt: 'asc' },
        });
    }
}
exports.ChatService = ChatService;
//# sourceMappingURL=chat.service.js.map