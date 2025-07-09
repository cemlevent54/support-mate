export function apiError(res, error, message = 'Error', status = 500) {
  return res.status(status).json({ success: false, message, error });
} 