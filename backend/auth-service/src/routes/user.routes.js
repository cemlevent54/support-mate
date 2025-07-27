import { Router } from 'express';
import userController from '../controllers/user.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';

const router = Router();

// GET /users/:id/internal

// GET /users/profile
router.get('/profile', authMiddleware, userController.getAuthenticatedUser);

// GET /users/role?roleName=Employee
router.get('/role', authMiddleware, userController.getUsersByRole);
// GET /users/:id
router.get('/:id', userController.getUserById);
router.get('/', authMiddleware, requireRole('Admin'), userController.getAllUsers);

// PATCH /users/:id - Kullanıcı kendi profilini güncelleyebilir veya Admin tüm kullanıcıları güncelleyebilir
router.patch('/:id', authMiddleware, userController.updateUser);

// soft delete /users/:id
router.delete('/:id', authMiddleware, requireRole('Admin'), userController.deleteUser);

export default router; 