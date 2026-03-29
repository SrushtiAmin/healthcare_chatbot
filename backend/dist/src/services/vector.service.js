"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VectorService = void 0;
const chromadb_1 = require("chromadb");
const embeddings_service_1 = require("./embeddings.service");
const textsplitters_1 = require("@langchain/textsplitters");
class VectorService {
    static async init() {
        if (this.client)
            return;
        this.client = new chromadb_1.ChromaClient({ path: 'http://localhost:8000' });
        this.embeddings = new embeddings_service_1.EmbeddingsService();
        try {
            this.collection = await this.client.getOrCreateCollection({
                name: 'healthcare_docs',
            });
            console.log('[Vector] ChromaDB initialized');
        }
        catch (error) {
            console.error('[Vector] Failed to init ChromaDB:', error);
        }
    }
    static async addDocument(text, metadata) {
        if (!this.collection)
            await this.init();
        const splitter = new textsplitters_1.RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200,
        });
        const chunks = await splitter.createDocuments([text], [metadata]);
        // Ensure all metadata values are strings, numbers, or booleans for Chroma
        const fileSlug = (metadata.fileName || 'document').replace(/[^a-z0-9]/gi, '_').toLowerCase().substring(0, 50);
        const ids = chunks.map((_, i) => `doc_${metadata.sessionId || 'gen'}_${fileSlug}_${i}`);
        const documents = chunks.map((c) => c.pageContent);
        const metadatas = chunks.map((c) => ({
            ...c.metadata,
            sessionId: String(metadata.sessionId || 'legacy_session'),
            userId: String(metadata.userId || 'system'),
            fileName: metadata.fileName || 'document'
        }));
        // Using OpenAI embeddings via LangChain manually or letting Chroma handle if configured
        // For simplicity, we'll let LangChain handle embeddings and pass them to Chroma
        const embeddings = await this.embeddings.embedDocuments(documents);
        await this.collection.add({
            ids,
            embeddings,
            documents,
            metadatas,
        });
        console.log(`[Vector] Added ${chunks.length} chunks to vector store`);
    }
    static async search(query, sessionId, limit = 5) {
        if (!this.collection)
            await this.init();
        const queryEmbedding = await this.embeddings.embedQuery(query);
        const results = await this.collection.query({
            queryEmbeddings: [queryEmbedding],
            nResults: limit,
            where: { sessionId: sessionId },
        });
        return results.documents[0].join('\n\n');
    }
}
exports.VectorService = VectorService;
//# sourceMappingURL=vector.service.js.map