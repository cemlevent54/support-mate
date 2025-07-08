import { Response } from 'express';

export function acceptedResponse(res: Response, data: any, message = 'Accepted') {
  return res.status(202).json({ success: true, message, data });
} 