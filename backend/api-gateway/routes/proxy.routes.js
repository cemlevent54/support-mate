const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { SERVICES } = require('../config/config.js');

const router = express.Router();

// /api/auth -> auth service
router.use('/api/auth', createProxyMiddleware({
  target: SERVICES.auth,
  changeOrigin: true
}));

// /api/notification -> notification service
router.use('/api/notification', createProxyMiddleware({
  target: SERVICES.notification,
  changeOrigin: true
}));

// /api/tickets -> ticket service
router.use('/api/tickets', createProxyMiddleware({
  target: SERVICES.ticket,
  changeOrigin: true
}));

module.exports = router;
