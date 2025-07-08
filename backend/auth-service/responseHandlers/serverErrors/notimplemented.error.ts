import { Response } from 'express';

export function notImplementedError(res: Response, message = 'Not Implemented') {
  return res.status(501).json({ success: false, message });
} 