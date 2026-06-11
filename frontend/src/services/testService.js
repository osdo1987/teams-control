import { api } from './api';

export const testService = {
  // Templates
  getTemplates: async () => {
    return api('/tests/templates');
  },

  createTemplate: async (data) => {
    return api('/tests/templates', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' }
    });
  },

  updateTemplate: async (id, data) => {
    return api(`/tests/templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' }
    });
  },

  deleteTemplate: async (id) => {
    return api(`/tests/templates/${id}`, { method: 'DELETE' });
  },

  // Results
  getResults: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api(`/tests/results?${query}`);
  },

  createResult: async (data) => {
    return api('/tests/results', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' }
    });
  },

  deleteResult: async (id) => {
    return api(`/tests/results/${id}`, { method: 'DELETE' });
  },

  // Sessions
  getSessions: async () => {
    return api('/tests/sessions');
  },

  createSession: async (data) => {
    return api('/tests/sessions', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' }
    });
  },

  // Athlete History
  getAthleteHistory: async (athleteId, templateId = null) => {
    const query = templateId ? `?template_id=${templateId}` : '';
    return api(`/tests/athletes/${athleteId}/history${query}`);
  }
};