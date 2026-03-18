/**
 * Input Component
 * Email, password, text inputs with validation states
 * Design: Clean borders with floating labels option
 */

import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  errorVariant?: 'inline' | 'cloud';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  isValid?: boolean;
  variant?: 'default' | 'logout';
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      errorVariant = 'inline',
      icon,
      iconPosition = 'left',
      isValid,
      variant = 'default',
      className = '',
      id,
      type = 'text',
      placeholder,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    const baseInputStyles =
      'w-full px-4 py-3 rounded-[10px] font-medium border-2 transition-all duration-300 ease-out focus:outline-none placeholder-slate-400 dark:placeholder-slate-500';

    const borderStyles = error
      ? 'border-red-500 focus:border-red-600'
      : isValid
        ? 'border-green-500 focus:border-green-600'
        : 'border-slate-200 dark:border-slate-700 focus:border-lime-400 dark:focus:border-purple-400';

    const bgStyles =
      'bg-white dark:bg-slate-800 text-slate-900 dark:text-white';

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2"
          >
            {label}
          </label>
        )}

        <div className="relative">
          {icon && iconPosition === 'left' && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 pointer-events-none">
              {icon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            type={type}
            placeholder={placeholder}
            disabled={disabled}
            className={`
              ${baseInputStyles}
              ${borderStyles}
              ${bgStyles}
              ${icon && iconPosition === 'left' ? 'pl-12' : ''}
              ${icon && iconPosition === 'right' ? 'pr-12' : ''}
              ${disabled ? 'opacity-60 cursor-not-allowed' : ''}
              ${className}
            `}
            {...props}
          />

          {icon && iconPosition === 'right' && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400">
              {icon}
            </div>
          )}
        </div>

        {error && errorVariant === 'cloud' && (
          <div className="mt-2 flex">
            <div className="relative max-w-full rounded-2xl border border-red-400/70 bg-white/95 px-3 py-2 text-sm font-medium text-red-700 shadow-[0_10px_24px_rgba(239,68,68,0.15)] dark:border-red-400/70 dark:bg-slate-900/90 dark:text-purple-200 dark:shadow-[0_14px_30px_rgba(239,68,68,0.18)]">
              <span className="relative z-10 block pr-2">{error}</span>
            </div>
          </div>
        )}

        {error && errorVariant === 'inline' && (
          <p className="text-red-500 text-sm font-medium mt-2">{error}</p>
        )}

        {isValid && !error && (
          <p className="text-green-500 text-sm font-medium mt-2">✓ Valid</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
