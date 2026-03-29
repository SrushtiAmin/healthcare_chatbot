"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
const prisma_lib_1 = __importDefault(require("../lib/prisma.lib"));
const guardrail_service_1 = require("./guardrail.service");
const classifier_service_1 = require("./classifier.service");
const router_service_1 = require("./router.service");
class ChatService {
    /**
     * Main entry point for processing a chat message.
     */
    static async processChat(request) {
        try {
            // 1. Guardrail (BLOCK non-healthcare queries)
            // If we have a document, check the document content instead of just the message
            const contentToCheck = request.documentContext || request.message;
            const guardrail = await guardrail_service_1.GuardrailService.checkMessage(contentToCheck);
            if (!guardrail.isAllowed) {
                return {
                    responseText: guardrail.reason || "I'm just here to talk about healthcare related topics okay?",
                    type: 'blocked',
                    reason: "Policy Restriction",
                };
            }
            // 2. Classifier (Determine query type)
            const queryType = await classifier_service_1.ClassifierService.classifyMessage(request.message);
            // 3. RAG: Retrieve relevant context from Vector Store
            let augmentedMessage = request.message;
            try {
                const { VectorService } = require('./vector.service');
                const context = await VectorService.search(request.message, request.sessionId || 'legacy_session');
                if (context && context.trim().length > 0) {
                    augmentedMessage = `You are a healthcare assistant. Here is relevant context from the user's uploaded medical documents:\n\n${context}\n\nUser Question: ${request.message}`;
                    console.log('[RAG] Augmented prompt with vector context');
                }
            }
            catch (vectorSearchError) {
                console.warn('[RAG] Vector search failed or skipped:', vectorSearchError);
            }
            // 4. Router Service (Centralized routing based on classification)
            const routerResponse = await router_service_1.RouterService.routeQuery({
                message: augmentedMessage,
                type: queryType,
                provider: request.provider,
                model: request.model,
                userId: request.userId,
            });
            // 4. SAVE TO DATABASE (Include all new fields)
            await prisma_lib_1.default.chat.create({
                data: {
                    userId: request.userId,
                    message: request.message,
                    response: routerResponse.response,
                    type: queryType,
                    provider: request.provider,
                    model: request.model,
                    source: routerResponse.source,
                    context: routerResponse.context || null,
                    sessionId: request.sessionId || 'legacy_session',
                },
            });
            return {
                responseText: routerResponse.response,
                type: queryType,
            };
        }
        catch (error) {
            console.error('Error in ChatService:', error);
            throw error;
        }
    }
    /**
     * Fetch chat history for a specific user.
     */
    static async getChatHistory(userId) {
        try {
            const chats = await prisma_lib_1.default.chat.findMany({
                where: { userId },
                orderBy: {
                    createdAt: 'asc', // Ascending so oldest is first. Frontend can group by session
                },
            });
            return chats;
        }
        catch (error) {
            console.error('Error in getChatHistory:', error);
            throw error;
        }
    }
}
exports.ChatService = ChatService;
//# sourceMappingURL=chat.service.js.map