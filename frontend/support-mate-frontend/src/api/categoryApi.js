import axiosInstance from './axiosInstance';

const BASE_URL = 'http://localhost:9000' + '/api/tickets';

function getLang() {
  // Öncelik sırası: localStorage.language > localStorage.lang > browser > 'tr'
  const lang = localStorage.getItem('language') || localStorage.getItem('lang');
  if (lang === 'tr' || lang === 'en') return lang;
  if (navigator.language) {
    const navLang = navigator.language.split('-')[0];
    if (navLang === 'tr' || navLang === 'en') return navLang;
  }
  return lang;
}

export const getCategories = async () => {
  const response = await axiosInstance.get(BASE_URL + '/categories', {
    headers: { 'accept-language': getLang() },
  });
  return response.data;
};

export const getAdminCategories = async () => {
  const response = await axiosInstance.get(BASE_URL + '/admin/categories', {
    headers: { 'accept-language': getLang() },
  });
  return response.data;
};

export const createCategory = async (data) => {
  const response = await axiosInstance.post(BASE_URL + '/admin/categories', data, {
    headers: { 'accept-language': getLang() },
  });
  return response.data;
};

export const updateCategory = async (categoryId, data) => {
  const response = await axiosInstance.patch(`${BASE_URL}/admin/categories/${categoryId}`, data, {
    headers: { 'accept-language': getLang() },
  });
  return response.data;
};

export const deleteCategory = async (categoryId) => {
  const response = await axiosInstance.delete(`${BASE_URL}/admin/categories/${categoryId}`, {
    headers: { 'accept-language': getLang() },
  });
  return response.data;
};
