import { api } from './api';

export const authService = {
  login: async (identificationNumber, password) => {
    const data = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identification_number: identificationNumber, password })
    });
    
    if (data && data.access_token) {
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    return data;
  },
  
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  },
  
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  getTrainers: async () => {
    return await api('/auth/trainers');
  }
};
