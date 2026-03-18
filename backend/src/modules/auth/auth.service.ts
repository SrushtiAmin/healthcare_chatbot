import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User, UserWithoutPassword, AuthResponse } from './auth.types';
import { SignupInput, LoginInput } from './auth.schema';

// In-memory user storage (replace with database in production)
const users: User[] = [];

export class AuthService {
  private static generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

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
    const existingUser = users.find(user => user.email === signupData.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(signupData.password, saltRounds);

    // Create new user
    const newUser: User = {
      id: this.generateId(),
      name: signupData.name,
      email: signupData.email,
      password: hashedPassword,
      createdAt: new Date(),
    };

    // Store user (in memory for now)
    users.push(newUser);

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
    const user = users.find(u => u.email === loginData.email);
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

  static async getUserById(id: string): Promise<UserWithoutPassword | null> {
    const user = users.find(u => u.id === id);
    if (!user) {
      return null;
    }

    return this.excludePassword(user);
  }

  // Helper method for testing (remove in production)
  static getUsers(): UserWithoutPassword[] {
    return users.map(user => this.excludePassword(user));
  }
}
