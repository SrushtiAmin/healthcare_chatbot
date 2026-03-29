import { ChatRequest, ChatResponse } from '../types/chat.types';
export declare class ChatService {
    /**
     * Main entry point for processing a chat message.
     */
    static processChat(request: ChatRequest): Promise<ChatResponse>;
    /**
     * Fetch chat history for a specific user.
     */
    static getChatHistory(userId: string): Promise<{
        model: string;
        id: string;
        createdAt: Date;
        userId: string;
        sessionId: string;
        message: string;
        response: string;
        type: string;
        provider: string;
        source: string;
        context: string | null;
    }[]>;
}
//# sourceMappingURL=chat.service.d.ts.map