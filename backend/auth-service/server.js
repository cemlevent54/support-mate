import express from 'express';
import dotenv from 'dotenv';
import logger from './config/logger.js';
import { initializeApp } from './config/index.js';
import router from './routes/index.routes.js';
import { healthCheck } from './config/health.js';
import { corsMiddleware } from './middlewares/cors.middleware.js';
import { errorHandler } from './middlewares/error.handler.js';
import { seedPermissions } from './migrations/seedPermissions.js';

dotenv.config();

const app = express();

// Body parsing middleware with limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS middleware
app.use(corsMiddleware);

app.use('/api', router); 

// Error handler middleware (en son olmalı)
app.use(errorHandler);

// Basit bir Health Check endpointi
app.get('/health', healthCheck);

const PORT = process.env.PORT;

initializeApp()
  .then(async () => {
    await seedPermissions();
    app.listen(PORT, () => {
      logger.info(`🚀 Server is listening on port ${PORT}`);
    });
  })
  .catch((error) => {
    logger.error('Application could not be started:', error);
    process.exit(1);
  }); 