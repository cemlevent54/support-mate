import express from 'express';
import dotenv from 'dotenv';
import logger from './config/logger.js';
import i18n from './config/i18n.js';
import authService, { registerAuthHandlers } from './services/auth.service.js';
import userService, { registerUserHandlers } from './services/user.service.js';
import { kafkaService } from './config/index.js';
dotenv.config();

// Dil tercihini en başta ayarla
const DEFAULT_LOCALE = process.env.DEFAULT_LOCALE === 'en' ? 'en' : 'tr';
i18n.setLocale(DEFAULT_LOCALE);
logger.info(`Default language set to: ${DEFAULT_LOCALE}`);

// Handler kayıtlarını dil ayarından sonra başlat
registerAuthHandlers();
registerUserHandlers();

import { initializeApp } from './config/index.js';
import router from './routes/index.routes.js';
import { healthCheck } from './config/health.js';
import { corsMiddleware } from './middlewares/cors.middleware.js';
import { languageMiddleware } from './middlewares/language.middleware.js';
import { errorHandler } from './middlewares/error.handler.js';
import { seedPermissions } from './migrations/seedPermissions.js';
import { swearCheckMiddleware } from './middlewares/swear.middleware.js';
import { startGrpcServer } from './grpc_server.js';



const app = express();

// Body parsing middleware with limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS middleware
app.use(corsMiddleware);

// i18n middleware
app.use(i18n.init);

// Language middleware (Accept-Language header'ını işler)
app.use(languageMiddleware);

// Küfür kontrolü middleware'i (Google login/register ve verify-email hariç)
app.use((req, res, next) => {
  // Google login/register ve verify-email endpoint'lerini kontrol etme
  if (req.path === '/api/auth/google-login' || 
      req.path === '/api/auth/google-register' || 
      req.path === '/api/auth/verify-email') {
    return next();
  }
  return swearCheckMiddleware(req, res, next);
});

app.use('/api', router); 

// Error handler middleware (en son olmalı)
app.use(errorHandler);

// Basit bir Health Check endpointi
app.get('/health', healthCheck);

const PORT = process.env.PORT;

initializeApp()
  .then(async () => {
    await seedPermissions(DEFAULT_LOCALE);
    
    // gRPC server'ı başlat
    startGrpcServer();
    
    app.listen(PORT, () => {
      logger.info(`🚀 Server is listening on port ${PORT}`);
    });
  })
  .catch((error) => {
    logger.error('Application could not be started:', error);
    process.exit(1);
  }); 