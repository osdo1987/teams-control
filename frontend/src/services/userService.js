import { api } from './api';

export const userService = {
  getUsers: async () => {
    return await api('/auth/users'); // We might need to add this endpoint to the backend
  },
  
  createUser: async (userData) => {
    return await api('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }
};
