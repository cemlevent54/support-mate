import { Request, Response, NextFunction } from 'express';
// Not: Gerçek dosya yükleme için multer veya benzeri bir paket kullanmalısın.

export function uploadMiddleware(req: Request, res: Response, next: NextFunction) {
  // Burada dosya yükleme işlemleri yapılabilir
  next();
} 