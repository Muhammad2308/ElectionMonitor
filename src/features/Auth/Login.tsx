import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, ShieldCheck } from 'lucide-react';
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
    <svg width="20" height="20" viewBox="0 0 18 18" aria-hidden="true">
        <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.91c1.7-1.57 2.69-3.87 2.69-6.62Z" />
        <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.26c-.81.54-1.84.86-3.05.86-2.34 0-4.32-1.58-5.03-3.71H.96v2.33A9 9 0 0 0 9 18Z" />
        <path fill="#FBBC05" d="M3.97 10.71A5.4 5.4 0 0 1 3.68 9c0-.59.1-1.17.28-1.71V4.96H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.04l3.01-2.33Z" />
        <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.96l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z" />
    </svg>
);

const BackgroundOrbs: React.FC = () => (
    <div style={{ pointerEvents: 'none', position: 'fixed', inset: 0, overflow: 'hidden' }} aria-hidden="true">
        {/* Primary blue orb – top-left */}
        <div style={{
            position: 'absolute', top: '-15%', left: '-10%',
            width: '55vmax', height: '55vmax', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(37,99,235,0.22) 0%, transparent 70%)',
            animation: 'eipOrbFloat1 14s ease-in-out infinite',
        }} />
        {/* Green accent orb – bottom-right */}
        <div style={{
            position: 'absolute', bottom: '-20%', right: '-10%',
            width: '50vmax', height: '50vmax', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(16,185,129,0.18) 0%, transparent 70%)',
            animation: 'eipOrbFloat2 18s ease-in-out infinite',
        }} />
        {/* Indigo orb – center */}
        <div style={{
            position: 'absolute', top: '40%', left: '50%',
            transform: 'translate(-50%,-50%)',
            width: '30vmax', height: '30vmax', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.10) 0%, transparent 70%)',
            animation: 'eipOrbFloat3 22s ease-in-out infinite',
        }} />
        {/* Subtle grid */}
        <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px)',
            backgroundSize: '60px 60px',
        }} />
    </div>
);

export const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);
    const setAuth = useAuthStore((state) => state.setAuth);
    const navigate = useNavigate();

    useEffect(() => {
        const t = setTimeout(() => setMounted(true), 60);
        return () => clearTimeout(t);
    }, []);

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
                email, password,
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

    const labelStyle: React.CSSProperties = {
        display: 'block', fontSize: '11px', fontWeight: 600,
        color: '#94a3b8', marginBottom: '8px',
        letterSpacing: '0.06em', textTransform: 'uppercase',
    };

    const inputBaseStyle: React.CSSProperties = {
        display: 'block', width: '100%',
        padding: '11px 14px 11px 40px',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.09)',
        background: 'rgba(8,15,30,0.85)',
        color: '#e2e8f0', fontSize: '14px',
        fontFamily: 'Inter,sans-serif',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
    };

    return (
        <>
            <style>{`
                @keyframes eipOrbFloat1 {
                    0%,100%{ transform:translate(0,0) scale(1); }
                    33%    { transform:translate(3%,5%) scale(1.05); }
                    66%    { transform:translate(-2%,2%) scale(0.97); }
                }
                @keyframes eipOrbFloat2 {
                    0%,100%{ transform:translate(0,0) scale(1); }
                    33%    { transform:translate(-4%,-3%) scale(1.07); }
                    66%    { transform:translate(2%,4%) scale(0.95); }
                }
                @keyframes eipOrbFloat3 {
                    0%,100%{ transform:translate(-50%,-50%) scale(1); }
                    50%    { transform:translate(-50%,-50%) scale(1.15); }
                }
                @keyframes eipFadeUp {
                    from{ opacity:0; transform:translateY(28px); }
                    to  { opacity:1; transform:translateY(0); }
                }
                @keyframes eipShimmer {
                    0%  { background-position:-200% center; }
                    100%{ background-position: 200% center; }
                }
                .eip-enter { animation: eipFadeUp 0.65s cubic-bezier(0.22,1,0.36,1) both; }
                .eip-input:focus {
                    outline:none;
                    border-color:rgba(99,102,241,0.70)!important;
                    box-shadow:0 0 0 3px rgba(99,102,241,0.15),0 0 16px rgba(99,102,241,0.10)!important;
                }
                .eip-input::placeholder{ color:#4a5b74; }
                .eip-signin {
                    position:relative; overflow:hidden;
                    background:linear-gradient(135deg,#2563eb 0%,#4f46e5 100%);
                    transition:filter .2s,transform .15s,box-shadow .2s;
                }
                .eip-signin::after{
                    content:''; position:absolute; inset:0;
                    background:linear-gradient(90deg,transparent,rgba(255,255,255,0.14),transparent);
                    background-size:200% 100%; opacity:0; transition:opacity .3s;
                }
                .eip-signin:hover:not(:disabled)::after{ opacity:1; animation:eipShimmer 1.2s linear infinite; }
                .eip-signin:hover:not(:disabled){
                    filter:brightness(1.12); transform:translateY(-1px);
                    box-shadow:0 8px 32px rgba(79,70,229,0.50);
                }
                .eip-signin:active:not(:disabled){ transform:translateY(0); }
                .eip-google{ transition:background .2s,transform .15s,box-shadow .2s; }
                .eip-google:hover:not(:disabled){
                    background:rgba(255,255,255,0.06)!important;
                    transform:translateY(-1px); box-shadow:0 6px 24px rgba(0,0,0,0.30);
                }
                .eip-eye{ transition:color .15s,transform .15s; }
                .eip-eye:hover{ color:#c7d2fe!important; transform:scale(1.1); }
                .eip-div-line{
                    flex:1; height:1px;
                    background:linear-gradient(90deg,transparent,rgba(255,255,255,0.07),transparent);
                }
                .eip-badge{
                    display:inline-flex; align-items:center; gap:6px;
                    padding:4px 12px; border-radius:9999px;
                    border:1px solid rgba(16,185,129,0.28);
                    background:rgba(16,185,129,0.07);
                    color:#6ee7b7; font-size:11px; font-weight:600;
                    letter-spacing:0.05em; text-transform:uppercase;
                    margin-bottom:14px;
                }
                @media (prefers-reduced-motion: reduce) {
                    .eip-enter { animation: none !important; opacity: 1 !important; transform: none !important; }
                    .eip-signin:hover:not(:disabled)::after { animation: none !important; }
                    [style*="eipOrbFloat"] { animation: none !important; }
                }
            `}</style>

            {/* Page */}
            <div style={{
                minHeight:'100vh', width:'100%',
                display:'flex', alignItems:'center', justifyContent:'center',
                padding:'3rem 1rem', background:'#060a14', position:'relative',
            }}>
                <BackgroundOrbs />

                {/* Content */}
                <div
                    className={mounted ? 'eip-enter' : ''}
                    style={{ width:'100%', maxWidth:'420px', position:'relative', zIndex:10, opacity: mounted ? undefined : 0 }}
                >
                    {/* ── Brand ── */}
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', marginBottom:'32px' }}>
                        {/* Logo mark */}
                        <div style={{ position:'relative', width:'68px', height:'68px', marginBottom:'16px' }}>
                            <div style={{
                                position:'absolute', inset:'-4px', borderRadius:'50%',
                                background:'conic-gradient(from 0deg,#2563eb,#4f46e5,#10b981,#2563eb)',
                                opacity:0.55, filter:'blur(5px)',
                            }} />
                            <div style={{
                                position:'absolute', inset:0, borderRadius:'20px',
                                background:'linear-gradient(135deg,#1d4ed8 0%,#4338ca 60%,#0d9488 100%)',
                                display:'flex', alignItems:'center', justifyContent:'center',
                                boxShadow:'0 8px 32px rgba(37,99,235,0.45)',
                            }}>
                                <span style={{ fontSize:'28px', fontWeight:900, color:'white', letterSpacing:'-1px' }}>E</span>
                            </div>
                        </div>

                        <div className="eip-badge">
                            <ShieldCheck size={12} />
                            Secure Platform
                        </div>

                        <h1 style={{ fontSize:'26px', fontWeight:800, color:'#f0f4ff', letterSpacing:'-0.5px', marginBottom:'5px', textAlign:'center' }}>
                            ElectWatch
                        </h1>
                        <p style={{ fontSize:'13px', color:'#94a3b8', textAlign:'center', letterSpacing:'0.02em' }}>
                            Election Intelligence Platform
                        </p>
                    </div>

                    {/* ── Card ── */}
                    <div style={{
                        borderRadius:'24px',
                        border:'1px solid rgba(255,255,255,0.07)',
                        background:'linear-gradient(145deg,rgba(13,19,35,0.94) 0%,rgba(10,15,28,0.82) 100%)',
                        backdropFilter:'blur(28px)', WebkitBackdropFilter:'blur(28px)',
                        padding:'36px',
                        boxShadow:'0 32px 80px rgba(0,0,0,0.65),inset 0 1px 0 rgba(255,255,255,0.05)',
                    }}>
                        <div style={{ marginBottom:'26px' }}>
                            <h2 style={{ fontSize:'18px', fontWeight:700, color:'#f0f4ff', marginBottom:'4px' }}>
                                Welcome back
                            </h2>
                            <p style={{ fontSize:'13px', color:'#94a3b8' }}>
                                Sign in to access your observer dashboard.
                            </p>
                        </div>

                        {/* Error */}
                        {error && (
                            <div role="alert" style={{
                                display:'flex', alignItems:'flex-start', gap:'10px',
                                padding:'12px 14px', borderRadius:'12px',
                                border:'1px solid rgba(239,68,68,0.25)',
                                background:'rgba(239,68,68,0.08)',
                                marginBottom:'20px', color:'#fca5a5',
                                fontSize:'13px', lineHeight:1.5,
                                animation:'eipFadeUp 0.3s ease both',
                            }}>
                                <AlertCircle size={16} style={{ marginTop:'1px', flexShrink:0, color:'#f87171' }} aria-hidden="true" />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleSubmit} noValidate style={{ display:'flex', flexDirection:'column', gap:'18px' }}>

                            {/* Email */}
                            <div>
                                <label htmlFor="email" style={labelStyle}>Email Address</label>
                                <div style={{ position:'relative' }}>
                                    <Mail size={16} aria-hidden="true" style={{
                                        position:'absolute', left:'13px', top:'50%',
                                        transform:'translateY(-50%)', color:'#64748b', pointerEvents:'none',
                                    }} />
                                    <input
                                        id="email" name="email" type="email"
                                        value={email} onChange={(e) => setEmail(e.target.value)}
                                        autoComplete="email" required placeholder="name@example.com"
                                        className="eip-input" style={inputBaseStyle}
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <label htmlFor="password" style={labelStyle}>Password</label>
                                <div style={{ position:'relative' }}>
                                    <Lock size={16} aria-hidden="true" style={{
                                        position:'absolute', left:'13px', top:'50%',
                                        transform:'translateY(-50%)', color:'#64748b', pointerEvents:'none',
                                    }} />
                                    <input
                                        id="password" name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={password} onChange={(e) => setPassword(e.target.value)}
                                        autoComplete="current-password" required placeholder="••••••••"
                                        className="eip-input"
                                        style={{ ...inputBaseStyle, paddingRight:'42px' }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((s) => !s)}
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                        className="eip-eye"
                                        style={{
                                            position:'absolute', right:'12px', top:'50%',
                                            transform:'translateY(-50%)',
                                            background:'none', border:'none', cursor:'pointer',
                                            color:'#64748b', display:'flex', alignItems:'center', padding:'4px',
                                        }}
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            {/* Sign in */}
                            <button
                                type="submit" disabled={loading}
                                className="eip-signin"
                                style={{
                                    marginTop:'4px', display:'flex',
                                    alignItems:'center', justifyContent:'center', gap:'8px',
                                    width:'100%', padding:'13px',
                                    borderRadius:'12px', border:'none',
                                    color:'white', fontSize:'14px', fontWeight:700,
                                    letterSpacing:'0.03em', fontFamily:'Inter,sans-serif',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    opacity: loading ? 0.65 : 1,
                                }}
                            >
                                {loading ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : 'Sign In'}
                            </button>
                        </form>

                        {/* Divider */}
                        <div style={{ display:'flex', alignItems:'center', gap:'12px', margin:'24px 0' }}>
                            <div className="eip-div-line" />
                            <span style={{
                                fontSize:'11px', fontWeight:500, color:'#94a3b8',
                                letterSpacing:'0.08em', textTransform:'uppercase' as const,
                                whiteSpace:'nowrap', flexShrink:0,
                            }}>
                                or continue with
                            </span>
                            <div className="eip-div-line" />
                        </div>

                        {/* Google */}
                        <button
                            type="button" onClick={handleGoogleSignIn}
                            disabled={googleLoading}
                            title={isGoogleSignInConfigured() ? undefined : 'Google sign-in is not configured for this deployment yet'}
                            className="eip-google"
                            style={{
                                display:'flex', alignItems:'center', justifyContent:'center', gap:'10px',
                                width:'100%', padding:'12px',
                                borderRadius:'12px',
                                border:'1px solid rgba(255,255,255,0.09)',
                                background:'rgba(255,255,255,0.03)',
                                color:'#94a3b8', fontSize:'14px', fontWeight:600,
                                fontFamily:'Inter,sans-serif',
                                cursor: googleLoading ? 'not-allowed' : 'pointer',
                                opacity: googleLoading ? 0.65 : 1,
                            }}
                        >
                            {googleLoading ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : <GoogleIcon />}
                            Continue with Google
                        </button>
                    </div>

                    {/* Footer */}
                    <p style={{
                        marginTop:'24px', textAlign:'center',
                        fontSize:'12px', color:'#94a3b8', lineHeight:1.7,
                    }}>
                        🔒 Authorized election observers &amp; staff only.<br />
                        Unauthorized access is strictly prohibited.
                    </p>
                </div>
            </div>
        </>
    );
};
