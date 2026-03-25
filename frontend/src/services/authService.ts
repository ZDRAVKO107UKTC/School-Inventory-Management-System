import type {
  ApiResult,
  AuthSession,
  LoginRequest,
  SignupRequest,
  User,
} from '@/types/auth';
import { apiRequest } from '@/services/apiClient';

export interface IAuthService {
  loginWithEmail(credentials: LoginRequest): Promise<ApiResult<AuthSession>>;
  signupWithEmail(credentials: SignupRequest): Promise<ApiResult<AuthSession>>;
  getGoogleAuthUrl(): Promise<ApiResult<{ url: string }>>;
  exchangeGoogleCode(code: string): Promise<ApiResult<AuthSession>>;
  getTelegramAuthUrl(): Promise<ApiResult<{ url: string }>>;
  verifyTelegramAuth(payload: Record<string, string>): Promise<ApiResult<AuthSession>>;
  logout(refreshToken?: string): Promise<ApiResult<null>>;
  refreshSession(refreshToken?: string): Promise<ApiResult<AuthSession>>;
  getCurrentUser(token: string): Promise<ApiResult<User>>;
}

export class AuthService implements IAuthService {
  async getGoogleAuthUrl(): Promise<ApiResult<{ url: string }>> {
    const result = await apiRequest<{ url: string }>('/auth/google/url', {
      method: 'GET',
    });

    if (!result.success || !result.data) return { success: false, error: result.error };
    return { success: true, data: { url: result.data.url } };
  }

  async exchangeGoogleCode(code: string): Promise<ApiResult<AuthSession>> {
    const result = await apiRequest<{
      accessToken: string;
      user: User;
      message?: string;
    }>('/auth/google/exchange', {
      method: 'POST',
      body: { code },
    });

    if (!result.success || !result.data) return { success: false, error: result.error };

    return {
      success: true,
      data: {
        accessToken: result.data.accessToken,
        user: result.data.user,
      },
      message: result.data.message || 'Google authentication successful',
    };
  }

  async getTelegramAuthUrl(): Promise<ApiResult<{ url: string }>> {
    const result = await apiRequest<{ url: string }>('/auth/telegram/url', {
      method: 'GET',
    });

    if (!result.success || !result.data) return { success: false, error: result.error };
    return { success: true, data: { url: result.data.url } };
  }

  async verifyTelegramAuth(payload: Record<string, string>): Promise<ApiResult<AuthSession>> {
    const result = await apiRequest<{
      accessToken: string;
      user: User;
      message?: string;
    }>('/auth/telegram/verify', {
      method: 'POST',
      body: payload,
    });

    if (!result.success || !result.data) return { success: false, error: result.error };

    return {
      success: true,
      data: {
        accessToken: result.data.accessToken,
        user: result.data.user,
      },
      message: result.data.message || 'Telegram authentication successful',
    };
  }

  async loginWithEmail(credentials: LoginRequest): Promise<ApiResult<AuthSession>> {
    const result = await apiRequest<{
      accessToken: string;
      user: User;
      message?: string;
    }>('/auth/login', {
      method: 'POST',
      body: credentials,
    });

    if (!result.success || !result.data) return { success: false, error: result.error };

    return {
      success: true,
      data: {
        accessToken: result.data.accessToken,
        user: result.data.user,
      },
      message: result.data.message || 'Login successful',
    };
  }

  async signupWithEmail(credentials: SignupRequest): Promise<ApiResult<AuthSession>> {
    const registerResult = await apiRequest<{ user: User; message?: string }>('/auth/register', {
      method: 'POST',
      body: credentials,
    });

    if (!registerResult.success) {
      return { success: false, error: registerResult.error };
    }

    const loginResult = await this.loginWithEmail({
      email: credentials.email,
      password: credentials.password,
    });

    if (!loginResult.success) {
      return {
        success: false,
        error: loginResult.error || 'Registration succeeded but automatic login failed',
      };
    }

    return {
      success: true,
      data: loginResult.data,
      message: registerResult.data?.message || 'User registered successfully',
    };
  }

  async logout(refreshToken?: string): Promise<ApiResult<null>> {
    const result = await apiRequest<{ message?: string }>('/auth/logout', {
      method: 'POST',
      body: refreshToken ? { refreshToken } : {},
    });

    if (!result.success) return { success: false, error: result.error };

    return {
      success: true,
      data: null,
      message: result.data?.message || 'Logout successful',
    };
  }

  async refreshSession(refreshToken?: string): Promise<ApiResult<AuthSession>> {
    const result = await apiRequest<{
      accessToken: string;
      user: User;
      message?: string;
    }>('/auth/refresh', {
      method: 'POST',
      body: refreshToken ? { refreshToken } : {},
    });

    if (!result.success || !result.data) return { success: false, error: result.error };

    return {
      success: true,
      data: {
        accessToken: result.data.accessToken,
        user: result.data.user,
      },
      message: result.data.message || 'Session refreshed',
    };
  }

  async getCurrentUser(token: string): Promise<ApiResult<User>> {
    const result = await apiRequest<{
      user: {
        id?: number;
        userId?: number;
        username?: string;
        email: string;
        role: User['role'];
      };
    }>('/users/profile', {
      method: 'GET',
      token,
    });

    if (!result.success || !result.data) return { success: false, error: result.error };

    return {
      success: true,
      data: {
        id: result.data.user.id || result.data.user.userId || 0,
        username: result.data.user.username || result.data.user.email.split('@')[0],
        email: result.data.user.email,
        role: result.data.user.role,
      },
    };
  }
}

let authServiceInstance: AuthService | null = null;

export const getAuthService = (): AuthService => {
  if (!authServiceInstance) {
    authServiceInstance = new AuthService();
  }
  return authServiceInstance;
};
