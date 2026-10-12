import { db } from '../../storage/db';
import api from '../../api';

export const useGeographySync = () => {
    const syncElectoralData = async () => {
        try {
            // 1. Fetch States
            const statesRes = await api.get<any>('/geography/states');
            const states = Array.isArray(statesRes) ? statesRes : (statesRes?.data || []);
            if (states.length > 0) await db.states.bulkPut(states);

            // 2. Fetch LGAs
            const lgasRes = await api.get<any>('/geography/lgas');
            const lgas = Array.isArray(lgasRes) ? lgasRes : (lgasRes?.data || []);
            if (lgas.length > 0) await db.lgas.bulkPut(lgas);

            // 3. Fetch Wards
            const wardsRes = await api.get<any>('/geography/wards');
            const wards = Array.isArray(wardsRes) ? wardsRes : (wardsRes?.data || []);
            if (wards.length > 0) await db.wards.bulkPut(wards);

            // 4. Fetch Polling Units (All for the state)
            const puRes = await api.get<any>('/geography/polling-units?all=true');
            const puArray = Array.isArray(puRes) ? puRes : (puRes?.data || []);
            if (puArray.length > 0) await db.polling_units.bulkPut(puArray);

            console.log('Electoral data synchronized successfully');
            return true;
        } catch (error) {
            console.error('Failed to sync electoral data:', error);
            return false;
        }
    };

    return { syncElectoralData };
};
