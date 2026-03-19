import { Request } from 'express';
import jwt from 'jsonwebtoken';

export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
}

export interface UserWithoutPassword {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
}

export interface AuthResponse {
  token: string;
  user: UserWithoutPassword;
}

export interface JwtPayload {
  id: number;
  email: string;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends Request {
  user?: UserWithoutPassword;
}
