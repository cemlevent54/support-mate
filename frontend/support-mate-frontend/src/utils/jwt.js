// JWT'den kullanıcı id'sini döndürür
export function getUserIdFromJWT() {
  const token = localStorage.getItem('jwt');
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return decoded && decoded.id ? decoded.id : null;
  } catch (e) {
    return null;
  }
} 