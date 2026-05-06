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
  }
};
