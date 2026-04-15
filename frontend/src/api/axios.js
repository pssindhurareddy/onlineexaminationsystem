import axios from 'axios';

let rawUrl = import.meta.env.VITE_API_URL || '/api/v1';
// NUCLEAR FIX: Remove any accidental spaces or newlines the user might have pasted in Vercel
let baseUrl = rawUrl.trim();

// Standardize: Ensure baseURL ends with a slash and has no double-slashes
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
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
