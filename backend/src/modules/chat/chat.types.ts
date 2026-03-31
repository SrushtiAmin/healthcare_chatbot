import { BaseMessage } from '@langchain/core/messages';

export type LLMProvider = 'openai' | 'google' | 'anthropic' | 'groq';

export interface LLMRequest {
  message: string;
  provider: LLMProvider;
  model: string;
  history?: BaseMessage[];
}

export interface GuardrailResult {
  isAllowed: boolean;
  reason?: string;
}

export interface ChatRequest {
  userId: string;
  message: string;
  provider: LLMProvider;
  model: string;
  sessionId?: string;
}

export type ChatType = 'general' | 'symptom' | 'medicine' | 'document';
export type ChatResponseType = ChatType | 'blocked';

export interface ChatResponse {
  responseText: string;
  type: ChatResponseType;
  reason?: string;
  sessionId: string;
}

export interface RouteRequest {
  message: string;
  type: string;
  provider: LLMProvider;
  model: string;
  userId: string;
  history?: BaseMessage[];
}

export interface RouteResponse {
  response: string;
  type: string;
  source: string;
  context?: string;
}
