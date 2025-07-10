import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_BASE_URL + '/api/auth/roles';

const getAuthHeader = () => {
  const token = localStorage.getItem('jwt');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const getRoles = async () => {
  const res = await axios.get(BASE_URL, {
    headers: { ...getAuthHeader() }
  });
  return (res.data && res.data.message && Array.isArray(res.data.message.roles))
    ? res.data.message.roles
    : [];
};

export const createRole = async (role) => {
  const res = await axios.post(BASE_URL, role, {
    headers: { ...getAuthHeader() }
  });
  return res.data.data;
};

export const updateRole = async (id, role) => {
  const res = await axios.patch(`${BASE_URL}/${id}`, role, {
    headers: { ...getAuthHeader() }
  });
  return res.data.data;
};

export const deleteRole = async (id) => {
  await axios.delete(`${BASE_URL}/${id}`, {
    headers: { ...getAuthHeader() }
  });
};

export const getUserRole = async () => {
  const res = await axios.get(`${BASE_URL}/user`, {
    headers: { ...getAuthHeader() }
  });
  return res.data.data;
};