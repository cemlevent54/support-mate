import { Router } from 'express';
import userRoutes from './user.routes.js';
import authRoutes from './auth.routes.js';
import roleRoutes from './role.routes.js';
import permissionRoutes from './permission.routes.js';
import reportRoutes from './report.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/auth/users', userRoutes);
router.use('/auth/roles', roleRoutes);
router.use('/auth/permissions', permissionRoutes);
router.use('/auth/reports', reportRoutes);

export default router; 