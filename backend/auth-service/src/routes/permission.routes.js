import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';
import permissionController from '../controllers/permission.controller.js';

const router = Router();

// GET /permissions
router.get('/', authMiddleware, requireRole('Admin'), permissionController.getAllPermissions);

// GET /permissions/active
router.get('/active', authMiddleware, requireRole('Admin'), permissionController.getActivePermissions);

// POST /permissions
router.post('/', authMiddleware, requireRole('Admin'), permissionController.createPermission);

// PATCH /permissions/:id
router.patch('/:id', authMiddleware, requireRole('Admin'), permissionController.updatePermission);

// DELETE /permissions/:id
router.delete('/:id', authMiddleware, requireRole('Admin'), permissionController.deletePermission);

// GET /permissions/:id
router.get('/:id', authMiddleware, requireRole('Admin'), permissionController.getPermissionById);

export default router; 