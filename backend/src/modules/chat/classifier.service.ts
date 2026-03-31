import { LLMService } from './llm.service';
import { LLMProvider, ChatType } from './chat.types';
import { AI_CONFIG, PROMPTS } from './chat.constants';

export class ClassifierService {
    /**
     * Classifies the user message into one of: 'general', 'symptom', 'medicine', 'document'.
     */
    public static async classifyMessage(message: string): Promise<ChatType> {
        try {
            const provider = AI_CONFIG.DEFAULT_PROVIDER as LLMProvider;

            if (!provider) {
                return this.keywordClassify(message);
            }

            const response = await LLMService.generateResponse({
                message: PROMPTS.INTENT_CLASSIFIER(message),
                provider,
                model: process.env.CLASSIFIER_MODEL || (provider === 'groq' ? AI_CONFIG.MODELS.LLAMA : AI_CONFIG.MODELS.GEMINI),
            });

            const predictedType = response.trim().toLowerCase();
            const validTypes: ChatType[] = ['symptom', 'medicine', 'document', 'general'];

            if (validTypes.includes(predictedType as any)) {
                return predictedType as ChatType;
            }
            return 'general';
        } catch (error) {
            console.warn('Classifier LLM failed, falling back to keywords:', error);
            return this.keywordClassify(message);
        }
    }

    private static keywordClassify(message: string): ChatType {
        const lowerMessage = message.toLowerCase();

        if (lowerMessage.includes('symptom') || lowerMessage.includes('pain') || lowerMessage.includes('feel')) {
            return 'symptom';
        }

        if (lowerMessage.includes('medicine') || lowerMessage.includes('pill') || lowerMessage.includes('dose')) {
            return 'medicine';
        }

        if (lowerMessage.includes('document') || lowerMessage.includes('report') || lowerMessage.includes('result')) {
            return 'document';
        }

        return 'general';
    }
}
