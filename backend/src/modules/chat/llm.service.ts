import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Anthropic } from '@anthropic-ai/sdk';
import { Groq } from 'groq-sdk';

export type LLMProvider = 'openai' | 'google' | 'anthropic' | 'groq';

export interface LLMRequest {
    message: string;
    provider: LLMProvider;
    model: string;
}

export class LLMService {
    private static readonly SYSTEM_PROMPT = "You are a healthcare assistant. Only answer healthcare-related queries.";

    public static async generateResponse(request: LLMRequest): Promise<string> {
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
        } catch (error: any) {
            console.error(`Error in LLMService [${provider}]:`, error);
            throw new Error(`LLM Failure: ${error.message}`);
        }
    }

    private static async callOpenAI(message: string, model: string): Promise<string> {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) throw new Error('Missing OpenAI API Key');

        const openai = new OpenAI({ apiKey });
        const response = await openai.chat.completions.create({
            model: model || process.env.OPENAI_MODEL || 'gpt-4o',
            messages: [
                { role: 'system', content: this.SYSTEM_PROMPT },
                { role: 'user', content: message },
            ],
        });

        return response.choices[0].message?.content || 'No response from OpenAI';
    }

    private static async callGemini(message: string, model: string): Promise<string> {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error('Missing Gemini API Key');

        const genAI = new GoogleGenerativeAI(apiKey);
        const geminiModel = genAI.getGenerativeModel({
            model: model || process.env.GEMINI_MODEL || 'gemini-1.5-flash',
            systemInstruction: this.SYSTEM_PROMPT
        });

        const result = await geminiModel.generateContent(message);
        const response = await result.response;
        return response.text();
    }

    private static async callClaude(message: string, model: string): Promise<string> {
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) throw new Error('Missing Anthropic API Key');

        const anthropic = new Anthropic({ apiKey });
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

    private static async callGroq(message: string, model: string): Promise<string> {
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) throw new Error('Missing Groq API Key');

        const groq = new Groq({ apiKey });
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
