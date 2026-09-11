import React, { useState } from 'react';
import { useGeolocation, calculateDistance } from '../../hooks/useGeolocation';
import { syncManager } from '../../api/SyncManager';
import { MapPin, Navigation, CheckCircle, AlertCircle } from 'lucide-react';

interface CheckInProps {
    assignedPU: {
        id: number;
        name: string;
        latitude: number;
        longitude: number;
    };
}

export const CheckIn: React.FC<CheckInProps> = ({ assignedPU }) => {
    const { position, hasLock, error, startTracking } = useGeolocation();
    const [checkInStatus, setCheckInStatus] = useState<'idle' | 'ready' | 'done'>('idle');
    const MAX_DISTANCE = 500; // meters

    React.useEffect(() => {
        startTracking();
    }, []);

    const distance = position
        ? calculateDistance(
            position.latitude, position.longitude,
            assignedPU.latitude, assignedPU.longitude
        )
        : null;

    const isWithinRange = distance !== null && distance <= MAX_DISTANCE;

    React.useEffect(() => {
        if (isWithinRange && checkInStatus === 'idle') {
            setCheckInStatus('ready');
        }
    }, [isWithinRange, checkInStatus]);

    const handleCheckIn = async () => {
        if (!position || !isWithinRange) return;

        await syncManager.queueAction('CHECK_IN', {
            polling_unit_id: assignedPU.id,
            latitude: position.latitude,
            longitude: position.longitude,
            check_in_time: new Date().toISOString(),
            distance_from_pu: Math.round(distance!),
        }, 2); // High priority

        setCheckInStatus('done');
    };

    return (
        <div className="min-h-screen bg-slate-900 p-4">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Navigation size={20} className="text-blue-400" />
                Check-In
            </h2>

            {/* Assigned PU Info */}
            <div className="glass-panel p-4 mb-4">
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Assigned Polling Unit</p>
                <p className="text-lg font-semibold text-white">{assignedPU.name}</p>
                <p className="text-xs text-slate-500 mt-1">
                    {assignedPU.latitude.toFixed(4)}, {assignedPU.longitude.toFixed(4)}
                </p>
            </div>

            {/* GPS Status */}
            <div className="glass-panel p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-slate-400">GPS Status</span>
                    <span className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full ${hasLock ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                        <MapPin size={12} />
                        {hasLock ? 'Locked' : 'Acquiring...'}
                    </span>
                </div>

                {position && (
                    <>
                        <p className="text-sm text-slate-300">
                            Your Location: {position.latitude.toFixed(5)}, {position.longitude.toFixed(5)}
                        </p>
                        <p className="text-sm text-slate-300 mt-1">
                            Accuracy: ±{Math.round(position.accuracy)}m
                        </p>
                    </>
                )}

                {distance !== null && (
                    <div className={`mt-3 p-3 rounded-lg ${isWithinRange ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'
                        }`}>
                        <p className={`text-sm font-semibold ${isWithinRange ? 'text-green-300' : 'text-red-300'}`}>
                            Distance: {Math.round(distance)}m {isWithinRange ? '✓ Within range' : `✗ Too far (max ${MAX_DISTANCE}m)`}
                        </p>
                    </div>
                )}

                {error && (
                    <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                        <p className="text-sm text-red-300 flex items-center gap-2">
                            <AlertCircle size={14} /> {error}
                        </p>
                    </div>
                )}
            </div>

            {/* Check-In Button */}
            {checkInStatus === 'done' ? (
                <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-center">
                    <CheckCircle size={32} className="text-green-400 mx-auto mb-2" />
                    <p className="text-green-200 font-semibold">Checked In Successfully</p>
                    <p className="text-green-400/60 text-xs mt-1">
                        {new Date().toLocaleTimeString()}
                    </p>
                </div>
            ) : (
                <button
                    onClick={handleCheckIn}
                    disabled={!isWithinRange}
                    className={`w-full py-4 text-lg rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${isWithinRange
                            ? 'bg-green-600 hover:bg-green-500 text-white'
                            : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                        }`}
                >
                    <CheckCircle size={20} />
                    {isWithinRange ? 'Check In Now' : 'Move closer to PU'}
                </button>
            )}
        </div>
    );
};
