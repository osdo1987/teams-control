import { api } from './api';

const clubService = {
  // Admin methods
  getAllClubs: async () => {
    return await api('/clubs');
  },

  createClub: async (data) => {
    return await api('/clubs', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  updateClub: async (clubId, data) => {
    return await api(`/clubs/${clubId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  deleteClub: async (clubId) => {
    return await api(`/clubs/${clubId}`, {
      method: 'DELETE'
    });
  },

  reactivateClub: async (clubId) => {
    return await api(`/clubs/${clubId}/reactivate`, {
      method: 'PATCH'
    });
  },

  getAllClubsIncludingInactive: async () => {
    return await api('/clubs?include_inactive=true');
  },

  /**
   * Upload a club logo image file.
   * Uses native fetch to send FormData (not JSON).
   */
  uploadLogo: async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('access_token');
    const response = await fetch('/api/clubs/upload-logo', {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: formData
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Error al subir imagen');
    }
    return data;
  },

  // Public method - no auth required
  getPublicBySlug: async (slug) => {
    return await api(`/clubs/public/${slug}`);
  },

  // Club login method
  login: async (identificationNumber, password) => {
    return await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        identification_number: identificationNumber,
        password: password
      })
    });
  },

  // Get club by slug (alias for getPublicBySlug)
  getBySlug: async (slug) => {
    return await api(`/clubs/public/${slug}`);
  },
};

export default clubService;