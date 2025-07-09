import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { SERVICES } from '../config/config.js';

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

// /api/order -> order service (örnek, ileride eklenirse)
// router.use('/api/order', createProxyMiddleware({
//   target: SERVICES.order,
//   changeOrigin: true,
//   pathRewrite: { '^/api/order': '' }
// }));

export default router;
