import { Response } from 'express';

export function unauthorizedError(res: Response, message = 'Unauthorized') {
  return res.status(401).json({ success: false, message });
} 