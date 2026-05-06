import { api } from './api';

export const athleteService = {
  getAthletes: async () => {
    return await api('/athletes');
  },
  
  createAthlete: async (data) => {
    return await api('/athletes', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  
  getAthlete: async (id) => {
    return await api(`/athletes/${id}`);
  },

  updateAthlete: async (id, data) => {
    return await api(`/athletes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  deleteAthlete: async (id) => {
    return await api(`/athletes/${id}`, {
      method: 'DELETE'
    });
  }
};
