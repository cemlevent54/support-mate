import axiosInstance from "./axiosInstance";

const getLang = () => localStorage.getItem("language") || "tr";

const BASE_URL = 'http://localhost:9000' + '/api/tickets';

export const getTasks = async (token) => {
  return axiosInstance.get(`${BASE_URL}/tasks`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'accept-language': getLang(),
    },
  });
};

export const getTask = async (taskId, token) => {
  return axiosInstance.get(`${BASE_URL}/tasks/${taskId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'accept-language': getLang(),
    },
  });
};

export const createTask = async (data, token) => {
  return axiosInstance.post(`${BASE_URL}/tasks`, data, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'accept-language': getLang(),
    },
  });
};

export const updateTask = async (taskId, data, token) => {
  return axiosInstance.patch(`${BASE_URL}/tasks/${taskId}`, data, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'accept-language': getLang(),
    },
  });
};

export const deleteTask = async (taskId, token) => {
  return axiosInstance.delete(`${BASE_URL}/tasks/${taskId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'accept-language': getLang(),
    },
  });
};

export const getTasksEmployee = async (token) => {
  return axiosInstance.get(`${BASE_URL}/tasks/employee`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'accept-language': getLang(),
    },
  });
};

