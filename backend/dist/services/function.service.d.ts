/**
 * FunctionService handles retrieval of structured, domain-specific intelligence.
 * Instead of mocks, it now leverages high-speed medical knowledge extraction via specialized LLM calls.
 */
export declare class FunctionService {
    /**
     * Retrieves medically grounded context for symptom-related queries.
     */
    static getSymptomContext(message: string): Promise<string>;
    /**
     * Retrieves pharmacology-grounded context for medicine-related queries.
     */
    static getMedicineContext(message: string): Promise<string>;
    /**
     * Simulates document-based context extraction (Future hook for RAG).
     */
    static getDocumentContext(message: string): Promise<string>;
}
//# sourceMappingURL=function.service.d.ts.map