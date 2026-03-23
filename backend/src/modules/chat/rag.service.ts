import { pipeline } from '@xenova/transformers';
import fs from 'fs/promises';
import path from 'path';
import { IndexFlatL2, Index } from 'faiss-node';
import prisma from '../../lib/prisma';

export class RagService {
    private static instance: RagService;
    private embedder: any;
    private indexFile = path.join(process.cwd(), 'data/index.faiss');
    private index: IndexFlatL2 | null = null;
    private dimension = 384; // Dimension for all-MiniLM-L6-v2

    private constructor() { }

    public static getInstance(): RagService {
        if (!RagService.instance) {
            RagService.instance = new RagService();
        }
        return RagService.instance;
    }

    private async initialize() {
        if (!this.embedder) {
            this.embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
        }

        if (!this.index) {
            await fs.mkdir(path.dirname(this.indexFile), { recursive: true });
            try {
                await fs.access(this.indexFile);
                this.index = (Index as any).read(this.indexFile) as IndexFlatL2;
            } catch (error) {
                // Create new index if file doesn't exist
                this.index = new IndexFlatL2(this.dimension);
            }
        }
    }

    private async saveIndex() {
        if (this.index) {
            this.index.write(this.indexFile);
        }
    }

    public async getEmbeddings(text: string): Promise<number[]> {
        await this.initialize();
        const output = await this.embedder(text, { pooling: 'mean', normalize: true });
        return Array.from(output.data);
    }

    public async addChunks(chunks: string[], fileId: string, userId: string) {
        await this.initialize();
        if (!this.index) throw new Error("FAISS index not initialized");

        const embeddings: number[][] = [];
        for (const text of chunks) {
            const vector = await this.getEmbeddings(text);
            embeddings.push(vector);
        }

        // Current index size before adding
        const startIndex = this.index.ntotal();

        // Add to FAISS index (flatten the 2D array if needed, but faiss-node add takes number[][])
        this.index.add(embeddings.flat());
        await this.saveIndex();

        // Store chunks in Postgres with vectorId mapping
        await (prisma as any).chunk.createMany({
            data: chunks.map((content, i) => ({
                content,
                fileId,
                userId,
                vectorId: startIndex + i,
            })),
        });
    }

    public async search(query: string, userId: string, topK: number = 5): Promise<string[]> {
        await this.initialize();
        if (!this.index || this.index.ntotal() === 0) return [];

        const queryEmbedding = await this.getEmbeddings(query);

        // Search in FAISS
        const results = this.index.search(queryEmbedding, topK * 5); // Fetch more to filter by userId later
        const vectorIds = results.labels;

        // Fetch corresponding chunks from Postgres that belong to the user
        const dbChunks = await (prisma as any).chunk.findMany({
            where: {
                vectorId: { in: vectorIds },
                userId: userId
            }
        });

        // Sort by original similarity (since label order in FAISS results is by distance)
        const sortedChunks = vectorIds
            .map(vid => dbChunks.find((c: any) => c.vectorId === vid))
            .filter(Boolean)
            .slice(0, topK);

        return sortedChunks.map((c: any) => c.content);
    }

    public async getContext(query: string, userId: string): Promise<string> {
        const relevantChunks = await this.search(query, userId);
        if (relevantChunks.length === 0) return "";

        return "Relevant information from your documents:\n\n" + relevantChunks.join("\n\n---\n\n");
    }
}
