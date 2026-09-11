import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useSyncStore } from '../../store/useSyncStore';
import { db } from '../../storage/db';
import { useNavigate } from 'react-router-dom';
import { Wifi, WifiOff, MapPin, AlertTriangle, Clock, CheckCircle, Upload } from 'lucide-react';

export const Dashboard: React.FC = () => {
    const user = useAuthStore((s) => s.user);
    const logout = useAuthStore((s) => s.logout);
    const { isOnline, pendingCount, lastSyncTime } = useSyncStore();
    const navigate = useNavigate();

    const [stats, setStats] = useState({ totalIncidents: 0, totalPending: 0, totalSynced: 0 });

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
        <div className="min-h-screen bg-slate-900 p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-bold text-white">Observer Dashboard</h1>
                    <p className="text-sm text-slate-400">Welcome, {user?.name}</p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Connectivity Indicator */}
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${isOnline ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                        {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
                        {isOnline ? 'Online' : 'Offline'}
                    </div>
                </div>
            </div>

            {/* Sync Status Banner */}
            {pendingCount > 0 && (
                <div className="glass-panel p-3 mb-4 flex items-center gap-3 border-l-4 border-yellow-500">
                    <Upload size={18} className="text-yellow-400" />
                    <p className="text-sm text-yellow-200">
                        <strong>{pendingCount}</strong> item{pendingCount > 1 ? 's' : ''} queued for sync
                    </p>
                </div>
            )}

            {/* KPI Cards */}
            <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="glass-panel p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle size={16} className="text-blue-400" />
                        <span className="text-xs text-slate-400">Reports Filed</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{stats.totalIncidents}</p>
                </div>
                <div className="glass-panel p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Clock size={16} className="text-yellow-400" />
                        <span className="text-xs text-slate-400">Pending Sync</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{stats.totalPending}</p>
                </div>
                <div className="glass-panel p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <CheckCircle size={16} className="text-green-400" />
                        <span className="text-xs text-slate-400">Synced</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{stats.totalSynced}</p>
                </div>
                <div className="glass-panel p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <MapPin size={16} className="text-purple-400" />
                        <span className="text-xs text-slate-400">Last Sync</span>
                    </div>
                    <p className="text-sm font-medium text-white">
                        {lastSyncTime ? new Date(lastSyncTime).toLocaleTimeString() : 'Never'}
                    </p>
                </div>
            </div>

            {/* Quick Actions */}
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Quick Actions</h2>
            <div className="grid grid-cols-1 gap-3">
                <button
                    onClick={() => navigate('/report')}
                    className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-2"
                >
                    <AlertTriangle size={20} />
                    Report Incident
                </button>
                <button
                    onClick={() => navigate('/checkin')}
                    className="w-full py-4 text-lg flex items-center justify-center gap-2 bg-green-500/10 border border-green-500/30 rounded-xl text-green-100 hover:bg-green-500/20 transition-all"
                >
                    <MapPin size={20} />
                    Check-In at Polling Unit
                </button>
            </div>

            {/* Logout */}
            <button
                onClick={() => { logout(); navigate('/login'); }}
                className="mt-8 text-sm text-red-400 hover:text-red-300 transition-colors block mx-auto"
            >
                Logout System
            </button>
        </div>
    );
};
