import React, { useState, useEffect } from 'react';
import { db } from '../../storage/db';
import { useAuthStore } from '../../store/useAuthStore';
import { MapPin, Send, AlertTriangle } from 'lucide-react';

export const IncidentForm: React.FC<{ pollingUnitId: number }> = ({ pollingUnitId }) => {
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [description, setDescription] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [gps, setGps] = useState<{ lat: number; lng: number } | null>(null);
    const user = useAuthStore((state) => state.user);

    useEffect(() => {
        // Capture GPS on mount
        navigator.geolocation.getCurrentPosition(
            (pos) => setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            (err) => console.warn('GPS capture failed', err),
            { enableHighAccuracy: true }
        );
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCategory || !user) return;

        setIsSaving(true);
        try {
            const incidentId = crypto.randomUUID();
            await db.incidents.add({
                id: incidentId,
                user_id: user.id,
                polling_unit_id: pollingUnitId,
                category_id: selectedCategory,
                description,
                incident_time: new Date().toISOString(),
                latitude: gps?.lat || null,
                longitude: gps?.lng || null,
                sync_status: 'pending',
                created_at: new Date().toISOString(),
            });

            // Clear form
            setDescription('');
            setSelectedCategory(null);
            alert('Incident saved and queued for sync.');
        } catch (error) {
            console.error('Failed to save incident:', error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="glass-panel p-6 max-w-2xl mx-auto">
            <div className="flex items-center gap-2 mb-6">
                <AlertTriangle className="text-yellow-500" />
                <h2 className="text-xl font-bold">Report Incident</h2>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
                {/* Category Selection - Large Tap Targets */}
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Category</label>
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { id: 1, name: 'Violence' },
                            { id: 2, name: 'Vote Buying' },
                            { id: 3, name: 'Ballot Snatching' },
                            { id: 4, name: 'Delayed Opening' },
                        ].map((cat) => (
                            <button
                                key={cat.id}
                                type="button"
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`p-4 rounded-xl border transition-all text-left ${selectedCategory === cat.id
                                        ? 'bg-blue-500/20 border-blue-500 text-blue-100'
                                        : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                                    }`}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Description</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
                        placeholder="Provide context about the incident..."
                    />
                </div>

                {/* GPS Status Indicator */}
                <div className="flex items-center gap-2 p-3 bg-white/5 rounded-lg text-sm">
                    <MapPin className={gps ? 'text-green-500' : 'text-slate-500'} size={16} />
                    <span className={gps ? 'text-slate-100' : 'text-slate-400'}>
                        {gps ? `GPS Locked (${gps.lat.toFixed(4)}, ${gps.lng.toFixed(4)})` : 'Aquiring GPS...'}
                    </span>
                </div>

                <button
                    type="submit"
                    disabled={isSaving || !selectedCategory}
                    className="btn-primary w-full py-4 flex items-center justify-center gap-2"
                >
                    <Send size={20} />
                    {isSaving ? 'Saving...' : 'Submit Incident'}
                </button>
            </form>
        </div>
    );
};
