const { createProxyMiddleware } = require('http-proxy-middleware');
const logger = require('../config/logger.config.js').default;
const { getServiceUrl } = require('../utils/gatewayConfigHelper.js');

const authProxy = createProxyMiddleware({
  target: getServiceUrl('authService'),
  changeOrigin: true,
  pathRewrite: {
    '^/api/auth': '/api/auth'
  },
  onProxyReq: (proxyReq, req, res) => {
    logger.info(`[AUTH] Proxying request: ${req.method} ${req.originalUrl}`);
  },
  onError: (err, req, res) => {
    logger.error(`[AUTH] Proxy error: ${err.message}`);
    res.status(500).json({ error: 'Proxy error', details: err.message });
  }
});

module.exports = authProxy; 