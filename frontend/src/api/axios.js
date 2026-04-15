import axios from 'axios';

let baseUrl = import.meta.env.VITE_API_URL || '/api/v1';
// Standardize: Ensure baseURL ends with a slash so Axios doesn't strip the /api/v1 path
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
