import userService from '../services/user.service.js';

class UserController {
  getUserById = userService.getUserById.bind(userService);
  getAllUsers = userService.getAllUsers.bind(userService);
  getUsersByRole = userService.getUsersByRole.bind(userService);
}

export default new UserController();
