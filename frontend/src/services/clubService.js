import { api } from './api';

const clubService = {
  // Admin methods
  getAllClubs: async () => {
    return await api('/clubs');
  },

  createClub: async (data) => {
    return await api('/clubs', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  updateClub: async (clubId, data) => {
    return await api(`/clubs/${clubId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  deleteClub: async (clubId) => {
    return await api(`/clubs/${clubId}`, {
      method: 'DELETE'
    });
  },

  // Public method - no auth required
  getPublicBySlug: async (slug) => {
    return await api(`/clubs/public/${slug}`);
  },
};

export default clubService;