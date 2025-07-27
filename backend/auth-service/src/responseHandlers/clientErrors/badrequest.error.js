export function badRequestError(res, message = 'Bad Request') {
  return res.status(400).json({ success: false, message });
} 