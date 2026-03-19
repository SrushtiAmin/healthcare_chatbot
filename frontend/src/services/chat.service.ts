import { api } from './auth.service';

export interface ChatRequest {
  message: string;
  provider: string;
  model: string;
}

export interface ChatResponseData {
  responseText: string;
  type: 'general' | 'symptom' | 'medicine' | 'document' | 'blocked';
}

export interface ChatApiResponse {
  success: boolean;
  data: ChatResponseData;
  message?: string;
}

export const chatService = {
  async sendMessage(request: ChatRequest): Promise<ChatResponseData> {
    try {
      const response = await api.post<ChatApiResponse>('/api/chat', request);

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error(response.data.message || 'Failed to send message');
    } catch (error: any) {
      if (error.response?.data) {
        throw new Error(error.response.data.message || 'Failed to send message');
      }
      throw error;
    }
  },

  async getHistory(): Promise<any[]> {
    try {
      const response = await api.get<any>('/api/chat/history');
      if (response.data.success) {
        return response.data.data;
      }
      return [];
    } catch (error) {
      console.error('History fetch error:', error);
      return [];
    }
  }
};
