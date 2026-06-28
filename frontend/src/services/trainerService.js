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

    // Admin methods
    getAdminProfile: async (userId) => {
        return await api(`/trainer/admin/${userId}`);
    },

    updateAdminProfile: async (userId, data) => {
        return await api(`/trainer/admin/${userId}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },
};

export default trainerService;