export interface ChatRequest {
    userId: string;
    message: string;
    provider: string;
    model: string;
    sessionId: string;
    documentContext?: string;
}
export type ChatResponseType = 'general' | 'symptom' | 'medicine' | 'document' | 'blocked';
export interface ChatResponse {
    responseText: string;
    type: ChatResponseType;
    reason?: string;
}
//# sourceMappingURL=chat.types.d.ts.map