"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RouterModule = void 0;
const llm_service_1 = require("./llm.service");
const function_module_1 = require("./function.module");
class RouterModule {
    /**
     * Routes user queries based on classification and ensures responses are LLM-generated.
     */
    static async routeQuery(request) {
        const { message, type, provider, model } = request;
        let context = '';
        // Routing Logic based on Query Type
        switch (type) {
            case 'symptom':
                // Call Function Module (Mock) to simulate context retrieval
                context = await function_module_1.FunctionModule.getSymptomContext(message);
                break;
            case 'medicine':
                // Call Function Module (Mock) for medication context
                context = await function_module_1.FunctionModule.getMedicineContext(message);
                break;
            case 'document':
                // (Future) RAG → LLM integration point
                context = await function_module_1.FunctionModule.getDocumentContext(message);
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
exports.RouterModule = RouterModule;
//# sourceMappingURL=router.js.map