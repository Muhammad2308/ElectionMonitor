import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { getDeviceId } from '../../utils/deviceIdentity';
import { homeRouteForRole } from '../../utils/roles';
import { signInWithGoogle, isGoogleSignInConfigured } from '../../utils/googleAuth';
import api from '../../api';

interface LoginResponse {
    user: { id: number; name: string; email: string; role?: string };
    token: string;
}

const GoogleIcon: React.FC = () => (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
        <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.91c1.7-1.57 2.69-3.87 2.69-6.62Z" />
        <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.26c-.81.54-1.84.86-3.05.86-2.34 0-4.32-1.58-5.03-3.71H.96v2.33A9 9 0 0 0 9 18Z" />
        <path fill="#FBBC05" d="M3.97 10.71A5.4 5.4 0 0 1 3.68 9c0-.59.1-1.17.28-1.71V4.96H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.04l3.01-2.33Z" />
        <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.96l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z" />
    </svg>
);

export const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const setAuth = useAuthStore((state) => state.setAuth);
    const navigate = useNavigate();

    const completeLogin = (response: LoginResponse) => {
        setAuth(response.user, response.token);
        navigate(homeRouteForRole(response.user.role));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await api.post<LoginResponse>('/auth/login', {
                email,
                password,
                device_id: getDeviceId(),
                device_name: navigator.userAgent,
            });
            completeLogin(response);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setError(null);
        setGoogleLoading(true);
        try {
            const credential = await signInWithGoogle();
            const response = await api.post<LoginResponse>('/auth/google', {
                credential,
                device_id: getDeviceId(),
                device_name: navigator.userAgent,
            });
            completeLogin(response);
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Google sign-in failed. Please try again.');
        } finally {
            setGoogleLoading(false);
        }
    };

    return (
        <div
            className="flex min-h-screen w-full items-center justify-center px-4 py-12 sm:px-6"
            style={{
                background:
                    'radial-gradient(ellipse 800px 600px at 20% -10%, rgba(37,99,235,0.16), transparent 60%), ' +
                    'radial-gradient(ellipse 800px 600px at 100% 110%, rgba(16,185,129,0.12), transparent 60%), ' +
                    '#05070d',
            }}
        >
            <div className="w-full max-w-100">
                {/* Logo */}
                <div className="mb-8 flex flex-col items-center text-center">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-blue-500 to-blue-700 text-2xl font-bold text-white shadow-lg shadow-blue-950/40">
                        E
                    </div>
                    <h1 className="text-xl font-bold text-white">ElectWatch</h1>
                    <p className="mt-1 text-sm text-slate-400">Election Observation Platform</p>
                </div>

                {/* Card */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900 px-6 py-8 shadow-2xl shadow-black/40 sm:px-10 sm:py-10">
                    <h2 className="text-lg font-semibold text-white">Sign in to your account</h2>
                    <p className="mt-1 mb-6 text-sm text-slate-400">Enter your credentials to continue.</p>

                    {error && (
                        <div role="alert" className="mb-6 flex items-start gap-2.5 rounded-lg border border-red-500/30 bg-red-500/10 p-3.5 text-sm text-red-200">
                            <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-400" aria-hidden="true" />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} noValidate className="space-y-5">
                        <div>
                            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-300">
                                Email address
                            </label>
                            <div className="relative">
                                <Mail size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" aria-hidden="true" />
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    autoComplete="email"
                                    required
                                    placeholder="name@example.com"
                                    className="block w-full rounded-lg border border-slate-700 bg-slate-800/60 py-2.5 pl-10 pr-3 text-sm text-white placeholder-slate-500 transition-colors duration-150 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-300">
                                Password
                            </label>
                            <div className="relative">
                                <Lock size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" aria-hidden="true" />
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    autoComplete="current-password"
                                    required
                                    placeholder="••••••••"
                                    className="block w-full rounded-lg border border-slate-700 bg-slate-800/60 py-2.5 pl-10 pr-10 text-sm text-white placeholder-slate-500 transition-colors duration-150 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((s) => !s)}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center justify-center text-slate-500 transition-colors duration-150 hover:text-slate-300"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {loading ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : 'Sign in'}
                        </button>
                    </form>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-800" />
                        </div>
                        <div className="relative flex justify-center">
                            <span className="bg-slate-900 px-3 text-xs uppercase tracking-wider text-slate-500">or continue with</span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleGoogleSignIn}
                        disabled={googleLoading}
                        title={isGoogleSignInConfigured() ? undefined : 'Google sign-in is not configured for this deployment yet'}
                        className="flex w-full items-center justify-center gap-3 rounded-lg border border-slate-700 bg-slate-800/40 py-2.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {googleLoading ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : <GoogleIcon />}
                        Continue with Google
                    </button>
                </div>

                <p className="mt-6 text-center text-xs text-slate-500">
                    This system is for authorized election observers and staff only.
                </p>
            </div>
        </div>
    );
};
