"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmbeddingsService = void 0;
const transformers_1 = require("@xenova/transformers");
class EmbeddingsService {
    static async getPipeline() {
        if (!this.instance) {
            this.instance = await (0, transformers_1.pipeline)('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
        }
        return this.instance;
    }
    async embedDocuments(texts) {
        const pipe = await EmbeddingsService.getPipeline();
        const results = [];
        for (const text of texts) {
            const output = await pipe(text, { pooling: 'mean', normalize: true });
            results.push(Array.from(output.data));
        }
        return results;
    }
    async embedQuery(text) {
        const pipe = await EmbeddingsService.getPipeline();
        const output = await pipe(text, { pooling: 'mean', normalize: true });
        return Array.from(output.data);
    }
}
exports.EmbeddingsService = EmbeddingsService;
EmbeddingsService.instance = null;
//# sourceMappingURL=embeddings.service.js.map