export interface ChatRequest {
  userId: string;
  message: string;
  selectedLLM?: string;
}

export type ChatResponseType = 'general' | 'symptom' | 'medicine' | 'document' | 'blocked';

export interface ChatResponse {
  responseText: string;
  type: ChatResponseType;
}
