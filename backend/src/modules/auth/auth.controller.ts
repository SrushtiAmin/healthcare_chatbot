import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { AuthenticatedRequest } from './auth.types';
import { signupSchema, loginSchema } from './auth.schema';
import { handleApiError } from '../../utils/errors';

export class AuthController {
  static async signup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = signupSchema.parse(req.body);
      const authResponse = await AuthService.signup(validatedData);

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: authResponse,
      });
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        res.status(409).json({ success: false, message: error.message });
        return;
      }
      handleApiError(error, res, 'AuthController.signup');
    }
  }

  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = loginSchema.parse(req.body);
      const authResponse = await AuthService.login(validatedData);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: authResponse,
      });
    } catch (error: any) {
      if (error.message.includes('Invalid email or password')) {
        res.status(401).json({ success: false, message: 'Invalid email or password' });
        return;
      }
      handleApiError(error, res, 'AuthController.login');
    }
  }

  static async getMe(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'User not authenticated' });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'User retrieved successfully',
        data: { user: req.user },
      });
    } catch (error) {
      handleApiError(error, res, 'AuthController.getMe');
    }
  }
}
