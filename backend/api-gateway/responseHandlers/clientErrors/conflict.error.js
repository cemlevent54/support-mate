export function conflictError(res, message = 'Conflict') {
  return res.status(409).json(({ success: false, message, data: null }));
} 