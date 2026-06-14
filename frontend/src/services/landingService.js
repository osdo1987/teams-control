import { api } from './api';

const landingService = {
    /**
     * Get public landing page for a club (no auth required)
     */
    getPublicBySlug: async (clubSlug) => {
        return await api(`/landing/${clubSlug}`);
    },

    /**
     * Get landing page for editing (requires auth)
     */
    getManage: async (clubId) => {
        let endpoint = '/landing/manage';
        if (clubId) endpoint += `?club_id=${clubId}`;
        return await api(endpoint);
    },

    /**
     * Create or update landing page
     */
    save: async (data, clubId) => {
        let endpoint = '/landing/manage';
        if (clubId) endpoint += `?club_id=${clubId}`;
        return await api(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    /**
     * Upload an image
     */
    uploadImage: async (file, clubId) => {
        const formData = new FormData();
        formData.append('file', file);
        let endpoint = '/landing/upload-image';
        if (clubId) endpoint += `?club_id=${clubId}`;

        // Use native fetch for file upload to avoid JSON content-type
        const token = localStorage.getItem('access_token');
        const response = await fetch(`/api${endpoint}`, {
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

    /**
     * Delete landing page
     */
    delete: async (clubId) => {
        let endpoint = '/landing/manage';
        if (clubId) endpoint += `?club_id=${clubId}`;
        return await api(endpoint, { method: 'DELETE' });
    },
};

export default landingService;