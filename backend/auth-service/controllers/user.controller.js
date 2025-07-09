import userService from '../services/user.service.js';

class UserController {
  getUserById = userService.getUserById.bind(userService);
  getAllUsers = userService.getAllUsers.bind(userService);
  getUsersByRole = userService.getUsersByRole.bind(userService);
  updateUser = userService.updateUser.bind(userService);
  deleteUser = userService.deleteUser.bind(userService);
  getAuthenticatedUser = userService.getAuthenticatedUser.bind(userService);
}

export default new UserController();
