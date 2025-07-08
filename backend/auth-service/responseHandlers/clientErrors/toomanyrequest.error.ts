import { Response } from 'express';

export function tooManyRequestError(res: Response, message = 'Too Many Requests') {
  return res.status(429).json({ success: false, message });
} 