"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClassifierService = void 0;
const llm_service_1 = require("./llm.service");
class ClassifierService {
    /**
     * Classifies the user message into one of: 'general', 'symptom', 'medicine', 'document'.
     */
    static async classifyMessage(message) {
        try {
            const prompt = `You are an intent classifier. Categorize the user's healthcare query into one of these types:
      - 'symptom': the user is describing physical pain, discomfort, or asking for a diagnosis.
      - 'medicine': the user is asking about medication, dosage, side effects, or drug interactions.
      - 'document': the user is referring to a medical report, lab result, or uploaded health file.
      - 'general': all other healthcare interactions (e.g., greetings, health tips, scheduling). 

      Respond with ONLY one word from the above categories.
      Query: "${message}"`;
            let response = '';
            // Use Groq or Gemini as a cheap/fast classifier
            if (process.env.GROQ_API_KEY) {
                response = await llm_service_1.LLMService.generateResponse({
                    message: prompt,
                    provider: 'groq',
                    model: process.env.CLASSIFIER_MODEL || 'llama-3.3-70b-versatile',
                });
            }
            else if (process.env.GEMINI_API_KEY) {
                response = await llm_service_1.LLMService.generateResponse({
                    message: prompt,
                    provider: 'google',
                    model: process.env.CLASSIFIER_MODEL || 'gemini-1.5-flash',
                });
            }
            else {
                // Fallback to simple keyword check if no LLM APIs are available
                return this.keywordClassify(message);
            }
            const predictedType = response.trim().toLowerCase();
            if (['symptom', 'medicine', 'document', 'general'].includes(predictedType)) {
                return predictedType;
            }
            return 'general';
        }
        catch (error) {
            console.warn('Classifier LLM failed, falling back to keywords:', error);
            return this.keywordClassify(message);
        }
    }
    static keywordClassify(message) {
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
exports.ClassifierService = ClassifierService;
//# sourceMappingURL=classifier.js.map