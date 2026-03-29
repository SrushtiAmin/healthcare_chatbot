export declare class EmbeddingsService {
    private static instance;
    private static getPipeline;
    embedDocuments(texts: string[]): Promise<number[][]>;
    embedQuery(text: string): Promise<number[]>;
}
//# sourceMappingURL=embeddings.service.d.ts.map