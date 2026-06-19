import { api } from './api';

export const trainingPlanService = {
  getPlans: async () => {
    return await api('/training-plans');
  },

  getPlan: async (id) => {
    return await api(`/training-plans/${id}`);
  },

  createPlan: async (data) => {
    return await api('/training-plans', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  updatePlan: async (id, data) => {
    return await api(`/training-plans/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  deletePlan: async (id) => {
    return await api(`/training-plans/${id}`, {
      method: 'DELETE'
    });
  },

  reactivatePlan: async (id) => {
    return await api(`/training-plans/${id}/reactivate`, {
      method: 'PATCH'
    });
  },

  assignPlan: async (planId, data) => {
    return await api(`/training-plans/${planId}/assign`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  deleteAssignment: async (assignmentId) => {
    return await api(`/training-plans/assignments/${assignmentId}`, {
      method: 'DELETE'
    });
  },

  getAthletePlans: async (athleteId) => {
    return await api(`/training-plans/athlete/${athleteId}`);
  }
};
