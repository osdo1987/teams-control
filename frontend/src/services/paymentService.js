import { api } from './api';

export const paymentService = {
  createPayment: async (paymentData) => {
    return await api('/payments', {
      method: 'POST',
      body: JSON.stringify(paymentData)
    });
  },
  
  getAthletePayments: async (athleteId) => {
    return await api(`/payments/athlete/${athleteId}`);
  },

  getPayments: async () => {
    return await api('/payments');
  },

  updatePayment: async (id, paymentData) => {
    return await api(`/payments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(paymentData)
    });
  },

  deletePayment: async (id) => {
    return await api(`/payments/${id}`, {
      method: 'DELETE'
    });
  }
};
