import { useState, useEffect, useCallback } from 'react';

interface GeoPosition {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: number;
}

interface GeolocationState {
    position: GeoPosition | null;
    error: string | null;
    isTracking: boolean;
    hasLock: boolean;
}

export const useGeolocation = (options?: PositionOptions) => {
    const [state, setState] = useState<GeolocationState>({
        position: null,
        error: null,
        isTracking: false,
        hasLock: false,
    });

    const startTracking = useCallback(() => {
        if (!navigator.geolocation) {
            setState((s) => ({ ...s, error: 'Geolocation not supported' }));
            return;
        }

        setState((s) => ({ ...s, isTracking: true }));

        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                setState({
                    position: {
                        latitude: pos.coords.latitude,
                        longitude: pos.coords.longitude,
                        accuracy: pos.coords.accuracy,
                        timestamp: pos.timestamp,
                    },
                    error: null,
                    isTracking: true,
                    hasLock: pos.coords.accuracy < 100, // <100m = good lock
                });
            },
            (err) => {
                setState((s) => ({ ...s, error: err.message, hasLock: false }));
            },
            {
                enableHighAccuracy: true,
                maximumAge: 10000,
                timeout: 15000,
                ...options,
            }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, [options]);

    return { ...state, startTracking };
};

/**
 * Calculate distance in meters between two GPS points (Haversine).
 */
export const calculateDistance = (
    lat1: number, lon1: number,
    lat2: number, lon2: number
): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
};
