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
  }
};
