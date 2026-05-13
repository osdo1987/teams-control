export const BASE_URL = '/api';

// Simple api wrapper around fetch to handle token injection and auto-logout
export const api = async (endpoint, options = {}) => {
  const token = localStorage.getItem('access_token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers
    });

    const data = await response.json();

    // Auto-logout ONLY when a previously authenticated request fails with 401
    // (token expired / invalid). Do NOT auto-logout on the login endpoint itself.
    if (response.status === 401 && token && !endpoint.includes('/auth/login')) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      return null;
    }

    if (!response.ok) {
      throw new Error(data.error || data.message || 'Error en la solicitud');
    }

    return data;
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
};
