"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatRequestSchema = void 0;
const zod_1 = require("zod");
exports.chatRequestSchema = zod_1.z.object({
    message: zod_1.z.string().min(1, 'Message cannot be empty'),
    provider: zod_1.z.enum(['openai', 'google', 'anthropic', 'groq']),
    model: zod_1.z.string().min(1, 'Model must be selected'),
    sessionId: zod_1.z.string().min(1, 'Session ID is required').optional(),
});
//# sourceMappingURL=chat.schema.js.map