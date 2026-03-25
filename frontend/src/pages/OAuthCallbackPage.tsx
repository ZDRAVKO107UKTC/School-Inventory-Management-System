import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getAuthService } from '@/services/authService';
import { useAuthStore } from '@/stores/authStore';

type OAuthProvider = 'google' | 'telegram';

interface OAuthCallbackPageProps {
  provider: OAuthProvider;
}

const OAuthCallbackPage: React.FC<OAuthCallbackPageProps> = ({ provider }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [statusText, setStatusText] = useState('Completing authentication...');

  useEffect(() => {
    let isMounted = true;

    const completeOAuth = async () => {
      const authService = getAuthService();
      const { completeOAuthSession, setError } = useAuthStore.getState();

      try {
        if (provider === 'google') {
          const code = searchParams.get('code');
          if (!code) {
            throw new Error('Google authorization code is missing.');
          }

          const result = await authService.exchangeGoogleCode(code);
          if (!result.success || !result.data) {
            throw new Error(result.error || 'Google authentication failed.');
          }

          completeOAuthSession(result.data);
          if (!isMounted) return;

          navigate('/dashboard', { replace: true });
          return;
        }

        const payload = Object.fromEntries(searchParams.entries());
        if (!payload.hash || !payload.id) {
          throw new Error('Telegram authentication response is incomplete.');
        }

        const result = await authService.verifyTelegramAuth(payload);
        if (!result.success || !result.data) {
          throw new Error(result.error || 'Telegram authentication failed.');
        }

        completeOAuthSession(result.data);
        if (!isMounted) return;

        navigate('/dashboard', { replace: true });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'OAuth authentication failed.';
        setError(message);
        if (!isMounted) return;

        setStatusText(message);
        setTimeout(() => {
          navigate('/auth', { replace: true });
        }, 1200);
      }
    };

    completeOAuth();

    return () => {
      isMounted = false;
    };
  }, [navigate, provider, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-950 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 text-center shadow-xl">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">{provider === 'google' ? 'Google' : 'Telegram'} Sign-in</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">{statusText}</p>
      </div>
    </div>
  );
};

export default OAuthCallbackPage;
