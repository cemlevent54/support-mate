const { createProxyMiddleware } = require('http-proxy-middleware');
const { getServiceUrl } = require('../utils/gatewayConfigHelper.js');

const notificationProxy = createProxyMiddleware({
  target: getServiceUrl('notificationService'),
  changeOrigin: true,
  pathRewrite: {
    '^/api/notification': '/api/notification',
  },
  onProxyReq: (proxyReq, req, res) => {
    if (typeof logger !== 'undefined') {
      logger.info(`[NOTIFICATION] Proxying request: ${req.method} ${req.originalUrl}`);
    }
  },
  onError: (err, req, res) => {
    if (typeof logger !== 'undefined') {
      logger.error(`[NOTIFICATION] Proxy error: ${err.message}`);
    }
    res.status(500).json({ error: 'Proxy error', details: err.message });
  }
});

module.exports = notificationProxy;
