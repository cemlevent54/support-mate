import { expect } from 'chai';
import sinon from 'sinon';
import { AuthService } from '../../src/services/auth.service.js';
import { ValidationError, UnauthorizedError, NotFoundError } from '../../src/utils/customErrors.js';

describe('AuthService.resetPassword', () => {
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
          'services.authService.logs.resetPasswordSuccess': 'Password reset successful',
          'services.authService.logs.resetPasswordError': 'Reset password error',
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

  describe('resetPassword', () => {
    it('should reset password successfully with Turkish locale', async () => {
      const resetData = {
        token: 'valid_token_123',
        password: 'newPassword123',
        confirmPassword: 'newPassword123'
      };
      const locale = 'tr';

      const fakeUser = {
        id: 'user123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User'
      };

      // Mock Redis methods
      mockDeps.cacheService.client.get.resolves(null); // No daily limit reached
      mockDeps.cacheService.client.incr.resolves(1); // First reset
      mockDeps.cacheService.client.expire.resolves(1);
      mockDeps.cacheService.client.set.resolves('OK');

      // Mock commandHandler to return user
      mockDeps.commandHandler.dispatch.resolves(fakeUser);

      const result = await authService.resetPassword(resetData, locale);

      // Assertions
      expect(result).to.deep.equal({
        success: true,
        message: 'Şifreniz başarıyla sıfırlandı'
      });

      // Verify password was hashed
      expect(mockDeps.passwordHelper.hashPassword.calledOnce).to.be.true;
      expect(mockDeps.passwordHelper.hashPassword.firstCall.args[0]).to.equal('newPassword123');

      // Verify user was updated
      expect(mockDeps.commandHandler.dispatch.calledOnce).to.be.true;
      expect(mockDeps.commandHandler.dispatch.firstCall.args[0]).to.equal('UPDATE_USER');
      expect(mockDeps.commandHandler.dispatch.firstCall.args[1]).to.deep.equal({
        id: 'user123',
        updateData: { password: 'hashed_password_123' }
      });
    });

    it('should reset password successfully with English locale', async () => {
      const resetData = {
        token: 'valid_token_123',
        password: 'newPassword123',
        confirmPassword: 'newPassword123'
      };
      const locale = 'en';

      const fakeUser = {
        id: 'user123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User'
      };

      // Mock commandHandler to return user
      mockDeps.commandHandler.dispatch.resolves(fakeUser);

      const result = await authService.resetPassword(resetData, locale);

      // Assertions
      expect(result).to.deep.equal({
        success: true,
        message: 'Password has been reset successfully'
      });
    });

    it('should throw ValidationError when password fields are missing (Turkish)', async () => {
      const resetData = {
        token: 'valid_token_123',
        password: '',
        confirmPassword: ''
      };
      const locale = 'tr';

      try {
        await authService.resetPassword(resetData, locale);
        expect.fail('Should have thrown ValidationError');
      } catch (error) {
        expect(error).to.be.instanceOf(ValidationError);
        expect(error.message).to.equal('Şifre alanları gereklidir');
      }
    });

    it('should throw ValidationError when password fields are missing (English)', async () => {
      const resetData = {
        token: 'valid_token_123',
        password: '',
        confirmPassword: ''
      };
      const locale = 'en';

      try {
        await authService.resetPassword(resetData, locale);
        expect.fail('Should have thrown ValidationError');
      } catch (error) {
        expect(error).to.be.instanceOf(ValidationError);
        expect(error.message).to.equal('Password fields are required');
      }
    });

    it('should throw ValidationError when passwords do not match (Turkish)', async () => {
      const resetData = {
        token: 'valid_token_123',
        password: 'newPassword123',
        confirmPassword: 'differentPassword'
      };
      const locale = 'tr';

      try {
        await authService.resetPassword(resetData, locale);
        expect.fail('Should have thrown ValidationError');
      } catch (error) {
        expect(error).to.be.instanceOf(ValidationError);
        expect(error.message).to.equal('Şifreler eşleşmiyor');
      }
    });

    it('should throw ValidationError when passwords do not match (English)', async () => {
      const resetData = {
        token: 'valid_token_123',
        password: 'newPassword123',
        confirmPassword: 'differentPassword'
      };
      const locale = 'en';

      try {
        await authService.resetPassword(resetData, locale);
        expect.fail('Should have thrown ValidationError');
      } catch (error) {
        expect(error).to.be.instanceOf(ValidationError);
        expect(error.message).to.equal('Passwords do not match');
      }
    });

    it('should throw ValidationError when password is too short (Turkish)', async () => {
      const resetData = {
        token: 'valid_token_123',
        password: '123',
        confirmPassword: '123'
      };
      const locale = 'tr';

      try {
        await authService.resetPassword(resetData, locale);
        expect.fail('Should have thrown ValidationError');
      } catch (error) {
        expect(error).to.be.instanceOf(ValidationError);
        expect(error.message).to.equal('Şifre en az 8 karakter olmalıdır');
      }
    });

    it('should throw ValidationError when password is too short (English)', async () => {
      const resetData = {
        token: 'valid_token_123',
        password: '123',
        confirmPassword: '123'
      };
      const locale = 'en';

      try {
        await authService.resetPassword(resetData, locale);
        expect.fail('Should have thrown ValidationError');
      } catch (error) {
        expect(error).to.be.instanceOf(ValidationError);
        expect(error.message).to.equal('Password must be at least 8 characters');
      }
    });

    it('should throw UnauthorizedError when token is invalid (Turkish)', async () => {
      const resetData = {
        token: 'invalid_token',
        password: 'newPassword123',
        confirmPassword: 'newPassword123'
      };
      const locale = 'tr';

      // Mock jwtService to throw error
      mockDeps.jwtService.verifyPasswordResetToken.throws(new Error('Invalid token'));

      try {
        await authService.resetPassword(resetData, locale);
        expect.fail('Should have thrown UnauthorizedError');
      } catch (error) {
        expect(error).to.be.instanceOf(UnauthorizedError);
        expect(error.message).to.equal('Geçersiz veya süresi dolmuş sıfırlama token\'ı');
      }
    });

    it('should throw UnauthorizedError when token is invalid (English)', async () => {
      const resetData = {
        token: 'invalid_token',
        password: 'newPassword123',
        confirmPassword: 'newPassword123'
      };
      const locale = 'en';

      // Mock jwtService to throw error
      mockDeps.jwtService.verifyPasswordResetToken.throws(new Error('Invalid token'));

      try {
        await authService.resetPassword(resetData, locale);
        expect.fail('Should have thrown UnauthorizedError');
      } catch (error) {
        expect(error).to.be.instanceOf(UnauthorizedError);
        expect(error.message).to.equal('Invalid or expired reset token');
      }
    });

    it('should throw UnauthorizedError when decoded token has no id (Turkish)', async () => {
      const resetData = {
        token: 'valid_token_123',
        password: 'newPassword123',
        confirmPassword: 'newPassword123'
      };
      const locale = 'tr';

      // Mock jwtService to return token without id
      mockDeps.jwtService.verifyPasswordResetToken.returns({ email: 'test@example.com' });

      try {
        await authService.resetPassword(resetData, locale);
        expect.fail('Should have thrown UnauthorizedError');
      } catch (error) {
        expect(error).to.be.instanceOf(UnauthorizedError);
        expect(error.message).to.equal('Geçersiz sıfırlama token\'ı');
      }
    });

    it('should throw UnauthorizedError when decoded token has no id (English)', async () => {
      const resetData = {
        token: 'valid_token_123',
        password: 'newPassword123',
        confirmPassword: 'newPassword123'
      };
      const locale = 'en';

      // Mock jwtService to return token without id
      mockDeps.jwtService.verifyPasswordResetToken.returns({ email: 'test@example.com' });

      try {
        await authService.resetPassword(resetData, locale);
        expect.fail('Should have thrown UnauthorizedError');
      } catch (error) {
        expect(error).to.be.instanceOf(UnauthorizedError);
        expect(error.message).to.equal('Invalid reset token');
      }
    });

    it('should throw NotFoundError when user update fails (Turkish)', async () => {
      const resetData = {
        token: 'valid_token_123',
        password: 'newPassword123',
        confirmPassword: 'newPassword123'
      };
      const locale = 'tr';

      // Mock commandHandler to return null (user not found)
      mockDeps.commandHandler.dispatch.resolves(null);

      try {
        await authService.resetPassword(resetData, locale);
        expect.fail('Should have thrown NotFoundError');
      } catch (error) {
        expect(error).to.be.instanceOf(NotFoundError);
        expect(error.message).to.equal('User not found');
      }
    });

    it('should use default locale when locale is not provided', async () => {
      const resetData = {
        token: 'valid_token_123',
        password: 'newPassword123',
        confirmPassword: 'newPassword123'
      };

      const fakeUser = {
        id: 'user123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User'
      };

      // Mock commandHandler to return user
      mockDeps.commandHandler.dispatch.resolves(fakeUser);

      const result = await authService.resetPassword(resetData);

      // Assertions - should use default Turkish locale
      expect(result).to.deep.equal({
        success: true,
        message: 'Şifreniz başarıyla sıfırlandı'
      });
    });

    it('should handle password hashing errors gracefully', async () => {
      const resetData = {
        token: 'valid_token_123',
        password: 'newPassword123',
        confirmPassword: 'newPassword123'
      };
      const locale = 'tr';

      // Mock passwordHelper to throw error
      mockDeps.passwordHelper.hashPassword.rejects(new Error('Hashing error'));

      try {
        await authService.resetPassword(resetData, locale);
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error.message).to.equal('Hashing error');
      }
    });

    it('should handle user update errors gracefully', async () => {
      const resetData = {
        token: 'valid_token_123',
        password: 'newPassword123',
        confirmPassword: 'newPassword123'
      };
      const locale = 'tr';

      // Mock Redis methods
      mockDeps.cacheService.client.get.resolves(null);
      mockDeps.cacheService.client.incr.resolves(1);
      mockDeps.cacheService.client.expire.resolves(1);
      mockDeps.cacheService.client.set.resolves('OK');

      // Mock commandHandler to throw error
      mockDeps.commandHandler.dispatch.rejects(new Error('Database error'));

      try {
        await authService.resetPassword(resetData, locale);
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error.message).to.equal('Database error');
      }
    });

    it('should throw UnauthorizedError when daily password reset limit is exceeded (Turkish)', async () => {
      const resetData = {
        token: 'valid_token_123',
        password: 'newPassword123',
        confirmPassword: 'newPassword123'
      };
      const locale = 'tr';

      // Mock Redis to return limit exceeded
      mockDeps.cacheService.client.get.resolves('2'); // Already 2 resets today

      try {
        await authService.resetPassword(resetData, locale);
        expect.fail('Should have thrown UnauthorizedError');
      } catch (error) {
        expect(error).to.be.instanceOf(UnauthorizedError);
        expect(error.message).to.equal('Günlük şifre sıfırlama limiti aşıldı. Günde sadece 2 kez şifrenizi sıfırlayabilirsiniz.');
      }
    });

    it('should throw UnauthorizedError when daily password reset limit is exceeded (English)', async () => {
      const resetData = {
        token: 'valid_token_123',
        password: 'newPassword123',
        confirmPassword: 'newPassword123'
      };
      const locale = 'en';

      // Mock Redis to return limit exceeded
      mockDeps.cacheService.client.get.resolves('2'); // Already 2 resets today

      try {
        await authService.resetPassword(resetData, locale);
        expect.fail('Should have thrown UnauthorizedError');
      } catch (error) {
        expect(error).to.be.instanceOf(UnauthorizedError);
        expect(error.message).to.equal('Daily password reset limit exceeded. You can only reset your password 2 times per day.');
      }
    });

    it('should throw UnauthorizedError when token is already used (Turkish)', async () => {
      const resetData = {
        token: 'used_token_123',
        password: 'newPassword123',
        confirmPassword: 'newPassword123'
      };
      const locale = 'tr';

      // Mock Redis to return token as used
      mockDeps.cacheService.client.get
        .onFirstCall().resolves(null) // Daily limit check
        .onSecondCall().resolves('1'); // Token usage check - already used

      try {
        await authService.resetPassword(resetData, locale);
        expect.fail('Should have thrown UnauthorizedError');
      } catch (error) {
        expect(error).to.be.instanceOf(UnauthorizedError);
        expect(error.message).to.equal('Bu sıfırlama token\'ı zaten kullanılmış. Lütfen yeni bir şifre sıfırlama talebinde bulunun.');
      }
    });

    it('should throw UnauthorizedError when token is already used (English)', async () => {
      const resetData = {
        token: 'used_token_123',
        password: 'newPassword123',
        confirmPassword: 'newPassword123'
      };
      const locale = 'en';

      // Mock Redis to return token as used
      mockDeps.cacheService.client.get
        .onFirstCall().resolves(null) // Daily limit check
        .onSecondCall().resolves('1'); // Token usage check - already used

      try {
        await authService.resetPassword(resetData, locale);
        expect.fail('Should have thrown UnauthorizedError');
      } catch (error) {
        expect(error).to.be.instanceOf(UnauthorizedError);
        expect(error.message).to.equal('This reset token has already been used. Please request a new password reset.');
      }
    });
  });

  describe('validateResetData', () => {
    it('should not throw error for valid data', () => {
      const password = 'newPassword123';
      const confirmPassword = 'newPassword123';
      const locale = 'tr';
      
      // Should not throw
      expect(() => authService.validateResetData(password, confirmPassword, locale)).to.not.throw();
    });

    it('should throw ValidationError for missing password fields (Turkish)', () => {
      const password = '';
      const confirmPassword = '';
      const locale = 'tr';
      
      expect(() => authService.validateResetData(password, confirmPassword, locale))
        .to.throw(ValidationError, 'Şifre alanları gereklidir');
    });

    it('should throw ValidationError for missing password fields (English)', () => {
      const password = '';
      const confirmPassword = '';
      const locale = 'en';
      
      expect(() => authService.validateResetData(password, confirmPassword, locale))
        .to.throw(ValidationError, 'Password fields are required');
    });

    it('should throw ValidationError for mismatched passwords (Turkish)', () => {
      const password = 'newPassword123';
      const confirmPassword = 'differentPassword';
      const locale = 'tr';
      
      expect(() => authService.validateResetData(password, confirmPassword, locale))
        .to.throw(ValidationError, 'Şifreler eşleşmiyor');
    });

    it('should throw ValidationError for mismatched passwords (English)', () => {
      const password = 'newPassword123';
      const confirmPassword = 'differentPassword';
      const locale = 'en';
      
      expect(() => authService.validateResetData(password, confirmPassword, locale))
        .to.throw(ValidationError, 'Passwords do not match');
    });

    it('should throw ValidationError for short password (Turkish)', () => {
      const password = '123';
      const confirmPassword = '123';
      const locale = 'tr';
      
      expect(() => authService.validateResetData(password, confirmPassword, locale))
        .to.throw(ValidationError, 'Şifre en az 8 karakter olmalıdır');
    });

    it('should throw ValidationError for short password (English)', () => {
      const password = '123';
      const confirmPassword = '123';
      const locale = 'en';
      
      expect(() => authService.validateResetData(password, confirmPassword, locale))
        .to.throw(ValidationError, 'Password must be at least 8 characters');
    });
  });

  describe('verifyResetToken', () => {
    it('should return decoded token for valid token', () => {
      const token = 'valid_token_123';
      const locale = 'tr';
      const expectedDecoded = { id: 'user123', email: 'test@example.com' };
      
      mockDeps.jwtService.verifyPasswordResetToken.returns(expectedDecoded);
      
      const result = authService.verifyResetToken(token, locale);
      
      expect(result).to.deep.equal(expectedDecoded);
      expect(mockDeps.jwtService.verifyPasswordResetToken.calledOnce).to.be.true;
      expect(mockDeps.jwtService.verifyPasswordResetToken.firstCall.args[0]).to.equal(token);
    });

    it('should throw UnauthorizedError for invalid token (Turkish)', () => {
      const token = 'invalid_token';
      const locale = 'tr';
      
      mockDeps.jwtService.verifyPasswordResetToken.throws(new Error('Invalid token'));
      
      expect(() => authService.verifyResetToken(token, locale))
        .to.throw(UnauthorizedError, 'Geçersiz veya süresi dolmuş sıfırlama token\'ı');
    });

    it('should throw UnauthorizedError for invalid token (English)', () => {
      const token = 'invalid_token';
      const locale = 'en';
      
      mockDeps.jwtService.verifyPasswordResetToken.throws(new Error('Invalid token'));
      
      expect(() => authService.verifyResetToken(token, locale))
        .to.throw(UnauthorizedError, 'Invalid or expired reset token');
    });
  });
}); 