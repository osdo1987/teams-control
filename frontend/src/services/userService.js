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
  },

  updateUser: async (id, userData) => {
    return await api(`/auth/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  },

  deleteUser: async (id) => {
    return await api(`/auth/users/${id}`, {
      method: 'DELETE'
    });
  },

  reactivateUser: async (id) => {
    return await api(`/auth/users/${id}/reactivate`, {
      method: 'PATCH'
    });
  }
};
