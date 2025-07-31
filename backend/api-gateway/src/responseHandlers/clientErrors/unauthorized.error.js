export function unauthorizedError(res, message = 'Unauthorized') {
  return res.status(401).json({ success: false, message });
} 