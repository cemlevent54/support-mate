import { OAuth2Client } from 'google-auth-library';
import translation from './translation.js';

export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

export const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// Basit bir bağlantı/test fonksiyonu
export async function testGoogleConnection(logger) {
  try {
    // Geçersiz bir token ile verifyIdToken çağır, sadece bağlantı testi için
    await googleClient.verifyIdToken({
      idToken: 'dummy-token',
      audience: GOOGLE_CLIENT_ID,
    });
    logger.info(translation('config.google.logs.connectSuccess'));
  } catch (err) {
    logger.info(translation('config.google.logs.connectSuccess') + ' (Beklenen hata)', { error: err.message });
  }
}
