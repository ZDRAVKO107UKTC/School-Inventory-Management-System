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
        'bg-[#1d1d1f] dark:bg-[#f5f5f7] text-white dark:text-[#1d1d1f] hover:bg-[#000000] dark:hover:bg-white shadow-sm active:scale-95',
      secondary:
        'bg-[#f5f5f7] dark:bg-[#1d1d1f] text-[#1d1d1f] dark:text-[#f5f5f7] border border-[#d2d2d7] dark:border-[#303030] hover:bg-[#e8e8ed] dark:hover:bg-[#2c2c2e]',
      ghost:
        'text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-[#f5f5f7] dark:hover:bg-[#1d1d1f]',
      destructive:
        'bg-[#ff3b30] hover:bg-[#ff453a] text-white active:scale-95',
      oauth:
        'border border-[#d2d2d7] bg-white hover:bg-[#f5f5f7] dark:border-[#303030] dark:bg-transparent dark:hover:bg-[#1d1d1f] text-[#1d1d1f] dark:text-[#f5f5f7]',
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
