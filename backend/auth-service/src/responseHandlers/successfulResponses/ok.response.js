export function okResponse(res, data, message = 'OK') {
  return res.status(200).json({ success: true, message, data });
} 