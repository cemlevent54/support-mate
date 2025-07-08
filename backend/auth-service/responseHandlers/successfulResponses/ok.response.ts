import { Response } from 'express';

export function okResponse(res: Response, data: any, message = 'OK') {
  return res.status(200).json({ success: true, message, data });
} 