import { ChatRequest, ChatResponse } from './chat.types';
export declare class ChatService {
    /**
     * Main entry point for processing a chat message.
     */
    static processChat(request: ChatRequest): Promise<ChatResponse>;
    /**
     * Fetch all sessions for a specific user.
     */
    static getSessions(userId: string): Promise<{
        id: string;
        createdAt: Date;
        title: string | null;
        userId: string;
        updatedAt: Date;
    }[]>;
    /**
     * Fetch all messages for a specific session.
     */
    static getSessionMessages(sessionId: string, userId: string): Promise<{
        model: string;
        id: string;
        createdAt: Date;
        userId: string;
        sessionId: string | null;
        message: string;
        response: string;
        type: string;
        provider: string;
        source: string;
        context: string | null;
    }[]>;
    /**
     * OBSOLETE: Old method to fetch chat history (all at once)
     */
    static getChatHistory(userId: string): Promise<{
        model: string;
        id: string;
        createdAt: Date;
        userId: string;
        sessionId: string | null;
        message: string;
        response: string;
        type: string;
        provider: string;
        source: string;
        context: string | null;
    }[]>;
}
//# sourceMappingURL=chat.service.d.ts.map