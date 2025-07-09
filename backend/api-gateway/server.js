const express = require('express');
const cors = require('cors');
const logger = require('./config/logger.config.js').default;
const { authProxy, userProxy } = require('./middleware/index.proxy.js');
const routes = require('./routes/index.js');
const corsOptions = require('./config/cors.config.js');
const { getGatewayHealth, services } = require('./config/health.config.js');

const app = express();
const PORT = process.env.PORT || 9000;

// CORS middleware
app.use(cors(corsOptions));

// Routes
app.use('/', routes);

// Proxy middleware
app.use('/api/auth', authProxy);
app.use('/api/users', userProxy);

app.listen(PORT, () => {
  logger.info(`API Gateway running on: http://localhost:${PORT}`);
  logger.info(`API Gateway health endpoint: http://localhost:${PORT}/health`);
}); 