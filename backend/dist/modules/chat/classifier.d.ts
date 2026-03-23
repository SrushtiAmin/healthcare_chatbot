export type ChatType = 'general' | 'symptom' | 'medicine' | 'document';
export declare class ClassifierService {
    /**
     * Classifies the user message into one of: 'general', 'symptom', 'medicine', 'document'.
     */
    static classifyMessage(message: string): Promise<ChatType>;
    private static keywordClassify;
}
//# sourceMappingURL=classifier.d.ts.map