const express = require('express');
const cors = require('cors');
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

// SOCKET.IO PROXY ENTEGRASYONU
setupSocketProxy(server);

server.listen(PORT, () => {
  logger.info(`API Gateway running on: http://localhost:${PORT}`);
  logger.info(`API Gateway health endpoint: http://localhost:${PORT}/health`);
}); 