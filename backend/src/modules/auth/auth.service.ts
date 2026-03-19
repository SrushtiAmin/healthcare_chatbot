import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { User, UserWithoutPassword, AuthResponse } from './auth.types';
import { SignupInput, LoginInput } from './auth.schema';

// Local file JSON store
const USERS_FILE_PATH = path.join(__dirname, '../../../data/users.json');

const initializeUsers = (): User[] => {
  const dir = path.dirname(USERS_FILE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(USERS_FILE_PATH)) {
    fs.writeFileSync(USERS_FILE_PATH, '[]');
  }
  try {
    const data = fs.readFileSync(USERS_FILE_PATH, 'utf-8');
    const parsed = JSON.parse(data || '[]');
    return parsed.map((user: any) => ({
      ...user,
      createdAt: new Date(user.createdAt),
    }));
  } catch (err) {
    return [];
  }
};

const saveUsers = (usersToSave: User[]) => {
  fs.writeFileSync(USERS_FILE_PATH, JSON.stringify(usersToSave, null, 2));
};

let users: User[] = initializeUsers();

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
    // Reload users just in case it was modified by another request
    users = initializeUsers();

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

    // Store user globally and in file
    users.push(newUser);
    saveUsers(users);

    // Generate token and return response
    const userWithoutPassword = this.excludePassword(newUser);
    const token = this.generateToken(userWithoutPassword);

    return {
      token,
      user: userWithoutPassword,
    };
  }

  static async login(loginData: LoginInput): Promise<AuthResponse> {
    // Reload users
    users = initializeUsers();

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
    users = initializeUsers();
    const user = users.find(u => u.id === id);
    if (!user) {
      return null;
    }

    return this.excludePassword(user);
  }

  // Helper method for testing (remove in production)
  static getUsers(): UserWithoutPassword[] {
    users = initializeUsers();
    return users.map(user => this.excludePassword(user));
  }
}
