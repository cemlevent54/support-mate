import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';
import roleController from '../controllers/role.controller.js';

const router = Router();

// GET /roles
router.get('/', authMiddleware, requireRole('Admin'), roleController.getAllRoles);

// POST /roles
router.post('/', authMiddleware, requireRole('Admin'), roleController.createRole);

// PATCH /roles/:id
router.patch('/:id', authMiddleware, requireRole('Admin'), roleController.updateRole);

// soft delete /roles/:id
router.delete('/:id', authMiddleware, requireRole('Admin'), roleController.deleteRole);

// GET /roles/:id
router.get('/:id', authMiddleware, requireRole('Admin'), roleController.getRoleById);



export default router;