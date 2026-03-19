import { z } from 'zod';

export const chatRequestSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty'),
  selectedLLM: z.string().optional(),
});

export type ChatRequestDto = z.infer<typeof chatRequestSchema>;
