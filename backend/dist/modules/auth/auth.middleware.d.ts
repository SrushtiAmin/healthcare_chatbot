import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.types';
export declare const authenticateToken: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=auth.middleware.d.ts.map