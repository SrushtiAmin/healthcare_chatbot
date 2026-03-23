import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.types';
export declare class AuthController {
    static signup(req: Request, res: Response, next: NextFunction): Promise<void>;
    static login(req: Request, res: Response, next: NextFunction): Promise<void>;
    static getMe(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
}
//# sourceMappingURL=auth.controller.d.ts.map