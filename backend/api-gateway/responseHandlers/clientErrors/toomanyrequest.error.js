export function tooManyRequestError(res, message = 'Too Many Requests') {
  return res.status(429).json({ success: false, message });
} 