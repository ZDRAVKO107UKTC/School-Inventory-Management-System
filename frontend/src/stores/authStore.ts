import { create } from 'zustand';
import type { User, AuthMode } from '@/types/auth';
import { getAuthService } from '@/services/authService';

export interface AuthStore {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  error: string | null;
  mode: AuthMode;
  token: string | null;
  showForgotPassword: boolean;
  isOAuthLoading: boolean;
  oauthProvider: 'google' | 'apple' | null;
  setMode: (mode: AuthMode) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setIsAuthenticated: (authenticated: boolean) => void;
  setShowForgotPassword: (show: boolean) => void;
  setOAuthLoading: (loading: boolean, provider?: 'google' | 'apple') => void;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (username: string, email: string, password: string) => Promise<boolean>;
  hydrateSession: () => Promise<void>;
  logout: () => Promise<void>;
  resetAuthState: () => void;
}

const SESSION_KEY = 'sims_auth_session';

const initialState = {
  isAuthenticated: false,
  user: null,
  isLoading: false,
  error: null,
  mode: 'login' as AuthMode,
  token: null,
  showForgotPassword: false,
  isOAuthLoading: false,
  oauthProvider: null,
};

const saveSession = (token: string, user: User) => {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ token, user }));
};

const readSession = (): { token: string; user: User } | null => {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as { token: string; user: User };
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
};

const clearSession = () => {
  localStorage.removeItem(SESSION_KEY);
};

const bootSession = readSession();

export const useAuthStore = create<AuthStore>((set) => ({
  ...initialState,
  isAuthenticated: !!bootSession,
  user: bootSession?.user || null,
  token: bootSession?.token || null,

  setMode: (mode) => set({ mode }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setUser: (user) => set({ user }),
  setToken: (token) => set({ token }),
  setIsAuthenticated: (authenticated) => set({ isAuthenticated: authenticated }),
  setShowForgotPassword: (show) => set({ showForgotPassword: show }),
  setOAuthLoading: (loading, provider) =>
    set({ isOAuthLoading: loading, oauthProvider: provider || null }),

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    const authService = getAuthService();
    const result = await authService.loginWithEmail({ email, password });

    if (!result.success || !result.data) {
      set({ isLoading: false, error: result.error || 'Login failed' });
      return false;
    }

    saveSession(result.data.accessToken, result.data.user);
    set({
      isLoading: false,
      isAuthenticated: true,
      token: result.data.accessToken,
      user: result.data.user,
      error: null,
      showForgotPassword: false,
    });
    return true;
  },

  signup: async (username, email, password) => {
    set({ isLoading: true, error: null });
    const authService = getAuthService();
    const result = await authService.signupWithEmail({ username, email, password });

    if (!result.success || !result.data) {
      set({ isLoading: false, error: result.error || 'Signup failed' });
      return false;
    }

    saveSession(result.data.accessToken, result.data.user);
    set({
      isLoading: false,
      isAuthenticated: true,
      token: result.data.accessToken,
      user: result.data.user,
      error: null,
      showForgotPassword: false,
    });
    return true;
  },

  hydrateSession: async () => {
    const session = readSession();
    if (!session) {
      set({ ...initialState });
      return;
    }

    set({
      token: session.token,
      user: session.user,
      isAuthenticated: true,
    });

    const authService = getAuthService();
    const profileResult = await authService.getCurrentUser(session.token);
    if (profileResult.success && profileResult.data) {
      saveSession(session.token, profileResult.data);
      set({ user: profileResult.data });
      return;
    }

    // Access token may be stale after reload; attempt refresh using httpOnly cookie.
    const refreshResult = await authService.refreshSession();
    if (refreshResult.success && refreshResult.data) {
      saveSession(refreshResult.data.accessToken, refreshResult.data.user);
      set({
        token: refreshResult.data.accessToken,
        user: refreshResult.data.user,
        isAuthenticated: true,
      });
      return;
    }

    const authFailure = `${profileResult.error || ''} ${refreshResult.error || ''}`.toLowerCase();
    const isAuthExpired = authFailure.includes('invalid') || authFailure.includes('expired') || authFailure.includes('401');

    if (isAuthExpired) {
      clearSession();
      set({ ...initialState });
      return;
    }

    // Keep existing session if backend is temporarily unreachable to avoid logging out on refresh.
    set({
      token: session.token,
      user: session.user,
      isAuthenticated: true,
    });
  },

  logout: async () => {
    const authService = getAuthService();
    await authService.logout();
    clearSession();
    set({ ...initialState });
  },

  resetAuthState: () => {
    clearSession();
    set(initialState);
  },
}));
