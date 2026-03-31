import prisma from '../../lib/prisma';
import { ChatRequest, ChatResponse, ChatResponseType } from './chat.types';
import { GuardrailService } from './guardrail.service';
import { ClassifierService } from './classifier.service';
import { LLMService } from './llm.service';
import { RouterModule } from './router.service';
import { AIMessage, HumanMessage, BaseMessage } from '@langchain/core/messages';
import { ERROR_MESSAGES, AI_CONFIG } from './chat.constants';

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
          responseText: ERROR_MESSAGES.NOT_HEALTH_RELATED,
          type: 'blocked',
          reason: guardrail.reason,
          sessionId: request.sessionId || 'temporary',
        };
      }
      const isActuallyBlocked = false;

      // 2. Fetch Chat History for context-aware conversation (Memory)
      let history: BaseMessage[] = [];
      if (request.sessionId) {
        const lastMessages = await prisma.chat.findMany({
          where: { sessionId: request.sessionId, userId: request.userId },
          orderBy: { createdAt: 'desc' },
          take: 10,
        });

        // Reverse to get chronological order and map to LangChain classes
        history = lastMessages.reverse().map(msg => {
          return msg.response
            ? [new HumanMessage(msg.message), new AIMessage(msg.response)]
            : [new HumanMessage(msg.message)];
        }).flat();
      }

      // 3. Classifier (Determine query type)
      const queryType = await ClassifierService.classifyMessage(request.message);

      // 4. Router Module (Using LangChain Chain internally)
      const routerResponse = await RouterModule.routeQuery({
        message: request.message,
        type: queryType,
        provider: request.provider,
        model: request.model,
        userId: request.userId,
        history, // Pass history to LangChain
      });

      // 5. SESSION HANDLING
      let currentSessionId = request.sessionId;

      if (!currentSessionId) {
        const title = await LLMService.generateTitle(request.message);
        const session = await prisma.chatSession.create({
          data: { userId: request.userId, title }
        });
        currentSessionId = session.id;
      } else if (queryType !== 'general') {
        const session = await prisma.chatSession.findUnique({ where: { id: currentSessionId } });
        const genericTitles = AI_CONFIG.GENERIC_TITLES;

        if (session && genericTitles.some(gt => session.title?.toLowerCase().includes(gt.toLowerCase()))) {
          const newTitle = await LLMService.generateTitle(request.message);
          await prisma.chatSession.update({
            where: { id: currentSessionId },
            data: { title: newTitle }
          });
        }
      }

      // 6. SAVE TO DATABASE
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

  public static async getSessions(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [sessions, total] = await Promise.all([
      prisma.chatSession.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.chatSession.count({ where: { userId } })
    ]);

    return {
      sessions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  public static async getSessionMessages(sessionId: string, userId: string) {
    return prisma.chat.findMany({
      where: { sessionId, userId },
      orderBy: { createdAt: 'asc' },
    });
  }

  public static async getChatHistory(userId: string) {
    return prisma.chat.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
  }
}

