import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const axiosInstance = axios.create({
  baseURL: API_URL,
});

// Attach the stored JWT as a Bearer token on every outgoing request.
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Global response error handling:
//   401 → clear the stale token and redirect to login (unless already there)
//   503 → the server is in maintenance mode; redirect to the maintenance page
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      if (error.response.status === 401) {
        localStorage.removeItem('token');
        const path = window.location.pathname;
        if (path !== '/login' && path !== '/register' && path !== '/') {
          window.location.href = '/login';
        }
      } else if (error.response.status === 503) {
        if (window.location.pathname !== '/maintenance') {
          window.location.href = '/maintenance';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
