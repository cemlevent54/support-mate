export function serviceUnavailableError(res, message = 'Service Unavailable') {
  return res.status(503).json({ success: false, message });
} 