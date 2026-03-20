import React from 'react';
import { Sun, Moon } from 'lucide-react';

export interface ThemeToggleProps {
  defaultTheme?: 'light' | 'dark';
  onThemeChange?: (theme: 'light' | 'dark') => void;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  defaultTheme = 'dark',
  onThemeChange,
}) => {
  const handleToggle = () => {
    const newTheme = defaultTheme === 'light' ? 'dark' : 'light';
    onThemeChange?.(newTheme);
  };

  return (
    <button
      onClick={handleToggle}
      aria-label={`Switch to ${defaultTheme === 'light' ? 'dark' : 'light'} mode`}
      className="
        relative z-10
        flex items-center justify-center
        w-10 h-10 rounded-full
        bg-white/30 dark:bg-slate-900/30
        backdrop-blur-sm
        border border-white/20 dark:border-slate-700/30
        hover:bg-white/50 dark:hover:bg-slate-800/50
        transition-all duration-300 ease-out
        hover:scale-105 active:scale-95
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-300 dark:focus-visible:ring-purple-500
      "
    >
      {defaultTheme === 'light' ? (
        <Sun className="w-5 h-5 text-yellow-400" strokeWidth={2} />
      ) : (
        <Moon className="w-5 h-5 text-blue-300" strokeWidth={2} />
      )}
    </button>
  );
};

export default ThemeToggle;
