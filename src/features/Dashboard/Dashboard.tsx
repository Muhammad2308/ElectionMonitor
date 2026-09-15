import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useSyncStore } from '../../store/useSyncStore';
import { db } from '../../storage/db';
import { useNavigate } from 'react-router-dom';
import { Wifi, WifiOff, MapPin, AlertTriangle, Clock, CheckCircle, Upload, LogOut, ChevronRight } from 'lucide-react';

const BackgroundOrbs: React.FC = () => (
    <div style={{ pointerEvents: 'none', position: 'fixed', inset: 0, overflow: 'hidden', zIndex: 0 }} aria-hidden="true">
        <div style={{
            position: 'absolute', top: '-10%', right: '-15%',
            width: '60vmax', height: '60vmax', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)',
            animation: 'eipOrbFloat2 16s ease-in-out infinite',
        }} />
        <div style={{
            position: 'absolute', bottom: '-20%', left: '-10%',
            width: '50vmax', height: '50vmax', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(37,99,235,0.15) 0%, transparent 70%)',
            animation: 'eipOrbFloat1 18s ease-in-out infinite',
        }} />
        <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px)',
            backgroundSize: '40px 40px',
        }} />
    </div>
);

export const Dashboard: React.FC = () => {
    const user = useAuthStore((s) => s.user);
    const logout = useAuthStore((s) => s.logout);
    const { isOnline, pendingCount, lastSyncTime } = useSyncStore();
    const navigate = useNavigate();

    const [stats, setStats] = useState({ totalIncidents: 0, totalPending: 0, totalSynced: 0 });
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setMounted(true), 50);
        return () => clearTimeout(t);
    }, []);

    useEffect(() => {
        const loadStats = async () => {
            const total = await db.incidents.count();
            const pending = await db.incidents.where('sync_status').equals('pending').count();
            const synced = await db.incidents.where('sync_status').equals('synced').count();
            setStats({ totalIncidents: total, totalPending: pending, totalSynced: synced });
        };
        loadStats();
        const interval = setInterval(loadStats, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <>
            <style>{`
                @keyframes eipFadeUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .dash-enter { animation: eipFadeUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) both; }
                .dash-enter-delay-1 { animation-delay: 0.1s; }
                .dash-enter-delay-2 { animation-delay: 0.2s; }
                .dash-enter-delay-3 { animation-delay: 0.3s; }
                
                .glass-card {
                    background: linear-gradient(145deg, rgba(30,41,59,0.7) 0%, rgba(15,23,42,0.6) 100%);
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 20px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                }

                .btn-report {
                    background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%);
                    box-shadow: 0 8px 24px rgba(239, 68, 68, 0.35);
                    transition: transform 0.2s, filter 0.2s, box-shadow 0.2s;
                }
                .btn-report:active { transform: scale(0.98); }
                .btn-report:hover { filter: brightness(1.1); box-shadow: 0 12px 32px rgba(239, 68, 68, 0.45); }

                .btn-checkin {
                    background: linear-gradient(135deg, #10b981 0%, #047857 100%);
                    box-shadow: 0 8px 24px rgba(16, 185, 129, 0.35);
                    transition: transform 0.2s, filter 0.2s, box-shadow 0.2s;
                }
                .btn-checkin:active { transform: scale(0.98); }
                .btn-checkin:hover { filter: brightness(1.1); box-shadow: 0 12px 32px rgba(16, 185, 129, 0.45); }

                .pulse-dot {
                    animation: pulse 2s infinite;
                }
                @keyframes pulse {
                    0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
                    70% { box-shadow: 0 0 0 6px rgba(34, 197, 94, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
                }
                @keyframes pulse-red {
                    0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
                    70% { box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
                }
            `}</style>
            
            <div className="min-h-screen bg-[#060a14] text-slate-100 relative overflow-hidden pb-20">
                <BackgroundOrbs />
                
                {/* Sticky Header */}
                <div className="sticky top-0 z-50 w-full backdrop-blur-xl bg-[#060a14]/70 border-b border-white/5 pt-6 pb-4 px-5">
                    <div className="flex items-center justify-between max-w-md mx-auto">
                        <div className={`dash-enter ${!mounted && 'opacity-0'}`}>
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-lg shadow-lg shadow-blue-500/30">
                                    {user?.name?.charAt(0).toUpperCase() || 'O'}
                                </div>
                                <div>
                                    <h1 className="text-sm font-medium text-slate-400 leading-tight">Welcome back,</h1>
                                    <p className="text-lg font-bold text-white leading-tight">{user?.name}</p>
                                </div>
                            </div>
                        </div>
                        <div className={`dash-enter ${!mounted && 'opacity-0'} flex items-center`}>
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${
                                isOnline 
                                    ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                                    : 'bg-red-500/10 text-red-400 border-red-500/20'
                            }`}>
                                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400 pulse-dot' : 'bg-red-400'} ${!isOnline && 'pulse-red'}`} />
                                {isOnline ? 'Online' : 'Offline'}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-md mx-auto px-5 pt-6 relative z-10">
                    
                    {/* Sync Status Banner */}
                    {pendingCount > 0 && (
                        <div className={`dash-enter dash-enter-delay-1 ${!mounted && 'opacity-0'} mb-6`}>
                            <div className="rounded-2xl bg-gradient-to-r from-orange-500/20 to-yellow-500/10 border border-orange-500/30 p-4 flex items-center gap-4 shadow-lg shadow-orange-500/10">
                                <div className="bg-orange-500/20 p-2 rounded-full text-orange-400">
                                    <Upload size={20} className="animate-bounce" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-orange-200">Sync Pending</h3>
                                    <p className="text-xs text-orange-300/80 mt-0.5">
                                        {pendingCount} report{pendingCount > 1 ? 's' : ''} waiting for connection
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Quick Actions (Primary Focus on Mobile) */}
                    <div className={`dash-enter dash-enter-delay-1 ${!mounted && 'opacity-0'} mb-8`}>
                        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 pl-1">Take Action</h2>
                        <div className="grid grid-cols-1 gap-4">
                            <button
                                onClick={() => navigate('/report')}
                                className="btn-report w-full p-5 rounded-2xl flex items-center justify-between group overflow-hidden relative"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                                <div className="flex items-center gap-4 relative z-10">
                                    <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                                        <AlertTriangle size={24} className="text-white" />
                                    </div>
                                    <div className="text-left">
                                        <div className="text-lg font-bold text-white">Report Incident</div>
                                        <div className="text-xs font-medium text-red-200">Log a new event at your PU</div>
                                    </div>
                                </div>
                                <ChevronRight className="text-red-200 opacity-70 relative z-10" />
                            </button>
                            
                            <button
                                onClick={() => navigate('/checkin')}
                                className="btn-checkin w-full p-5 rounded-2xl flex items-center justify-between group overflow-hidden relative"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                                <div className="flex items-center gap-4 relative z-10">
                                    <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                                        <MapPin size={24} className="text-white" />
                                    </div>
                                    <div className="text-left">
                                        <div className="text-lg font-bold text-white">Check-In</div>
                                        <div className="text-xs font-medium text-emerald-200">Verify your location</div>
                                    </div>
                                </div>
                                <ChevronRight className="text-emerald-200 opacity-70 relative z-10" />
                            </button>
                        </div>
                    </div>

                    {/* KPI Stats Grid */}
                    <div className={`dash-enter dash-enter-delay-2 ${!mounted && 'opacity-0'} mb-8`}>
                        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 pl-1">Your Stats</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="glass-card p-5">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="bg-blue-500/20 p-2 rounded-lg text-blue-400">
                                        <AlertTriangle size={18} />
                                    </div>
                                    <span className="text-xs font-semibold text-slate-400 uppercase">Filed</span>
                                </div>
                                <p className="text-3xl font-black text-white">{stats.totalIncidents}</p>
                            </div>
                            
                            <div className="glass-card p-5">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="bg-emerald-500/20 p-2 rounded-lg text-emerald-400">
                                        <CheckCircle size={18} />
                                    </div>
                                    <span className="text-xs font-semibold text-slate-400 uppercase">Synced</span>
                                </div>
                                <p className="text-3xl font-black text-white">{stats.totalSynced}</p>
                            </div>
                            
                            <div className="glass-card p-5 col-span-2 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="bg-purple-500/20 p-2 rounded-lg text-purple-400">
                                        <Clock size={18} />
                                    </div>
                                    <div>
                                        <div className="text-xs font-semibold text-slate-400 uppercase">Last Sync Time</div>
                                        <div className="text-sm font-medium text-white mt-0.5">
                                            {lastSyncTime ? new Date(lastSyncTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Never'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className={`dash-enter dash-enter-delay-3 ${!mounted && 'opacity-0'} flex justify-center`}>
                        <button
                            onClick={() => { logout(); navigate('/login'); }}
                            className="flex items-center gap-2 px-6 py-3 rounded-full border border-slate-700 bg-slate-800/50 text-slate-300 text-sm font-medium hover:bg-slate-700 hover:text-white transition-colors"
                        >
                            <LogOut size={16} />
                            Sign Out
                        </button>
                    </div>

                </div>
            </div>
        </>
    );
};

