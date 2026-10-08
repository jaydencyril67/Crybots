import axios from 'axios';
import { navigate } from '../utils/navigate';

// Create an axios instance with the base URL set to production API server
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://kingshalls.onrender.com';

export const authHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const clearAuthData = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('kingshall_user');
  localStorage.removeItem('firstName');
  localStorage.removeItem('kingshall_first_name');
};

export const forceLogout = () => {
  clearAuthData();
  window.dispatchEvent(new Event('ke:force-logout'));
  navigate('/');
};

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add an interceptor to include the auth token when available.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});

// Add a response interceptor to handle force logout
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.data?.forceLogout) {
      forceLogout();
      return Promise.reject(error);
    }
    return Promise.reject(error);
  },
);

export default api;
