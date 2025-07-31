import { checkForSwearWords, createSwearWordResponse, controlUsername } from '../config/badword/swearConfig.js';

// Küfür kontrolü middleware'i
export const swearCheckMiddleware = (req, res, next) => {
  console.log(`[AUTH SWEAR MIDDLEWARE] ${req.method} ${req.path}`);
  console.log(`[AUTH SWEAR MIDDLEWARE] Headers:`, req.headers);
  
  // Google login/register için credential alanını kontrol etme
  if (req.body && req.body.credential) {
    console.log('[AUTH SWEAR MIDDLEWARE] Skipping credential field');
    return next();
  }
  
  // Request body'deki metinleri kontrol et
  if (req.body && typeof req.body === 'object') {
    const checkTextFields = (obj) => {
      for (const [key, value] of Object.entries(obj)) {
        // credential, code ve token alanlarını kontrol etme
        if (key === 'credential' || key === 'code' || key === 'token' || key === 'permissions') continue;
        
        if (typeof value === 'string') {
          // Refresh token'ları kontrol etme
          if (key === 'refreshToken' || key === 'accessToken' || key === 'token') {
            continue;
          }
          
          const result = checkForSwearWords(value);
          if (result.hasSwearWords) {
            console.log('[AUTH SWEAR DETECTED] Field:', key, 'Value:', value, 'Original:', result.originalText, 'Filtered:', result.filteredText);
            const locale = req.getLocale ? req.getLocale() : 'tr';
            return res.status(400).json(createSwearWordResponse(locale));
          }
        } else if (typeof value === 'object' && value !== null) {
          const result = checkTextFields(value);
          if (result) return result;
        }
      }
      return null;
    };
    
    const result = checkTextFields(req.body);
    if (result) return result;
  }
  
  // Query parametrelerini kontrol et
  if (req.query && typeof req.query === 'object') {
    for (const [key, value] of Object.entries(req.query)) {
      if (typeof value === 'string') {
        // Token'ları kontrol etme
        if (key === 'refreshToken' || key === 'accessToken' || key === 'token') {
          continue;
        }
        
        const result = checkForSwearWords(value);
        if (result.hasSwearWords) {
          console.log('[AUTH SWEAR DETECTED] Query Field:', key, 'Value:', value, 'Original:', result.originalText, 'Filtered:', result.filteredText);
          const locale = req.getLocale ? req.getLocale() : 'tr';
          return res.status(400).json(createSwearWordResponse(locale));
        }
      }
    }
  }
  
  next();
};

// Username kontrolü için özel middleware
export const usernameCheckMiddleware = async (req, res, next) => {
  console.log(`[AUTH USERNAME MIDDLEWARE] ${req.method} ${req.path}`);
  
  if (req.body && req.body.username) {
    console.log('[AUTH USERNAME MIDDLEWARE] Checking username:', req.body.username);
    const isClean = await controlUsername(req.body.username);
    console.log('[AUTH USERNAME MIDDLEWARE] Username clean:', isClean);
    
    if (!isClean) {
      console.log('[AUTH USERNAME DETECTED] Username contains swear words:', req.body.username);
      const locale = req.getLocale ? req.getLocale() : 'tr';
      return res.status(400).json({
        success: false,
        message: locale === 'en' 
          ? 'Username contains inappropriate words. Please choose a different username.'
          : 'Kullanıcı adında uygunsuz kelimeler bulunmaktadır. Lütfen farklı bir kullanıcı adı seçin.',
        data: null
      });
    }
  }
  
  next();
};

// Belirli alanları kontrol eden middleware
export const checkSpecificFields = (fields) => {
  return (req, res, next) => {
    if (!req.body || typeof req.body !== 'object') {
      return next();
    }
    
    for (const field of fields) {
      if (req.body[field] && typeof req.body[field] === 'string') {
        const result = checkForSwearWords(req.body[field]);
        if (result.hasSwearWords) {
          const locale = req.getLocale ? req.getLocale() : 'tr';
          return res.status(400).json(createSwearWordResponse(locale));
        }
      }
    }
    
    next();
  };
}; 