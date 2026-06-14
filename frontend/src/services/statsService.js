import { api } from './api';

export const statsService = {
  getDashboard: async () => {
    return api('/stats/dashboard');
  },
  getGlobalStats: async () => {
    return api('/stats/global');
  }
};
