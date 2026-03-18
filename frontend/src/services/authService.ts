/**
 * Auth Service
 * API-ready contracts (no implementation yet)
 * Will be wired to Node.js/TypeScript backend
 */

import type {
  AuthResponse,
  LoginRequest,
  SignupRequest,
  OAuthCallbackRequest,
  PasswordResetRequest,
  PasswordResetConfirm,
} from '@/types/auth';

export interface IAuthService {
  /**
   * Email/password login
   * @param email User email
   * @param password User password
   * @returns Authentication response with token and user data
   */
  loginWithEmail(credentials: LoginRequest): Promise<AuthResponse>;

  /**
   * Email/password signup
   * @param fullName User full name
   * @param email User email
   * @param password User password
   * @returns Authentication response with token and user data
   */
  signupWithEmail(credentials: SignupRequest): Promise<AuthResponse>;

  /**
   * Initiate Google OAuth flow
   * Redirects to Google consent screen
   */
  initiateGoogleOAuth(): void;

  /**
   * Initiate Apple OAuth flow
   * Redirects to Apple Sign In screen
   */
  initiateAppleOAuth(): void;

  /**
   * Handle OAuth callback
   * Extracts code from URL params and exchanges for token
   */
  handleOAuthCallback(params: OAuthCallbackRequest): Promise<AuthResponse>;

  /**
   * Request password reset email
   */
  requestPasswordReset(request: PasswordResetRequest): Promise<AuthResponse>;

  /**
   * Confirm password reset with token
   */
  resetPassword(request: PasswordResetConfirm): Promise<AuthResponse>;

  /**
   * Logout current session
   */
  logout(): Promise<AuthResponse>;

  /**
   * Refresh authentication token
   */
  refreshSession(): Promise<AuthResponse>;

  /**
   * Get current session user (or null if not authenticated)
   */
  getCurrentUser(): Promise<AuthResponse>;
}

/**
 * Auth Service Implementation
 * Constructor placeholder - will accept API client
 */
export class AuthService implements IAuthService {
  private apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

  constructor() {
    // Placeholder: will receive API client in constructor
  }

  async loginWithEmail(credentials: LoginRequest): Promise<AuthResponse> {
    // Placeholder: no implementation yet
    // Will POST to /auth/login
    return {
      success: false,
      error: 'Not implemented - awaiting backend API',
    };
  }

  async signupWithEmail(credentials: SignupRequest): Promise<AuthResponse> {
    // Placeholder: no implementation yet
    // Will POST to /auth/signup
    return {
      success: false,
      error: 'Not implemented - awaiting backend API',
    };
  }

  initiateGoogleOAuth(): void {
    // Placeholder: no implementation yet
    // Will redirect to /auth/google/authorize endpoint
    console.log('Google OAuth flow initiated (not implemented)');
  }

  initiateAppleOAuth(): void {
    // Placeholder: no implementation yet
    // Will redirect to /auth/apple/authorize endpoint
    console.log('Apple OAuth flow initiated (not implemented)');
  }

  async handleOAuthCallback(params: OAuthCallbackRequest): Promise<AuthResponse> {
    // Placeholder: no implementation yet
    // Will POST to /auth/oauth/callback
    return {
      success: false,
      error: 'Not implemented - awaiting backend API',
    };
  }

  async requestPasswordReset(request: PasswordResetRequest): Promise<AuthResponse> {
    // Placeholder: no implementation yet
    // Will POST to /auth/password-reset/request
    return {
      success: false,
      error: 'Not implemented - awaiting backend API',
    };
  }

  async resetPassword(request: PasswordResetConfirm): Promise<AuthResponse> {
    // Placeholder: no implementation yet
    // Will POST to /auth/password-reset/confirm
    return {
      success: false,
      error: 'Not implemented - awaiting backend API',
    };
  }

  async logout(): Promise<AuthResponse> {
    // Placeholder: no implementation yet
    // Will POST to /auth/logout
    return {
      success: false,
      error: 'Not implemented - awaiting backend API',
    };
  }

  async refreshSession(): Promise<AuthResponse> {
    // Placeholder: no implementation yet
    // Will POST to /auth/refresh
    return {
      success: false,
      error: 'Not implemented - awaiting backend API',
    };
  }

  async getCurrentUser(): Promise<AuthResponse> {
    // Placeholder: no implementation yet
    // Will GET /auth/me
    return {
      success: false,
      error: 'Not implemented - awaiting backend API',
    };
  }
}

// Singleton instance (will be created in app providers)
let authServiceInstance: AuthService | null = null;

export const getAuthService = (): AuthService => {
  if (!authServiceInstance) {
    authServiceInstance = new AuthService();
  }
  return authServiceInstance;
};
