import express from 'express';
import dotenv from 'dotenv';
import logger from './config/logger';
import { initializeApp } from './config';

dotenv.config();

const app = express();
app.use(express.json());

// Basit bir Health Check endpointi
app.get('/health', (req, res) => {
  res.status(200).send('✅ Auth Service is running');
});

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