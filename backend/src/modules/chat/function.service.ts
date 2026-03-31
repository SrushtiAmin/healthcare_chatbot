import { LLMService } from './llm.service';
import { AI_CONFIG, PROMPTS } from './chat.constants';
import { LLMProvider } from './chat.types';

/**
 * FunctionService handles retrieval of structured, domain-specific intelligence.
 * it leverages high-speed medical knowledge extraction via specialized LLM calls.
 */
export class FunctionService {
    /**
     * Retrieves medically grounded context for symptom-related queries.
     */
    public static async getSymptomContext(message: string): Promise<string> {
        try {
            const provider = AI_CONFIG.DEFAULT_PROVIDER as LLMProvider;
            return await LLMService.generateResponse({
                message: PROMPTS.SYMPTOM_EXTRACTION(message),
                provider,
                model: process.env.GROQ_MODEL || (provider === 'groq' ? AI_CONFIG.MODELS.LLAMA : AI_CONFIG.MODELS.GEMINI),
            });
        } catch (error) {
            console.error('FunctionService Symptom Extraction Failed:', error);
            return "Unable to retrieve clinical symptom context.";
        }
    }

    /**
     * Retrieves pharmacology-grounded context for medicine-related queries.
     */
    public static async getMedicineContext(message: string): Promise<string> {
        try {
            const provider = AI_CONFIG.DEFAULT_PROVIDER as LLMProvider;
            return await LLMService.generateResponse({
                message: PROMPTS.MEDICINE_EXTRACTION(message),
                provider,
                model: process.env.GROQ_MODEL || (provider === 'groq' ? AI_CONFIG.MODELS.LLAMA : AI_CONFIG.MODELS.GEMINI),
            });
        } catch (error) {
            console.error('FunctionService Medicine Extraction Failed:', error);
            return "Unable to retrieve pharmacology context.";
        }
    }
}
