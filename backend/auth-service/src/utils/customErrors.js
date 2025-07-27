/**
 * Custom Error sınıfları
 * HTTP status kodları ile birlikte hata yönetimi için
 */

export class BaseError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.name = this.constructor.name;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends BaseError {
  constructor(message = 'Validation Error') {
    super(message, 400);
  }
}

export class ConflictError extends BaseError {
  constructor(message = 'Conflict') {
    super(message, 409);
  }
}

export class NotFoundError extends BaseError {
  constructor(message = 'Not Found') {
    super(message, 404);
  }
}

export class UnauthorizedError extends BaseError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenError extends BaseError {
  constructor(message = 'Forbidden') {
    super(message, 403);
  }
}

export class TooManyRequestsError extends BaseError {
  constructor(message = 'Too Many Requests') {
    super(message, 429);
  }
}

export class InternalServerError extends BaseError {
  constructor(message = 'Internal Server Error') {
    super(message, 500);
  }
}

export class ServiceUnavailableError extends BaseError {
  constructor(message = 'Service Unavailable') {
    super(message, 503);
  }
}

/**
 * Email doğrulama ile ilgili hatalar
 */
export class EmailVerificationError extends BaseError {
  constructor(message = 'Email Verification Error') {
    super(message, 400);
  }
}

export class EmailVerificationExpiredError extends EmailVerificationError {
  constructor(message = 'Email verification code expired') {
    super(message);
  }
}

export class EmailVerificationInvalidError extends EmailVerificationError {
  constructor(message = 'Invalid email verification code') {
    super(message);
  }
}

/**
 * Kullanıcı işlemleri ile ilgili hatalar
 */
export class UserAlreadyExistsError extends ConflictError {
  constructor(message = 'User already exists') {
    super(message);
  }
}

export class UserNotFoundError extends NotFoundError {
  constructor(message = 'User not found') {
    super(message);
  }
}

export class EmailNotVerifiedError extends UnauthorizedError {
  constructor(message = 'Email not verified') {
    super(message);
  }
}

export class AccountLockedError extends TooManyRequestsError {
  constructor(message = 'Account temporarily locked') {
    super(message);
  }
}

/**
 * Hata mesajlarını çeviri ile birleştiren yardımcı fonksiyon
 */
export function createTranslatedError(ErrorClass, translationKey, translationService, ...args) {
  // i18n placeholder'ları için özel format
  let message = translationService(translationKey);
  
  // Placeholder'ları replace et
  args.forEach((arg, index) => {
    message = message.replace(`{${index}}`, arg);
  });
  
  return new ErrorClass(message);
} 