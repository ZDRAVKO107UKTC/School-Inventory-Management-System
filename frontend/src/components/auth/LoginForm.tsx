/**
 * Login Form Component
 * Email & password inputs, forgot password link
 * Design-only: no form submission logic
 */

import React, { useState } from 'react';
import { Eye, EyeOff, Mail } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { OAuthButtons } from './OAuthButtons';

export interface LoginFormProps {
  onSwitchToSignup?: () => void;
  onForgotPassword?: () => void;
  onSubmit?: (email: string, password: string) => void;
  onGoogleClick?: () => void;
  onTelegramClick?: () => void;
  isLoading?: boolean;
  error?: string | null;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSwitchToSignup,
  onForgotPassword,
  onSubmit,
  onGoogleClick,
  onTelegramClick,
  isLoading = false,
  error,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  const validateForm = () => {
    const nextErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      nextErrors.email = 'Enter your email address to continue.';
    }

    if (!password.trim()) {
      nextErrors.password = 'Enter your password to continue.';
    }

    setFieldErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (fieldErrors.email) {
      setFieldErrors((current) => ({ ...current, email: undefined }));
    }
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (fieldErrors.password) {
      setFieldErrors((current) => ({ ...current, password: undefined }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-lime-600 dark:text-white mb-2">
          Welcome back
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Sign in to your inventory account
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm font-medium text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Form Fields */}
      <form noValidate className="space-y-4" onSubmit={(e) => {
        e.preventDefault();
        if (!validateForm()) {
          return;
        }
        onSubmit?.(email, password);
      }}>
        <Input
          label="Email address"
          type="email"
          placeholder="name@example.com"
          value={email}
          onChange={(e) => handleEmailChange(e.target.value)}
          icon={<Mail className="w-5 h-5" strokeWidth={1.5} />}
          error={fieldErrors.email}
          disabled={isLoading}
        />

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Password
            </label>
            <button
              type="button"
              onClick={onForgotPassword}
              className="text-sm font-medium text-lime-700 dark:text-purple-400 hover:underline"
            >
              Forgot?
            </button>
          </div>
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              icon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <Eye className="w-5 h-5" strokeWidth={1.5} />
                  ) : (
                    <EyeOff className="w-5 h-5" strokeWidth={1.5} />
                  )}
                </button>
              }
              iconPosition="right"
              error={fieldErrors.password}
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full mt-6"
          isLoading={isLoading}
          disabled={isLoading}
        >
          Sign in
        </Button>
      </form>

      {/* OAuth */}
      <OAuthButtons
        onGoogleClick={onGoogleClick}
        onTelegramClick={onTelegramClick}
        isLoading={isLoading}
      />

      {/* Sign Up Link */}
      <p className="text-center text-sm text-slate-600 dark:text-slate-400">
        Don't have an account?{' '}
        <button
          onClick={onSwitchToSignup}
          className="font-semibold text-lime-700 dark:text-purple-400 hover:underline"
        >
          Sign up
        </button>
      </p>
    </div>
  );
};
