import i18n from '../config/i18n.js';
import logger from '../config/logger.js';

export const languageMiddleware = (req, res, next) => {
  try {
    // Accept-Language header'ını al
    const acceptLanguage = req.headers['accept-language'];
    const userAgent = req.headers['user-agent'];
    const ip = req.ip || req.connection.remoteAddress;
    
    // Detaylı log
    logger.info('=== Accept-Language Header Log ===');
    logger.info(`Endpoint: ${req.method} ${req.path}`);
    logger.info(`IP: ${ip}`);
    logger.info(`User-Agent: ${userAgent}`);
    logger.info(`Accept-Language: ${acceptLanguage || 'Not provided'}`);
    
    if (acceptLanguage) {
      // Desteklenen dilleri kontrol et
      const supportedLocales = ['tr', 'en'];
      let selectedLocale = 'tr'; // varsayılan
      
      // Accept-Language header'ını parse et
      const languages = acceptLanguage.split(',').map(lang => {
        const [language, quality = '1'] = lang.trim().split(';q=');
        return { language: language.split('-')[0], quality: parseFloat(quality) };
      });
      
      logger.info(`Parsed languages: ${JSON.stringify(languages)}`);
      
      // Desteklenen diller arasından en yüksek kaliteli olanı seç
      for (const lang of languages) {
        if (supportedLocales.includes(lang.language)) {
          selectedLocale = lang.language;
          break;
        }
      }
      
      // i18n locale'ini ayarla
      req.setLocale(selectedLocale);
      logger.info(`Selected locale: ${selectedLocale}`);
      logger.info(`Final language set to: ${selectedLocale} for request to ${req.path}`);
    } else {
      // Header yoksa varsayılan dili kullan
      req.setLocale('tr');
      logger.info('No Accept-Language header found, using default: tr');
    }
    
    logger.info('=== End Accept-Language Header Log ===');
    next();
  } catch (error) {
    logger.error('Language middleware error:', error);
    // Hata durumunda varsayılan dili kullan
    req.setLocale('tr');
    logger.info('Error in language middleware, using default: tr');
    next();
  }
}; 