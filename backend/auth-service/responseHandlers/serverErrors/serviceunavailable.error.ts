import { Response } from 'express';

export function serviceUnavailableError(res: Response, message = 'Service Unavailable') {
  return res.status(503).json({ success: false, message });
} 