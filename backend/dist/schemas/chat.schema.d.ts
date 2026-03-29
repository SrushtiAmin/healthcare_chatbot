import { z } from 'zod';
export declare const chatRequestSchema: z.ZodObject<{
    message: z.ZodString;
    provider: z.ZodEnum<{
        openai: "openai";
        google: "google";
        anthropic: "anthropic";
        groq: "groq";
    }>;
    model: z.ZodString;
    sessionId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type ChatRequestDto = z.infer<typeof chatRequestSchema>;
//# sourceMappingURL=chat.schema.d.ts.map