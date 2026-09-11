import React, { useRef, useState } from 'react';
import { Camera, X } from 'lucide-react';
import { db } from '../../storage/db';

interface MediaCaptureProps {
    incidentId: string;
    onCapture: (mediaId: string) => void;
}

export const MediaCapture: React.FC<MediaCaptureProps> = ({ incidentId, onCapture }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [previews, setPreviews] = useState<{ id: string; url: string }[]>([]);

    const handleCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const mediaId = crypto.randomUUID();

            // Save to IndexedDB
            await db.media.add({
                id: mediaId,
                incident_id: incidentId,
                media_type: 'image',
                file_blob: file,
                file_hash: md5(file), // Assume md5 util exists or just use empty for now
                sync_status: 'pending',
                created_at: new Date().toISOString()
            });

            const url = URL.createObjectURL(file);
            setPreviews((prev) => [...prev, { id: mediaId, url }]);
            onCapture(mediaId);
        }
    };

    // Mock md5 for prototype
    const md5 = (file: File) => `${file.size}-${file.name}`;

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-100 hover:bg-blue-500/20 transition-all"
                >
                    <Camera size={24} />
                    <span className="font-semibold">Add Photo</span>
                </button>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleCapture}
                    className="hidden"
                    accept="image/*"
                    capture="environment"
                    multiple
                />
            </div>

            {previews.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                    {previews.map((img) => (
                        <div key={img.id} className="relative aspect-square rounded-lg overflow-hidden border border-white/10">
                            <img src={img.url} alt="Evidence" className="w-full h-full object-cover" />
                            <button
                                className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white"
                                onClick={() => setPreviews(prev => prev.filter(p => p.id !== img.id))}
                            >
                                <X size={12} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
