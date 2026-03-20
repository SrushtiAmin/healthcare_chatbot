import { LLMProvider } from './llm.service';

export interface ChatRequest {
  userId: string;
  message: string;
  provider: LLMProvider;
  model: string;
}

export type ChatResponseType = 'general' | 'symptom' | 'medicine' | 'document' | 'blocked';

export interface ChatResponse {
  responseText: string;
  type: ChatResponseType;
  reason?: string; // Add reason for blocked messages
}
