import { Response } from 'express';

export function apiError(res: Response, error: any, message = 'Error', status = 500) {
  return res.status(status).json({ success: false, message, error });
} 