import { registerUser, loginUser, logoutUser } from '../services/user.service.js';

const userController = {
  register: registerUser,
  login: loginUser,
  logout: logoutUser,
};

export default userController; 