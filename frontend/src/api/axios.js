import axios from 'axios';

let rawUrl = import.meta.env.VITE_API_URL || '/api/v1';

// ULTIMATE SCRUB: Delete all spaces, newlines, and tabs
let baseUrl = rawUrl.replace(/\s/g, '');

// Standardize: Ensure baseURL ends with a SINGLE slash
if (!baseUrl.endsWith('/')) {
  baseUrl = baseUrl + '/';
}

const api = axios.create({
  baseURL: baseUrl,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  // SMART ROUTING: If the URL starts with a slash, strip it so it appends correctly to /api/v1/
  if (config.url && config.url.startsWith('/')) {
    config.url = config.url.substring(1);
  }

  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
