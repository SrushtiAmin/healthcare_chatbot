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
    /**
     * Medical Fine-Tuned System Prompt
     * This instructs the LLM to behave with clinical precision, evidence-based reasoning, 
     * and strict medical boundary enforcement.
     */
    private static readonly SYSTEM_PROMPT = `
You are a highly specialized AI Healthcare Assistant named "Vaidya AI". 
Your core directive is to provide precise, evidence-based, and clinically sound information.

CONSTRAINTS & TUNING:
1. ONLY answer healthcare-related queries (symptoms, medications, lab reports, wellness).
2. For document analysis: Strictly use the provided context. If the data is ambiguous, state the ambiguity.
3. Clinical Precision: Use professional medical terminology but explain it simply for the patient.
4. Boundaries: Do NOT provide life-or-death emergency advice. Always advise consulting a physical doctor for critical issues.
5. Factual Accuracy: Prioritize accuracy over creativity. If you don't know, say you don't know.
6. Conciseness: Give structured, easy-to-read responses using markdown (bullet points, bold text).

Current User Consultation Context below:
`.trim();

    /**
     * Low temperature (0.1) is used across all providers to ensure 
     * high factual consistency and minimal creative hallucination.
     */
    private static readonly DEFAULT_TEMPERATURE = 0.1;

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
            temperature: this.DEFAULT_TEMPERATURE,
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

        const result = await geminiModel.generateContent({
            contents: [{ role: 'user', parts: [{ text: message }] }],
            generationConfig: {
                temperature: this.DEFAULT_TEMPERATURE,
                topP: 0.9,
            }
        });
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
            temperature: this.DEFAULT_TEMPERATURE,
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
            model: model || process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
            temperature: this.DEFAULT_TEMPERATURE,
            messages: [
                { role: 'system', content: this.SYSTEM_PROMPT },
                { role: 'user', content: message },
            ],
        });

        return response.choices[0].message?.content || 'No response from Groq';
    }
}
