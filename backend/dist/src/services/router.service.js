"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RouterService = void 0;
const llm_service_1 = require("./llm.service");
const function_service_1 = require("./function.service");
class RouterService {
    /**
     * Routes user queries based on classification and ensures responses are LLM-generated.
     */
    static async routeQuery(request) {
        const { message, type, provider, model } = request;
        let context = '';
        // Routing Logic based on Query Type
        switch (type) {
            case 'symptom':
                // Call Function Service (Mock) to simulate context retrieval
                context = await function_service_1.FunctionService.getSymptomContext(message);
                break;
            case 'medicine':
                // Call Function Service (Mock) for medication context
                context = await function_service_1.FunctionService.getMedicineContext(message);
                break;
            case 'document':
                // (Future) RAG → LLM integration point
                context = await function_service_1.FunctionService.getDocumentContext(message);
                break;
            case 'general':
            default:
                // Direct LLM call with no context
                break;
        }
        // Build structured input for LLM
        const structuredInput = `
      User Query: "${message}"
      Context: ${context || "None provided"}
      Type: ${type}
    `.trim();
        // All responses generated through LLM Service
        const llmResponseText = await llm_service_1.LLMService.generateResponse({
            message: structuredInput,
            provider,
            model,
        });
        return {
            response: llmResponseText,
            type,
            source: "llm",
            context: context || undefined,
        };
    }
}
exports.RouterService = RouterService;
//# sourceMappingURL=router.service.js.map