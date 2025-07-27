import axiosInstance from './axiosInstance';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL + '/api/auth';

const getLanguage = () => {
  const language = localStorage.getItem('language');
  return language || 'tr';
};

// Kayıt olma
export async function register(userData) {
  console.log('API_BASE_URL:', process.env.REACT_APP_API_BASE_URL);
  const response = await axiosInstance.post(`${API_BASE_URL}/register`, userData, {
    headers: {
      'Accept-Language': getLanguage()
    }
  });
  return response.data;
}

// Giriş yapma
export async function login(credentials) {
  console.log('API_BASE_URL:', process.env.REACT_APP_API_BASE_URL);
  const response = await axiosInstance.post(`${API_BASE_URL}/login`, credentials, {
    headers: {
      'Accept-Language': getLanguage()
    }
  });
  return response.data;
}

// Çıkış yapma (token gerektirir)
export async function logout(token) {
  const response = await axiosInstance.post(
    `${API_BASE_URL}/logout`,
    {},
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept-Language': getLanguage()
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
  const response = await axiosInstance.post(`${API_BASE_URL}/refresh-token`, { refreshToken }, {
    headers: {
      'Accept-Language': getLanguage()
    }
  });
  return response.data;
}

// Şifre sıfırlama isteği
export async function forgotPassword(email) {
  const response = await axiosInstance.post(`${API_BASE_URL}/forgot-password`, { email }, {
    headers: {
      'Accept-Language': getLanguage()
    }
  });
  return response.data;
}

// Şifre sıfırlama
export async function resetPassword({ token, password, confirmPassword }) {
  const response = await axiosInstance.post(`${API_BASE_URL}/reset-password`, { token, password, confirmPassword }, {
    headers: {
      'Accept-Language': getLanguage()
    }
  });
  return response.data;
}

// Şifre güncelleme (login olmuş kullanıcı için)
export async function changePassword({ newPassword, confirmPassword }) {
  const response = await axiosInstance.patch(`${API_BASE_URL}/change-password`, {
    newPassword,
    confirmPassword
  }, {
    headers: {
      'Accept-Language': getLanguage()
    }
  });
  return response.data;
}

// Google ile giriş
export async function googleLogin(credential) {
  const response = await axiosInstance.post(`${API_BASE_URL}/google-login`, { credential }, {
    headers: {
      'Accept-Language': getLanguage()
    }
  });
  return response.data;
}

// Google ile kayıt
export async function googleRegister(credential) {
  const response = await axiosInstance.post(`${API_BASE_URL}/google-register`, { credential }, {
    headers: {
      'Accept-Language': getLanguage()
    }
  });
  return response.data;
}

export async function getUsersByRoleName(roleName) {
  const response = await axiosInstance.get(`${API_BASE_URL}/users/role?roleName=${roleName}`, {
    headers: {
      'Accept-Language': getLanguage()
    }
  });
  return response.data;
}
