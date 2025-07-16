const express = require('express');
const cors = require('cors');
const logger = require('./config/logger.config.js');
const { authProxy, userProxy , notificationProxy , ticketProxy } = require('./middleware/index.proxy.js');
const routes = require('./routes/index.js');
const corsOptions = require('./config/cors.config.js');
const { getGatewayHealth, services } = require('./config/health.config.js');


const app = express();
const PORT = 9000;

// CORS middleware
app.use(cors(corsOptions));

// Routes
app.use('/', routes);

// Proxy middleware
app.use('/api/auth', authProxy);
app.use('/api/notification', notificationProxy);
app.use('/api/tickets', ticketProxy);

app.listen(PORT, () => {
  logger.info(`API Gateway running on: http://localhost:${PORT}`);
  logger.info(`API Gateway health endpoint: http://localhost:${PORT}/health`);
}); 