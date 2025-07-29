export function roleMiddleware(roles) {
  return (req, res, next) => {
    const user = req.user;
    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden: insufficient role' });
    }
    next();
  };
}

export function requireRole(role) {
  return (req, res, next) => {
    const user = req.user;
    
    // Eğer role bir array ise, kullanıcının rolü array'de var mı kontrol et
    if (Array.isArray(role)) {
      if (!user || !role.includes(user.roleName)) {
        return res.status(403).json({ success: false, message: 'Forbidden: insufficient role' });
      }
    } else {
      // Eğer role string ise, eski davranışı koru
      if (!user || user.roleName !== role) {
        return res.status(403).json({ success: false, message: 'Forbidden: insufficient role' });
      }
    }
    
    next();
  };
} 