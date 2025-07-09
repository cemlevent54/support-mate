const { createProxyMiddleware } = require('http-proxy-middleware');
const logger = require('../config/logger.config.js').default;
const { getServiceUrl } = require('../utils/gatewayConfigHelper.js');
const { internalServerError } = require('../responseHandlers/serverErrors/internalServer.error.js');

const userProxy = createProxyMiddleware({
  target: getServiceUrl('userService'),
  changeOrigin: true,
  pathRewrite: {
    '^/api/users': '/api/users'
  },
  onProxyReq: (proxyReq, req, res) => {
    logger.info(`[USERS] Proxying request: ${req.method} ${req.originalUrl}`);
  },
  onError: (err, req, res) => {
    logger.error(`[USERS] Proxy error: ${err.message}`);
    internalServerError(res);
  }
});

module.exports = userProxy; 