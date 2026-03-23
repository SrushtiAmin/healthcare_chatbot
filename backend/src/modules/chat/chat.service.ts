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
      // 1. Guardrail (BLOCK non-healthcare/safety violations)
      const guardrail = await GuardrailService.checkMessage(request.message);
      if (!guardrail.isAllowed) {
        return {
          responseText: "Sorry, I can only answer health or medical related questions. You can also upload medical-related images and files for analysis.",
          type: 'blocked',
          reason: guardrail.reason,
          sessionId: request.sessionId || 'temporary',
        };
      }
      const isActuallyBlocked = false; // Proceed only if allowed

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

      // 4. SESSION HANDLING
      let currentSessionId = request.sessionId;

      if (!currentSessionId) {
        // Create a new session if not provided
        const title = await LLMService.generateTitle(request.message);
        const session = await prisma.chatSession.create({
          data: { userId: request.userId, title }
        });
        currentSessionId = session.id;
      } else if (queryType !== 'general') {
        // AUTO-UPDATE TITLE: If the session already exists but the current query is specific (symptom/medicine/doc)
        // and its current title was generic, update it to reflect the core topic.
        const session = await prisma.chatSession.findUnique({ where: { id: currentSessionId } });
        const genericTitles = ['Medical Consultation', 'Hi', 'Hello', 'New Chat'];

        if (session && genericTitles.some(gt => session.title?.toLowerCase().includes(gt.toLowerCase()))) {
          const newTitle = await LLMService.generateTitle(request.message);
          await prisma.chatSession.update({
            where: { id: currentSessionId },
            data: { title: newTitle }
          });
        }
      }

      // 5. SAVE TO DATABASE (Include all new fields)
      await prisma.chat.create({
        data: {
          userId: request.userId,
          sessionId: currentSessionId,
          message: request.message,
          response: routerResponse.response,
          type: queryType,
          provider: request.provider,
          model: request.model,
          source: routerResponse.source,
          context: routerResponse.context || null,
        },
      });

      // Update session timestamp
      await prisma.chatSession.update({
        where: { id: currentSessionId },
        data: { updatedAt: new Date() }
      });

      return {
        responseText: routerResponse.response,
        type: (isActuallyBlocked ? 'blocked' : queryType) as ChatResponseType,
        sessionId: currentSessionId,
      };
    } catch (error) {
      console.error('Error in ChatService:', error);
      throw error;
    }
  }

  /**
   * Fetch all sessions for a specific user.
   */
  public static async getSessions(userId: string) {
    return prisma.chatSession.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  /**
   * Fetch all messages for a specific session.
   */
  public static async getSessionMessages(sessionId: string, userId: string) {
    return prisma.chat.findMany({
      where: {
        sessionId,
        userId // Ensure user owns the session
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * OBSOLETE: Old method to fetch chat history (all at once)
   */
  public static async getChatHistory(userId: string) {
    return prisma.chat.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
  }
}
