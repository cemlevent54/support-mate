import { expect } from 'chai';
import sinon from 'sinon';
import { AuthService } from '../../src/services/auth.service.js';
import { ValidationError, UnauthorizedError, NotFoundError } from '../../src/utils/customErrors.js';

describe('AuthService.changePassword', () => {
  let authService;
  let mockDeps;

  beforeEach(() => {
    mockDeps = {
      jwtService: {
        generatePasswordResetToken: sinon.stub().returns('password_reset_token_123'),
        verifyPasswordResetToken: sinon.stub().returns({ id: 'user123', email: 'test@example.com' }),
        buildJWTPayload: sinon.stub().returns({ id: 'user123', email: 'test@example.com' }),
        generateAccessToken: sinon.stub().returns('access_token_123'),
        getTokenExpireDate: sinon.stub().returns(new Date(Date.now() + 3600000)),
        generateRefreshToken: sinon.stub().returns('refresh_token_123'),
        addActiveSession: sinon.stub().resolves()
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
      roleService: {
        getRoleByName: sinon.stub().resolves({ _id: 'role123', name: 'User' })
      },
      kafkaProducer: {
        sendUserRegisteredEvent: sinon.stub().resolves(),
        sendAgentOnlineEvent: sinon.stub(),
        sendPasswordResetEvent: sinon.stub().resolves(),
        sendUserVerifiedEvent: sinon.stub().resolves(),
        sendUserVerificationResendEvent: sinon.stub()
      },
      translation: (key) => {
        const translations = {
          'services.authService.logs.changePasswordSuccess': 'Password changed successfully',
          'services.authService.logs.changePasswordError': 'Change password error',
          'services.authService.logs.validationError': 'Validation error',
          'services.authService.logs.emailAlreadyInUse': 'Email already in use',
          'services.authService.logs.userReactivated': 'User reactivated',
          'services.authService.logs.registerSuccess': 'Register success',
          'services.authService.logs.verificationEmailSent': 'Verification email sent',
          'services.authService.logs.registerError': 'Register error',
          'services.authService.logs.missingVerificationData': 'Missing verification data',
          'services.authService.logs.invalidVerificationToken': 'Invalid verification token',
          'services.authService.logs.invalidVerificationCode': 'Invalid verification code',
          'services.authService.logs.emailVerificationSuccess': 'Email verification success',
          'services.authService.logs.verificationCodeResent': 'Verification code resent',
          'services.authService.logs.invalidTokenEmail': 'Invalid token email',
          'repositories.userRepository.logs.notFound': 'User not found'
        };
        return translations[key] || key;
      },
      googleClient: {},
      userModel: {},
      passwordHelper: {
        hashPassword: sinon.stub().resolves('hashed_password_123'),
        comparePasswords: sinon.stub().resolves(true)
      },
      commandHandler: {
        dispatch: sinon.stub()
      },
      queryHandler: {
        dispatch: sinon.stub()
      },
      bcrypt: {
        compare: sinon.stub()
      },
      crypto: {
        randomBytes: sinon.stub().returns({ toString: () => 'random_bytes_123' })
      },
      jwt: {
        verify: sinon.stub(),
        decode: sinon.stub()
      }
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

  describe('changePassword', () => {
    it('should change password successfully with Turkish locale', async () => {
      const userId = 'user123';
      const changePasswordData = {
        newPassword: 'newPassword123',
        confirmPassword: 'newPassword123'
      };
      const locale = 'tr';

      const fakeUser = {
        id: 'user123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User'
      };

      // Mock queryHandler to return user
      mockDeps.queryHandler.dispatch.resolves(fakeUser);

      // Mock commandHandler to return updated user
      mockDeps.commandHandler.dispatch.resolves(fakeUser);

      const result = await authService.changePassword(userId, changePasswordData, locale);

      // Assertions
      expect(result).to.deep.equal({
        success: true,
        message: 'Şifreniz başarıyla değiştirildi'
      });

      // Verify password was hashed
      expect(mockDeps.passwordHelper.hashPassword.calledOnce).to.be.true;
      expect(mockDeps.passwordHelper.hashPassword.firstCall.args[0]).to.equal('newPassword123');

      // Verify user was fetched
      expect(mockDeps.queryHandler.dispatch.calledOnce).to.be.true;
      expect(mockDeps.queryHandler.dispatch.firstCall.args[0]).to.equal('GET_USER_BY_ID');
      expect(mockDeps.queryHandler.dispatch.firstCall.args[1]).to.deep.equal({ id: userId });

      // Verify user was updated
      expect(mockDeps.commandHandler.dispatch.calledOnce).to.be.true;
      expect(mockDeps.commandHandler.dispatch.firstCall.args[0]).to.equal('UPDATE_USER');
      expect(mockDeps.commandHandler.dispatch.firstCall.args[1]).to.deep.equal({
        id: userId,
        updateData: { password: 'hashed_password_123' }
      });
    });

    it('should change password successfully with English locale', async () => {
      const userId = 'user123';
      const changePasswordData = {
        newPassword: 'newPassword123',
        confirmPassword: 'newPassword123'
      };
      const locale = 'en';

      const fakeUser = {
        id: 'user123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User'
      };

      // Mock queryHandler to return user
      mockDeps.queryHandler.dispatch.resolves(fakeUser);

      // Mock commandHandler to return updated user
      mockDeps.commandHandler.dispatch.resolves(fakeUser);

      const result = await authService.changePassword(userId, changePasswordData, locale);

      // Assertions
      expect(result).to.deep.equal({
        success: true,
        message: 'Password changed successfully'
      });
    });

    it('should throw ValidationError when newPassword is missing', async () => {
      const userId = 'user123';
      const changePasswordData = {
        confirmPassword: 'newPassword123'
        // newPassword missing
      };

      try {
        await authService.changePassword(userId, changePasswordData, 'tr');
        expect.fail('Should have thrown ValidationError');
      } catch (error) {
        expect(error).to.be.instanceOf(ValidationError);
        expect(error.message).to.equal('Şifre alanları gereklidir');
      }
    });

    it('should throw ValidationError when confirmPassword is missing', async () => {
      const userId = 'user123';
      const changePasswordData = {
        newPassword: 'newPassword123'
        // confirmPassword missing
      };

      try {
        await authService.changePassword(userId, changePasswordData, 'tr');
        expect.fail('Should have thrown ValidationError');
      } catch (error) {
        expect(error).to.be.instanceOf(ValidationError);
        expect(error.message).to.equal('Şifre alanları gereklidir');
      }
    });

    it('should throw ValidationError when passwords do not match', async () => {
      const userId = 'user123';
      const changePasswordData = {
        newPassword: 'newPassword123',
        confirmPassword: 'differentPassword456'
      };

      try {
        await authService.changePassword(userId, changePasswordData, 'tr');
        expect.fail('Should have thrown ValidationError');
      } catch (error) {
        expect(error).to.be.instanceOf(ValidationError);
        expect(error.message).to.equal('Şifreler eşleşmiyor');
      }
    });

    it('should throw ValidationError when password is too short', async () => {
      const userId = 'user123';
      const changePasswordData = {
        newPassword: '123',
        confirmPassword: '123'
      };

      try {
        await authService.changePassword(userId, changePasswordData, 'tr');
        expect.fail('Should have thrown ValidationError');
      } catch (error) {
        expect(error).to.be.instanceOf(ValidationError);
        expect(error.message).to.equal('Şifre en az 8 karakter olmalıdır');
      }
    });

    it('should throw ValidationError when password is exactly 7 characters', async () => {
      const userId = 'user123';
      const changePasswordData = {
        newPassword: '1234567',
        confirmPassword: '1234567'
      };

      try {
        await authService.changePassword(userId, changePasswordData, 'tr');
        expect.fail('Should have thrown ValidationError');
      } catch (error) {
        expect(error).to.be.instanceOf(ValidationError);
        expect(error.message).to.equal('Şifre en az 8 karakter olmalıdır');
      }
    });

    it('should accept password with exactly 8 characters', async () => {
      const userId = 'user123';
      const changePasswordData = {
        newPassword: '12345678',
        confirmPassword: '12345678'
      };

      const fakeUser = {
        id: 'user123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User'
      };

      // Mock queryHandler to return user
      mockDeps.queryHandler.dispatch.resolves(fakeUser);

      // Mock commandHandler to return updated user
      mockDeps.commandHandler.dispatch.resolves(fakeUser);

      const result = await authService.changePassword(userId, changePasswordData, 'tr');

      // Assertions
      expect(result).to.deep.equal({
        success: true,
        message: 'Şifreniz başarıyla değiştirildi'
      });

      // Verify password was hashed
      expect(mockDeps.passwordHelper.hashPassword.calledOnce).to.be.true;
      expect(mockDeps.passwordHelper.hashPassword.firstCall.args[0]).to.equal('12345678');
    });

    it('should throw NotFoundError when user is not found', async () => {
      const userId = 'nonexistent_user';
      const changePasswordData = {
        newPassword: 'newPassword123',
        confirmPassword: 'newPassword123'
      };

      // Mock queryHandler to return null (user not found)
      mockDeps.queryHandler.dispatch.resolves(null);

      try {
        await authService.changePassword(userId, changePasswordData, 'tr');
        expect.fail('Should have thrown NotFoundError');
      } catch (error) {
        expect(error).to.be.instanceOf(NotFoundError);
        expect(error.message).to.equal('User not found');
      }
    });

    it('should handle commandHandler errors gracefully', async () => {
      const userId = 'user123';
      const changePasswordData = {
        newPassword: 'newPassword123',
        confirmPassword: 'newPassword123'
      };

      const fakeUser = {
        id: 'user123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User'
      };

      // Mock queryHandler to return user
      mockDeps.queryHandler.dispatch.resolves(fakeUser);

      // Mock commandHandler to throw error
      mockDeps.commandHandler.dispatch.rejects(new Error('Database error'));

      try {
        await authService.changePassword(userId, changePasswordData, 'tr');
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error.message).to.equal('Database error');
      }
    });

    it('should handle queryHandler errors gracefully', async () => {
      const userId = 'user123';
      const changePasswordData = {
        newPassword: 'newPassword123',
        confirmPassword: 'newPassword123'
      };

      // Mock queryHandler to throw error
      mockDeps.queryHandler.dispatch.rejects(new Error('Database connection error'));

      try {
        await authService.changePassword(userId, changePasswordData, 'tr');
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error.message).to.equal('Database connection error');
      }
    });

    it('should handle passwordHelper errors gracefully', async () => {
      const userId = 'user123';
      const changePasswordData = {
        newPassword: 'newPassword123',
        confirmPassword: 'newPassword123'
      };

      const fakeUser = {
        id: 'user123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User'
      };

      // Mock queryHandler to return user
      mockDeps.queryHandler.dispatch.resolves(fakeUser);

      // Mock passwordHelper to throw error
      mockDeps.passwordHelper.hashPassword.rejects(new Error('Hashing error'));

      try {
        await authService.changePassword(userId, changePasswordData, 'tr');
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error.message).to.equal('Hashing error');
      }
    });

    it('should accept complex passwords with special characters', async () => {
      const userId = 'user123';
      const changePasswordData = {
        newPassword: 'P@ssw0rd!123',
        confirmPassword: 'P@ssw0rd!123'
      };

      const fakeUser = {
        id: 'user123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User'
      };

      // Mock queryHandler to return user
      mockDeps.queryHandler.dispatch.resolves(fakeUser);

      // Mock commandHandler to return updated user
      mockDeps.commandHandler.dispatch.resolves(fakeUser);

      const result = await authService.changePassword(userId, changePasswordData, 'tr');

      // Assertions
      expect(result).to.deep.equal({
        success: true,
        message: 'Şifreniz başarıyla değiştirildi'
      });

      // Verify password was hashed
      expect(mockDeps.passwordHelper.hashPassword.calledOnce).to.be.true;
      expect(mockDeps.passwordHelper.hashPassword.firstCall.args[0]).to.equal('P@ssw0rd!123');
    });

    it('should accept passwords with spaces', async () => {
      const userId = 'user123';
      const changePasswordData = {
        newPassword: 'My Password 123',
        confirmPassword: 'My Password 123'
      };

      const fakeUser = {
        id: 'user123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User'
      };

      // Mock queryHandler to return user
      mockDeps.queryHandler.dispatch.resolves(fakeUser);

      // Mock commandHandler to return updated user
      mockDeps.commandHandler.dispatch.resolves(fakeUser);

      const result = await authService.changePassword(userId, changePasswordData, 'tr');

      // Assertions
      expect(result).to.deep.equal({
        success: true,
        message: 'Şifreniz başarıyla değiştirildi'
      });

      // Verify password was hashed
      expect(mockDeps.passwordHelper.hashPassword.calledOnce).to.be.true;
      expect(mockDeps.passwordHelper.hashPassword.firstCall.args[0]).to.equal('My Password 123');
    });
  });

  describe('validateChangePasswordData', () => {
    it('should validate correct password data', () => {
      const newPassword = 'newPassword123';
      const confirmPassword = 'newPassword123';

      // Should not throw any error
      expect(() => authService.validateChangePasswordData(newPassword, confirmPassword, 'tr')).to.not.throw();
    });

    it('should throw ValidationError for missing newPassword', () => {
      const newPassword = null;
      const confirmPassword = 'newPassword123';

      expect(() => authService.validateChangePasswordData(newPassword, confirmPassword, 'tr')).to.throw(ValidationError, 'Şifre alanları gereklidir');
    });

    it('should throw ValidationError for missing confirmPassword', () => {
      const newPassword = 'newPassword123';
      const confirmPassword = null;

      expect(() => authService.validateChangePasswordData(newPassword, confirmPassword, 'tr')).to.throw(ValidationError, 'Şifre alanları gereklidir');
    });

    it('should throw ValidationError for empty strings', () => {
      const newPassword = '';
      const confirmPassword = '';

      expect(() => authService.validateChangePasswordData(newPassword, confirmPassword, 'tr')).to.throw(ValidationError, 'Şifre alanları gereklidir');
    });

    it('should throw ValidationError for mismatched passwords', () => {
      const newPassword = 'newPassword123';
      const confirmPassword = 'differentPassword456';

      expect(() => authService.validateChangePasswordData(newPassword, confirmPassword, 'tr')).to.throw(ValidationError, 'Şifreler eşleşmiyor');
    });

    it('should throw ValidationError for short password', () => {
      const newPassword = '123';
      const confirmPassword = '123';

      expect(() => authService.validateChangePasswordData(newPassword, confirmPassword, 'tr')).to.throw(ValidationError, 'Şifre en az 8 karakter olmalıdır');
    });
  });

  describe('updatePassword', () => {
    it('should update password successfully', async () => {
      const userId = 'user123';
      const hashedPassword = 'hashed_password_123';

      const fakeUser = {
        id: 'user123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User'
      };

      // Mock commandHandler to return user
      mockDeps.commandHandler.dispatch.resolves(fakeUser);

      await authService.updatePassword(userId, hashedPassword);

      // Verify commandHandler was called correctly
      expect(mockDeps.commandHandler.dispatch.calledOnce).to.be.true;
      expect(mockDeps.commandHandler.dispatch.firstCall.args[0]).to.equal('UPDATE_USER');
      expect(mockDeps.commandHandler.dispatch.firstCall.args[1]).to.deep.equal({
        id: userId,
        updateData: { password: hashedPassword }
      });
    });

    it('should handle commandHandler errors', async () => {
      const userId = 'user123';
      const hashedPassword = 'hashed_password_123';

      // Mock commandHandler to throw error
      mockDeps.commandHandler.dispatch.rejects(new Error('Update failed'));

      try {
        await authService.updatePassword(userId, hashedPassword);
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error.message).to.equal('Update failed');
      }
    });
  });
});
