import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { InteractiveBackground } from '@/components/auth/InteractiveBackground';
import { ThemeToggle } from '@/components/auth/ThemeToggle';
import { LoginForm } from '@/components/auth/LoginForm';
import { SignupForm } from '@/components/auth/SignupForm';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';
import { useAuthStore } from '@/stores/authStore';
import { getAuthService } from '@/services/authService';

type ViewKey = 'login' | 'signup' | 'forgot';

const HEIGHT_MS = 380;

export type AuthPageProps = {
  defaultMode?: 'login' | 'signup';
};

export const AuthPage: React.FC<AuthPageProps> = ({ defaultMode = 'login' }) => {
  const navigate = useNavigate();
  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    localStorage.getItem('sims_theme') === 'light' ? 'light' : 'dark'
  );
  const {
    mode,
    setMode,
    isLoading,
    error,
    showForgotPassword,
    setShowForgotPassword,
    login,
    signup,
    setError,
    setOAuthLoading,
    isOAuthLoading,
  } = useAuthStore();
  const cardRef = useRef<HTMLDivElement>(null);
  const prevHeight = useRef<number>(0);
  const cleanupTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeView: ViewKey = showForgotPassword ? 'forgot' : (mode as ViewKey);


  const switchView = useCallback((apply: () => void) => {
    const el = cardRef.current;
    if (el) {
      if (cleanupTimer.current) clearTimeout(cleanupTimer.current);
      prevHeight.current = el.getBoundingClientRect().height;
      el.style.transition = 'none';
      el.style.height = `${prevHeight.current}px`;
    }
    apply();
  }, []);

  useEffect(() => {
    setMode(defaultMode);
  }, [defaultMode, setMode]);

  useEffect(() => {
    const el = cardRef.current;
    if (!el || prevHeight.current === 0) return;

    const oldHeight = prevHeight.current;

    // Measure natural target height (works for both grow and shrink).
    el.style.transition = 'none';
    el.style.height = 'auto';
    const newHeight = el.scrollHeight;

    // Snap back to the previous locked height, then animate to target.
    el.style.height = `${oldHeight}px`;
    void el.getBoundingClientRect();

    el.style.transition = `height ${HEIGHT_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`;
    el.style.height = `${newHeight}px`;

    cleanupTimer.current = setTimeout(() => {
      if (cardRef.current) {
        cardRef.current.style.height = 'auto';
        cardRef.current.style.transition = '';
      }
      prevHeight.current = 0;
    }, HEIGHT_MS + 50);
  }, [activeView]);

  const handleLogin = async (email: string, password: string) => {
    const success = await login(email, password);
    if (!success) return;

    const currentUser = useAuthStore.getState().user;
    if (currentUser?.role === 'admin') {
      navigate('/dashboard');
      return;
    }

    navigate('/dashboard');
  };

  const handleSignup = async (username: string, email: string, password: string) => {
    const success = await signup(username, email, password);
    if (success) navigate('/dashboard');
  };

  const handleForgotPassword = (email: string) => {
    // Current backend has no password-reset endpoint yet.
    setError(`Password reset endpoint is not available yet. Saved email: ${email}`);
  };

  const handleGoogleAuth = async () => {
    setOAuthLoading(true, 'google');
    setError(null);
    const authService = getAuthService();
    const result = await authService.getGoogleAuthUrl();
    if (!result.success || !result.data?.url) {
      setOAuthLoading(false);
      setError(result.error || 'Failed to start Google authentication');
      return;
    }

    window.location.href = result.data.url;
  };

  const handleTelegramAuth = async () => {
    setOAuthLoading(true, 'telegram');
    setError(null);
    const authService = getAuthService();
    const result = await authService.getTelegramAuthUrl();
    if (!result.success || !result.data?.url) {
      setOAuthLoading(false);
      setError(result.error || 'Failed to start Telegram authentication');
      return;
    }

    window.location.href = result.data.url;
  };

  return (
    <div className={theme === 'dark' ? 'dark' : 'light'}>
      <div className="relative min-h-screen overflow-hidden">
        {/* Interactive Background */}
        <InteractiveBackground theme={theme} />

        {/* Theme Toggle */}
        <ThemeToggle
          defaultTheme={theme}
          onThemeChange={setTheme}
          className="fixed top-4 right-4 sm:top-6 sm:right-6 z-30"
        />

        {/* Main Container */}
        <div className="relative z-10 flex items-center justify-center min-h-screen px-4 py-12">
          {/* Card Container */}
          <div
            ref={cardRef}
            className="
              w-full max-w-md
              bg-white/95 dark:bg-slate-900/85
              backdrop-blur-xl
              rounded-2xl
              border border-slate-200/50 dark:border-purple-500/20
              shadow-2xl dark:shadow-purple-500/10
              p-8 md:p-10
              overflow-hidden
            "
            style={{
              animation: 'slideUp 600ms cubic-bezier(0.4, 0, 0.2, 1)',
              transition: 'background-color 300ms ease-out, border-color 300ms ease-out, box-shadow 300ms ease-out',
            }}
          >
            {/* Form Content */}
            <div
              key={activeView}
              style={{ animation: 'cardContentFade 420ms cubic-bezier(0.22, 1, 0.36, 1)' }}
            >
              {activeView === 'forgot' ? (
                <ForgotPasswordForm
                  onBackToLogin={() => switchView(() => setShowForgotPassword(false))}
                  onSubmit={handleForgotPassword}
                  isLoading={isLoading}
                  error={error}
                />
              ) : activeView === 'login' ? (
                <LoginForm
                  onSwitchToSignup={() => switchView(() => setMode('signup'))}
                  onForgotPassword={() => switchView(() => setShowForgotPassword(true))}
                  onSubmit={handleLogin}
                  onGoogleClick={handleGoogleAuth}
                  onTelegramClick={handleTelegramAuth}
                  isLoading={isLoading || isOAuthLoading}
                  error={error}
                />
              ) : (
                <SignupForm
                  onSwitchToLogin={() => switchView(() => setMode('login'))}
                  onSubmit={handleSignup}
                  onGoogleClick={handleGoogleAuth}
                  onTelegramClick={handleTelegramAuth}
                  isLoading={isLoading || isOAuthLoading}
                  error={error}
                />
              )}
            </div>
          </div>
        </div>

        {/* Animation Styles */}
        <style>{`
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(24px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes cardContentFade {
            0% {
              opacity: 0;
              transform: translateY(10px) scale(0.985);
              filter: blur(2px);
            }
            100% {
              opacity: 1;
              transform: translateY(0) scale(1);
              filter: blur(0);
            }
          }

          /* Smooth page transitions */
          @media (prefers-reduced-motion: no-preference) {
            * {
              scroll-behavior: smooth;
            }
          }
        `}</style>
      </div>
    </div>
  );
};

export default AuthPage;
