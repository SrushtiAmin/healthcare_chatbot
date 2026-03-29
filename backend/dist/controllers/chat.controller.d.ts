import { Response } from 'express';
import { AuthenticatedRequest } from '../types/auth.types';
export declare class ChatController {
    static handleChat(req: AuthenticatedRequest, res: Response): Promise<void>;
    static handleGetHistory(req: AuthenticatedRequest, res: Response): Promise<void>;
    static handleUpload(req: AuthenticatedRequest, res: Response): Promise<void>;
}
//# sourceMappingURL=chat.controller.d.ts.map