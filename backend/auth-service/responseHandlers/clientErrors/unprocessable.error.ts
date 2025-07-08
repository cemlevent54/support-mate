import { Response } from 'express';

export function unprocessableError(res: Response, message = 'Unprocessable Entity') {
  return res.status(422).json({ success: false, message });
} 