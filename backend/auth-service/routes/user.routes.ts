import { Router } from 'express';
import userController from '../controllers/user.controller';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/logout', authMiddleware, userController.logout);

export default router;