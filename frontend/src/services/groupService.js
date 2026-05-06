import { api } from './api';

export const groupService = {
  getGroups: async () => {
    return await api('/groups'); // We might need to implement a GET /groups endpoint in backend
  },
  
  createGroup: async (groupData) => {
    return await api('/groups', {
      method: 'POST',
      body: JSON.stringify(groupData)
    });
  },
  
  assignAthlete: async (groupId, athleteId) => {
    return await api(`/groups/${groupId}/assign`, {
      method: 'POST',
      body: JSON.stringify({ athlete_id: athleteId })
    });
  },
  
  changeAthleteGroup: async (data) => {
    return await api('/groups/change-athlete', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  updateGroup: async (id, groupData) => {
    return await api(`/groups/${id}`, {
      method: 'PUT',
      body: JSON.stringify(groupData)
    });
  },

  deleteGroup: async (id) => {
    return await api(`/groups/${id}`, {
      method: 'DELETE'
    });
  }
};
