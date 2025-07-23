import axiosInstance from "./axiosInstance";

const getLang = () => localStorage.getItem("language") || "tr";

const BASE_URL = 'http://localhost:9000' + '/api/tickets';

// Kullanıcı için ürünleri listele
export const getProductsUser = (token) => {
  const lang = getLang();
  return axiosInstance.get(BASE_URL + "/products", {
    headers: {
      Authorization: `Bearer ${token}`,
      "accept-language": lang,
    },
  });
};

// Admin için ürünleri listele
export const getProductsAdmin = (token) => {
  const lang = getLang();
  return axiosInstance.get(BASE_URL + "/admin/products", {
    headers: {
      Authorization: `Bearer ${token}`,
      "accept-language": lang,
    },
  });
};

// Admin için ürün oluştur
export const createProductAdmin = (product, token) => {
  const lang = getLang();
  return axiosInstance.post(BASE_URL + "/admin/products", product, {
    headers: {
      Authorization: `Bearer ${token}`,
      "accept-language": lang,
    },
  });
};

// Admin için ürün güncelle
export const updateProductAdmin = (productId, product, token) => {
  const lang = getLang();
  return axiosInstance.patch(BASE_URL + `/admin/products/${productId}`, product, {
    headers: {
      Authorization: `Bearer ${token}`,
      "accept-language": lang,
    },
  });
};

// Admin için ürün sil (soft delete)
export const deleteProductAdmin = (productId, token) => {
  const lang = getLang();
  return axiosInstance.delete(BASE_URL + `/admin/products/${productId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "accept-language": lang,
    },
  });
};
