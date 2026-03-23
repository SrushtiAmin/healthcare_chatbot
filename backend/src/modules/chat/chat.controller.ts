import { Response } from 'express';
import { AuthenticatedRequest } from '../auth/auth.types';
import { chatRequestSchema } from './chat.schema';
import { ChatService } from './chat.service';
import { handleApiError } from '../../utils/errors';

export class ChatController {
  public static async handleChat(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, message: 'User authentication context is missing.' });
        return;
      }

      const parseResult = chatRequestSchema.safeParse(req.body);
      if (!parseResult.success) {
        handleApiError(parseResult.error, res, 'ChatController.handleChat');
        return;
      }

      const validatedData = parseResult.data;

      // 3. Prepare ChatRequest type
      const chatRequest = {
        userId: user.id,
        message: validatedData.message,
        provider: validatedData.provider,
        model: validatedData.model,
        sessionId: validatedData.sessionId, // PASS SESSION ID
      };

      // 4. Call service logic
      const chatResponse = await ChatService.processChat(chatRequest);

      // Handle guardrail blocking (Return as success so it shows as a normal message)
      if (chatResponse.type === 'blocked') {
        res.status(200).json({
          success: true,
          data: chatResponse,
        });
        return;
      }

      // 5. Return JSON response
      res.status(200).json({
        success: true,
        data: chatResponse,
      });
    } catch (error) {
      handleApiError(error, res, 'ChatController.handleChat');
    }
  }

  /**
   * Fetch all chat sessions for the logged-in user.
   */
  public static async handleGetSessions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, message: 'User authentication context is missing.' });
        return;
      }

      const sessions = await ChatService.getSessions(user.id);

      res.status(200).json({
        success: true,
        data: sessions,
      });
    } catch (error) {
      handleApiError(error, res, 'ChatController.handleGetSessions');
    }
  }

  /**
   * Fetch all messages for a specific session.
   */
  public static async handleGetSessionMessages(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, message: 'User authentication context is missing.' });
        return;
      }

      const { sessionId } = req.params;
      if (!sessionId) {
        res.status(400).json({ success: false, message: 'Session ID is required.' });
        return;
      }

      const messages = await ChatService.getSessionMessages(sessionId as string, user.id);

      res.status(200).json({
        success: true,
        data: messages,
      });
    } catch (error) {
      handleApiError(error, res, 'ChatController.handleGetSessionMessages');
    }
  }

  public static async handleGetHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, message: 'User authentication context is missing.' });
        return;
      }

      const history = await ChatService.getChatHistory(user.id);

      res.status(200).json({
        success: true,
        data: history,
      });
    } catch (error) {
      handleApiError(error, res, 'ChatController.handleGetHistory');
    }
  }
}
