import { db, type State, type LGA, type Ward, type PollingUnit } from '../../storage/db';
import api from '../../api';

export const useGeographySync = () => {
    const syncElectoralData = async () => {
        try {
            // 1. Fetch States
            const states = await api.get<State[]>('/geography/states');
            await db.states.bulkPut(states);

            // 2. Fetch LGAs
            const lgas = await api.get<LGA[]>('/geography/lgas');
            await db.lgas.bulkPut(lgas);

            // 3. Fetch Wards
            const wards = await api.get<Ward[]>('/geography/wards');
            await db.wards.bulkPut(wards);

            // 4. Fetch Polling Units (Warning: High Volume)
            // For the first sync, we might fetch in chunks or all if the backend supports it.
            const pollingUnits = await api.get<PollingUnit[]>('/geography/polling-units');
            await db.polling_units.bulkPut(pollingUnits);

            console.log('Electoral data synchronized successfully');
            return true;
        } catch (error) {
            console.error('Failed to sync electoral data:', error);
            return false;
        }
    };

    return { syncElectoralData };
};
