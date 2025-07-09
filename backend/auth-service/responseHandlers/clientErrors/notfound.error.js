export function notFoundError(res, message = 'Not Found') {
  return res.status(404).json({ success: false, message });
} 