import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowRight, AlertCircle, ShieldCheck, MapPin, Activity } from 'lucide-react';
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
        <div className="relative min-h-screen w-full overflow-hidden bg-slate-950 flex">
            {/* Ambient background glow — decorative only */}
            <div aria-hidden className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl" />
            <div aria-hidden className="pointer-events-none absolute -bottom-40 -right-20 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />

            {/* Branding panel — desktop only */}
            <div className="relative z-10 hidden w-1/2 flex-col justify-between border-r border-white/5 p-12 lg:flex">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-lg font-bold text-white">
                        E
                    </div>
                    <span className="text-lg font-semibold text-white">ElectWatch</span>
                </div>

                <div className="max-w-md">
                    <h1 className="mb-4 text-4xl font-bold leading-tight text-white">
                        Real-time election observation, built for trust.
                    </h1>
                    <p className="text-lg text-slate-400">
                        Secure reporting, live coverage tracking, and command-center visibility for every polling unit.
                    </p>

                    <ul className="mt-10 space-y-4">
                        <li className="flex items-center gap-3 text-slate-300">
                            <ShieldCheck className="text-emerald-400" size={20} aria-hidden="true" />
                            Role-based, audited access
                        </li>
                        <li className="flex items-center gap-3 text-slate-300">
                            <MapPin className="text-blue-400" size={20} aria-hidden="true" />
                            Live polling-unit coverage map
                        </li>
                        <li className="flex items-center gap-3 text-slate-300">
                            <Activity className="text-amber-400" size={20} aria-hidden="true" />
                            Real-time incident intelligence
                        </li>
                    </ul>
                </div>

                <p className="text-xs text-slate-500">
                    &copy; {new Date().getFullYear()} ElectWatch. Authorized personnel only.
                </p>
            </div>

            {/* Form panel */}
            <div className="relative z-10 flex flex-1 items-center justify-center p-6 sm:p-10">
                <div className="w-full max-w-sm">
                    <div className="mb-8 flex items-center justify-center gap-3 lg:hidden">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-lg font-bold text-white">
                            E
                        </div>
                        <span className="text-lg font-semibold text-white">ElectWatch</span>
                    </div>

                    <h2 className="text-2xl font-bold text-white">Welcome back</h2>
                    <p className="mt-1.5 mb-8 text-sm text-slate-400">Sign in to continue to your dashboard.</p>

                    {error && (
                        <div role="alert" className="mb-6 flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-sm text-red-200">
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
                                <Mail size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" aria-hidden="true" />
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    autoComplete="email"
                                    required
                                    placeholder="name@example.com"
                                    className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-white placeholder-slate-500 transition-colors duration-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-300">
                                Password
                            </label>
                            <div className="relative">
                                <Lock size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" aria-hidden="true" />
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    autoComplete="current-password"
                                    required
                                    placeholder="••••••••"
                                    className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-11 pr-11 text-white placeholder-slate-500 transition-colors duration-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((s) => !s)}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    className="absolute right-3.5 top-1/2 flex -translate-y-1/2 items-center justify-center text-slate-500 transition-colors duration-200 hover:text-slate-300"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 font-semibold text-white transition-colors duration-200 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {loading ? (
                                <Loader2 size={18} className="animate-spin" aria-hidden="true" />
                            ) : (
                                <>
                                    Sign in
                                    <ArrowRight size={16} aria-hidden="true" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="my-6 flex items-center gap-3">
                        <div className="h-px flex-1 bg-white/10" />
                        <span className="text-xs uppercase tracking-wider text-slate-500">or continue with</span>
                        <div className="h-px flex-1 bg-white/10" />
                    </div>

                    <button
                        type="button"
                        onClick={handleGoogleSignIn}
                        disabled={googleLoading}
                        title={isGoogleSignInConfigured() ? undefined : 'Google sign-in is not configured for this deployment yet'}
                        className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-medium text-white transition-colors duration-200 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {googleLoading ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : <GoogleIcon />}
                        Continue with Google
                    </button>

                    <p className="mt-8 text-center text-xs text-slate-500">
                        This system is for authorized election observers and staff only.
                    </p>
                </div>
            </div>
        </div>
    );
};
