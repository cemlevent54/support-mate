import { userCQRSService } from '../services/user.cqrs.service.js';

const userCQRSController = {
  register: userCQRSService.registerUser.bind(userCQRSService),
  login: userCQRSService.loginUser.bind(userCQRSService),
  logout: userCQRSService.logoutUser.bind(userCQRSService),
  getUserById: userCQRSService.getUserById.bind(userCQRSService),
  getAllUsers: userCQRSService.getAllUsers.bind(userCQRSService),
  getUsersByRole: userCQRSService.getUsersByRole.bind(userCQRSService),
};

export default userCQRSController; 