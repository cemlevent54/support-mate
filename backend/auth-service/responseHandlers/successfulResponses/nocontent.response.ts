import { Response } from 'express';

export function noContentResponse(res: Response) {
  return res.status(204).send();
} 