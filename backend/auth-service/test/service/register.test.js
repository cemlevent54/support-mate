import { expect } from 'chai';
import sinon from 'sinon';
import { AuthService } from '../../src/services/auth.service.js';


describe('AuthService.register', () => {
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
        sendUserVerificationResendEvent: sinon.stub()
      },
      translation: (key) => {
        const translations = {
          'services.authService.logs.registerRequest': 'Register request',
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

    // Mock userHelper methods
    authService.userHelper = {
      validateUserData: sinon.stub().returns({ isValid: true, errors: [] }),
      sanitizeUser: sinon.stub().callsFake((user) => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        roleName: user.roleName,
        isEmailVerified: user.isEmailVerified,
        emailVerifiedAt: user.emailVerifiedAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      })),
      prepareUserForLog: sinon.stub().callsFake((user) => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roleName: user.roleName,
        isEmailVerified: user.isEmailVerified
      })),
      logUserAction: sinon.stub()
    };

    // Mock EmailVerificationHelper
    authService.emailVerificationHelper = {
      generateVerificationCode: sinon.stub().returns('123456'),
      calculateExpirationTime: sinon.stub().returns(new Date(Date.now() + 900000)),
      saveVerificationCode: sinon.stub().resolves(),
      verifyCode: sinon.stub().resolves(true)
    };
  });

  after(() => {
    // Tüm stub'ları restore et
    sinon.restore();
  });

  it('should register new user successfully', async () => {
    const registerData = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
      locale: 'tr'
    };

    const fakeUser = {
      id: 'user123',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      roleName: 'User',
      role: { _id: 'role123', name: 'User' }
    };

    // Mock queryHandler - kullanıcı bulunamaz
    mockDeps.queryHandler.dispatch.resolves(null);
    
    // Mock commandHandler - yeni kullanıcı oluşturulur
    mockDeps.commandHandler.dispatch.resolves(fakeUser);

    const result = await authService.register(registerData);

    expect(result).to.have.property('id', 'user123');
    expect(result).to.have.property('email', 'test@example.com');
    
    // Validation çağrıldı mı kontrol et
    expect(authService.userHelper.validateUserData.calledOnce).to.be.true;
    expect(authService.userHelper.validateUserData.calledWith(registerData, false)).to.be.true;
    
    // Email verification kodu üretildi mi kontrol et
    expect(authService.emailVerificationHelper.generateVerificationCode.calledOnce).to.be.true;
    expect(authService.emailVerificationHelper.saveVerificationCode.calledOnce).to.be.true;
    
    // Email gönderildi mi kontrol et
    expect(mockDeps.kafkaProducer.sendUserRegisteredEvent.calledOnce).to.be.true;
    
    // Kullanıcı sanitize edildi mi kontrol et
    expect(authService.userHelper.sanitizeUser.calledOnce).to.be.true;
  });

  it('should reactivate soft deleted user', async () => {
    const registerData = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Reactivate',
      lastName: 'User',
      locale: 'tr'
    };

    const existingUser = {
      id: 'user123',
      email: 'test@example.com',
      isDeleted: true // Soft deleted kullanıcı
    };

    const reactivatedUser = {
      id: 'user123',
      email: 'test@example.com',
      firstName: 'Reactivate',
      lastName: 'User',
      roleName: 'User',
      role: { _id: 'role123', name: 'User' }
    };

    // Mock queryHandler - soft deleted kullanıcı bulunur
    mockDeps.queryHandler.dispatch.resolves(existingUser);
    
    // Mock commandHandler - kullanıcı yeniden aktifleştirilir
    mockDeps.commandHandler.dispatch.resolves(reactivatedUser);

    const result = await authService.register(registerData);

    expect(result).to.have.property('id', 'user123');
    expect(result).to.have.property('email', 'test@example.com');
    
    // UPDATE_USER command çağrıldı mı kontrol et
    expect(mockDeps.commandHandler.dispatch.calledWith('UPDATE_USER', {
      id: 'user123',
      updateData: {
        firstName: 'Reactivate',
        lastName: 'User',
        password: 'password123',
        role: 'role123',
        roleName: 'User',
        isDeleted: false,
        deletedAt: null,
        languagePreference: 'tr'
      }
    })).to.be.true;
  });

  it('should throw error when email already in use', async () => {
    const registerData = {
      email: 'existing@example.com',
      password: 'password123',
      firstName: 'Existing',
      lastName: 'User',
      locale: 'tr'
    };

    const existingUser = {
      id: 'user123',
      email: 'existing@example.com',
      isDeleted: false // Aktif kullanıcı
    };

    // Mock queryHandler - aktif kullanıcı bulunur
    mockDeps.queryHandler.dispatch.resolves(existingUser);

    try {
      await authService.register(registerData);
      expect.fail('Should have thrown an error');
    } catch (err) {
      const errorResponse = JSON.parse(err.message);
      expect(errorResponse.success).to.be.false;
      expect(errorResponse.message).to.equal('Email already in use');
      expect(errorResponse.data).to.be.null;
    }
  });

  it('should throw error when validation fails', async () => {
    const registerData = {
      email: 'invalid@example.com',
      password: '123', // Çok kısa şifre
      firstName: '',
      lastName: '',
      locale: 'tr'
    };

    // Mock validation failure
    authService.userHelper.validateUserData.returns({
      isValid: false,
      errors: ['Password too short', 'First name required', 'Last name required']
    });

    try {
      await authService.register(registerData);
      expect.fail('Should have thrown an error');
    } catch (err) {
      expect(err.message).to.include('Validation error');
    }
  });

  it('should throw error when locale is missing', async () => {
    const registerData = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User'
      // locale eksik
    };

    // Mock queryHandler - kullanıcı bulunamaz
    mockDeps.queryHandler.dispatch.resolves(null);

    try {
      await authService.register(registerData);
      expect.fail('Should have thrown an error');
    } catch (err) {
      // Hata mesajı "Cannot read properties of undefined" olabilir çünkü translation service undefined
      expect(err.message).to.include('Cannot read properties of undefined');
    }
  });

  it('should use provided role when available', async () => {
    const registerData = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
      role: 'custom_role_id',
      roleName: 'Custom Role',
      locale: 'tr'
    };

    const fakeUser = {
      id: 'user123',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      roleName: 'Custom Role',
      role: { _id: 'custom_role_id', name: 'Custom Role' }
    };

    // Mock queryHandler - kullanıcı bulunamaz
    mockDeps.queryHandler.dispatch.resolves(null);
    
    // Mock commandHandler - yeni kullanıcı oluşturulur
    mockDeps.commandHandler.dispatch.resolves(fakeUser);

    const result = await authService.register(registerData);

    expect(result).to.have.property('id', 'user123');
    
    // CREATE_USER command'da doğru rol kullanıldı mı kontrol et
    expect(mockDeps.commandHandler.dispatch.calledWith('CREATE_USER', {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
      role: 'custom_role_id',
      roleName: 'Custom Role',
      languagePreference: 'tr'
    })).to.be.true;
  });

  it('should use default User role when role not provided', async () => {
    const registerData = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
      locale: 'tr'
      // role ve roleName eksik
    };

    const fakeUser = {
      id: 'user123',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      roleName: 'User',
      role: { _id: 'role123', name: 'User' }
    };

    // Mock queryHandler - kullanıcı bulunamaz
    mockDeps.queryHandler.dispatch.resolves(null);
    
    // Mock commandHandler - yeni kullanıcı oluşturulur
    mockDeps.commandHandler.dispatch.resolves(fakeUser);

    const result = await authService.register(registerData);

    expect(result).to.have.property('id', 'user123');
    
    // CREATE_USER command'da default rol kullanıldı mı kontrol et
    expect(mockDeps.commandHandler.dispatch.calledWith('CREATE_USER', {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
      role: 'role123',
      roleName: 'User',
      languagePreference: 'tr'
    })).to.be.true;
    
    // getRoleByName çağrıldı mı kontrol et
    expect(mockDeps.roleService.getRoleByName.calledWith('User')).to.be.true;
  });



  it('should send verification email with correct parameters', async () => {
    const registerData = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
      locale: 'en' // İngilizce locale
    };

    const fakeUser = {
      id: 'user123',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      roleName: 'User',
      role: { _id: 'role123', name: 'User' }
    };

    // Mock queryHandler - kullanıcı bulunamaz
    mockDeps.queryHandler.dispatch.resolves(null);
    
    // Mock commandHandler - yeni kullanıcı oluşturulur
    mockDeps.commandHandler.dispatch.resolves(fakeUser);

    await authService.register(registerData);

    // sendUserRegisteredEvent doğru parametrelerle çağrıldı mı kontrol et
    expect(mockDeps.kafkaProducer.sendUserRegisteredEvent.calledOnce).to.be.true;
    const callArgs = mockDeps.kafkaProducer.sendUserRegisteredEvent.firstCall.args;
    expect(callArgs[0]).to.deep.equal(fakeUser); // user
    expect(callArgs[1]).to.equal('en'); // locale
    expect(callArgs[2]).to.equal('123456'); // code
    expect(callArgs[3]).to.include('verify-email'); // verifyUrl
  });

  it('should log user action after successful registration', async () => {
    const registerData = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
      locale: 'tr'
    };

    const fakeUser = {
      id: 'user123',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      roleName: 'User',
      role: { _id: 'role123', name: 'User' }
    };

    // Mock queryHandler - kullanıcı bulunamaz
    mockDeps.queryHandler.dispatch.resolves(null);
    
    // Mock commandHandler - yeni kullanıcı oluşturulur
    mockDeps.commandHandler.dispatch.resolves(fakeUser);

    await authService.register(registerData);

    // logUserAction çağrıldı mı kontrol et
    expect(authService.userHelper.logUserAction.calledOnce).to.be.true;
    expect(authService.userHelper.logUserAction.calledWith('register', fakeUser, {
      email: 'test@example.com',
      verificationCode: '123456'
    })).to.be.true;
  });

  it('should handle registration error and log it', async () => {
    const registerData = {
      email: 'error@example.com',
      password: 'password123',
      firstName: 'Error',
      lastName: 'User',
      locale: 'tr'
    };

    // Mock queryHandler to throw error
    mockDeps.queryHandler.dispatch.rejects(new Error('Database error'));

    try {
      await authService.register(registerData);
      expect.fail('Should have thrown an error');
    } catch (err) {
      expect(err.message).to.equal('Database error');
    }
  });

  it('should generate email verification with correct parameters', async () => {
    const registerData = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
      locale: 'tr'
    };

    const fakeUser = {
      id: 'user123',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      roleName: 'User',
      role: { _id: 'role123', name: 'User' }
    };

    // Mock queryHandler - kullanıcı bulunamaz
    mockDeps.queryHandler.dispatch.resolves(null);
    
    // Mock commandHandler - yeni kullanıcı oluşturulur
    mockDeps.commandHandler.dispatch.resolves(fakeUser);

    await authService.register(registerData);

    // Email verification kodu üretildi mi kontrol et
    expect(authService.emailVerificationHelper.generateVerificationCode.calledOnce).to.be.true;
    expect(authService.emailVerificationHelper.calculateExpirationTime.calledOnce).to.be.true;
    expect(mockDeps.jwtService.generateEmailVerifyToken.calledOnce).to.be.true;
    
    // generateEmailVerifyToken doğru parametrelerle çağrıldı mı kontrol et
    const tokenCallArgs = mockDeps.jwtService.generateEmailVerifyToken.firstCall.args;
    expect(tokenCallArgs[0]).to.equal('test@example.com'); // email
    expect(tokenCallArgs[1]).to.equal('123456'); // code
    expect(tokenCallArgs[2]).to.be.instanceOf(Date); // expiresAt
    expect(tokenCallArgs[3]).to.equal('email_verify_secret'); // secret
  });

  it('should save verification code to Redis', async () => {
    const registerData = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
      locale: 'tr'
    };

    const fakeUser = {
      id: 'user123',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      roleName: 'User',
      role: { _id: 'role123', name: 'User' }
    };

    // Mock queryHandler - kullanıcı bulunamaz
    mockDeps.queryHandler.dispatch.resolves(null);
    
    // Mock commandHandler - yeni kullanıcı oluşturulur
    mockDeps.commandHandler.dispatch.resolves(fakeUser);

    await authService.register(registerData);

    // saveVerificationCode doğru parametrelerle çağrıldı mı kontrol et
    expect(authService.emailVerificationHelper.saveVerificationCode.calledOnce).to.be.true;
    const saveCallArgs = authService.emailVerificationHelper.saveVerificationCode.firstCall.args;
    expect(saveCallArgs[0]).to.equal('test@example.com'); // email
    expect(saveCallArgs[1]).to.equal('123456'); // code
    expect(saveCallArgs[2]).to.be.instanceOf(Date); // expiresAt
  });
});