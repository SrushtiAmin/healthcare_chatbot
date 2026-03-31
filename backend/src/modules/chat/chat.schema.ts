import { z } from 'zod';
import { AI_CONFIG } from './chat.constants';

export const chatRequestSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty'),
  provider: z.enum(AI_CONFIG.PROVIDERS as any),
  model: z.string().min(1, 'Model must be selected'),
  sessionId: z.string().uuid().optional(),
});

export type ChatRequestDto = z.infer<typeof chatRequestSchema>;
