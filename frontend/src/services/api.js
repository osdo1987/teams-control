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

    // Auto logout on 401 or 422 if it relates to JWT expiration
    if (response.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/login'; // Force redirect to login
      return null;
    }

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'API Error');
    }

    return data;
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
};
