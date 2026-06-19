import { api } from './api';

export const categoryService = {
  getCategories: async () => {
    return await api('/categories');
  },
  createCategory: async (data) => {
    return await api('/categories', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  deleteCategory: async (id) => {
    return await api(`/categories/${id}`, {
      method: 'DELETE'
    });
  },
  reactivateCategory: async (id) => {
    return await api(`/categories/${id}/reactivate`, {
      method: 'PATCH'
    });
  }
};
