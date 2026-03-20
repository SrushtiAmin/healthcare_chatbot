import prisma from '../../lib/prisma';
import { ChatRequest, ChatResponse, ChatResponseType } from './chat.types';
import { GuardrailService } from './guardrail';
import { ClassifierService } from './classifier';
import { LLMService } from './llm.service';
import { RouterModule } from './router';

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

      // 3. Router Module (Centralized routing based on classification)
      const routerResponse = await RouterModule.routeQuery({
        message: request.message,
        type: queryType,
        provider: request.provider,
        model: request.model,
        userId: request.userId,
      });

      // 4. SAVE TO DATABASE (Include all new fields)
      await prisma.chat.create({
        data: {
          userId: request.userId,
          message: request.message,
          response: routerResponse.response,
          type: queryType,
          provider: request.provider,
          model: request.model,
          source: routerResponse.source,
          context: routerResponse.context || null,
        },
      });

      return {
        responseText: routerResponse.response,
        type: queryType as ChatResponseType,
      };
    } catch (error) {
      console.error('Error in ChatService:', error);
      throw error;
    }
  }

  /**
   * Fetch chat history for a specific user.
   */
  public static async getChatHistory(userId: string) {
    return prisma.chat.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
  }
}
