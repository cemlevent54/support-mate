import { Response } from 'express';

export function forbiddenError(res: Response, message = 'Forbidden') {
  return res.status(403).json({ success: false, message });
} 