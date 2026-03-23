"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../../lib/prisma"));
class AuthService {
    static generateToken(user) {
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new Error('JWT_SECRET is not defined in environment variables');
        }
        return jsonwebtoken_1.default.sign({ id: user.id, email: user.email }, jwtSecret, { expiresIn: '7d' });
    }
    static excludePassword(user) {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }
    static async signup(signupData) {
        // Check if user already exists
        const existingUser = await prisma_1.default.user.findUnique({
            where: { email: signupData.email },
        });
        if (existingUser) {
            throw new Error('User already exists. Please sign in.');
        }
        // Hash password
        const saltRounds = 12;
        const hashedPassword = await bcrypt_1.default.hash(signupData.password, saltRounds);
        // Create new user in database
        const newUser = await prisma_1.default.user.create({
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
    static async login(loginData) {
        // Find user by email
        const user = await prisma_1.default.user.findUnique({
            where: { email: loginData.email },
        });
        if (!user) {
            throw new Error('Invalid email or password');
        }
        // Compare password
        const isPasswordValid = await bcrypt_1.default.compare(loginData.password, user.password);
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
    static async getUserById(id) {
        const user = await prisma_1.default.user.findUnique({
            where: { id },
        });
        if (!user) {
            return null;
        }
        return this.excludePassword(user);
    }
    // Helper method for testing (updated to use Prisma)
    static async getUsers() {
        const users = await prisma_1.default.user.findMany();
        return users.map(user => this.excludePassword(user));
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=auth.service.js.map