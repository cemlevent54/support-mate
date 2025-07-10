import { Router } from 'express';
import userController from '../controllers/user.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';

const router = Router();

// GET /users/profile
router.get('/profile', authMiddleware, userController.getAuthenticatedUser);

// GET /users/:id
router.get('/:id', authMiddleware, requireRole('Admin'), userController.getUserById);
router.get('/', authMiddleware, requireRole('Admin'), userController.getAllUsers);
router.get('/role/:role', authMiddleware, requireRole('Admin'), userController.getUsersByRole);

// PATCH /users/:id
router.patch('/:id', authMiddleware, requireRole('Admin'), userController.updateUser);

// soft delete /users/:id
router.delete('/:id', authMiddleware, requireRole('Admin'), userController.deleteUser);

export default router; 