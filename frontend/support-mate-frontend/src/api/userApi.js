import axiosInstance from './axiosInstance';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL + '/api/auth/users';

// 1. Authenticated User (Profil)
export const getAuthenticatedUser = async () => {
  try {
    const res = await axiosInstance.get(`${API_BASE_URL}/profile`);
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
};

// 2. Kullanıcıyı ID ile getir
export const getUserById = async (id) => {
  try {
    const res = await axiosInstance.get(`${API_BASE_URL}/${id}`);
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
};

// 3. Tüm kullanıcıları getir (opsiyonel: page, limit, role)
export const getAllUsers = async (params = {}) => {
  try {
    const res = await axiosInstance.get(`${API_BASE_URL}`, { params });
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
};

// 4. Role göre kullanıcıları getir
export const getUsersByRole = async (role, params = {}) => {
  try {
    const res = await axiosInstance.get(`${API_BASE_URL}/role/${role}`, { params });
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
};

// 5. Kullanıcı güncelle (PATCH)
export const updateUser = async (id, updateData) => {
  try {
    const res = await axiosInstance.patch(`${API_BASE_URL}/${id}`, updateData);
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
};

// 6. Kullanıcıyı sil (soft delete)
export const deleteUser = async (id) => {
  try {
    const res = await axiosInstance.delete(`${API_BASE_URL}/${id}`);
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
};

// 7. Leaders with employees
// GET /api/auth/users/leaders/with-employees
export const getLeaders = async () => {
  try {
    const res = await axiosInstance.get(`${API_BASE_URL}/leaders/with-employees`);
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
};

// 8. Get employees (users with Employee role)
// GET /api/auth/users?role=Employee
export const getEmployees = async () => {
  try {
    const res = await axiosInstance.get(`${API_BASE_URL}?role=Employee`);
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
};

// 9. Assign employee to leader
// POST /api/auth/users/assign-employee
export const assignEmployeeToLeader = async (employeeId, leaderId) => {
  try {
    const res = await axiosInstance.post(`${API_BASE_URL}/assign-employee`, {
      employeeId,
      leaderId
    });
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
};

// 10. Remove employee from leader
// DELETE /api/auth/users/employees/:employeeId/leader
export const removeEmployeeFromLeader = async (employeeId) => {
  try {
    const res = await axiosInstance.delete(`${API_BASE_URL}/employees/${employeeId}/leader`);
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
};

// 11. Get employees by leader
// GET /api/auth/users/leaders/:leaderId/employees
export const getEmployeesByLeader = async (leaderId) => {
  try {
    const res = await axiosInstance.get(`${API_BASE_URL}/leaders/${leaderId}/employees`);
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
};
