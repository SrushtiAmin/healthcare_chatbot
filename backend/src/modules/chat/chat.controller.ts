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
      };

      // 4. Call service logic
      const chatResponse = await ChatService.processChat(chatRequest);

      // Handle guardrail blocking
      if (chatResponse.type === 'blocked') {
        res.status(403).json({
          success: false,
          message: chatResponse.responseText,
          reason: chatResponse.reason
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
