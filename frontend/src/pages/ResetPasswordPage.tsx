import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { InteractiveBackground } from '@/components/auth/InteractiveBackground';
import { ThemeToggle } from '@/components/auth/ThemeToggle';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { getAuthService } from '@/services/authService';
import { Loader2, KeyRound, CheckCircle2 } from 'lucide-react';

export const ResetPasswordPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [theme, setTheme] = useState<'light' | 'dark'>(() =>
        localStorage.getItem('sims_theme') === 'light' ? 'light' : 'dark'
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) {
            setError('Reset token is missing from the URL.');
            return;
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters long.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const authService = getAuthService();
            const result = await authService.resetPassword({ token, password });

            if (result.success) {
                setSuccess(true);
                setTimeout(() => navigate('/auth'), 3000);
            } else {
                setError(result.error || 'Failed to reset password. The link may have expired.');
            }
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className={theme === 'dark' ? 'dark' : 'light'}>
                <div className="relative min-h-screen overflow-hidden flex items-center justify-center px-4">
                    <InteractiveBackground theme={theme} />
                    <div className="relative z-10 w-full max-w-md bg-white/95 dark:bg-slate-900/85 backdrop-blur-xl rounded-2xl border border-green-500/20 shadow-2xl p-10 text-center space-y-6">
                        <div className="flex justify-center">
                            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center animate-bounce">
                                <CheckCircle2 className="w-8 h-8 text-green-500" />
                            </div>
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Password Reset!</h2>
                        <p className="text-[#86868b] text-sm leading-relaxed">
                            Your password has been changed successfully. Redirecting you to login...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

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
                    <div className="w-full max-w-md bg-white/95 dark:bg-slate-900/85 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-purple-500/20 shadow-2xl p-8 md:p-10 space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
                        <div className="space-y-2 text-center">
                            <div className="flex justify-center mb-4">
                                <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
                                    <KeyRound className="w-6 h-6 text-purple-500" />
                                </div>
                            </div>
                            <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">New Password</h1>
                            <p className="text-xs font-medium text-[#86868b] uppercase tracking-widest">Secure your account</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 text-xs font-semibold animate-in fade-in zoom-in duration-300">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[#86868b] ml-1">New Password</label>
                                    <Input
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="bg-slate-50/50 dark:bg-slate-800/50 border-slate-200/50 dark:border-slate-700/50"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[#86868b] ml-1">Confirm Password</label>
                                    <Input
                                        type="password"
                                        placeholder="••••••••"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        className="bg-slate-50/50 dark:bg-slate-800/50 border-slate-200/50 dark:border-slate-700/50"
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={isLoading || !token}
                                className="w-full bg-[#0066cc] hover:bg-[#0077ed] text-white h-12 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98]"
                            >
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Update Password'}
                            </Button>

                            <button
                                type="button"
                                onClick={() => navigate('/auth')}
                                className="w-full text-[10px] font-bold text-[#0066cc] uppercase tracking-widest hover:underline"
                            >
                                Back to login
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResetPasswordPage;
