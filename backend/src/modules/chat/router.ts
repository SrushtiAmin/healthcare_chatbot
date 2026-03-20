import { LLMService, LLMProvider } from './llm.service';
import { FunctionModule } from './function.module';

export interface RouteRequest {
    message: string;
    type: string;
    provider: LLMProvider;
    model: string;
    userId: string;
}

export interface RouteResponse {
    response: string;
    type: string;
    source: string;
    context?: string;
}

export class RouterModule {
    /**
     * Routes user queries based on classification and ensures responses are LLM-generated.
     */
    public static async routeQuery(request: RouteRequest): Promise<RouteResponse> {
        const { message, type, provider, model } = request;

        let context = '';

        // Routing Logic based on Query Type
        switch (type) {
            case 'symptom':
                // Call Function Module (Mock) to simulate context retrieval
                context = await FunctionModule.getSymptomContext(message);
                break;

            case 'medicine':
                // Call Function Module (Mock) for medication context
                context = await FunctionModule.getMedicineContext(message);
                break;

            case 'document':
                // (Future) RAG → LLM integration point
                context = await FunctionModule.getDocumentContext(message);
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
        const llmResponseText = await LLMService.generateResponse({
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
