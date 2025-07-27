import { expect } from 'chai';
import sinon from 'sinon';
import { AuthService } from '../../src/services/auth.service.js';
import { ValidationError, UnauthorizedError } from '../../src/utils/customErrors.js';

describe('AuthService.forgotPassword', () => {
  let authService;
  let mockDeps;

  beforeEach(() => {
    mockDeps = {
      jwtService: {
        generatePasswordResetToken: sinon.stub().returns('password_reset_token_123'),
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
          'services.authService.logs.forgotPasswordSuccess': 'Password reset email sent successfully',
          'services.authService.logs.forgotPasswordError': 'Forgot password error',
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

    // Environment variable'ı set et
    process.env.WEBSITE_URL = 'http://localhost:3000';
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('forgotPassword', () => {
    it('should send password reset email successfully when user exists', async () => {
      const email = 'test@example.com';
      const locale = 'tr';
      
      const fakeUser = {
        id: 'user123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        roleName: 'User',
        isEmailVerified: true,
        emailVerifiedAt: new Date()
      };

      // Mock Redis methods
      mockDeps.cacheService.client.get.resolves(null); // No daily limit reached

      // Mock queryHandler to return user
      mockDeps.queryHandler.dispatch.resolves(fakeUser);

      const result = await authService.forgotPassword(email, locale);

      // Assertions
      expect(result).to.deep.equal({
        success: true,
        message: 'Şifre sıfırlama e-postası başarıyla gönderildi'
      });

      // Verify queryHandler was called
      expect(mockDeps.queryHandler.dispatch.calledOnce).to.be.true;
      expect(mockDeps.queryHandler.dispatch.firstCall.args[0]).to.equal('FIND_ANY_USER_BY_EMAIL');
      expect(mockDeps.queryHandler.dispatch.firstCall.args[1]).to.deep.equal({ email });

      // Verify password reset token was generated
      expect(mockDeps.jwtService.generatePasswordResetToken.calledOnce).to.be.true;
      expect(mockDeps.jwtService.generatePasswordResetToken.firstCall.args[0]).to.deep.equal(fakeUser);

      // Verify kafka event was sent
      expect(mockDeps.kafkaProducer.sendPasswordResetEvent.calledOnce).to.be.true;
      const kafkaCall = mockDeps.kafkaProducer.sendPasswordResetEvent.firstCall;
      expect(kafkaCall.args[0]).to.deep.equal({
        email,
        resetLink: `http://localhost:3000/reset-password?token=password_reset_token_123&email=${encodeURIComponent(email)}`,
        locale
      });
    });

    it('should return success message even when user does not exist (security measure)', async () => {
      const email = 'nonexistent@example.com';
      const locale = 'en';

      // Mock queryHandler to return null (user not found)
      mockDeps.queryHandler.dispatch.resolves(null);

      const result = await authService.forgotPassword(email, locale);

      // Assertions
      expect(result).to.deep.equal({
        success: true,
        message: 'Password reset email sent successfully'
      });

      // Verify queryHandler was called
      expect(mockDeps.queryHandler.dispatch.calledOnce).to.be.true;

      // Verify kafka event was NOT sent (security measure)
      expect(mockDeps.kafkaProducer.sendPasswordResetEvent.called).to.be.false;

      // Verify password reset token was NOT generated
      expect(mockDeps.jwtService.generatePasswordResetToken.called).to.be.false;
    });

    it('should throw ValidationError when email is empty', async () => {
      const email = '';
      const locale = 'tr';

      try {
        await authService.forgotPassword(email, locale);
        expect.fail('Should have thrown ValidationError');
      } catch (error) {
        expect(error).to.be.instanceOf(ValidationError);
        expect(error.message).to.equal('Email is required');
      }

      // Verify queryHandler was NOT called
      expect(mockDeps.queryHandler.dispatch.called).to.be.false;
    });

    it('should throw ValidationError when email is null', async () => {
      const email = null;
      const locale = 'en';

      try {
        await authService.forgotPassword(email, locale);
        expect.fail('Should have thrown ValidationError');
      } catch (error) {
        expect(error).to.be.instanceOf(ValidationError);
        expect(error.message).to.equal('Email is required');
      }

      // Verify queryHandler was NOT called
      expect(mockDeps.queryHandler.dispatch.called).to.be.false;
    });

    it('should throw ValidationError when email is undefined', async () => {
      const email = undefined;
      const locale = 'tr';

      try {
        await authService.forgotPassword(email, locale);
        expect.fail('Should have thrown ValidationError');
      } catch (error) {
        expect(error).to.be.instanceOf(ValidationError);
        expect(error.message).to.equal('Email is required');
      }

      // Verify queryHandler was NOT called
      expect(mockDeps.queryHandler.dispatch.called).to.be.false;
    });

    it('should use default locale when locale is not provided', async () => {
      const email = 'test@example.com';
      
      const fakeUser = {
        id: 'user123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        roleName: 'User',
        isEmailVerified: true,
        emailVerifiedAt: new Date()
      };

      // Mock queryHandler to return user
      mockDeps.queryHandler.dispatch.resolves(fakeUser);

      const result = await authService.forgotPassword(email);

      // Assertions
      expect(result).to.deep.equal({
        success: true,
        message: 'Şifre sıfırlama e-postası başarıyla gönderildi'
      });

      // Verify kafka event was sent with default locale
      expect(mockDeps.kafkaProducer.sendPasswordResetEvent.calledOnce).to.be.true;
      const kafkaCall = mockDeps.kafkaProducer.sendPasswordResetEvent.firstCall;
      expect(kafkaCall.args[0].locale).to.equal('tr'); // Default locale
    });

    it('should return English message when locale is en', async () => {
      const email = 'test@example.com';
      const locale = 'en';
      
      const fakeUser = {
        id: 'user123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        roleName: 'User',
        isEmailVerified: true,
        emailVerifiedAt: new Date()
      };

      // Mock queryHandler to return user
      mockDeps.queryHandler.dispatch.resolves(fakeUser);

      const result = await authService.forgotPassword(email, locale);

      // Assertions
      expect(result).to.deep.equal({
        success: true,
        message: 'Password reset email sent successfully'
      });

      // Verify kafka event was sent with English locale
      expect(mockDeps.kafkaProducer.sendPasswordResetEvent.calledOnce).to.be.true;
      const kafkaCall = mockDeps.kafkaProducer.sendPasswordResetEvent.firstCall;
      expect(kafkaCall.args[0].locale).to.equal('en');
    });

    it('should return English message for non-existent user when locale is en', async () => {
      const email = 'nonexistent@example.com';
      const locale = 'en';

      // Mock queryHandler to return null (user not found)
      mockDeps.queryHandler.dispatch.resolves(null);

      const result = await authService.forgotPassword(email, locale);

      // Assertions
      expect(result).to.deep.equal({
        success: true,
        message: 'Password reset email sent successfully'
      });

      // Verify queryHandler was called
      expect(mockDeps.queryHandler.dispatch.calledOnce).to.be.true;

      // Verify kafka event was NOT sent (security measure)
      expect(mockDeps.kafkaProducer.sendPasswordResetEvent.called).to.be.false;
    });

    it('should handle queryHandler errors gracefully', async () => {
      const email = 'test@example.com';
      const locale = 'en';

      // Mock queryHandler to throw error
      mockDeps.queryHandler.dispatch.rejects(new Error('Database error'));

      try {
        await authService.forgotPassword(email, locale);
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error.message).to.equal('Database error');
      }

      // Verify kafka event was NOT sent
      expect(mockDeps.kafkaProducer.sendPasswordResetEvent.called).to.be.false;
    });

    it('should handle kafka producer errors gracefully', async () => {
      const email = 'test@example.com';
      const locale = 'tr';
      
      const fakeUser = {
        id: 'user123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        roleName: 'User',
        isEmailVerified: true,
        emailVerifiedAt: new Date()
      };

      // Mock Redis methods
      mockDeps.cacheService.client.get.resolves(null); // No daily limit reached

      // Mock queryHandler to return user
      mockDeps.queryHandler.dispatch.resolves(fakeUser);

      // Mock kafka producer to throw error
      mockDeps.kafkaProducer.sendPasswordResetEvent.rejects(new Error('Kafka error'));

      try {
        await authService.forgotPassword(email, locale);
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error.message).to.equal('Kafka error');
      }
    });

    it('should throw UnauthorizedError when daily password reset limit is exceeded in forgotPassword (Turkish)', async () => {
      const email = 'test@example.com';
      const locale = 'tr';
      
      const fakeUser = {
        id: 'user123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        roleName: 'User',
        isEmailVerified: true,
        emailVerifiedAt: new Date()
      };

      // Mock Redis to return limit exceeded
      mockDeps.cacheService.client.get.resolves('2'); // Already 2 resets today

      // Mock queryHandler to return user
      mockDeps.queryHandler.dispatch.resolves(fakeUser);

      try {
        await authService.forgotPassword(email, locale);
        expect.fail('Should have thrown UnauthorizedError');
      } catch (error) {
        expect(error).to.be.instanceOf(UnauthorizedError);
        expect(error.message).to.equal('Günlük şifre sıfırlama limiti aşıldı. Günde sadece 2 kez şifrenizi sıfırlayabilirsiniz.');
      }
    });

    it('should throw UnauthorizedError when daily password reset limit is exceeded in forgotPassword (English)', async () => {
      const email = 'test@example.com';
      const locale = 'en';
      
      const fakeUser = {
        id: 'user123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        roleName: 'User',
        isEmailVerified: true,
        emailVerifiedAt: new Date()
      };

      // Mock Redis to return limit exceeded
      mockDeps.cacheService.client.get.resolves('2'); // Already 2 resets today

      // Mock queryHandler to return user
      mockDeps.queryHandler.dispatch.resolves(fakeUser);

      try {
        await authService.forgotPassword(email, locale);
        expect.fail('Should have thrown UnauthorizedError');
      } catch (error) {
        expect(error).to.be.instanceOf(UnauthorizedError);
        expect(error.message).to.equal('Daily password reset limit exceeded. You can only reset your password 2 times per day.');
      }
    });

    it('should generate correct reset link with token and email', async () => {
      const email = 'test@example.com';
      const locale = 'en';
      
      const fakeUser = {
        id: 'user123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        roleName: 'User',
        isEmailVerified: true,
        emailVerifiedAt: new Date()
      };

      // Mock queryHandler to return user
      mockDeps.queryHandler.dispatch.resolves(fakeUser);

      await authService.forgotPassword(email, locale);

      // Verify reset link was generated correctly
      expect(mockDeps.kafkaProducer.sendPasswordResetEvent.calledOnce).to.be.true;
      const kafkaCall = mockDeps.kafkaProducer.sendPasswordResetEvent.firstCall;
      const resetLink = kafkaCall.args[0].resetLink;
      
      expect(resetLink).to.include('http://localhost:3000/reset-password');
      expect(resetLink).to.include('token=password_reset_token_123');
      expect(resetLink).to.include(`email=${encodeURIComponent(email)}`);
    });

    it('should handle special characters in email correctly', async () => {
      const email = 'test+special@example.com';
      const locale = 'tr';
      
      const fakeUser = {
        id: 'user123',
        email: 'test+special@example.com',
        firstName: 'Test',
        lastName: 'User',
        roleName: 'User',
        isEmailVerified: true,
        emailVerifiedAt: new Date()
      };

      // Mock queryHandler to return user
      mockDeps.queryHandler.dispatch.resolves(fakeUser);

      await authService.forgotPassword(email, locale);

      // Verify reset link was generated correctly with encoded email
      expect(mockDeps.kafkaProducer.sendPasswordResetEvent.calledOnce).to.be.true;
      const kafkaCall = mockDeps.kafkaProducer.sendPasswordResetEvent.firstCall;
      const resetLink = kafkaCall.args[0].resetLink;
      
      expect(resetLink).to.include(`email=${encodeURIComponent(email)}`);
      expect(resetLink).to.include('email=test%2Bspecial%40example.com');
    });
  });

  describe('validateEmail', () => {
    it('should not throw error for valid email', () => {
      const email = 'test@example.com';
      
      // Should not throw
      expect(() => authService.validateEmail(email)).to.not.throw();
    });

    it('should throw ValidationError for empty email', () => {
      const email = '';
      
      expect(() => authService.validateEmail(email)).to.throw(ValidationError, 'Email is required');
    });

    it('should throw ValidationError for null email', () => {
      const email = null;
      
      expect(() => authService.validateEmail(email)).to.throw(ValidationError, 'Email is required');
    });

    it('should throw ValidationError for undefined email', () => {
      const email = undefined;
      
      expect(() => authService.validateEmail(email)).to.throw(ValidationError, 'Email is required');
    });
  });

  describe('buildResetLink', () => {
    it('should build correct reset link', () => {
      const email = 'test@example.com';
      const token = 'test_token_123';
      
      const resetLink = authService.buildResetLink(email, token);
      
      expect(resetLink).to.equal(`http://localhost:3000/reset-password?token=${token}&email=${encodeURIComponent(email)}`);
    });

    it('should handle special characters in email', () => {
      const email = 'test+special@example.com';
      const token = 'test_token_123';
      
      const resetLink = authService.buildResetLink(email, token);
      
      expect(resetLink).to.equal(`http://localhost:3000/reset-password?token=${token}&email=test%2Bspecial%40example.com`);
    });

    it('should use environment variable for website URL', () => {
      // Change environment variable
      process.env.WEBSITE_URL = 'https://example.com';
      
      const email = 'test@example.com';
      const token = 'test_token_123';
      
      const resetLink = authService.buildResetLink(email, token);
      
      expect(resetLink).to.equal(`https://example.com/reset-password?token=${token}&email=${encodeURIComponent(email)}`);
      
      // Reset environment variable
      process.env.WEBSITE_URL = 'http://localhost:3000';
    });
  });
});
