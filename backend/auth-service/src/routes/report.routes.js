import { Router } from 'express';
import reportController from '../controllers/report.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';

const router = Router();

// GET /reports/dashboard-statistics
router.get('/dashboard-statistics', authMiddleware, requireRole('Admin'), reportController.getDashboardStatistics);

export default router;




