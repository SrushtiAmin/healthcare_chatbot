import { Response } from 'express';
import { AuthenticatedRequest } from '../auth/auth.types';
export declare class ChatController {
    static handleChat(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * Fetch all chat sessions for the logged-in user.
     */
    static handleGetSessions(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * Fetch all messages for a specific session.
     */
    static handleGetSessionMessages(req: AuthenticatedRequest, res: Response): Promise<void>;
    static handleGetHistory(req: AuthenticatedRequest, res: Response): Promise<void>;
}
//# sourceMappingURL=chat.controller.d.ts.map