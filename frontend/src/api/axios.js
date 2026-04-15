import axios from 'axios';

let rawUrl = import.meta.env.VITE_API_URL || 'https://onlineexaminationsystem-production.up.railway.app/api/v1';

// ULTIMATE SCRUB: Delete all spaces, newlines, and tabs
let baseUrl = rawUrl.replace(/\s/g, '');

// Standardize: Ensure baseURL DOES NOT end with a slash (since paths usually start with one)
if (baseUrl.endsWith('/')) {
  baseUrl = baseUrl.slice(0, -1);
}

const api = axios.create({
  baseURL: baseUrl,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
