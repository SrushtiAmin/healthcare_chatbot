"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GuardrailService = void 0;
const groq_1 = require("@langchain/groq");
const prompts_1 = require("@langchain/core/prompts");
const output_parsers_1 = require("@langchain/core/output_parsers");
class GuardrailService {
    /**
     * Checks if the message is healthcare-related using a LangChain pipeline.
     */
    static async checkMessage(message) {
        try {
            // Fall back to keyword check if no API key is available
            if (!process.env.GROQ_API_KEY) {
                return this.keywordCheck(message);
            }
            // Initialize the native LangChain chat model wrapper
            const model = new groq_1.ChatGroq({
                apiKey: process.env.GROQ_API_KEY,
                model: process.env.GUARDRAIL_MODEL || 'llama-3.3-70b-versatile',
                temperature: 0,
            });
            // Set up prompt template
            console.log(`[Guardrail] Checking message length: ${message.length}`);
            const prompt = prompts_1.PromptTemplate.fromTemplate(`You are a strictly compliant healthcare assistant guardrail.
Your goal is to ensure the user stays on topic (Medical, Symptoms, Health Documents, Medications).

If the user query relates to healthcare, medicine, clinical trials, medications, symptoms, or is a standard greeting (Hi, hello, etc.), respond with ONLY 'YES'.
Even if the query is a long document, if it contains medical terms or data, it is ALLOWED.

If the user query is NOT about healthcare at all (e.g., world news, sports, entertainment, recipes, general trivia, etc.):
1. Acknowledge what they asked briefly.
2. Politely explain that as a specialized healthcare assistant, you can't help with that specific non-medical topic.
3. Offer to help them with a medical-related curiosity or safety regulation instead.
4. Always prefix this rejection with "NO: "

Query: "{message}"`);
            // Use the standard string output parser
            const parser = new output_parsers_1.StringOutputParser();
            // Construct the LangChain Runnable sequence
            const chain = prompt.pipe(model).pipe(parser);
            // Execute the chain
            const response = await chain.invoke({ message });
            console.log(`[Guardrail] LLM Response: ${response.substring(0, 50)}...`);
            if (response.trim().toUpperCase().startsWith('YES')) {
                return { isAllowed: true };
            }
            else {
                let reason = response.trim();
                // Strip "NO: " or "NO " prefixes
                if (reason.toUpperCase().startsWith('NO:')) {
                    reason = reason.substring(3).trim();
                }
                else if (reason.toUpperCase().startsWith('NO ')) {
                    reason = reason.substring(3).trim();
                }
                // If it's just "NO" or empty, provide a polite fallback
                if (!reason || reason.toUpperCase() === 'NO') {
                    reason = "I'm just here to talk about healthcare related topics okay?";
                }
                return {
                    isAllowed: false,
                    reason: reason
                };
            }
        }
        catch (error) {
            console.warn('[Guardrail] LangChain failed, falling back to keywords:', error);
            return this.keywordCheck(message);
        }
    }
    static keywordCheck(message) {
        console.log('[Guardrail] Using keyword fallback');
        const healthcareKeywords = [
            'health', 'medicine', 'symptom', 'pain', 'doctor', 'pill', 'dose', 'fever',
            'medical', 'report', 'lab', 'test', 'blood', 'heart', 'headache', 'prescription',
            'hi', 'hello', 'hey', 'greetings', 'help', 'who'
        ];
        const lowerMessage = message.toLowerCase();
        const isAllowed = healthcareKeywords.some(kw => lowerMessage.includes(kw));
        return {
            isAllowed,
            reason: isAllowed ? undefined : "I'm sorry, I couldn't find any medical context in your request. I'm just here to help with your health today. How can I assist you with a medical curiosity instead?"
        };
    }
}
exports.GuardrailService = GuardrailService;
//# sourceMappingURL=guardrail.service.js.map