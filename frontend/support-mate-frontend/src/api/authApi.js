import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL + '/api/auth';

// Kayıt olma
export async function register(userData) {
  console.log('API_BASE_URL:', process.env.REACT_APP_API_BASE_URL);
  const response = await axios.post(`${API_BASE_URL}/register`, userData);
  return response.data;
}

// Giriş yapma
export async function login(credentials) {
  console.log('API_BASE_URL:', process.env.REACT_APP_API_BASE_URL);
  const response = await axios.post(`${API_BASE_URL}/login`, credentials);
  return response.data;
}

// Çıkış yapma (token gerektirir)
export async function logout(token) {
  const response = await axios.post(
    `${API_BASE_URL}/logout`,
    {},
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      withCredentials: true // refreshToken cookie için
    }
  );
  // JWT'yi localStorage'dan temizle
  localStorage.removeItem('jwt');
  return response.data;
}

// Token yenileme
export async function refreshToken(refreshToken) {
  const response = await axios.post(`${API_BASE_URL}/refresh-token`, { refreshToken });
  return response.data;
}
