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
      const userStr = localStorage.getItem('user');
      let clubSlug = null;
      try {
        const user = JSON.parse(userStr);
        clubSlug = user?.club_slug || null;
        // Save the club_slug in sessionStorage so ProtectedRoute can use it
        if (clubSlug) {
          sessionStorage.setItem('last_club_slug', clubSlug);
        }
      } catch (e) { /* ignore parse errors */ }
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      // Redirect to club login if user belonged to a club, otherwise to super-admin login
      window.location.href = clubSlug ? `/${clubSlug}` : '/login';
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
