export function acceptedResponse(res, data, message = 'Accepted') {
  return res.status(202).json({ success: true, message, data });
} 