import authService from '../services/auth.service.js';

class AuthController {
  register = authService.register.bind(authService);
  login = authService.login.bind(authService);
  logout = authService.logout.bind(authService);
  refreshToken = authService.refreshToken.bind(authService);
  forgotPassword = authService.forgotPassword.bind(authService);
  resetPassword = authService.resetPassword.bind(authService);
  changePassword = authService.changePassword.bind(authService);
  googleLogin = authService.googleLogin.bind(authService);
  googleRegister = authService.googleRegister.bind(authService);
  verifyEmail = authService.verifyEmail.bind(authService);
  onlineUsers = authService.onlineUsers.bind(authService);
}

export default new AuthController(); 