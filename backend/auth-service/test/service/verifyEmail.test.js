import { expect } from 'chai';
import sinon from 'sinon';
import { AuthService } from '../../src/services/auth.service.js';



describe('AuthService.verifyEmail', () => {
  let authService;
  let mockDeps;

  beforeEach(() => {
    mockDeps = {
      jwtService: {
        generateEmailVerifyToken: sinon.stub().returns('email_verify_token_123'),
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
        sendPasswordResetEvent: sinon.stub(),
        sendUserVerifiedEvent: sinon.stub().resolves(),
        sendUserVerificationResendEvent: sinon.stub().resolves()
      },
      translation: (key) => {
        const translations = {
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
        hashPassword: sinon.stub().resolves('hashed_password_123')
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

    // EmailVerificationHelper ve UserHelper stub'ları
    authService.emailVerificationHelper = {
      generateVerificationCode: sinon.stub().returns('123456'),
      calculateExpirationTime: sinon.stub().returns(new Date(Date.now() + 900000)),
      saveVerificationCode: sinon.stub().resolves(),
      verifyCode: sinon.stub().resolves(true)
    };

    authService.userHelper = {
      validateUserData: sinon.stub().returns({ isValid: true, errors: [] }),
      sanitizeUser: sinon.stub().returns({ id: 'user123', email: 'test@example.com' }),
      logUserAction: sinon.stub(),
      prepareUserForLog: sinon.stub().returns({ id: 'user123', email: 'test@example.com' }),
      isEmailVerified: sinon.stub().returns(false)
    };
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should verify email successfully', async () => {
    const verifyEmailData = {
      code: '123456',
      token: 'valid_token_123',
      locale: 'tr'
    };

    const decodedToken = {
      email: 'test@example.com',
      code: '123456'
    };

    const fakeUser = {
      id: 'user123',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      isEmailVerified: false,
      emailVerifiedAt: null,
      roleName: 'User',
      role: { _id: 'role123', name: 'User' }
    };

    const updatedUser = {
      ...fakeUser,
      isEmailVerified: true,
      emailVerifiedAt: new Date()
    };

    // Mock JWT verification
    mockDeps.jwt.verify.returns(decodedToken);
    
    // Mock queryHandler - kullanıcı bulunur
    mockDeps.queryHandler.dispatch.resolves(fakeUser);
    
    // Mock commandHandler - kullanıcı güncellenir
    mockDeps.commandHandler.dispatch.resolves(updatedUser);

    const result = await authService.verifyEmail(verifyEmailData);

    expect(result.success).to.be.true;
    expect(result.message).to.equal('Email verification success');
    
    // Token doğrulandı mı kontrol et
    expect(mockDeps.jwt.verify.calledWith('valid_token_123', 'email_verify_secret')).to.be.true;
    
    // Kod doğrulandı mı kontrol et
    expect(authService.emailVerificationHelper.verifyCode.calledWith('test@example.com', '123456')).to.be.true;
    
    // Kullanıcı güncellendi mi kontrol et
    expect(mockDeps.commandHandler.dispatch.calledWith('UPDATE_USER', {
      id: 'user123',
      updateData: {
        isEmailVerified: true,
        emailVerifiedAt: sinon.match.date
      }
    })).to.be.true;
    
    // Başarı emaili gönderildi mi kontrol et
    expect(mockDeps.kafkaProducer.sendUserVerifiedEvent.calledOnce).to.be.true;
  });

  it('should throw error when code is missing', async () => {
    const verifyEmailData = {
      token: 'valid_token_123',
      locale: 'tr'
      // code eksik
    };

    try {
      await authService.verifyEmail(verifyEmailData);
      expect.fail('Should have thrown an error');
    } catch (err) {
      expect(err.message).to.include('Missing verification data');
    }
  });

  it('should throw error when token is missing', async () => {
    const verifyEmailData = {
      code: '123456',
      locale: 'tr'
      // token eksik
    };

    try {
      await authService.verifyEmail(verifyEmailData);
      expect.fail('Should have thrown an error');
    } catch (err) {
      expect(err.message).to.include('Missing verification data');
    }
  });

  it('should throw error when token verification fails', async () => {
    const verifyEmailData = {
      code: '123456',
      token: 'invalid_token_123',
      locale: 'tr'
    };

    // Mock JWT verification failure
    mockDeps.jwt.verify.throws(new Error('Invalid token'));

    try {
      await authService.verifyEmail(verifyEmailData);
      expect.fail('Should have thrown an error');
    } catch (err) {
      expect(err.message).to.include('Invalid verification token');
    }
  });

  it('should throw error when verification code is invalid', async () => {
    const verifyEmailData = {
      code: 'wrong_code',
      token: 'valid_token_123',
      locale: 'tr'
    };

    const decodedToken = {
      email: 'test@example.com',
      code: '123456'
    };

    // Mock JWT verification
    mockDeps.jwt.verify.returns(decodedToken);
    
    // Mock verification code failure
    authService.emailVerificationHelper.verifyCode.resolves(false);

    try {
      await authService.verifyEmail(verifyEmailData);
      expect.fail('Should have thrown an error');
    } catch (err) {
      expect(err.message).to.include('Invalid verification code');
    }
  });

  it('should return user when email is already verified', async () => {
    const verifyEmailData = {
      code: '123456',
      token: 'valid_token_123',
      locale: 'tr'
    };

    const decodedToken = {
      email: 'test@example.com',
      code: '123456'
    };

    const fakeUser = {
      id: 'user123',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
      roleName: 'User',
      role: { _id: 'role123', name: 'User' }
    };

    // Mock JWT verification
    mockDeps.jwt.verify.returns(decodedToken);
    
    // Mock queryHandler - kullanıcı bulunur
    mockDeps.queryHandler.dispatch.resolves(fakeUser);
    
    // Mock isEmailVerified to return true
    authService.userHelper.isEmailVerified.returns(true);

    const result = await authService.verifyEmail(verifyEmailData);

    expect(result.success).to.be.true;
    expect(result.message).to.equal('Email verification success');
    
    // UPDATE_USER command çağrılmamalı
    expect(mockDeps.commandHandler.dispatch.called).to.be.false;
  });

  it('should throw error when user not found', async () => {
    const verifyEmailData = {
      code: '123456',
      token: 'valid_token_123',
      locale: 'tr'
    };

    const decodedToken = {
      email: 'nonexistent@example.com',
      code: '123456'
    };

    // Mock JWT verification
    mockDeps.jwt.verify.returns(decodedToken);
    
    // Mock queryHandler - kullanıcı bulunamaz
    mockDeps.queryHandler.dispatch.resolves(null);

    try {
      await authService.verifyEmail(verifyEmailData);
      expect.fail('Should have thrown an error');
    } catch (err) {
      expect(err.message).to.include('User not found');
    }
  });

  it('should handle expired token and resend verification code', async () => {
    const verifyEmailData = {
      code: '123456',
      token: 'expired_token_123',
      locale: 'tr'
    };

    const decodedPayload = {
      email: 'test@example.com'
    };

    const fakeUser = {
      id: 'user123',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      roleName: 'User',
      role: { _id: 'role123', name: 'User' }
    };

    // Mock JWT verification failure (expired)
    mockDeps.jwt.verify.throws(new Error('jwt expired'));
    
    // Mock JWT decode
    authService.jwt.decode.returns(decodedPayload);
    
    // Mock queryHandler - kullanıcı bulunur
    mockDeps.queryHandler.dispatch.resolves(fakeUser);

    try {
      await authService.verifyEmail(verifyEmailData);
      expect.fail('Should have thrown an error');
    } catch (err) {
      expect(err.message).to.include('Verification code resent');
      
      // Yeni kod üretildi mi kontrol et
      expect(authService.emailVerificationHelper.generateVerificationCode.calledOnce).to.be.true;
      expect(authService.emailVerificationHelper.saveVerificationCode.calledOnce).to.be.true;
      expect(mockDeps.kafkaProducer.sendUserRegisteredEvent.calledOnce).to.be.true;
    }
  });

  after(() => {
    // Tüm stub'ları restore et
    sinon.restore();
  });
}); 