import { Router } from 'express';
import userController from '../controllers/user.controller.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

// GET /users/profile
router.get('/profile', authMiddleware, userController.getAuthenticatedUser);

// GET /users/:id
router.get('/:id', authMiddleware, userController.getUserById);
router.get('/', authMiddleware, userController.getAllUsers);
router.get('/role/:role', authMiddleware, userController.getUsersByRole);

// PATCH /users/:id
router.patch('/:id', authMiddleware, userController.updateUser);

// soft delete /users/:id
router.delete('/:id', authMiddleware, userController.deleteUser);

export default router; 