export function internalServerError(res, message = 'Internal Server Error') {
  return res.status(500).json({ success: false, message, data: null });
} 