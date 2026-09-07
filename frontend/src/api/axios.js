import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true, // keep cookie as a fallback, but don't rely on it
});

// Cross-domain cookies (frontend on Vercel, backend on Render) are unreliable
// across browsers/refreshes, so the login token is also stored locally and
// sent explicitly on every request - this is what actually keeps you logged in.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('meetslot_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
