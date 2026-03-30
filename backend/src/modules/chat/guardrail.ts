import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { LLMService, LLMProvider } from './llm.service';
import { ERROR_MESSAGES } from '../../utils/constants';

export interface GuardrailResult {
    isAllowed: boolean;
    reason?: string;
}

export class GuardrailService {
    /**
     * Checks if the message is healthcare-related using a native LangChain sequence.
     */
    public static async checkMessage(message: string): Promise<GuardrailResult> {
        const provider = (process.env.GROQ_API_KEY ? 'groq' : (process.env.GEMINI_API_KEY ? 'google' : null)) as LLMProvider;

        if (!provider) {
            console.warn('Safety guardrail running unrestricted (No AI keys)');
            return { isAllowed: true };
        }

        try {
            const chatModel = LLMService.getChatModel(provider, process.env.GUARDRAIL_MODEL || '');

            // Native LangChain Prompt Template
            const promptTemplate = ChatPromptTemplate.fromMessages([
                ['system', 'You are a healthcare assistant security monitor. Respond with "YES" if the user input is about medical topics, health reports, symptoms, or greetings. Otherwise respond with "NO" and a brief reason.'],
                ['user', '{input}']
            ]);

            // Build a LangChain RunnableSequence (Modern Module Pattern)
            const chain = promptTemplate.pipe(chatModel).pipe(new StringOutputParser());

            // Run the LangChain Module
            const response = await chain.invoke({ input: message });

            const isAllowed = response.trim().toUpperCase().startsWith('YES');
            return {
                isAllowed,
                reason: isAllowed ? undefined : response.replace(/^NO[:\s]*/i, '').trim() || ERROR_MESSAGES.NOT_HEALTH_RELATED
            };
        } catch (error) {
            console.error('LangChain Guardrail Module Error:', error);
            return { isAllowed: true };
        }
    }
}
