import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { LLMService } from './llm.service';
import { ERROR_MESSAGES, PROMPTS, AI_CONFIG } from './chat.constants';
import { GuardrailResult, LLMProvider } from './chat.types';

export class GuardrailService {
    /**
     * Checks if the message is healthcare-related using a native LangChain sequence.
     */
    public static async checkMessage(message: string): Promise<GuardrailResult> {
        const provider = AI_CONFIG.DEFAULT_PROVIDER as LLMProvider;

        if (!provider) {
            console.warn('Safety guardrail running unrestricted (No AI keys)');
            return { isAllowed: true };
        }

        try {
            const chatModel = LLMService.getChatModel(provider, process.env.GUARDRAIL_MODEL || '');

            // Native LangChain Prompt Template
            const promptTemplate = ChatPromptTemplate.fromMessages([
                ['system', PROMPTS.GUARDRAIL_SYSTEM],
                ['user', '{input}']
            ]);

            // Build a LangChain RunnableSequence (Modern Module Pattern)
            const chain = promptTemplate.pipe(chatModel).pipe(new StringOutputParser());

            // Run the LangChain Module
            const response = await chain.invoke({ input: message });
            console.log(`[GuardrailService] LLM direct response: "${response.trim()}"`);

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
