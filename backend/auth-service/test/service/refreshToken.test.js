import { expect } from 'chai';
import sinon from 'sinon';
import { AuthService } from '../../src/services/auth.service.js';

describe('AuthService.refreshToken', () => {
  let authService;
  let mockDeps;

  beforeEach(() => {
    mockDeps = {
      jwtService: {
        verifyRefreshToken: sinon.stub(),
        buildJWTPayload: sinon.stub().returns({ id: 'user123', email: 'test@example.com' }),
        generateAccessToken: sinon.stub().returns('new_access_token_123'),
        generateRefreshToken: sinon.stub().returns('new_refresh_token_123'),
        getTokenExpireDate: sinon.stub().returns(new Date(Date.now() + 3600000)),
        removeActiveSession: sinon.stub().resolves()
      },
      cacheService: { 
        client: {
          get: sinon.stub(),
          set: sinon.stub(),
          del: sinon.stub(),
          incr: sinon.stub(),
          expire: sinon.stub(),
          lRange: sinon.stub(),
          rPush: sinon.stub()
        } 
      },
      userRepository: {},
      roleService: {},
      kafkaProducer: {
        sendUserRegisteredEvent: sinon.stub(),
        sendAgentOnlineEvent: sinon.stub(),
        sendPasswordResetEvent: sinon.stub(),
        sendUserVerifiedEvent: sinon.stub(),
        sendUserVerificationResendEvent: sinon.stub()
      },
      translation: (key) => {
        const translations = {
          'services.authService.logs.refreshRequest': 'Refresh request',
          'services.authService.logs.refreshSuccess': 'Refresh success',
          'services.authService.logs.refreshError': 'Refresh error',
          'repositories.userRepository.logs.notFound': 'User not found'
        };
        return translations[key] || key;
      },
      googleClient: {},
      userModel: {},
      passwordHelper: {},
      commandHandler: {
        dispatch: sinon.stub()
      },
      queryHandler: {
        dispatch: sinon.stub()
      },
      bcrypt: {
        compare: sinon.stub()
      },
      crypto: {},
      jwt: {}
    };

    authService = new AuthService(
      mockDeps.jwtService,
      mockDeps.cacheService,
      mockDeps.userRepository,
      mockDeps.roleService,
      mockDeps.kafkaProducer,
      mockDeps.translation,
      mockDeps.googleClient,
      mockDeps.userModel,
      mockDeps.passwordHelper,
      mockDeps.commandHandler,
      mockDeps.queryHandler,
      mockDeps.bcrypt,
      mockDeps.crypto,
      mockDeps.jwt
    );
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('refreshToken', () => {
    it('should refresh token successfully with cookie refresh token', async () => {
      const fakeUser = {
        id: 'user123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        roleName: 'User',
        role: { _id: 'role123', name: 'User' }
      };

      const refreshTokenData = {
        cookies: { refreshToken: 'valid_refresh_token_123' },
        body: {}
      };

      // Mock jwtService methods
      mockDeps.jwtService.verifyRefreshToken.returns({ id: 'user123' });
      mockDeps.jwtService.buildJWTPayload.returns({ id: 'user123', email: 'test@example.com' });
      mockDeps.jwtService.generateAccessToken.returns('new_access_token_123');
      mockDeps.jwtService.generateRefreshToken.returns('new_refresh_token_123');
      mockDeps.jwtService.getTokenExpireDate.returns(new Date(Date.now() + 3600000));
      mockDeps.jwtService.removeActiveSession.resolves();

      // Mock queryHandler to return user
      mockDeps.queryHandler.dispatch.resolves(fakeUser);

      const result = await authService.refreshToken(refreshTokenData);

      expect(result).to.have.property('accessToken', 'new_access_token_123');
      expect(result).to.have.property('refreshToken', 'new_refresh_token_123');
      expect(result).to.have.property('accessTokenExpiresAt');
      expect(result).to.have.property('user');
      expect(result.user).to.have.property('id', 'user123');
      expect(result.user).to.have.property('email', 'test@example.com');
      expect(result.user).to.have.property('role', 'role123');
      expect(result.user).to.have.property('roleName', 'User');

      expect(mockDeps.jwtService.verifyRefreshToken.calledOnce).to.be.true;
      expect(mockDeps.queryHandler.dispatch.calledOnce).to.be.true;
      expect(mockDeps.jwtService.removeActiveSession.calledOnce).to.be.true;
      expect(mockDeps.jwtService.generateAccessToken.calledOnce).to.be.true;
      expect(mockDeps.jwtService.generateRefreshToken.calledOnce).to.be.true;
    });

    it('should refresh token successfully with body refresh token', async () => {
      const fakeUser = {
        id: 'user123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        roleName: 'User',
        role: { _id: 'role123', name: 'User' }
      };

      const refreshTokenData = {
        cookies: {},
        body: { refreshToken: 'valid_refresh_token_123' }
      };

      // Mock jwtService methods
      mockDeps.jwtService.verifyRefreshToken.returns({ id: 'user123' });
      mockDeps.jwtService.buildJWTPayload.returns({ id: 'user123', email: 'test@example.com' });
      mockDeps.jwtService.generateAccessToken.returns('new_access_token_123');
      mockDeps.jwtService.generateRefreshToken.returns('new_refresh_token_123');
      mockDeps.jwtService.getTokenExpireDate.returns(new Date(Date.now() + 3600000));
      mockDeps.jwtService.removeActiveSession.resolves();

      // Mock queryHandler to return user
      mockDeps.queryHandler.dispatch.resolves(fakeUser);

      const result = await authService.refreshToken(refreshTokenData);

      expect(result).to.have.property('accessToken', 'new_access_token_123');
      expect(result).to.have.property('refreshToken', 'new_refresh_token_123');
      expect(result).to.have.property('accessTokenExpiresAt');
      expect(result).to.have.property('user');

      expect(mockDeps.jwtService.verifyRefreshToken.calledOnce).to.be.true;
      expect(mockDeps.queryHandler.dispatch.calledOnce).to.be.true;
    });

    it('should throw error when no refresh token provided', async () => {
      const refreshTokenData = {
        cookies: {},
        body: {}
      };

      try {
        await authService.refreshToken(refreshTokenData);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.equal('Refresh error');
      }

      expect(mockDeps.jwtService.verifyRefreshToken.called).to.be.false;
      expect(mockDeps.queryHandler.dispatch.called).to.be.false;
    });

    it('should throw error when refresh token verification fails', async () => {
      const refreshTokenData = {
        cookies: { refreshToken: 'invalid_refresh_token_123' },
        body: {}
      };

      // Mock jwtService to throw error
      mockDeps.jwtService.verifyRefreshToken.throws(new Error('Invalid token'));

      try {
        await authService.refreshToken(refreshTokenData);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.equal('Refresh error');
      }

      expect(mockDeps.jwtService.verifyRefreshToken.calledOnce).to.be.true;
      expect(mockDeps.queryHandler.dispatch.called).to.be.false;
    });

    it('should throw error when user not found', async () => {
      const refreshTokenData = {
        cookies: { refreshToken: 'valid_refresh_token_123' },
        body: {}
      };

      // Mock jwtService methods
      mockDeps.jwtService.verifyRefreshToken.returns({ id: 'user123' });

      // Mock queryHandler to return null (user not found)
      mockDeps.queryHandler.dispatch.resolves(null);

      try {
        await authService.refreshToken(refreshTokenData);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.equal('User not found');
      }

      expect(mockDeps.jwtService.verifyRefreshToken.calledOnce).to.be.true;
      expect(mockDeps.queryHandler.dispatch.calledOnce).to.be.true;
      expect(mockDeps.jwtService.removeActiveSession.called).to.be.false;
    });

    it('should handle user with string role', async () => {
      const fakeUser = {
        id: 'user123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        roleName: 'User',
        role: 'role123' // String role
      };

      const refreshTokenData = {
        cookies: { refreshToken: 'valid_refresh_token_123' },
        body: {}
      };

      // Mock jwtService methods
      mockDeps.jwtService.verifyRefreshToken.returns({ id: 'user123' });
      mockDeps.jwtService.buildJWTPayload.returns({ id: 'user123', email: 'test@example.com' });
      mockDeps.jwtService.generateAccessToken.returns('new_access_token_123');
      mockDeps.jwtService.generateRefreshToken.returns('new_refresh_token_123');
      mockDeps.jwtService.getTokenExpireDate.returns(new Date(Date.now() + 3600000));
      mockDeps.jwtService.removeActiveSession.resolves();

      // Mock queryHandler to return user
      mockDeps.queryHandler.dispatch.resolves(fakeUser);

      const result = await authService.refreshToken(refreshTokenData);

      expect(result.user).to.have.property('role', 'role123');
      expect(result.user).to.have.property('roleName', 'User');
    });

    it('should handle user with role object without _id', async () => {
      const fakeUser = {
        id: 'user123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        roleName: 'User',
        role: { name: 'User' } // Role object without _id
      };

      const refreshTokenData = {
        cookies: { refreshToken: 'valid_refresh_token_123' },
        body: {}
      };

      // Mock jwtService methods
      mockDeps.jwtService.verifyRefreshToken.returns({ id: 'user123' });
      mockDeps.jwtService.buildJWTPayload.returns({ id: 'user123', email: 'test@example.com' });
      mockDeps.jwtService.generateAccessToken.returns('new_access_token_123');
      mockDeps.jwtService.generateRefreshToken.returns('new_refresh_token_123');
      mockDeps.jwtService.getTokenExpireDate.returns(new Date(Date.now() + 3600000));
      mockDeps.jwtService.removeActiveSession.resolves();

      // Mock queryHandler to return user
      mockDeps.queryHandler.dispatch.resolves(fakeUser);

      const result = await authService.refreshToken(refreshTokenData);

      expect(result.user).to.have.property('role');
      expect(result.user).to.have.property('roleName', 'User');
    });

    it('should handle user with toString method on role', async () => {
      const fakeUser = {
        id: 'user123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        roleName: 'User',
        role: {
          toString: () => 'role123'
        }
      };

      const refreshTokenData = {
        cookies: { refreshToken: 'valid_refresh_token_123' },
        body: {}
      };

      // Mock jwtService methods
      mockDeps.jwtService.verifyRefreshToken.returns({ id: 'user123' });
      mockDeps.jwtService.buildJWTPayload.returns({ id: 'user123', email: 'test@example.com' });
      mockDeps.jwtService.generateAccessToken.returns('new_access_token_123');
      mockDeps.jwtService.generateRefreshToken.returns('new_refresh_token_123');
      mockDeps.jwtService.getTokenExpireDate.returns(new Date(Date.now() + 3600000));
      mockDeps.jwtService.removeActiveSession.resolves();

      // Mock queryHandler to return user
      mockDeps.queryHandler.dispatch.resolves(fakeUser);

      const result = await authService.refreshToken(refreshTokenData);

      expect(result.user).to.have.property('role', 'role123');
      expect(result.user).to.have.property('roleName', 'User');
    });
  });

  describe('getRefreshToken', () => {
    it('should return refresh token from cookies', () => {
      const data = {
        cookies: { refreshToken: 'cookie_token_123' },
        body: { refreshToken: 'body_token_123' }
      };

      const result = authService.getRefreshToken(data);
      expect(result).to.equal('cookie_token_123');
    });

    it('should return refresh token from body when not in cookies', () => {
      const data = {
        cookies: {},
        body: { refreshToken: 'body_token_123' }
      };

      const result = authService.getRefreshToken(data);
      expect(result).to.equal('body_token_123');
    });

    it('should return null when no refresh token found', () => {
      const data = {
        cookies: {},
        body: {}
      };

      const result = authService.getRefreshToken(data);
      expect(result).to.be.null;
    });

    it('should return null when data is undefined', () => {
      const result = authService.getRefreshToken(undefined);
      expect(result).to.be.null;
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify refresh token successfully', () => {
      const token = 'valid_token_123';
      const decodedPayload = { id: 'user123', email: 'test@example.com' };

      mockDeps.jwtService.verifyRefreshToken.returns(decodedPayload);

      const result = authService.verifyRefreshToken(token);

      expect(result).to.deep.equal(decodedPayload);
      expect(mockDeps.jwtService.verifyRefreshToken.calledOnce).to.be.true;
      expect(mockDeps.jwtService.verifyRefreshToken.calledWith(token)).to.be.true;
    });

    it('should throw error when token verification fails', () => {
      const token = 'invalid_token_123';
      const verificationError = new Error('Invalid token');

      mockDeps.jwtService.verifyRefreshToken.throws(verificationError);

      try {
        authService.verifyRefreshToken(token);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.equal('Refresh error');
      }

      expect(mockDeps.jwtService.verifyRefreshToken.calledOnce).to.be.true;
    });
  });

  describe('getUser', () => {
    it('should get user successfully', async () => {
      const userId = 'user123';
      const fakeUser = {
        id: 'user123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User'
      };

      mockDeps.queryHandler.dispatch.resolves(fakeUser);

      const result = await authService.getUser(userId);

      expect(result).to.deep.equal(fakeUser);
      expect(mockDeps.queryHandler.dispatch.calledOnce).to.be.true;
      expect(mockDeps.queryHandler.dispatch.calledWith('GET_USER_BY_ID', { id: userId })).to.be.true;
    });

    it('should return null when user not found', async () => {
      const userId = 'nonexistent_user';

      mockDeps.queryHandler.dispatch.resolves(null);

      const result = await authService.getUser(userId);

      expect(result).to.be.null;
      expect(mockDeps.queryHandler.dispatch.calledOnce).to.be.true;
    });
  });

  describe('rotateSession', () => {
    it('should rotate session successfully', async () => {
      const fakeUser = {
        id: 'user123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        roleName: 'User',
        role: { _id: 'role123', name: 'User' }
      };

      const payload = { id: 'user123', email: 'test@example.com' };
      const accessToken = 'new_access_token_123';
      const refreshToken = 'new_refresh_token_123';
      const expireDate = new Date(Date.now() + 3600000);

      mockDeps.jwtService.buildJWTPayload.returns(payload);
      mockDeps.jwtService.generateAccessToken.returns(accessToken);
      mockDeps.jwtService.generateRefreshToken.returns(refreshToken);
      mockDeps.jwtService.getTokenExpireDate.returns(expireDate);
      mockDeps.jwtService.removeActiveSession.resolves();

      const result = await authService.rotateSession(fakeUser);

      expect(result).to.deep.equal({
        accessToken,
        refreshToken,
        accessTokenExpiresAt: expireDate
      });

      expect(mockDeps.jwtService.removeActiveSession.calledOnce).to.be.true;
      expect(mockDeps.jwtService.removeActiveSession.calledWith(fakeUser.id)).to.be.true;
      expect(mockDeps.jwtService.buildJWTPayload.calledOnce).to.be.true;
      expect(mockDeps.jwtService.buildJWTPayload.calledWith(fakeUser)).to.be.true;
      expect(mockDeps.jwtService.generateAccessToken.calledOnce).to.be.true;
      expect(mockDeps.jwtService.generateAccessToken.calledWith(payload, process.env.JWT_EXPIRES_IN)).to.be.true;
      expect(mockDeps.jwtService.generateRefreshToken.calledOnce).to.be.true;
      expect(mockDeps.jwtService.generateRefreshToken.calledWith(payload)).to.be.true;
      expect(mockDeps.jwtService.getTokenExpireDate.calledOnce).to.be.true;
      expect(mockDeps.jwtService.getTokenExpireDate.calledWith(process.env.JWT_EXPIRES_IN)).to.be.true;
    });
  });

  describe('sanitizeUser', () => {
    it('should sanitize user with role object', () => {
      const user = {
        id: 'user123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        password: 'hashed_password',
        role: { _id: 'role123', name: 'User' },
        roleName: 'User'
      };

      const result = authService.sanitizeUser(user);

      expect(result).to.deep.equal({
        id: 'user123',
        email: 'test@example.com',
        role: 'role123',
        roleName: 'User',
        categoryIds: []
      });
    });

    it('should sanitize user with string role', () => {
      const user = {
        id: 'user123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        password: 'hashed_password',
        role: 'role123',
        roleName: 'User'
      };

      const result = authService.sanitizeUser(user);

      expect(result).to.deep.equal({
        id: 'user123',
        email: 'test@example.com',
        role: 'role123',
        roleName: 'User',
        categoryIds: []
      });
    });

    it('should sanitize user with role object without _id', () => {
      const user = {
        id: 'user123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        password: 'hashed_password',
        role: { name: 'User' },
        roleName: 'User'
      };

      const result = authService.sanitizeUser(user);

      expect(result).to.deep.equal({
        id: 'user123',
        email: 'test@example.com',
        role: undefined,
        roleName: 'User',
        categoryIds: []
      });
    });

    it('should sanitize user with toString method on role', () => {
      const user = {
        id: 'user123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        password: 'hashed_password',
        role: {
          toString: () => 'role123'
        },
        roleName: 'User'
      };

      const result = authService.sanitizeUser(user);

      expect(result).to.deep.equal({
        id: 'user123',
        email: 'test@example.com',
        role: 'role123',
        roleName: 'User',
        categoryIds: []
      });
    });
  });
});
