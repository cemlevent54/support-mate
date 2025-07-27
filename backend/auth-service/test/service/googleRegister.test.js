import { expect } from 'chai';
import sinon from 'sinon';
import { AuthService } from '../../src/services/auth.service.js';

describe('AuthService.googleRegister', () => {
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
          'services.authService.logs.registerConflict': 'Register conflict',
          'services.authService.logs.registerSuccess': 'Register success',
          'services.authService.logs.registerError': 'Register error',
          'services.authService.logs.verificationEmailSent': 'Verification email sent',
          'services.authService.logs.emailAlreadyInUse': 'Email already in use'
        };
        return translations[key] || key;
      },
      googleClient: {
        verifyIdToken: sinon.stub()
      },
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

  after(() => {
    // Tüm stub'ları restore et
    sinon.restore();
  });

  it('should register new user with Google successfully', async () => {
    const googleRegisterData = {
      credential: 'valid_google_token',
      locale: 'tr'
    };

    const fakeGooglePayload = {
      email: 'google@example.com',
      sub: 'google123',
      name: 'Google User',
      given_name: 'Google',
      family_name: 'User',
      email_verified: true
    };

    const fakeUser = {
      id: 'user123',
      email: 'google@example.com',
      firstName: 'Google',
      lastName: 'User',
      roleName: 'User',
      role: { _id: 'role123', name: 'User' },
      googleId: 'google123',
      isEmailVerified: true
    };

    // Mock Google token verification
    const mockTicket = {
      getPayload: () => fakeGooglePayload
    };
    mockDeps.googleClient.verifyIdToken.resolves(mockTicket);

    // Mock queryHandler - kullanıcı bulunamaz
    mockDeps.queryHandler.dispatch.onFirstCall().resolves(null); // googleId ile bulunamaz
    mockDeps.queryHandler.dispatch.onSecondCall().resolves(null); // email ile bulunamaz
    
    // Mock commandHandler - yeni kullanıcı oluşturulur
    mockDeps.commandHandler.dispatch.resolves(fakeUser);

    const result = await authService.googleRegister(googleRegisterData);

    expect(result).to.have.property('user', fakeUser);
    expect(result).to.have.property('accessToken');
    expect(result).to.have.property('expireAt');
    
    // Google token doğrulandı mı kontrol et
    expect(mockDeps.googleClient.verifyIdToken.calledOnce).to.be.true;
    const verifyCall = mockDeps.googleClient.verifyIdToken.firstCall;
    expect(verifyCall.args[0].idToken).to.equal('valid_google_token');
    
    // CREATE_USER command çağrıldı mı kontrol et
    expect(mockDeps.commandHandler.dispatch.calledOnce).to.be.true;
    const createCall = mockDeps.commandHandler.dispatch.firstCall;
    expect(createCall.args[0]).to.equal('CREATE_USER');
    expect(createCall.args[1].email).to.equal('google@example.com');
    expect(createCall.args[1].googleId).to.equal('google123');
    expect(createCall.args[1].isEmailVerified).to.be.true;
    
    // Email verification kodu üretildi mi kontrol et
    expect(authService.emailVerificationHelper.generateVerificationCode.calledOnce).to.be.true;
    expect(authService.emailVerificationHelper.saveVerificationCode.calledOnce).to.be.true;
    
    // Email gönderildi mi kontrol et
    expect(mockDeps.kafkaProducer.sendUserRegisteredEvent.calledOnce).to.be.true;
    
    // Session oluşturuldu mu kontrol et
    expect(mockDeps.jwtService.addActiveSession.calledOnce).to.be.true;
  });

  it('should throw error if no credential provided', async () => {
    const googleRegisterData = {
      locale: 'tr'
      // credential eksik
    };

    try {
      await authService.googleRegister(googleRegisterData);
      expect.fail('Should have thrown an error');
    } catch (err) {
      expect(err.message).to.include('Register conflict');
      expect(mockDeps.googleClient.verifyIdToken.called).to.be.false;
    }
  });

  it('should throw error if Google token verification fails', async () => {
    const googleRegisterData = {
      credential: 'invalid_google_token',
      locale: 'tr'
    };

    // Mock Google token verification failure
    mockDeps.googleClient.verifyIdToken.rejects(new Error('Invalid token'));

    try {
      await authService.googleRegister(googleRegisterData);
      expect.fail('Should have thrown an error');
    } catch (err) {
      expect(err.message).to.equal('Invalid token');
      expect(mockDeps.googleClient.verifyIdToken.calledOnce).to.be.true;
    }
  });

  it('should throw error if Google payload is invalid', async () => {
    const googleRegisterData = {
      credential: 'valid_google_token',
      locale: 'tr'
    };

    // Mock Google token verification with invalid payload
    const mockTicket = {
      getPayload: () => null // Invalid payload
    };
    mockDeps.googleClient.verifyIdToken.resolves(mockTicket);

    try {
      await authService.googleRegister(googleRegisterData);
      expect.fail('Should have thrown an error');
    } catch (err) {
      expect(err.message).to.include('Register conflict');
      expect(mockDeps.googleClient.verifyIdToken.calledOnce).to.be.true;
    }
  });

  it('should throw error if user already exists by googleId', async () => {
    const googleRegisterData = {
      credential: 'valid_google_token',
      locale: 'tr'
    };

    const fakeGooglePayload = {
      email: 'existing@example.com',
      sub: 'existing_google123',
      name: 'Existing User',
      email_verified: true
    };

    const existingUser = {
      id: 'existing123',
      email: 'existing@example.com',
      googleId: 'existing_google123'
    };

    // Mock Google token verification
    const mockTicket = {
      getPayload: () => fakeGooglePayload
    };
    mockDeps.googleClient.verifyIdToken.resolves(mockTicket);

    // Mock queryHandler - kullanıcı googleId ile bulunur
    mockDeps.queryHandler.dispatch.resolves(existingUser);

    try {
      await authService.googleRegister(googleRegisterData);
      expect.fail('Should have thrown an error');
    } catch (err) {
      const errorResponse = JSON.parse(err.message);
      expect(errorResponse.success).to.be.false;
      expect(errorResponse.message).to.equal('EMAIL_ALREADY_IN_USE');
      expect(errorResponse.data).to.be.null;
    }
  });

  it('should throw error if user already exists by email', async () => {
    const googleRegisterData = {
      credential: 'valid_google_token',
      locale: 'tr'
    };

    const fakeGooglePayload = {
      email: 'existing@example.com',
      sub: 'new_google123',
      name: 'New User',
      email_verified: true
    };

    const existingUser = {
      id: 'existing123',
      email: 'existing@example.com',
      googleId: 'old_google123'
    };

    // Mock Google token verification
    const mockTicket = {
      getPayload: () => fakeGooglePayload
    };
    mockDeps.googleClient.verifyIdToken.resolves(mockTicket);

    // Mock queryHandler - googleId ile bulunamaz, email ile bulunur
    mockDeps.queryHandler.dispatch.onFirstCall().resolves(null); // googleId ile bulunamaz
    mockDeps.queryHandler.dispatch.onSecondCall().resolves(existingUser); // email ile bulunur

    try {
      await authService.googleRegister(googleRegisterData);
      expect.fail('Should have thrown an error');
    } catch (err) {
      const errorResponse = JSON.parse(err.message);
      expect(errorResponse.success).to.be.false;
      expect(errorResponse.message).to.equal('EMAIL_ALREADY_IN_USE');
      expect(errorResponse.data).to.be.null;
    }
  });

  it('should use default User role when role not provided', async () => {
    const googleRegisterData = {
      credential: 'valid_google_token',
      locale: 'tr'
    };

    const fakeGooglePayload = {
      email: 'google@example.com',
      sub: 'google123',
      name: 'Google User',
      email_verified: true
    };

    const fakeUser = {
      id: 'user123',
      email: 'google@example.com',
      firstName: 'Google',
      lastName: 'User',
      roleName: 'User',
      role: { _id: 'role123', name: 'User' },
      googleId: 'google123',
      isEmailVerified: true
    };

    // Mock Google token verification
    const mockTicket = {
      getPayload: () => fakeGooglePayload
    };
    mockDeps.googleClient.verifyIdToken.resolves(mockTicket);

    // Mock queryHandler - kullanıcı bulunamaz
    mockDeps.queryHandler.dispatch.resolves(null);
    
    // Mock commandHandler - yeni kullanıcı oluşturulur
    mockDeps.commandHandler.dispatch.resolves(fakeUser);

    await authService.googleRegister(googleRegisterData);

    // getRoleByName çağrıldı mı kontrol et
    expect(mockDeps.roleService.getRoleByName.calledWith('User')).to.be.true;
    
    // CREATE_USER command'da default rol kullanıldı mı kontrol et
    expect(mockDeps.commandHandler.dispatch.calledOnce).to.be.true;
    const createCall = mockDeps.commandHandler.dispatch.firstCall;
    expect(createCall.args[0]).to.equal('CREATE_USER');
    expect(createCall.args[1].email).to.equal('google@example.com');
    expect(createCall.args[1].googleId).to.equal('google123');
    expect(createCall.args[1].isEmailVerified).to.be.true;
  });

  it('should handle Google payload with missing name fields', async () => {
    const googleRegisterData = {
      credential: 'valid_google_token',
      locale: 'tr'
    };

    const fakeGooglePayload = {
      email: 'google@example.com',
      sub: 'google123',
      email_verified: true
      // name, given_name, family_name eksik
    };

    const fakeUser = {
      id: 'user123',
      email: 'google@example.com',
      firstName: 'Google', // Default değer
      lastName: 'Google', // Default değer
      roleName: 'User',
      role: { _id: 'role123', name: 'User' },
      googleId: 'google123',
      isEmailVerified: true
    };

    // Mock Google token verification
    const mockTicket = {
      getPayload: () => fakeGooglePayload
    };
    mockDeps.googleClient.verifyIdToken.resolves(mockTicket);

    // Mock queryHandler - kullanıcı bulunamaz
    mockDeps.queryHandler.dispatch.resolves(null);
    
    // Mock commandHandler - yeni kullanıcı oluşturulur
    mockDeps.commandHandler.dispatch.resolves(fakeUser);

    await authService.googleRegister(googleRegisterData);

    // CREATE_USER command'da default isimler kullanıldı mı kontrol et
    expect(mockDeps.commandHandler.dispatch.calledOnce).to.be.true;
    const createCall = mockDeps.commandHandler.dispatch.firstCall;
    expect(createCall.args[0]).to.equal('CREATE_USER');
    expect(createCall.args[1].email).to.equal('google@example.com');
    expect(createCall.args[1].googleId).to.equal('google123');
    expect(createCall.args[1].firstName).to.equal('Google'); // Default değer
    expect(createCall.args[1].lastName).to.equal('Google'); // Default değer
  });

  it('should handle email_verified false in Google payload', async () => {
    const googleRegisterData = {
      credential: 'valid_google_token',
      locale: 'tr'
    };

    const fakeGooglePayload = {
      email: 'google@example.com',
      sub: 'google123',
      name: 'Google User',
      email_verified: false // Email doğrulanmamış
    };

    const fakeUser = {
      id: 'user123',
      email: 'google@example.com',
      firstName: 'Google',
      lastName: 'User',
      roleName: 'User',
      role: { _id: 'role123', name: 'User' },
      googleId: 'google123',
      isEmailVerified: false // Email doğrulanmamış olarak kaydedilir
    };

    // Mock Google token verification
    const mockTicket = {
      getPayload: () => fakeGooglePayload
    };
    mockDeps.googleClient.verifyIdToken.resolves(mockTicket);

    // Mock queryHandler - kullanıcı bulunamaz
    mockDeps.queryHandler.dispatch.resolves(null);
    
    // Mock commandHandler - yeni kullanıcı oluşturulur
    mockDeps.commandHandler.dispatch.resolves(fakeUser);

    await authService.googleRegister(googleRegisterData);

    // CREATE_USER command'da isEmailVerified false olarak kaydedildi mi kontrol et
    expect(mockDeps.commandHandler.dispatch.calledOnce).to.be.true;
    const createCall = mockDeps.commandHandler.dispatch.firstCall;
    expect(createCall.args[0]).to.equal('CREATE_USER');
    expect(createCall.args[1].email).to.equal('google@example.com');
    expect(createCall.args[1].googleId).to.equal('google123');
    expect(createCall.args[1].isEmailVerified).to.be.false; // Google'dan gelen değer
  });

  it('should use default locale when not provided', async () => {
    const googleRegisterData = {
      credential: 'valid_google_token'
      // locale eksik
    };

    const fakeGooglePayload = {
      email: 'google@example.com',
      sub: 'google123',
      name: 'Google User',
      email_verified: true
    };

    const fakeUser = {
      id: 'user123',
      email: 'google@example.com',
      firstName: 'Google',
      lastName: 'User',
      roleName: 'User',
      role: { _id: 'role123', name: 'User' },
      googleId: 'google123',
      isEmailVerified: true
    };

    // Mock Google token verification
    const mockTicket = {
      getPayload: () => fakeGooglePayload
    };
    mockDeps.googleClient.verifyIdToken.resolves(mockTicket);

    // Mock queryHandler - kullanıcı bulunamaz
    mockDeps.queryHandler.dispatch.resolves(null);
    
    // Mock commandHandler - yeni kullanıcı oluşturulur
    mockDeps.commandHandler.dispatch.resolves(fakeUser);

    await authService.googleRegister(googleRegisterData);

    // sendUserRegisteredEvent default locale ile çağrıldı mı kontrol et
    expect(mockDeps.kafkaProducer.sendUserRegisteredEvent.calledOnce).to.be.true;
    const callArgs = mockDeps.kafkaProducer.sendUserRegisteredEvent.firstCall.args;
    expect(callArgs[1]).to.equal('tr'); // Default locale
  });

  it('should generate and save verification code', async () => {
    const googleRegisterData = {
      credential: 'valid_google_token',
      locale: 'tr'
    };

    const fakeGooglePayload = {
      email: 'google@example.com',
      sub: 'google123',
      name: 'Google User',
      email_verified: true
    };

    const fakeUser = {
      id: 'user123',
      email: 'google@example.com',
      firstName: 'Google',
      lastName: 'User',
      roleName: 'User',
      role: { _id: 'role123', name: 'User' },
      googleId: 'google123',
      isEmailVerified: true
    };

    // Mock Google token verification
    const mockTicket = {
      getPayload: () => fakeGooglePayload
    };
    mockDeps.googleClient.verifyIdToken.resolves(mockTicket);

    // Mock queryHandler - kullanıcı bulunamaz
    mockDeps.queryHandler.dispatch.resolves(null);
    
    // Mock commandHandler - yeni kullanıcı oluşturulur
    mockDeps.commandHandler.dispatch.resolves(fakeUser);

    await authService.googleRegister(googleRegisterData);

    // Email verification kodu üretildi mi kontrol et
    expect(authService.emailVerificationHelper.generateVerificationCode.calledOnce).to.be.true;
    expect(authService.emailVerificationHelper.calculateExpirationTime.calledOnce).to.be.true;
    expect(mockDeps.jwtService.generateEmailVerifyToken.calledOnce).to.be.true;
    
    // generateEmailVerifyToken doğru parametrelerle çağrıldı mı kontrol et
    const tokenCallArgs = mockDeps.jwtService.generateEmailVerifyToken.firstCall.args;
    expect(tokenCallArgs[0]).to.equal('google@example.com'); // email
    expect(tokenCallArgs[1]).to.equal('123456'); // code
    expect(tokenCallArgs[2]).to.be.instanceOf(Date); // expiresAt
    expect(tokenCallArgs[3]).to.equal('email_verify_secret'); // secret
    
    // saveVerificationCode doğru parametrelerle çağrıldı mı kontrol et
    expect(authService.emailVerificationHelper.saveVerificationCode.calledOnce).to.be.true;
    const saveCallArgs = authService.emailVerificationHelper.saveVerificationCode.firstCall.args;
    expect(saveCallArgs[0]).to.equal('google@example.com'); // email
    expect(saveCallArgs[1]).to.equal('123456'); // code
    expect(saveCallArgs[2]).to.be.instanceOf(Date); // expiresAt
  });

  it('should send verification email with correct parameters', async () => {
    const googleRegisterData = {
      credential: 'valid_google_token',
      locale: 'en' // İngilizce locale
    };

    const fakeGooglePayload = {
      email: 'google@example.com',
      sub: 'google123',
      name: 'Google User',
      email_verified: true
    };

    const fakeUser = {
      id: 'user123',
      email: 'google@example.com',
      firstName: 'Google',
      lastName: 'User',
      roleName: 'User',
      role: { _id: 'role123', name: 'User' },
      googleId: 'google123',
      isEmailVerified: true
    };

    // Mock Google token verification
    const mockTicket = {
      getPayload: () => fakeGooglePayload
    };
    mockDeps.googleClient.verifyIdToken.resolves(mockTicket);

    // Mock queryHandler - kullanıcı bulunamaz
    mockDeps.queryHandler.dispatch.resolves(null);
    
    // Mock commandHandler - yeni kullanıcı oluşturulur
    mockDeps.commandHandler.dispatch.resolves(fakeUser);

    await authService.googleRegister(googleRegisterData);

    // sendUserRegisteredEvent doğru parametrelerle çağrıldı mı kontrol et
    expect(mockDeps.kafkaProducer.sendUserRegisteredEvent.calledOnce).to.be.true;
    const callArgs = mockDeps.kafkaProducer.sendUserRegisteredEvent.firstCall.args;
    expect(callArgs[0]).to.deep.equal(fakeUser); // user
    expect(callArgs[1]).to.equal('en'); // locale
    expect(callArgs[2]).to.equal('123456'); // code
    expect(callArgs[3]).to.include('verify-email'); // verifyUrl
  });

  it('should create active session after successful registration', async () => {
    const googleRegisterData = {
      credential: 'valid_google_token',
      locale: 'tr'
    };

    const fakeGooglePayload = {
      email: 'google@example.com',
      sub: 'google123',
      name: 'Google User',
      email_verified: true
    };

    const fakeUser = {
      id: 'user123',
      email: 'google@example.com',
      firstName: 'Google',
      lastName: 'User',
      roleName: 'User',
      role: { _id: 'role123', name: 'User' },
      googleId: 'google123',
      isEmailVerified: true
    };

    // Mock Google token verification
    const mockTicket = {
      getPayload: () => fakeGooglePayload
    };
    mockDeps.googleClient.verifyIdToken.resolves(mockTicket);

    // Mock queryHandler - kullanıcı bulunamaz
    mockDeps.queryHandler.dispatch.resolves(null);
    
    // Mock commandHandler - yeni kullanıcı oluşturulur
    mockDeps.commandHandler.dispatch.resolves(fakeUser);

    await authService.googleRegister(googleRegisterData);

    // Access token üretildi mi kontrol et
    expect(mockDeps.jwtService.generateAccessToken.calledOnce).to.be.true;
    
    // Session oluşturuldu mu kontrol et
    expect(mockDeps.jwtService.addActiveSession.calledOnce).to.be.true;
    const sessionCallArgs = mockDeps.jwtService.addActiveSession.firstCall.args;
    expect(sessionCallArgs[0]).to.equal('user123'); // userId
    expect(sessionCallArgs[1]).to.be.a('string'); // accessToken
    expect(sessionCallArgs[2]).to.be.instanceOf(Date); // expireAt
  });

  it('should handle registration error and log it', async () => {
    const googleRegisterData = {
      credential: 'valid_google_token',
      locale: 'tr'
    };

    const fakeGooglePayload = {
      email: 'error@example.com',
      sub: 'google123',
      name: 'Error User',
      email_verified: true
    };

    // Mock Google token verification
    const mockTicket = {
      getPayload: () => fakeGooglePayload
    };
    mockDeps.googleClient.verifyIdToken.resolves(mockTicket);

    // Mock queryHandler to throw error
    mockDeps.queryHandler.dispatch.rejects(new Error('Database error'));

    try {
      await authService.googleRegister(googleRegisterData);
      expect.fail('Should have thrown an error');
    } catch (err) {
      expect(err.message).to.equal('Database error');
    }
  });
});
