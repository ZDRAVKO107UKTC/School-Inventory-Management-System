/**
 * OAuth Buttons Component
 * Google and Telegram sign-in buttons
 * Design: Outlined style with official logos
 */

import React from 'react';
import { Button } from '@/components/ui/Button';

export interface OAuthButtonsProps {
  onGoogleClick?: () => void;
  onTelegramClick?: () => void;
  isLoading?: boolean;
  provider?: 'google' | 'telegram' | null;
}

export const OAuthButtons: React.FC<OAuthButtonsProps> = ({
  onGoogleClick,
  onTelegramClick,
  isLoading = false,
  provider = null,
}) => {
  return (
    <div className="space-y-3">
      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
          Or continue with
        </span>
        <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
      </div>

      {/* Google Button */}
      <Button
        variant="oauth"
        size="md"
        onClick={onGoogleClick}
        isLoading={isLoading && provider === 'google'}
        disabled={isLoading}
        className="w-full"
        icon={
          !isLoading || provider !== 'google' ? (
            <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              {/* Google G Logo — official 4-colour */}
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
          ) : undefined
        }
      >
        Google
      </Button>

      {/* Telegram Button */}
      <Button
        variant="oauth"
        size="md"
        onClick={onTelegramClick}
        isLoading={isLoading && provider === 'telegram'}
        disabled={isLoading}
        className="w-full"
        icon={
          !isLoading || provider !== 'telegram' ? (
            <svg className="w-6 h-6 text-[#229ED9]" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.64 6.8-1.66 7.83c-.12.56-.44.7-.89.44l-2.46-1.81-1.19 1.15c-.13.13-.24.24-.49.24l.18-2.53 4.61-4.16c.2-.18-.04-.28-.3-.1l-5.7 3.59-2.45-.76c-.53-.17-.54-.53.11-.78l9.57-3.69c.45-.17.84.11.7.78z" />
            </svg>
          ) : undefined
        }
      >
        Telegram
      </Button>
    </div>
  );
};
