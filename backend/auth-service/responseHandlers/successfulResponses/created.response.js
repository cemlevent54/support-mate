export function createdResponse(res, data, message = 'Created') {
  return res.status(201).json({ success: true, message, data });
} 