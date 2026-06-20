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

    // Auto-logout ONLY when a previously authenticated request fails with 401
    // (token expired / invalid). Do NOT auto-logout on the login endpoint itself.
    // Check BEFORE parsing JSON to ensure this always triggers.
    if (response.status === 401 && token && !endpoint.includes('/auth/login')) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      return null;
    }

    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      // If response is not JSON, throw a meaningful error
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      throw new Error('Respuesta inválida del servidor');
    }

    if (!response.ok) {
      // Flask-JWT-Extended returns {"msg": "..."} for 401 errors
      // Our API returns {"error": "..."} for other errors
      throw new Error(data.error || data.message || data.msg || `Error ${response.status}: ${response.statusText}`);
    }

    return data;
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
};
