import { z } from 'zod';

export const chatRequestSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty'),
  provider: z.enum(['openai', 'google', 'anthropic', 'groq']),
  model: z.string().min(1, 'Model must be selected'),
  sessionId: z.string().uuid().optional(),
});

export type ChatRequestDto = z.infer<typeof chatRequestSchema>;
