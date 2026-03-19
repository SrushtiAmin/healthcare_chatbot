import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../../lib/prisma';
import { User, UserWithoutPassword, AuthResponse } from './auth.types';
import { SignupInput, LoginInput } from './auth.schema';

export class AuthService {
  private static generateToken(user: UserWithoutPassword): string {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    return jwt.sign(
      { id: user.id, email: user.email },
      jwtSecret,
      { expiresIn: '7d' }
    );
  }

  private static excludePassword(user: User): UserWithoutPassword {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  static async signup(signupData: SignupInput): Promise<AuthResponse> {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: signupData.email },
    });

    if (existingUser) {
      throw new Error('User already exists. Please sign in.');
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(signupData.password, saltRounds);

    // Create new user in database
    const newUser = await prisma.user.create({
      data: {
        name: signupData.name,
        email: signupData.email,
        password: hashedPassword,
      },
    });

    // Generate token and return response
    const userWithoutPassword = this.excludePassword(newUser);
    const token = this.generateToken(userWithoutPassword);

    return {
      token,
      user: userWithoutPassword,
    };
  }

  static async login(loginData: LoginInput): Promise<AuthResponse> {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: loginData.email },
    });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(loginData.password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Generate token and return response
    const userWithoutPassword = this.excludePassword(user);
    const token = this.generateToken(userWithoutPassword);

    return {
      token,
      user: userWithoutPassword,
    };
  }

  static async getUserById(id: number): Promise<UserWithoutPassword | null> {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return null;
    }

    return this.excludePassword(user);
  }

  // Helper method for testing (updated to use Prisma)
  static async getUsers(): Promise<UserWithoutPassword[]> {
    const users = await prisma.user.findMany();
    return users.map(user => this.excludePassword(user));
  }
}
