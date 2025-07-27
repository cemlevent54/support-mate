// Google OAuth ayarları
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
import { google } from 'googleapis';

export async function testGoogleOAuthConnection(logger) {
  try {
    const oauth2Client = new google.auth.OAuth2(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      'http://localhost' // Redirect URI, test için
    );
    // Basit bir istek: tokeninfo endpointine istek atmak yerine client bilgilerini kontrol ediyoruz
    if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
      logger.info('Google OAuth Client ID ve Secret başarıyla yüklendi.');
      return true;
    } else {
      logger.error('Google OAuth Client ID veya Secret eksik.');
      return false;
    }
  } catch (err) {
    logger.error('Google OAuth bağlantı testi başarısız', err);
    return false;
  }
}

export { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET };
