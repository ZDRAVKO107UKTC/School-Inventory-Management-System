import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Mail, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { InteractiveBackground } from '@/components/auth/InteractiveBackground';
import { ThemeToggle } from '@/components/auth/ThemeToggle';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';

const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading, error, setError, logout } = useAuthStore();

  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    localStorage.getItem('sims_theme') === 'light' ? 'light' : 'dark'
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldError, setFieldError] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const next: { email?: string; password?: string } = {};
    if (!email.trim()) next.email = 'Enter your admin email.';
    if (!password.trim()) next.password = 'Enter your password.';
    setFieldError(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!validate()) return;

    const success = await login(email, password);
    if (!success) return;

    const currentUser = useAuthStore.getState().user;
    if (currentUser?.role !== 'admin') {
      await logout();
      setError('This account is not an admin account. Use the standard login page.');
      return;
    }

    navigate('/admin/dashboard');
  };

  return (
    <div className={theme === 'dark' ? 'dark' : 'light'}>
      <div className="relative min-h-screen overflow-hidden">
        <InteractiveBackground theme={theme} />
        <ThemeToggle
          defaultTheme={theme}
          onThemeChange={setTheme}
          className="fixed top-4 right-4 sm:top-6 sm:right-6 z-30"
        />

        <div className="relative z-10 flex items-center justify-center min-h-screen px-4 py-12">
          <div className="w-full max-w-md rounded-2xl border border-slate-200/50 dark:border-purple-500/20 bg-white/95 dark:bg-slate-900/85 backdrop-blur-xl p-6 sm:p-8 md:p-10 shadow-2xl dark:shadow-purple-500/10">
            <button
              type="button"
              onClick={() => navigate('/auth')}
              className="mb-5 flex items-center gap-1.5 text-sm font-medium text-lime-700 dark:text-purple-300 hover:underline"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to user login
            </button>

            <div className="text-center mb-6">
              <div className="mx-auto mb-3 w-14 h-14 rounded-full bg-lime-100 dark:bg-purple-900/40 flex items-center justify-center">
                <ShieldCheck className="w-7 h-7 text-lime-700 dark:text-purple-300" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-lime-600 dark:text-white">Admin Panel Access</h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                Sign in with an admin account to manage the inventory system.
              </p>
            </div>

            {error && (
              <div className="mb-4 rounded-lg border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 p-3 text-sm font-medium text-red-700 dark:text-red-200">
                {error}
              </div>
            )}

            <form noValidate className="space-y-4" onSubmit={handleSubmit}>
              <Input
                label="Admin email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldError.email) setFieldError((prev) => ({ ...prev, email: undefined }));
                }}
                icon={<Mail className="w-5 h-5" />}
                error={fieldError.email}
                disabled={isLoading}
              />

              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldError.password) setFieldError((prev) => ({ ...prev, password: undefined }));
                }}
                icon={
                  <button type="button" onClick={() => setShowPassword((v) => !v)}>
                    {showPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                  </button>
                }
                iconPosition="right"
                error={fieldError.password}
                disabled={isLoading}
              />

              <Button type="submit" variant="primary" size="lg" className="w-full mt-3" isLoading={isLoading}>
                Open admin panel
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
