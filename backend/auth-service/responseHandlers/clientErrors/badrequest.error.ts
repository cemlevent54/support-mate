import { Response } from 'express';

export function badRequestError(res: Response, message = 'Bad Request') {
  return res.status(400).json({ success: false, message });
} 