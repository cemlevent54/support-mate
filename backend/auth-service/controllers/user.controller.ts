import { RequestHandler } from 'express';
import { registerUser, loginUser, logoutUser } from '../services/user.service';

const userController: { [key: string]: RequestHandler } = {
  register: registerUser,
  login: loginUser,
  logout: logoutUser,
};

export default userController;