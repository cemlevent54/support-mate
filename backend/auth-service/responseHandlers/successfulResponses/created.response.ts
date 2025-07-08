import { Response } from 'express';

export function createdResponse(res: Response, data: any, message = 'Created') {
  return res.status(201).json({ success: true, message, data });
} 