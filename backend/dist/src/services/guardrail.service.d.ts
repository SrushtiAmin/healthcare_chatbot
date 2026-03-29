export interface GuardrailResult {
    isAllowed: boolean;
    reason?: string;
}
export declare class GuardrailService {
    /**
     * Checks if the message is healthcare-related using a LangChain pipeline.
     */
    static checkMessage(message: string): Promise<GuardrailResult>;
    private static keywordCheck;
}
//# sourceMappingURL=guardrail.service.d.ts.map