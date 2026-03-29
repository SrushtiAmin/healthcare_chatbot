export type LLMProvider = 'openai' | 'google' | 'anthropic' | 'groq';
export interface LLMRequest {
    message: string;
    provider: LLMProvider;
    model: string;
}
export declare class LLMService {
    private static readonly SYSTEM_PROMPT;
    static generateResponse(request: LLMRequest): Promise<string>;
    private static callOpenAI;
    private static callGemini;
    private static callClaude;
    private static callGroq;
}
//# sourceMappingURL=llm.service.d.ts.map