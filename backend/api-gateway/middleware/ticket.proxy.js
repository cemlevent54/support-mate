const { createProxyMiddleware } = require('http-proxy-middleware');
const logger = require('../config/logger.config.js').default;
const { getServiceUrl } = require('../utils/gatewayConfigHelper.js');
const { internalServerError } = require('../responseHandlers/serverErrors/internalServer.error.js');

const ticketProxy = createProxyMiddleware({
  target: getServiceUrl('ticketService'),
  changeOrigin: true,
  pathRewrite: {
    '^/api/tickets': '/api/tickets'
  },
  onProxyReq: (proxyReq, req, res) => {
    logger.info(`[TICKETS] Proxying request: ${req.method} ${req.originalUrl}`);
    if (req.headers['authorization']) {
      proxyReq.setHeader('authorization', req.headers['authorization']);
    }
  },
  onError: (err, req, res) => {
    logger.error(`[TICKETS] Proxy error: ${err.message}`);
    internalServerError(res);
  }
});

module.exports = ticketProxy; 