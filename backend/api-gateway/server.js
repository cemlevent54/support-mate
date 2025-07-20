const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const logger = require('./config/logger.config.js');
const { authProxy, userProxy , notificationProxy , ticketProxy } = require('./middleware/index.proxy.js');
const routes = require('./routes/index.js');
const corsOptions = require('./config/cors.config.js');
const { getGatewayHealth, services } = require('./config/health.config.js');
const http = require('http');
const setupSocketProxy = require('./config/socket.config.js');


const app = express();
const PORT = 9000;

const server = http.createServer(app);

// CORS middleware
app.use(cors(corsOptions));

// Routes
app.use('/', routes);

// Proxy middleware
app.use('/api/auth', authProxy);
app.use('/api/notification', notificationProxy);
app.use('/api/tickets', ticketProxy);

// Uploads proxy - ticket service'den dosyaları proxy et
app.use('/uploads', createProxyMiddleware({
  target: 'http://localhost:8086',
  changeOrigin: true,
  logLevel: 'debug',
  onProxyReq: (proxyReq, req, res) => {
    logger.info(`[UPLOADS PROXY] ${req.method} ${req.url} -> ${proxyReq.path}`);
  },
  onError: (err, req, res) => {
    logger.error(`[UPLOADS PROXY ERROR] ${err.message}`);
    res.status(500).send('Proxy Error');
  }
}));

// SOCKET.IO PROXY ENTEGRASYONU
setupSocketProxy(server);

server.listen(PORT, () => {
  logger.info(`API Gateway running on: http://localhost:${PORT}`);
  logger.info(`API Gateway health endpoint: http://localhost:${PORT}/health`);
}); 