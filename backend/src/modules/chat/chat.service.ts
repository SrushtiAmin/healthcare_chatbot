import prisma from '../../lib/prisma';
import { ChatRequest, ChatResponse, ChatResponseType } from './chat.types';
import { GuardrailService } from './guardrail';
import { ClassifierService } from './classifier';
import { LLMService } from './llm.service';

export class ChatService {
  /**
   * Main entry point for processing a chat message.
   */
  public static async processChat(request: ChatRequest): Promise<ChatResponse> {
    try {
      // 1. Guardrail (BLOCK non-healthcare queries)
      const guardrail = await GuardrailService.checkMessage(request.message);
      if (!guardrail.isAllowed) {
        return {
          responseText: "Please be restricted toward healthcare queries only.",
          type: 'blocked',
          reason: guardrail.reason,
        };
      }

      // 2. Classifier (Determine query type)
      const queryType = await ClassifierService.classifyMessage(request.message);

      // 3. LLM Service (Get real response)
      const responseText = await LLMService.generateResponse({
        message: request.message,
        provider: request.provider,
        model: request.model,
      });

      // 4. SAVE TO DATABASE (Include all new fields)
      await prisma.chat.create({
        data: {
          userId: request.userId,
          message: request.message,
          response: responseText,
          type: queryType,
          provider: request.provider,
          model: request.model,
        },
      });

      return {
        responseText,
        type: queryType,
      };
    } catch (error) {
      console.error('Error in ChatService:', error);
      throw error;
    }
  }

  /**
   * Fetch chat history for a specific user.
   */
  public static async getChatHistory(userId: number) {
    return prisma.chat.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
