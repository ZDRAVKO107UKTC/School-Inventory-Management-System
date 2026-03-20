/**
 * Forgot Password Form Component
 * Email input → sends reset link (design-only, no submission logic)
 * Two states: 'form' (enter email) and 'sent' (confirmation)
 */

import React, { useState } from 'react';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export interface ForgotPasswordFormProps {
  onBackToLogin?: () => void;
  onSubmit?: (email: string) => void;
  isLoading?: boolean;
  error?: string | null;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
  onBackToLogin,
  onSubmit,
  isLoading = false,
  error,
}) => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | undefined>(undefined);
  const [submitted, setSubmitted] = useState(false);

  const validateEmail = () => {
    if (!email.trim()) {
      setEmailError('Enter your email address to continue.');
      return false;
    }
    setEmailError(undefined);
    return true;
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (emailError) setEmailError(undefined);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail()) return;
    onSubmit?.(email.trim());
    // Show confirmation UI (design-only — no real request)
    setSubmitted(true);
  };

  const stateKey = submitted ? 'sent' : 'form';

  return (
    <>
      <div
        key={stateKey}
        className="space-y-6"
        style={{ animation: 'forgotPasswordSwap 360ms cubic-bezier(0.22, 1, 0.36, 1)' }}
      >
        {/* Back button */}
        <button
          type="button"
          onClick={onBackToLogin}
          className="flex items-center gap-1.5 text-sm font-medium text-lime-700 dark:text-purple-400 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to login
        </button>

        {submitted ? (
          <>
            {/* Success card body */}
            <div className="flex flex-col items-center text-center space-y-4 py-6">
              <div className="w-16 h-16 rounded-full bg-lime-100 dark:bg-purple-900/40 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-lime-600 dark:text-purple-400" strokeWidth={1.5} />
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-lime-600 dark:text-white">
                  Check your inbox
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xs">
                  We've sent a password reset link to:
                  <span className="mt-1 block font-semibold text-slate-800 dark:text-slate-200 break-all">
                    {email}
                  </span>
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
                  Didn't get it? Check your spam folder or{' '}
                  <button
                    type="button"
                    onClick={() => setSubmitted(false)}
                    className="font-medium text-lime-700 dark:text-purple-400 hover:underline"
                  >
                    try again
                  </button>
                  .
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="primary"
              size="lg"
              className="w-full"
              onClick={onBackToLogin}
            >
              Back to login
            </Button>
          </>
        ) : (
          <>
            {/* Header */}
            <div className="text-center">
              <h1 className="text-3xl font-bold text-lime-600 dark:text-white mb-2">
                Forgot password?
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Enter your email and we'll send you a reset link.
              </p>
            </div>

            {/* API-level error */}
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm font-medium text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}

            {/* Form */}
            <form noValidate className="space-y-4" onSubmit={handleSubmit}>
              <Input
                label="Email address"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                icon={<Mail className="w-5 h-5" strokeWidth={1.5} />}
                error={emailError}
                disabled={isLoading}
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full mt-2"
                isLoading={isLoading}
                disabled={isLoading}
              >
                Send reset link
              </Button>
            </form>

            {/* Footer */}
            <p className="text-center text-sm text-slate-600 dark:text-slate-400">
              Remembered it?{' '}
              <button
                type="button"
                onClick={onBackToLogin}
                className="font-semibold text-lime-700 dark:text-purple-400 hover:underline"
              >
                Sign in
              </button>
            </p>
          </>
        )}
      </div>

      <style>{`
        @keyframes forgotPasswordSwap {
          0% {
            opacity: 0;
            transform: translateY(10px) scale(0.99);
            filter: blur(2px);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0);
          }
        }
      `}</style>
    </>
  );
};
