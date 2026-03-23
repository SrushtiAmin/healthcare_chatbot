"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GuardrailService = void 0;
const llm_service_1 = require("./llm.service");
class GuardrailService {
    /**
     * Checks if the message is healthcare-related using a lightweight LLM call.
     */
    static async checkMessage(message) {
        try {
            // For guardrail, we use a lightweight model by default (e.g., Llama 3 8B on Groq or Gemini Flash)
            // If no API keys, we fall back to a simple keyword check
            const prompt = `You are a healthcare assistant guardrail. 
      Determine if the following user query is related to healthcare (symptoms, medicine, documents) OR is a greeting/introductory message (like 'Hi', 'Hello', 'Who are you?').
      Respond with strictly 'YES' if it is related or a valid greeting, or 'NO' followed by a brief reason if it is clearly unrelated to healthcare or your role as an assistant.
      Query: "${message}"`;
            let response = '';
            // Attempt to use Groq as a fast/cheap guardrail
            if (process.env.GROQ_API_KEY) {
                response = await llm_service_1.LLMService.generateResponse({
                    message: prompt,
                    provider: 'groq',
                    model: process.env.GUARDRAIL_MODEL || 'llama-3.3-70b-versatile',
                });
            }
            else if (process.env.GEMINI_API_KEY) {
                response = await llm_service_1.LLMService.generateResponse({
                    message: prompt,
                    provider: 'google',
                    model: process.env.GUARDRAIL_MODEL || 'gemini-1.5-flash',
                });
            }
            else {
                // Fallback to keyword check if no LLM APIs are available
                return this.keywordCheck(message);
            }
            if (response.trim().toUpperCase().startsWith('YES')) {
                return { isAllowed: true };
            }
            else {
                const reason = response.substring(response.indexOf('NO') + 2).trim() || 'Not a healthcare query.';
                return {
                    isAllowed: false,
                    reason: "Please be restricted toward healthcare queries only."
                };
            }
        }
        catch (error) {
            console.warn('Guardrail LLM failed, falling back to keywords:', error);
            return this.keywordCheck(message);
        }
    }
    static keywordCheck(message) {
        const healthcareKeywords = [
            'health', 'medicine', 'symptom', 'pain', 'doctor', 'pill', 'dose', 'fever',
            'medical', 'report', 'lab', 'test', 'blood', 'heart', 'headache', 'prescription',
            'hi', 'hello', 'hey', 'greetings', 'help', 'who'
        ];
        const lowerMessage = message.toLowerCase();
        const isAllowed = healthcareKeywords.some(kw => lowerMessage.includes(kw));
        return {
            isAllowed,
            reason: isAllowed ? undefined : "Please be restricted toward healthcare queries only."
        };
    }
}
exports.GuardrailService = GuardrailService;
//# sourceMappingURL=guardrail.js.map