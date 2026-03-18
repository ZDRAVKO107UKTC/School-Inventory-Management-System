/**
 * Button Component
 * Primary, secondary, ghost, destructive variants
 * Design: SaaS-quality with smooth transitions
 */

import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'oauth';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      icon,
      iconPosition = 'left',
      children,
      disabled,
      className = '',
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-semibold rounded-[10px] transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-lime-300 dark:focus-visible:ring-purple-500 disabled:opacity-60 disabled:cursor-not-allowed';

    const variants = {
      primary:
        'bg-gradient-to-r from-yellow-200 to-lime-200 text-lime-950 hover:shadow-lg hover:shadow-yellow-200/60 hover:scale-101 dark:from-purple-600 dark:to-blue-600 dark:text-white dark:hover:shadow-purple-500/30 active:scale-100',
      secondary:
        'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50',
      ghost:
        'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50',
      destructive:
        'bg-red-500 hover:bg-red-600 text-white hover:shadow-lg hover:scale-101 active:scale-100',
      oauth:
        'border border-lime-200/90 bg-lime-50/35 hover:bg-lime-100/50 dark:border-slate-600 dark:bg-transparent dark:hover:bg-slate-700/30 text-slate-900 dark:text-white',
    };

    const sizes = {
      sm: 'px-3 py-2 text-sm gap-2',
      md: 'px-4 py-3 text-base gap-3',
      lg: 'px-6 py-4 text-lg gap-3',
    };

    const sizeClasses = {
      sm: 'h-9',
      md: 'h-12',
      lg: 'h-14',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`
          ${baseStyles}
          ${variants[variant]}
          ${sizes[size]}
          ${sizeClasses[size]}
          ${className}
        `}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </>
        ) : (
          <>
            {icon && iconPosition === 'left' && <span>{icon}</span>}
            <span>{children}</span>
            {icon && iconPosition === 'right' && <span>{icon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
