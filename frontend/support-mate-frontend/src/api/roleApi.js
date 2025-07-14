import axiosInstance from './axiosInstance';

const BASE_URL = process.env.REACT_APP_API_BASE_URL + '/api/auth/roles';

export const getRoles = async () => {
  const res = await axiosInstance.get(BASE_URL);
  return (res.data && res.data.message && Array.isArray(res.data.message.roles))
    ? res.data.message.roles
    : [];
};

export const createRole = async (role) => {
  const res = await axiosInstance.post(BASE_URL, role);
  return res.data.data;
};

export const updateRole = async (id, role) => {
  const res = await axiosInstance.patch(`${BASE_URL}/${id}`, role);
  return res.data.data;
};

export const deleteRole = async (id) => {
  await axiosInstance.delete(`${BASE_URL}/${id}`);
};

export const getUserRole = async () => {
  const res = await axiosInstance.get(`${BASE_URL}/user`);
  return res.data.data;
};

// Tüm mevcut yetkileri getir
export const getAllPermissions = async () => {
  try {
    const res = await axiosInstance.get(process.env.REACT_APP_API_BASE_URL + '/api/auth/permissions/active');
    return res.data.message?.permissions || [];
  } catch (error) {
    console.error('Yetkiler getirilirken hata:', error);
    return [];
  }
};

// Role yetkilerini güncelle
export const updateRolePermissions = async (roleId, permissions) => {
  const res = await axiosInstance.patch(`${BASE_URL}/${roleId}/permissions`, { permissions });
  return res.data.data;
};