import React from 'react';
import { MapPin, Building, Users } from 'lucide-react';
import { useMyAssignment } from './useMyAssignment';

export const AssignmentDetails: React.FC = () => {
    const { assignment, isLoading, isOfflineCopy } = useMyAssignment();

    if (isLoading) return <div className="min-h-screen bg-slate-900 p-4 flex items-center justify-center text-slate-400">Loading assignment…</div>;

    if (!assignment) {
        return (
            <div className="min-h-screen bg-slate-900 p-4 flex items-center justify-center">
                <div className="glass-panel p-8 text-center">
                    <Users size={40} className="text-slate-500 mx-auto mb-3" />
                    <p className="text-slate-400">No assignment found.</p>
                    <p className="text-xs text-slate-500 mt-1">Contact your State Coordinator.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 p-4">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Building size={20} className="text-blue-400" />
                My Assignment
            </h2>

            {/* Polling Unit Card */}
            <div className="glass-panel p-5 mb-4">
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Polling Unit</p>
                <h3 className="text-lg font-bold text-white mb-3">{assignment.polling_unit.name}</h3>
                {isOfflineCopy && <p className="mb-3 text-xs text-amber-300">Showing your last synchronized assignment.</p>}

                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-slate-500 w-16">Code:</span>
                        <span className="text-slate-200 font-mono">{assignment.polling_unit.pu_code}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-slate-500 w-16">Ward:</span>
                        <span className="text-slate-200">{assignment.polling_unit.ward_id ? 'Available after geography sync' : 'N/A'}</span>
                    </div>
                </div>
            </div>

            {/* Location Card */}
            <div className="glass-panel p-5">
                <div className="flex items-center gap-2 mb-3">
                    <MapPin size={16} className="text-green-400" />
                    <p className="text-xs text-slate-400 uppercase tracking-wider">GPS Coordinates</p>
                </div>
                <p className="text-sm text-slate-200 font-mono">
                    {assignment.polling_unit.latitude?.toFixed(6) || 'Pending verification'}, {assignment.polling_unit.longitude?.toFixed(6) || 'Pending verification'}
                </p>
            </div>
        </div>
    );
};
