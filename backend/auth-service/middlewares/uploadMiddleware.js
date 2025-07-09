// Not: Gerçek dosya yükleme için multer veya benzeri bir paket kullanmalısın.

export function uploadMiddleware(req, res, next) {
  // Burada dosya yükleme işlemleri yapılabilir
  next();
} 