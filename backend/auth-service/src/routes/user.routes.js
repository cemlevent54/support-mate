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



// Leader-Employee ilişkisi için yeni endpoint'ler
// GET /users/leaders/:leaderId/employees - Leader'ın employee'lerini getir
router.get('/leaders/:leaderId/employees', authMiddleware, requireRole(['Admin', 'Leader']), userController.getEmployeesByLeader);

// GET /users/employees/:employeeId/leader - Employee'nin leader'ını getir
router.get('/employees/:employeeId/leader', authMiddleware, requireRole(['Admin', 'Employee']), userController.getLeaderByEmployee);

// GET /users/leaders/with-employees - Tüm leader'ları employee'leriyle birlikte getir
router.get('/leaders/with-employees', authMiddleware, requireRole(['Admin', 'Leader']), userController.getLeadersWithEmployees);

// POST /users/assign-employee - Employee'yi Leader'a ata (sadece Admin)
router.post('/assign-employee', authMiddleware, requireRole('Admin'), userController.assignEmployeeToLeader);

// DELETE /users/employees/:employeeId/leader - Employee'yi Leader'dan çıkar (sadece Admin)
router.delete('/employees/:employeeId/leader', authMiddleware, requireRole('Admin'), userController.removeEmployeeFromLeader);



export default router; 