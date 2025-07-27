import axiosInstance from './axiosInstance';

const BASE_URL = process.env.REACT_APP_API_BASE_URL + '/api/auth/roles';

const getLanguage = () => {
  const language = localStorage.getItem('language');
  return language;
};

export const getRoles = async () => {
  const res = await axiosInstance.get(BASE_URL, {
    headers: {
      'Accept-Language': getLanguage()
    }
  });
  console.log('getRoles API response:', res.data);
  return (res.data && res.data.data && res.data.data.roles)
    ? res.data.data.roles
    : [];
};

export const createRole = async (role) => {
  const res = await axiosInstance.post(BASE_URL, role, {
    headers: {
      'Accept-Language': getLanguage()
    }
  });
  return { data: res.data.data, message: res.data.message };
};

export const updateRole = async (id, role) => {
  const res = await axiosInstance.patch(`${BASE_URL}/${id}`, role, {
    headers: {
      'Accept-Language': getLanguage()
    }
  });
  return { data: res.data.data, message: res.data.message };
};

export const deleteRole = async (id) => {
  const res = await axiosInstance.delete(`${BASE_URL}/${id}`, {
    headers: {
      'Accept-Language': getLanguage()
    }
  });
  return { data: res.data.data, message: res.data.message };
};

export const getUserRole = async () => {
  const res = await axiosInstance.get(`${BASE_URL}/user`, {
    headers: {
      'Accept-Language': getLanguage()
    }
  });
  return res.data.data;
};

// Tüm mevcut yetkileri getir
export const getAllPermissions = async () => {
  try {
    const res = await axiosInstance.get(process.env.REACT_APP_API_BASE_URL + '/api/auth/permissions/active', {
      headers: {
        'Accept-Language': getLanguage()
      }
    });
    console.log('getAllPermissions API response:', res.data);
    return { 
      permissions: res.data.data?.permissions || res.data.message?.permissions || [],
      message: res.data.message 
    };
  } catch (error) {
    console.error('Yetkiler getirilirken hata:', error);
    throw error;
  }
};

// Role yetkilerini güncelle
export const updateRolePermissions = async (roleId, permissions) => {
  const res = await axiosInstance.patch(`${BASE_URL}/${roleId}/permissions`, { permissions }, {
    headers: {
      'Accept-Language': getLanguage()
    }
  });
  return { data: res.data.data, message: res.data.message };
};