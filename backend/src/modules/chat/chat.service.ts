import { ChatRequest, ChatResponse, ChatResponseType } from './chat.types';

export class ChatService {
  /**
   * Main entry point for processing a chat message.
   */
  public static async processChat(request: ChatRequest): Promise<ChatResponse> {
    try {
      // 1. Guardrail (Block non-healthcare queries)
      const isHealthcareRelated = await this.callGuardrail(request.message);
      if (!isHealthcareRelated) {
        return {
          responseText: "I can only assist with healthcare-related queries. Please ask me about symptoms, medicines, or health documents.",
          type: 'blocked',
        };
      }

      // 2. Classifier (Determine query type)
      const queryType = await this.callClassifier(request.message);

      // 3. Router (Forward query to LLM / Function / RAG)
      const responseText = await this.callRouter(request.message, queryType, request.selectedLLM, request.userId);

      return {
        responseText,
        type: queryType,
      };
    } catch (error) {
      console.error('Error in ChatService:', error);
      throw error;
    }
  }

  // --- Placeholder Integrations for other modules ---

  /**
   * Guardrail Module: Checks if the query is safe and healthcare-related.
   */
  private static async callGuardrail(message: string): Promise<boolean> {
    // Placeholder implementation
    // In a real scenario, this would call the actual Guardrail module/service
    const blockedKeywords = ['hack', 'illegal', 'bomb', 'recipe', 'politics'];
    const lowerMessage = message.toLowerCase();
    
    if (blockedKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return false; // Blocked
    }
    
    return true; // Allowed
  }

  /**
   * Classifier Module: Determines the intent/category of the query.
   */
  private static async callClassifier(message: string): Promise<ChatResponseType> {
    // Placeholder implementation
    // In a real scenario, this would use NLP/LLM to classify
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('symptom') || lowerMessage.includes('pain') || lowerMessage.includes('fever')) {
      return 'symptom';
    }
    
    if (lowerMessage.includes('medicine') || lowerMessage.includes('pill') || lowerMessage.includes('dose')) {
      return 'medicine';
    }
    
    if (lowerMessage.includes('document') || lowerMessage.includes('report') || lowerMessage.includes('pdf')) {
      return 'document';
    }

    return 'general';
  }

  /**
   * Router Module: Routes to the appropriate processing pipeline (LLM/RAG/Function).
   */
  private static async callRouter(
    message: string, 
    type: ChatResponseType, 
    selectedLLM?: string,
    userId?: string
  ): Promise<string> {
    // Placeholder implementation
    // Depending on the 'type', this would call the appropriate agent or retrieval system
    
    const llmName = selectedLLM || 'default-llm';
    
    switch (type) {
      case 'symptom':
        return `[Processed by ${llmName} - Symptom Pipeline] You mentioned a symptom. Please consult a real doctor if it's an emergency. Based on standard knowledge, ensure you rest and hydrate.`;
      case 'medicine':
        return `[Processed by ${llmName} - Medicine Pipeline] Regarding your medication query: Please take medications only as prescribed. Can you provide the specific medicine name?`;
      case 'document':
        return `[Processed by ${llmName} - RAG Pipeline] I have queried your uploaded health documents to find this answer.`;
      case 'general':
      default:
        return `[Processed by ${llmName} - General LLM] Hello! I am your healthcare assistant. How can I help you today?`;
    }
  }
}
