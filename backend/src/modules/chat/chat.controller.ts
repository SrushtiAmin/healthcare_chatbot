import { Response } from 'express';
import { AuthenticatedRequest } from '../auth/auth.types';
import { chatRequestSchema } from './chat.schema';
import { ChatService } from './chat.service';

export class ChatController {
  public static async handleChat(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // 1. Extract user info from auth middleware
      const user = req.user;
      if (!user) {
        res.status(401).json({
          success: false,
          message: 'User authentication context is missing.',
        });
        return;
      }

      // 2. Validate input using Zod
      const parseResult = chatRequestSchema.safeParse(req.body);
      
      if (!parseResult.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid request data',
          errors: parseResult.error.errors,
        });
        return;
      }

      const validatedData = parseResult.data;

      // 3. Prepare ChatRequest type
      const chatRequest = {
        userId: user.id,
        message: validatedData.message,
        selectedLLM: validatedData.selectedLLM,
      };

      // 4. Call service logic
      const chatResponse = await ChatService.processChat(chatRequest);

      // 5. Return JSON response
      res.status(200).json({
        success: true,
        data: chatResponse,
      });
    } catch (error) {
      console.error('Chat processing error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error processing chat',
      });
    }
  }
}
