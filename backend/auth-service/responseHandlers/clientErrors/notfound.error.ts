import { Response } from 'express';

export function notFoundError(res: Response, message = 'Not Found') {
  return res.status(404).json({ success: false, message });
} 