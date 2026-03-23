"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FunctionModule = void 0;
const llm_service_1 = require("./llm.service");
/**
 * FunctionModule handles retrieval of structured, domain-specific intelligence.
 * Instead of mocks, it now leverages high-speed medical knowledge extraction via specialized LLM calls.
 */
class FunctionModule {
    /**
     * Retrieves medically grounded context for symptom-related queries.
     */
    static async getSymptomContext(message) {
        const prompt = `You are a medical knowledge extractor. Analyze the symptoms mentioned in: "${message}".
      Provide detailed context including:
      - Potential related conditions
      - Severity indicators (when to seek immediate help)
      - Standard clinical assessment steps
      Respond with factual, structured clinical data only. No conversational filler.`;
        try {
            return await llm_service_1.LLMService.generateResponse({
                message: prompt,
                provider: 'groq',
                model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
            });
        }
        catch (error) {
            console.error('FunctionModule Symptom Extraction Failed:', error);
            return "Unable to retrieve clinical symptom context. Proceed with caution.";
        }
    }
    /**
     * Retrieves pharmacology-grounded context for medicine-related queries.
     */
    static async getMedicineContext(message) {
        const prompt = `You are a pharmacology expert. Analyze the medication query: "${message}".
      Provide detailed context including:
      - Common medical uses
      - General dosage guidelines and precautions
      - Potential side effects and warnings
      Respond with factual pharmacology data only. No conversational filler.`;
        try {
            return await llm_service_1.LLMService.generateResponse({
                message: prompt,
                provider: 'groq',
                model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
            });
        }
        catch (error) {
            console.error('FunctionModule Medicine Extraction Failed:', error);
            return "Unable to retrieve pharmacology context. Advise consulting a professional.";
        }
    }
    /**
     * Simulates document-based context extraction (Future hook for RAG).
     */
    static async getDocumentContext(message) {
        const prompt = `Extract medical document reference data relevant to: "${message}". 
      Summarize common document metadata or patient history points that would be relevant.`;
        try {
            return await llm_service_1.LLMService.generateResponse({
                message: prompt,
                provider: 'groq',
                model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
            });
        }
        catch (error) {
            return "Unable to retrieve document context.";
        }
    }
}
exports.FunctionModule = FunctionModule;
//# sourceMappingURL=function.module.js.map