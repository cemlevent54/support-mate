import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL + '/api/auth/users';

// JWT'yi localStorage'dan al
const getAuthHeader = () => {
  const token = localStorage.getItem('jwt');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// 1. Authenticated User (Profil)
export const getAuthenticatedUser = async () => {
  try {
    const res = await axios.get(`${API_BASE_URL}/profile`, {
      headers: { ...getAuthHeader() },
      withCredentials: true,
    });
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
};

// 2. Kullanıcıyı ID ile getir
export const getUserById = async (id) => {
  try {
    const res = await axios.get(`${API_BASE_URL}/${id}`, {
      headers: { ...getAuthHeader() },
      withCredentials: true,
    });
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
};

// 3. Tüm kullanıcıları getir (opsiyonel: page, limit, role)
export const getAllUsers = async (params = {}) => {
  try {
    const res = await axios.get(`${API_BASE_URL}`, {
      headers: { ...getAuthHeader() },
      params,
      withCredentials: true,
    });
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
};

// 4. Role göre kullanıcıları getir
export const getUsersByRole = async (role, params = {}) => {
  try {
    const res = await axios.get(`${API_BASE_URL}/role/${role}`, {
      headers: { ...getAuthHeader() },
      params,
      withCredentials: true,
    });
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
};

// 5. Kullanıcı güncelle (PATCH)
export const updateUser = async (id, updateData) => {
  try {
    const res = await axios.patch(`${API_BASE_URL}/${id}`, updateData, {
      headers: { ...getAuthHeader() },
      withCredentials: true,
    });
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
};

// 6. Kullanıcıyı sil (soft delete)
export const deleteUser = async (id) => {
  try {
    const res = await axios.delete(`${API_BASE_URL}/${id}`, {
      headers: { ...getAuthHeader() },
      withCredentials: true,
    });
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
};
