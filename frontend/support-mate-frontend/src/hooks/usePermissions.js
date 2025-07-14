import { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

export const usePermissions = () => {
  const [userPermissions, setUserPermissions] = useState([]);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserPermissions = async () => {
      try {
        const token = localStorage.getItem('jwt');
        if (!token) {
          setUserPermissions([]);
          setUserRole(null);
          setLoading(false);
          return;
        }

        const decoded = jwtDecode(token);
        const roleName = decoded.roleName;
        setUserRole(roleName);
        // Eğer JWT'de permissions varsa onları da al
        if (decoded.permissions && Array.isArray(decoded.permissions)) {
          setUserPermissions(decoded.permissions);
        } else {
          setUserPermissions([]);
        }
      } catch (error) {
        console.error('Kullanıcı yetkileri getirilirken hata:', error);
        setUserPermissions([]);
        setUserRole(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserPermissions();
  }, []);

  // Belirli bir yetkiye sahip mi kontrol et
  const hasPermission = (permission) => {
    return userPermissions.includes(permission);
  };

  // Birden fazla yetkiden herhangi birine sahip mi kontrol et
  const hasAnyPermission = (permissions) => {
    return permissions.some(permission => userPermissions.includes(permission));
  };

  // Tüm yetkilere sahip mi kontrol et
  const hasAllPermissions = (permissions) => {
    return permissions.every(permission => userPermissions.includes(permission));
  };

  // Admin mi kontrol et
  const isAdmin = () => {
    return userRole && userRole.toLowerCase() === 'admin';
  };

  return {
    userPermissions,
    userRole,
    loading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isAdmin
  };
}; 