export function apiSuccess(res, data, message = 'Success', status = 200) {
  return res.status(status).json({ success: true, message, data });
} 