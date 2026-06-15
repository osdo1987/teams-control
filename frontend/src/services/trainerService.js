import { api } from './api';

const trainerService = {
    getMyProfile: async () => {
        return await api('/trainer/profile');
    },

    updateMyProfile: async (data) => {
        return await api('/trainer/profile', {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },
};

export default trainerService;