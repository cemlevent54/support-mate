import express from 'express';
import dotenv from 'dotenv';
import logger from './config/logger.js';
import { initializeApp } from './config/index.js';
import router from './routes/index.routes.js';
import { healthCheck } from './config/health.js';

dotenv.config();

const app = express();
app.use(express.json());

app.use('/api', router); 


// Basit bir Health Check endpointi
app.get('/health', healthCheck);

const PORT = process.env.PORT;

initializeApp()
  .then(() => {
    app.listen(PORT, () => {
      logger.info(`🚀 Server is listening on port ${PORT}`);
    });
  })
  .catch((error) => {
    logger.error('Uygulama başlatılamadı:', error);
    process.exit(1);
  }); 