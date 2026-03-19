import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000';

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface SignupData {
  name: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

// Create axios instance with default config
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  async signup(data: SignupData): Promise<AuthResponse> {
    try {
      const response = await api.post<ApiResponse<AuthResponse>>('/api/auth/signup', data);
      
      if (response.data.success && response.data.data) {
        // Store token
        localStorage.setItem('token', response.data.data.token);
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Signup failed');
    } catch (error: any) {
      if (error.response?.data) {
        const apiError = error.response.data;
        if (apiError.errors) {
          throw new Error(apiError.errors.map((e: any) => e.message).join(', '));
        }
        throw new Error(apiError.message || 'Signup failed');
      }
      throw error;
    }
  },

  async login(data: LoginData): Promise<AuthResponse> {
    try {
      const response = await api.post<ApiResponse<AuthResponse>>('/api/auth/login', data);
      
      if (response.data.success && response.data.data) {
        // Store token
        localStorage.setItem('token', response.data.data.token);
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Login failed');
    } catch (error: any) {
      if (error.response?.data) {
        const apiError = error.response.data;
        if (apiError.errors) {
          throw new Error(apiError.errors.map((e: any) => e.message).join(', '));
        }
        throw new Error(apiError.message || 'Login failed');
      }
      throw error;
    }
  },

  async getCurrentUser(): Promise<User> {
    try {
      const response = await api.get<ApiResponse<{ user: User }>>('/api/auth/me');
      
      if (response.data.success && response.data.data) {
        return response.data.data.user;
      }
      
      throw new Error(response.data.message || 'Failed to get user');
    } catch (error: any) {
      if (error.response?.data) {
        const apiError = error.response.data;
        throw new Error(apiError.message || 'Failed to get user');
      }
      throw error;
    }
  },

  logout(): void {
    localStorage.removeItem('token');
  },

  getToken(): string | null {
    return localStorage.getItem('token');
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },
};
