import { UserWithoutPassword, AuthResponse } from './auth.types';
import { SignupInput, LoginInput } from './auth.schema';
export declare class AuthService {
    private static generateToken;
    private static excludePassword;
    static signup(signupData: SignupInput): Promise<AuthResponse>;
    static login(loginData: LoginInput): Promise<AuthResponse>;
    static getUserById(id: string): Promise<UserWithoutPassword | null>;
    static getUsers(): Promise<UserWithoutPassword[]>;
}
//# sourceMappingURL=auth.service.d.ts.map