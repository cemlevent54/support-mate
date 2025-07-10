const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { SERVICES } = require('../config/config.js');

const router = express.Router();

// /api/auth -> auth service
router.use('/api/auth', createProxyMiddleware({
  target: SERVICES.auth,
  changeOrigin: true
}));

// /api/user -> user service (örnek, ileride eklenirse)
router.use('/api/user', createProxyMiddleware({
  target: SERVICES.user,
  changeOrigin: true,
  pathRewrite: { '^/api/user': '' }
}));

// /api/notification -> notification service
router.use('/api/notification', createProxyMiddleware({
  target: SERVICES.notification,
  changeOrigin: true
}));

// /api/order -> order service (örnek, ileride eklenirse)
// router.use('/api/order', createProxyMiddleware({
//   target: SERVICES.order,
//   changeOrigin: true,
//   pathRewrite: { '^/api/order': '' }
// }));

module.exports = router;
