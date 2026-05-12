import { api } from './api';

export const statsService = {
    getGlobalStats: async () => {
        return await api('/stats/global');
    }
};
