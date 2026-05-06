import { api } from './api';

const clubService = {
  getAllClubs: async () => {
    return await api('/clubs');
  },
  getClubDetails: async (id) => {
    return await api(`/clubs/${id}`);
  },
  createClub: async (clubData) => {
    return await api('/clubs', {
      method: 'POST',
      body: JSON.stringify(clubData)
    });
  }
};

export default clubService;
