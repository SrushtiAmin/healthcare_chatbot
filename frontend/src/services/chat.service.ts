import { api } from './auth.service';

export interface ChatRequest {
  message: string;
  provider: string;
  model: string;
  sessionId?: string;
}

export interface ChatResponseData {
  responseText: string;
  type: 'general' | 'symptom' | 'medicine' | 'document' | 'blocked';
  sessionId: string;
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

      // If it's a blocked message, we still get session info but it might be in an error response
      throw new Error(response.data.message || 'Failed to send message');
    } catch (error: any) {
      if (error.response?.data) {
        // Handle blocked case where data contains sessionId
        if (error.response.data.data && error.response.data.data.sessionId) {
          throw {
            message: error.response.data.message,
            sessionId: error.response.data.data.sessionId,
            type: 'blocked'
          };
        }
        throw new Error(error.response.data.message || 'Failed to send message');
      }
      throw error;
    }
  },

  async getSessions(): Promise<any[]> {
    try {
      const response = await api.get<any>('/api/chat/sessions');
      if (response.data.success) {
        return response.data.data;
      }
      return [];
    } catch (error) {
      console.error('Sessions fetch error:', error);
      return [];
    }
  },

  async getMessages(sessionId: string): Promise<any[]> {
    try {
      const response = await api.get<any>(`/api/chat/sessions/${sessionId}/messages`);
      if (response.data.success) {
        return response.data.data;
      }
      return [];
    } catch (error) {
      console.error('Messages fetch error:', error);
      return [];
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
