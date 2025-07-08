import { Response } from 'express';

export function internalServerError(res: Response, message = 'Internal Server Error') {
  return res.status(500).json({ success: false, message, data: null });
} 