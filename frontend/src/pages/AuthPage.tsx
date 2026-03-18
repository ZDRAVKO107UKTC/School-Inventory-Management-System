/**
 * Auth Page (Login/Signup)
 * Main entry point for authentication UI
 * Combines interactive background, theme toggle, and form card
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { InteractiveBackground } from '@/components/auth/InteractiveBackground';
import { ThemeToggle } from '@/components/auth/ThemeToggle';
import { LoginForm } from '@/components/auth/LoginForm';
import { SignupForm } from '@/components/auth/SignupForm';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';
import { useAuthStore } from '@/stores/authStore';

type ViewKey = 'login' | 'signup' | 'forgot';

const HEIGHT_MS = 380;

export type AuthPageProps = {
  defaultMode?: 'login' | 'signup';
};

export const AuthPage: React.FC<AuthPageProps> = ({ defaultMode = 'login' }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const { mode, setMode, isLoading, error, showForgotPassword, setShowForgotPassword } = useAuthStore();
  const cardRef      = useRef<HTMLDivElement>(null);
  const prevHeight   = useRef<number>(0);
  const cleanupTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeView: ViewKey = showForgotPassword ? 'forgot' : (mode as ViewKey);

  /**
   * 1. Capture current pixel height and lock it on the card BEFORE React re-renders.
   * 2. Immediately apply the state change — React will insert new content with the
   *    card still clamped at the old height (overflow:hidden keeps it invisible).
   * 3. useEffect (below) fires after paint and animates old → new height.
   */
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

  /** After React paints the new content, animate from the locked old height to the new natural height. */
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

  return (
    <div className={theme === 'dark' ? 'dark' : 'light'}>
      <div className="relative min-h-screen overflow-hidden">
        {/* Interactive Background */}
        <InteractiveBackground theme={theme} />

        {/* Theme Toggle */}
        <ThemeToggle defaultTheme={theme} onThemeChange={setTheme} />

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
                  isLoading={isLoading}
                  error={error}
                />
              ) : activeView === 'login' ? (
                <LoginForm
                  onSwitchToSignup={() => switchView(() => setMode('signup'))}
                  onForgotPassword={() => switchView(() => setShowForgotPassword(true))}
                  isLoading={isLoading}
                  error={error}
                />
              ) : (
                <SignupForm
                  onSwitchToLogin={() => switchView(() => setMode('login'))}
                  isLoading={isLoading}
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
