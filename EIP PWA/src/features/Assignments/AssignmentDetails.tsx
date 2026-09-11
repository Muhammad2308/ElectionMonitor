import React, { useEffect, useState } from 'react';
import { db } from '../../storage/db';
import { MapPin, Building, Users } from 'lucide-react';

export const AssignmentDetails: React.FC = () => {
    const [assignment, setAssignment] = useState<any | null>(null);
    const [pu, setPu] = useState<any | null>(null);

    useEffect(() => {
        const loadAssignment = async () => {
            // In a real app, the observer's assignment would be fetched from the API
            // For now, we load the first polling unit from the local database to demonstrate
            const firstPu = await db.polling_units.limit(1).first();
            if (firstPu) {
                setPu(firstPu);
                const ward = await db.wards.get(firstPu.ward_id);
                setAssignment({
                    pollingUnit: firstPu,
                    ward: ward,
                });
            }
        };
        loadAssignment();
    }, []);

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
                <h3 className="text-lg font-bold text-white mb-3">{assignment.pollingUnit.name}</h3>

                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-slate-500 w-16">Code:</span>
                        <span className="text-slate-200 font-mono">{assignment.pollingUnit.pu_code}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-slate-500 w-16">Ward:</span>
                        <span className="text-slate-200">{assignment.ward?.name || 'N/A'}</span>
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
                    {assignment.pollingUnit.latitude?.toFixed(6) || 'N/A'}, {assignment.pollingUnit.longitude?.toFixed(6) || 'N/A'}
                </p>
            </div>
        </div>
    );
};
