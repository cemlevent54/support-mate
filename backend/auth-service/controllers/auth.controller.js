import authService from '../services/auth.service.js';

class AuthController {
  register = authService.register.bind(authService);
  login = authService.login.bind(authService);
  logout = authService.logout.bind(authService);
  refreshToken = authService.refreshToken.bind(authService);
}

export default new AuthController(); 