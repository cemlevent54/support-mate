const express = require('express');
const logger = require('../config/logger.config.js');
const { getGatewayHealth, services } = require('../config/health.config.js');
const proxyRoutes = require('./proxy.routes.js');

const router = express.Router();

// Health check endpoint
router.get('/health', async (req, res) => {
  const port = req.app.get('port') || process.env.PORT || 9000;
  logger.info(`[HEALTH] Health check endpoint called: http://localhost:${port}/health`);
  logger.info(`[HEALTH] API Gateway base URL: http://localhost:${port}`);
  logger.info(`[HEALTH] API Gateway services: ${JSON.stringify(services)}`);
  try {
    const health = await getGatewayHealth();
    logger.info(`[HEALTH] API Gateway health check: ${JSON.stringify(health)}`);
    res.json(health);
  } catch (err) {
    logger.error(`[HEALTH] Health check error: ${err.message}`);
    res.status(500).json({ error: 'Health check failed', details: err.message });
  }
});

// Default route
router.get('/', (req, res) => {
  logger.info('Root endpoint called');
  res.json({ message: 'Support Mate API Gateway' });
});

// Proxy route'larını ekle
router.use(proxyRoutes);

module.exports = router; 