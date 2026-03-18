/**
 * Signup Form Component
 * Full name, email, password inputs
 * Design-only: no form submission logic
 */

import React, { useState } from 'react';
import { Eye, EyeOff, Mail, User } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { OAuthButtons } from './OAuthButtons';

export interface SignupFormProps {
  onSwitchToLogin?: () => void;
  onSubmit?: (fullName: string, email: string, password: string) => void;
  isLoading?: boolean;
  error?: string | null;
}

export const SignupForm: React.FC<SignupFormProps> = ({
  onSwitchToLogin,
  onSubmit,
  isLoading = false,
  error,
}) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const [fieldErrors, setFieldErrors] = useState<{
    fullName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const validateForm = () => {
    const nextErrors: {
      fullName?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    if (!fullName.trim()) {
      nextErrors.fullName = 'Enter your full name to create an account.';
    }

    if (!email.trim()) {
      nextErrors.email = 'Enter your email address to create an account.';
    } else if (!emailPattern.test(email.trim())) {
      nextErrors.email = 'Enter a valid email address, like name@example.com.';
    }

    if (!password.trim()) {
      nextErrors.password = 'Enter a password to create your account.';
    }

    if (!confirmPassword.trim()) {
      nextErrors.confirmPassword = 'Confirm your password to continue.';
    } else if (password.trim() && confirmPassword !== password) {
      nextErrors.confirmPassword = 'Passwords do not match yet.';
    }

    setFieldErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const clearFieldError = (field: 'fullName' | 'email' | 'password' | 'confirmPassword') => {
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-lime-600 dark:text-white mb-2">
          Get started
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Create your inventory account
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm font-medium text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Form Fields */}
      <form
        noValidate
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!validateForm()) {
            return;
          }
          onSubmit?.(fullName, email, password);
        }}
      >
        <Input
          label="Full name"
          type="text"
          placeholder="Gus Fring"
          value={fullName}
          onChange={(e) => {
            setFullName(e.target.value);
            clearFieldError('fullName');
          }}
          icon={<User className="w-5 h-5" strokeWidth={1.5} />}
          error={fieldErrors.fullName}
          disabled={isLoading}
        />

        <Input
          label="Email address"
          type="email"
          placeholder="name@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            clearFieldError('email');
          }}
          icon={<Mail className="w-5 h-5" strokeWidth={1.5} />}
          error={fieldErrors.email}
          errorVariant={fieldErrors.email?.includes('valid email') ? 'cloud' : 'inline'}
          disabled={isLoading}
        />

        <div>
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">
            Password
          </label>
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearFieldError('password');
                clearFieldError('confirmPassword');
              }}
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

        <div>
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">
            Confirm password
          </label>
          <div className="relative">
            <Input
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                clearFieldError('confirmPassword');
              }}
              icon={
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? (
                    <Eye className="w-5 h-5" strokeWidth={1.5} />
                  ) : (
                    <EyeOff className="w-5 h-5" strokeWidth={1.5} />
                  )}
                </button>
              }
              iconPosition="right"
              error={fieldErrors.confirmPassword}
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
          Create account
        </Button>
      </form>

      {/* OAuth */}
      <OAuthButtons
        isLoading={isLoading}
        // Placeholder: no OAuth logic
      />

      {/* Sign In Link */}
      <p className="text-center text-sm text-slate-600 dark:text-slate-400">
        Already have an account?{' '}
        <button
          onClick={onSwitchToLogin}
          className="font-semibold text-lime-700 dark:text-purple-400 hover:underline"
        >
          Sign in
        </button>
      </p>
    </div>
  );
};
