"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LLMService = void 0;
const openai_1 = __importDefault(require("openai"));
const generative_ai_1 = require("@google/generative-ai");
const sdk_1 = require("@anthropic-ai/sdk");
const groq_sdk_1 = require("groq-sdk");
class LLMService {
    static async generateResponse(request) {
        const { message, provider, model } = request;
        try {
            switch (provider) {
                case 'openai':
                    return await this.callOpenAI(message, model);
                case 'google':
                    return await this.callGemini(message, model);
                case 'anthropic':
                    return await this.callClaude(message, model);
                case 'groq':
                    return await this.callGroq(message, model);
                default:
                    throw new Error('Invalid LLM provider specified');
            }
        }
        catch (error) {
            console.error(`Error in LLMService [${provider}]:`, error);
            throw new Error(`LLM Failure: ${error.message}`);
        }
    }
    static async callOpenAI(message, model) {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey)
            throw new Error('Missing OpenAI API Key');
        const openai = new openai_1.default({ apiKey });
        const response = await openai.chat.completions.create({
            model: model || process.env.OPENAI_MODEL || 'gpt-4o',
            messages: [
                { role: 'system', content: this.SYSTEM_PROMPT },
                { role: 'user', content: message },
            ],
        });
        return response.choices[0].message?.content || 'No response from OpenAI';
    }
    static async callGemini(message, model) {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey)
            throw new Error('Missing Gemini API Key');
        const genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
        const geminiModel = genAI.getGenerativeModel({
            model: model || process.env.GEMINI_MODEL || 'gemini-1.5-flash',
            systemInstruction: this.SYSTEM_PROMPT
        });
        const result = await geminiModel.generateContent(message);
        const response = await result.response;
        return response.text();
    }
    static async callClaude(message, model) {
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey)
            throw new Error('Missing Anthropic API Key');
        const anthropic = new sdk_1.Anthropic({ apiKey });
        const response = await anthropic.messages.create({
            model: model || process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20240620',
            max_tokens: 1024,
            system: this.SYSTEM_PROMPT,
            messages: [{ role: 'user', content: message }],
        });
        const content = response.content[0];
        if (content.type === 'text') {
            return content.text;
        }
        return 'No text response from Claude';
    }
    static async callGroq(message, model) {
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey)
            throw new Error('Missing Groq API Key');
        const groq = new groq_sdk_1.Groq({ apiKey });
        const response = await groq.chat.completions.create({
            model: model || process.env.GROQ_MODEL || 'llama3-8b-8192',
            messages: [
                { role: 'system', content: this.SYSTEM_PROMPT },
                { role: 'user', content: message },
            ],
        });
        return response.choices[0].message?.content || 'No response from Groq';
    }
}
exports.LLMService = LLMService;
LLMService.SYSTEM_PROMPT = "You are a healthcare assistant. Only answer healthcare-related queries.";
//# sourceMappingURL=llm.service.js.map