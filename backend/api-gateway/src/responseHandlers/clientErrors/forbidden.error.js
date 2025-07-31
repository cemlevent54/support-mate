export function forbiddenError(res, message = 'Forbidden') {
  return res.status(403).json({ success: false, message });
} 