import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatGroq } from '@langchain/groq';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { SystemMessage, HumanMessage, BaseMessage } from '@langchain/core/messages';

export type LLMProvider = 'openai' | 'google' | 'anthropic' | 'groq';

export interface LLMRequest {
    message: string;
    provider: LLMProvider;
    model: string;
    history?: BaseMessage[]; // Optional chat history
}

export class LLMService {
    /**
     * Medical Fine-Tuned System Prompt
     * This instructs the LLM to behave with clinical precision, evidence-based reasoning, 
     * and strict medical boundary enforcement.
     */
    public static readonly SYSTEM_PROMPT = `
You are a highly specialized "AI Healthcare Chatbot". 
Your core directive is to provide precise, evidence-based, and clinically sound information.

CONSTRAINTS & TUNING:
1. ONLY answer healthcare-related queries (symptoms, medications, lab reports, wellness).
2. FOR NON-HEALTHCARE QUERIES: If a user asks about anything unrelated to healthcare (e.g., violence, illegal acts, general trivia, politics, etc.), you must politely refuse to answer. State that you are an AI assistant specialized in healthcare only. You may then, at a high level, offer to discuss how healthcare authorities handle such matters or redirect them to healthcare-related topics.
3. Clinical Precision: Use professional medical terminology but explain it simply for the patient.
4. Boundaries: Do NOT provide life-or-death emergency advice. Always advise consulting a physical doctor for critical issues.
5. Factual Accuracy: Prioritize accuracy over creativity. If you don't know, say you don't know.
6. Conciseness: Give structured, easy-to-read responses using markdown (bullet points, bold text).
7. Identity: Do not use any specific brand name or persona; identify only as "AI Healthcare Chatbot".

Current User Consultation Context below:
`.trim();

    /**
     * Low temperature (0.1) is used across all providers to ensure 
     * high factual consistency and minimal creative hallucination.
     */
    private static readonly DEFAULT_TEMPERATURE = 0.1;

    /**
     * Factory method to get a LangChain-compatible Chat Model instance.
     */
    public static getChatModel(provider: LLMProvider, model: string): BaseChatModel {
        switch (provider) {
            case 'openai':
                return new ChatOpenAI({
                    modelName: model || process.env.OPENAI_MODEL || 'gpt-4o',
                    temperature: this.DEFAULT_TEMPERATURE,
                    openAIApiKey: process.env.OPENAI_API_KEY,
                });
            case 'google':
                return new ChatGoogleGenerativeAI({
                    model: model || process.env.GEMINI_MODEL || 'gemini-1.5-flash',
                    temperature: this.DEFAULT_TEMPERATURE,
                    apiKey: process.env.GEMINI_API_KEY,
                });
            case 'anthropic':
                return new ChatAnthropic({
                    modelName: model || process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20240620',
                    temperature: this.DEFAULT_TEMPERATURE,
                    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
                });
            case 'groq':
                return new ChatGroq({
                    model: model || process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
                    temperature: this.DEFAULT_TEMPERATURE,
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
                new SystemMessage(this.SYSTEM_PROMPT),
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
        const prompt = `Summarize this healthcare query into a professional 3-5 word title. 
        IMPORTANT: Use only the title without any preamble. 
        If the message is just a greeting (e.g. 'Hi', 'Hello') or is very short, respond with exactly "Medical Consultation".
        
        Query: "${message}"
        
        Respond with ONLY the title.`;

        try {
            const response = await this.generateResponse({
                message: prompt,
                provider: (process.env.GROQ_API_KEY ? 'groq' : 'google') as LLMProvider,
                model: process.env.TITLE_MODEL || (process.env.GROQ_API_KEY ? 'llama-3.3-70b-versatile' : 'gemini-1.5-flash'),
            });
            let title = response.replace(/["']/g, '').trim();
            if (title.length > 40) title = title.substring(0, 37) + '...';
            return title || "Medical Consultation";
        } catch (error) {
            return "Medical Consultation";
        }
    }
}
