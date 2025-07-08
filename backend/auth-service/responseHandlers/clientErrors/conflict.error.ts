import { Response } from 'express';

export function conflictError(res: Response, message = 'Conflict') {
  return res.status(409).json(({ success: false, message, data: null }));
} 