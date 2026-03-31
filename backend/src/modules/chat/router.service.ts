import { LLMService } from './llm.service';
import { FunctionService } from './function.service';
import { RagService } from './rag.service';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { PROMPTS } from './chat.constants';
import { RouteRequest, RouteResponse, LLMProvider } from './chat.types';

export class RouterModule {
    /**
     * Routes user queries based on classification and ensures responses are LLM-generated using LangChain.
     */
    public static async routeQuery(request: RouteRequest): Promise<RouteResponse> {
        const { message, type, provider, model, userId, history = [] } = request;

        let context = '';
        const ragService = RagService.getInstance();

        // 1. Retrieval Logic based on Query Type
        switch (type) {
            case 'symptom':
                context = await FunctionService.getSymptomContext(message);
                break;
            case 'medicine':
                context = await FunctionService.getMedicineContext(message);
                break;
            case 'document':
                context = await ragService.getContext(message, userId);
                break;
            default:
                break;
        }

        // 2. Build LangChain Prompt Template
        const promptTemplate = ChatPromptTemplate.fromMessages([
            ["system", PROMPTS.HEALTHCARE_SYSTEM],
            new MessagesPlaceholder("chat_history"),
            ["human", "{input_with_context}"]
        ]);

        // 3. Construct Input with Context
        let inputWithContext = '';
        if (context) {
            inputWithContext = `
CONTEXT INFORMATION:
${context}

USER QUERY:
"${message}"
`.trim();
        } else {
            inputWithContext = message;
        }

        // 4. Create and Invoke LangChain Chain
        const chatModel = LLMService.getChatModel(provider, model);
        const chain = promptTemplate.pipe(chatModel).pipe(new StringOutputParser());

        const response = await chain.invoke({
            chat_history: history,
            input_with_context: inputWithContext,
        });

        return {
            response,
            type,
            source: "llm",
            context: context || undefined,
        };
    }
}

