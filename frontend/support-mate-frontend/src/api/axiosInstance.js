import axios from 'axios';
import { refreshToken as apiRefreshToken } from './authApi';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Request interceptor: Her isteğe access token ekle
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwt');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    console.log('[Axios][Request]', config.method?.toUpperCase(), config.url, 'Headers:', config.headers);
    return config;
  },
  (error) => {
    console.error('[Axios][Request][Error]', error);
    return Promise.reject(error);
  }
);

// Response interceptor: 401 gelirse otomatik refresh token
axiosInstance.interceptors.response.use(
  (response) => {
    console.log('[Axios][Response]', response.config.url, 'Status:', response.status);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    console.error('[Axios][Response][Error]', error?.response?.status, error?.response?.data);
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');
        console.log('[Axios][Refresh] Refresh token ile yeni access token isteniyor...');
        const data = await apiRefreshToken(refreshToken);
        localStorage.setItem('jwt', data.accessToken);
        if (data.refreshToken) {
          localStorage.setItem('refreshToken', data.refreshToken);
        }
        console.log('[Axios][Refresh] Yeni access token alındı:', data.accessToken);
        originalRequest.headers['Authorization'] = `Bearer ${data.accessToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        console.error('[Axios][Refresh][Error]', refreshError);
        localStorage.removeItem('jwt');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance; 