export declare class VectorService {
    private static client;
    private static collection;
    private static embeddings;
    static init(): Promise<void>;
    static addDocument(text: string, metadata: any): Promise<void>;
    static search(query: string, sessionId: string, limit?: number): Promise<string>;
}
//# sourceMappingURL=vector.service.d.ts.map