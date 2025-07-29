import axios from 'axios';
import { refreshToken as apiRefreshToken } from './authApi';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Accept-Language': localStorage.getItem('language')
  }
});

// Accept-Language header'ını güncellemek için fonksiyon
export const updateAcceptLanguageHeader = (language) => {
  // localStorage'ı güncelle
  localStorage.setItem('language', language);
  // Axios defaults'ı güncelle
  axiosInstance.defaults.headers.common['Accept-Language'] = language;
};

// Sadece Accept-Language header'ını güncellemek için fonksiyon (localStorage'ı etkilemez)
export const updateAcceptLanguageHeaderOnly = (language) => {
  // Sadece Axios defaults'ı güncelle
  axiosInstance.defaults.headers.common['Accept-Language'] = language;
};

// Request interceptor: Her isteğe access token ve Accept-Language ekle
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwt');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Accept-Language header'ını her istekte güncelle
    const currentLanguage = localStorage.getItem('language') || 'tr';
    config.headers['Accept-Language'] = currentLanguage;
    
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
    
    if (error.response && error.response.status === 401) {
      // Sadece access token expired ise refresh dene
      if (
        (error.response.data?.message === 'token_expired' || error.response.data?.message === 'jwt expired') &&
        !originalRequest._retry
      ) {
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
          // Refresh token başarısız olduğunda token'ları temizle
          localStorage.removeItem('jwt');
          localStorage.removeItem('refreshToken');
          // Login sayfasında değilse ve ticket oluşturma işlemi değilse login'e yönlendir
          if (!originalRequest.url.includes('/api/tickets') && 
              originalRequest.method !== 'post' && 
              !window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
          return Promise.reject(refreshError);
        }
              } else {
          // Diğer tüm 401 durumlarında token'ları temizle
          localStorage.removeItem('jwt');
          localStorage.removeItem('refreshToken');
          // Login sayfasında değilse ve ticket oluşturma işlemi değilse login'e yönlendir
          if (!originalRequest.url.includes('/api/tickets') && 
              originalRequest.method !== 'post' && 
              !window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
          return Promise.reject(error);
        }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance; 