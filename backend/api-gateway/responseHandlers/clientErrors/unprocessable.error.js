export function unprocessableError(res, message = 'Unprocessable Entity') {
  return res.status(422).json({ success: false, message });
} 