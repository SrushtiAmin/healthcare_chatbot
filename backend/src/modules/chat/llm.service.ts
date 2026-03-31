import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatGroq } from '@langchain/groq';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { SystemMessage, HumanMessage, BaseMessage } from '@langchain/core/messages';
import { AI_CONFIG, PROMPTS } from './chat.constants';
import { LLMProvider, LLMRequest } from './chat.types';

export class LLMService {
    /**
     * Factory method to get a LangChain-compatible Chat Model instance.
     */
    public static getChatModel(provider: LLMProvider, model: string): BaseChatModel {
        const temperature = AI_CONFIG.DEFAULT_TEMPERATURE;

        switch (provider) {
            case 'openai':
                return new ChatOpenAI({
                    modelName: model || process.env.OPENAI_MODEL || AI_CONFIG.MODELS.GPT4,
                    temperature,
                    openAIApiKey: process.env.OPENAI_API_KEY,
                });
            case 'google':
                return new ChatGoogleGenerativeAI({
                    model: model || process.env.GEMINI_MODEL || AI_CONFIG.MODELS.GEMINI,
                    temperature,
                    apiKey: process.env.GEMINI_API_KEY,
                });
            case 'anthropic':
                return new ChatAnthropic({
                    modelName: model || process.env.ANTHROPIC_MODEL || AI_CONFIG.MODELS.CLAUDE,
                    temperature,
                    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
                });
            case 'groq':
                return new ChatGroq({
                    model: model || process.env.GROQ_MODEL || AI_CONFIG.MODELS.LLAMA,
                    temperature,
                    apiKey: process.env.GROQ_API_KEY,
                });
            default:
                throw new Error('Invalid LLM provider specified');
        }
    }

    public static async generateResponse(request: LLMRequest): Promise<string> {
        const { message, provider, model, history = [] } = request;

        try {
            const chatModel = this.getChatModel(provider, model);

            const messages: BaseMessage[] = [
                new SystemMessage(PROMPTS.HEALTHCARE_SYSTEM),
                ...history,
                new HumanMessage(message),
            ];

            const response = await chatModel.invoke(messages);
            return response.content as string;
        } catch (error: any) {
            console.error(`Error in LLMService [${provider}]:`, error);
            throw new Error(`LLM Failure: ${error.message}`);
        }
    }

    public static async generateTitle(message: string): Promise<string> {
        try {
            const response = await this.generateResponse({
                message: PROMPTS.TITLE_GENERATION(message),
                provider: AI_CONFIG.DEFAULT_PROVIDER as LLMProvider,
                model: process.env.TITLE_MODEL || (AI_CONFIG.DEFAULT_PROVIDER === 'groq' ? AI_CONFIG.MODELS.LLAMA : AI_CONFIG.MODELS.GEMINI),
            });
            let title = response.replace(/["']/g, '').trim();
            if (title.length > 40) title = title.substring(0, 37) + '...';
            return title || "Medical Consultation";
        } catch (error) {
            return "Medical Consultation";
        }
    }
}
