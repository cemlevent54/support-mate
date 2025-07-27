import { checkForSwearWords, createSwearWordResponse } from '../config/badword/swearConfig.js';

// Küfür kontrolü middleware'i
export const swearCheckMiddleware = (req, res, next) => {
  // Google login/register için credential alanını kontrol etme
  if (req.body && req.body.credential) {
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
            console.log('Uygunsuz kelime bulundu:', { field: key, value: value, originalText: result.originalText, filteredText: result.filteredText });
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
          const locale = req.getLocale ? req.getLocale() : 'tr';
          return res.status(400).json(createSwearWordResponse(locale));
        }
      }
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