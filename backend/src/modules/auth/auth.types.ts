import { Request } from 'express';
import jwt from 'jsonwebtoken';

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
}

export interface UserWithoutPassword {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

export interface AuthResponse {
  token: string;
  user: UserWithoutPassword;
}

export interface JwtPayload {
  id: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends Request {
  user?: UserWithoutPassword;
}
