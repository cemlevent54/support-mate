export function notImplementedError(res, message = 'Not Implemented') {
  return res.status(501).json({ success: false, message });
} 