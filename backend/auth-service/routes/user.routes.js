import { Router } from 'express';
import userController from '../controllers/user.controller.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();


router.get('/:id', authMiddleware, userController.getUserById);
router.get('/', authMiddleware, userController.getAllUsers);
router.get('/role/:role', authMiddleware, userController.getUsersByRole);

export default router; 