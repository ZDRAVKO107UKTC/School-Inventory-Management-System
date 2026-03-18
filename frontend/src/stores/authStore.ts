/**
 * Auth Store (Zustand)
 * Client state + UI state management (no logic)
 */

import { create } from 'zustand';
import type { User, AuthMode } from '@/types/auth';

export interface AuthStore {
  // State
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  error: string | null;
  mode: AuthMode; // 'login' or 'signup'
  token: string | null;

  // UI State
  showForgotPassword: boolean;
  isOAuthLoading: boolean;
  oauthProvider: 'google' | 'apple' | null;

  // Actions
  setMode: (mode: AuthMode) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setIsAuthenticated: (authenticated: boolean) => void;
  setShowForgotPassword: (show: boolean) => void;
  setOAuthLoading: (loading: boolean, provider?: 'google' | 'apple') => void;
  resetAuthState: () => void;
}

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

export const useAuthStore = create<AuthStore>((set) => ({
  ...initialState,

  setMode: (mode) => set({ mode }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setUser: (user) => set({ user }),
  setToken: (token) => set({ token }),
  setIsAuthenticated: (authenticated) => set({ isAuthenticated: authenticated }),
  setShowForgotPassword: (show) => set({ showForgotPassword: show }),
  setOAuthLoading: (loading, provider) =>
    set({ isOAuthLoading: loading, oauthProvider: provider || null }),
  resetAuthState: () => set(initialState),
}));
