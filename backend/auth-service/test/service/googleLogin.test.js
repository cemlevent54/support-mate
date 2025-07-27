import { expect } from 'chai';
import sinon from 'sinon';
import { AuthService } from '../../src/services/auth.service.js';



describe('AuthService.googleLogin', () => {
  let authService;
  let mockDeps;

  beforeEach(() => {
    mockDeps = {
      jwtService: {},
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
        sendAgentOnlineEvent: sinon.stub()
      },
      translation: () => 'translated-text',
      googleClient: {
        verifyIdToken: sinon.stub()
      },
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

  it('should login successfully with valid Google credential', async () => {
    const fakeGooglePayload = {
      email: 'test@gmail.com',
      sub: 'google123',
      name: 'Test User',
      given_name: 'Test',
      family_name: 'User',
      email_verified: true
    };

    const fakeUser = {
      id: 'user123',
      email: 'test@gmail.com',
      firstName: 'Test',
      lastName: 'User',
      roleName: 'User',
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
      role: { _id: 'role123', name: 'User' },
      googleId: 'google123'
    };

    const fakeTokens = {
      accessToken: 'google_token123',
      refreshToken: 'google_ref123',
      expireAt: new Date(Date.now() + 3600000)
    };

    // Mock Google token verification
    const mockTicket = {
      getPayload: () => fakeGooglePayload
    };
    mockDeps.googleClient.verifyIdToken.resolves(mockTicket);

    // Mock queryHandler to return user
    mockDeps.queryHandler.dispatch.resolves(fakeUser);

    // Mock AuthService methods
    const ensureEmailVerifiedStub = sinon.stub(authService, 'ensureEmailVerified').returns(true);
    const ensureNoActiveSessionStub = sinon.stub(authService, 'ensureNoActiveSession').resolves(true);
    const createSessionStub = sinon.stub(authService, 'createSession').resolves(fakeTokens);
    const handleOnlineQueueStub = sinon.stub(authService, 'handleOnlineQueue').resolves();

    const result = await authService.googleLogin({
      credential: 'valid_google_token',
      locale: 'tr'
    });

    expect(result).to.have.property('user', fakeUser);
    expect(result).to.have.property('accessToken', 'google_token123');
    expect(result).to.have.property('expireAt', fakeTokens.expireAt);

    expect(mockDeps.googleClient.verifyIdToken.calledOnce).to.be.true;
    expect(mockDeps.queryHandler.dispatch.calledWith('FIND_ANY_USER_BY_EMAIL', { email: 'test@gmail.com' })).to.be.true;
    expect(ensureEmailVerifiedStub.calledOnce).to.be.true;
    expect(ensureNoActiveSessionStub.calledWith(fakeUser, 'tr')).to.be.true;
    expect(createSessionStub.calledOnce).to.be.true;
    expect(handleOnlineQueueStub.calledWith(fakeUser, 'google_token123')).to.be.true;
  });

  it('should update user googleId if not exists', async () => {
    const fakeGooglePayload = {
      email: 'test@gmail.com',
      sub: 'google123',
      name: 'Test User',
      email_verified: true
    };

    const fakeUser = {
      id: 'user123',
      email: 'test@gmail.com',
      firstName: 'Test',
      lastName: 'User',
      roleName: 'User',
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
      role: { _id: 'role123', name: 'User' },
      googleId: null, // googleId yok
      save: sinon.stub().resolves()
    };

    const fakeTokens = {
      accessToken: 'google_token123',
      refreshToken: 'google_ref123',
      expireAt: new Date(Date.now() + 3600000)
    };

    // Mock Google token verification
    const mockTicket = {
      getPayload: () => fakeGooglePayload
    };
    mockDeps.googleClient.verifyIdToken.resolves(mockTicket);

    // Mock queryHandler to return user
    mockDeps.queryHandler.dispatch.resolves(fakeUser);

    // Mock commandHandler for GoogleId update
    const updatedUser = { ...fakeUser, googleId: 'google123' };
    mockDeps.commandHandler.dispatch.resolves(updatedUser);

    // Mock AuthService methods
    const ensureEmailVerifiedStub = sinon.stub(authService, 'ensureEmailVerified').returns(true);
    const ensureNoActiveSessionStub = sinon.stub(authService, 'ensureNoActiveSession').resolves(true);
    const createSessionStub = sinon.stub(authService, 'createSession').resolves(fakeTokens);
    const handleOnlineQueueStub = sinon.stub(authService, 'handleOnlineQueue').resolves();

    const result = await authService.googleLogin({
      credential: 'valid_google_token',
      locale: 'tr'
    });

    expect(result).to.have.property('user', updatedUser);
    expect(result.user.googleId).to.equal('google123');
    expect(mockDeps.commandHandler.dispatch.calledWith('UPDATE_USER_GOOGLE_ID', { userId: 'user123', googleId: 'google123' })).to.be.true;
  });

  it('should find user by googleId if not found by email', async () => {
    const fakeGooglePayload = {
      email: 'test@gmail.com',
      sub: 'google123',
      name: 'Test User',
      email_verified: true
    };

    const fakeUser = {
      id: 'user123',
      email: 'test@gmail.com',
      firstName: 'Test',
      lastName: 'User',
      roleName: 'User',
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
      role: { _id: 'role123', name: 'User' },
      googleId: 'google123'
    };

    const fakeTokens = {
      accessToken: 'google_token123',
      refreshToken: 'google_ref123',
      expireAt: new Date(Date.now() + 3600000)
    };

    // Mock Google token verification
    const mockTicket = {
      getPayload: () => fakeGooglePayload
    };
    mockDeps.googleClient.verifyIdToken.resolves(mockTicket);

    // Mock queryHandler - email ile bulunamaz, googleId ile bulunur
    mockDeps.queryHandler.dispatch.onFirstCall().resolves(null);
    mockDeps.queryHandler.dispatch.onSecondCall().resolves(fakeUser);

    // Mock AuthService methods
    const ensureEmailVerifiedStub = sinon.stub(authService, 'ensureEmailVerified').returns(true);
    const ensureNoActiveSessionStub = sinon.stub(authService, 'ensureNoActiveSession').resolves(true);
    const createSessionStub = sinon.stub(authService, 'createSession').resolves(fakeTokens);
    const handleOnlineQueueStub = sinon.stub(authService, 'handleOnlineQueue').resolves();

    const result = await authService.googleLogin({
      credential: 'valid_google_token',
      locale: 'tr'
    });

    expect(result).to.have.property('user', fakeUser);
    expect(mockDeps.queryHandler.dispatch.firstCall.args).to.deep.equal(['FIND_ANY_USER_BY_EMAIL', { email: 'test@gmail.com' }]);
    expect(mockDeps.queryHandler.dispatch.secondCall.args).to.deep.equal(['FIND_USER_BY_GOOGLE_ID', { googleId: 'google123' }]);
  });

  it('should throw error if no credential provided', async () => {
    try {
      await authService.googleLogin({
        locale: 'tr'
        // credential eksik
      });
      expect.fail('Should have thrown an error');
    } catch (err) {
      expect(err.message).to.equal('translated-text'); // services.authService.logs.loginFailed
      expect(mockDeps.googleClient.verifyIdToken.called).to.be.false;
    }
  });

  it('should throw error if Google token verification fails', async () => {
    // Mock Google token verification failure
    mockDeps.googleClient.verifyIdToken.rejects(new Error('Invalid token'));

    try {
      await authService.googleLogin({
        credential: 'invalid_google_token',
        locale: 'tr'
      });
      expect.fail('Should have thrown an error');
    } catch (err) {
      expect(err.message).to.equal('Invalid token');
      expect(mockDeps.googleClient.verifyIdToken.calledOnce).to.be.true;
    }
  });

  it('should throw error if Google payload is invalid', async () => {
    // Mock Google token verification with invalid payload
    const mockTicket = {
      getPayload: () => null // Invalid payload
    };
    mockDeps.googleClient.verifyIdToken.resolves(mockTicket);

    try {
      await authService.googleLogin({
        credential: 'valid_google_token',
        locale: 'tr'
      });
      expect.fail('Should have thrown an error');
    } catch (err) {
      expect(err.message).to.equal('translated-text'); // services.authService.logs.loginFailed
      expect(mockDeps.googleClient.verifyIdToken.calledOnce).to.be.true;
    }
  });

  it('should throw error if user not found by email or googleId', async () => {
    const fakeGooglePayload = {
      email: 'nonexistent@gmail.com',
      sub: 'google123',
      name: 'Test User',
      email_verified: true
    };

    // Mock Google token verification
    const mockTicket = {
      getPayload: () => fakeGooglePayload
    };
    mockDeps.googleClient.verifyIdToken.resolves(mockTicket);

    // Mock queryHandler - kullanıcı bulunamaz
    mockDeps.queryHandler.dispatch.onFirstCall().resolves(null);
    mockDeps.queryHandler.dispatch.onSecondCall().resolves(null);

    try {
      await authService.googleLogin({
        credential: 'valid_google_token',
        locale: 'tr'
      });
      expect.fail('Should have thrown an error');
    } catch (err) {
      expect(err.message).to.equal('translated-text'); // repositories.userRepository.logs.notFound
      expect(mockDeps.queryHandler.dispatch.firstCall.args).to.deep.equal(['FIND_ANY_USER_BY_EMAIL', { email: 'nonexistent@gmail.com' }]);
      expect(mockDeps.queryHandler.dispatch.secondCall.args).to.deep.equal(['FIND_USER_BY_GOOGLE_ID', { googleId: 'google123' }]);
    }
  });

  it('should throw error if email is not verified', async () => {
    const fakeGooglePayload = {
      email: 'test@gmail.com',
      sub: 'google123',
      name: 'Test User',
      email_verified: true
    };

    const fakeUser = {
      id: 'user123',
      email: 'test@gmail.com',
      firstName: 'Test',
      lastName: 'User',
      roleName: 'User',
      isEmailVerified: false, // Email doğrulanmamış
      emailVerifiedAt: null,
      role: { _id: 'role123', name: 'User' },
      googleId: 'google123'
    };

    // Mock Google token verification
    const mockTicket = {
      getPayload: () => fakeGooglePayload
    };
    mockDeps.googleClient.verifyIdToken.resolves(mockTicket);

    // Mock queryHandler to return user
    mockDeps.queryHandler.dispatch.resolves(fakeUser);

    // Mock ensureEmailVerified to throw error
    sinon.stub(authService, 'ensureEmailVerified').throws(new Error('Email not verified'));

    try {
      await authService.googleLogin({
        credential: 'valid_google_token',
        locale: 'tr'
      });
      expect.fail('Should have thrown an error');
    } catch (err) {
      expect(err.message).to.equal('Email not verified');
    }
  });

  it('should throw error if user already has active session', async () => {
    const fakeGooglePayload = {
      email: 'test@gmail.com',
      sub: 'google123',
      name: 'Test User',
      email_verified: true
    };

    const fakeUser = {
      id: 'user123',
      email: 'test@gmail.com',
      firstName: 'Test',
      lastName: 'User',
      roleName: 'User',
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
      role: { _id: 'role123', name: 'User' },
      googleId: 'google123'
    };

    // Mock Google token verification
    const mockTicket = {
      getPayload: () => fakeGooglePayload
    };
    mockDeps.googleClient.verifyIdToken.resolves(mockTicket);

    // Mock queryHandler to return user
    mockDeps.queryHandler.dispatch.resolves(fakeUser);

    // Mock AuthService methods
    sinon.stub(authService, 'ensureEmailVerified').returns(true);
    sinon.stub(authService, 'ensureNoActiveSession').throws(new Error('User already logged in'));

    try {
      await authService.googleLogin({
        credential: 'valid_google_token',
        locale: 'tr'
      });
      expect.fail('Should have thrown an error');
    } catch (err) {
      expect(err.message).to.equal('User already logged in');
    }
  });

  it('should use default locale when not provided', async () => {
    const fakeGooglePayload = {
      email: 'test@gmail.com',
      sub: 'google123',
      name: 'Test User',
      email_verified: true
    };

    const fakeUser = {
      id: 'user123',
      email: 'test@gmail.com',
      firstName: 'Test',
      lastName: 'User',
      roleName: 'User',
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
      role: { _id: 'role123', name: 'User' },
      googleId: 'google123'
    };

    const fakeTokens = {
      accessToken: 'google_token123',
      refreshToken: 'google_ref123',
      expireAt: new Date(Date.now() + 3600000)
    };

    // Mock Google token verification
    const mockTicket = {
      getPayload: () => fakeGooglePayload
    };
    mockDeps.googleClient.verifyIdToken.resolves(mockTicket);

    // Mock queryHandler to return user
    mockDeps.queryHandler.dispatch.resolves(fakeUser);

    // Mock AuthService methods
    const ensureEmailVerifiedStub = sinon.stub(authService, 'ensureEmailVerified').returns(true);
    const ensureNoActiveSessionStub = sinon.stub(authService, 'ensureNoActiveSession').resolves(true);
    const createSessionStub = sinon.stub(authService, 'createSession').resolves(fakeTokens);
    const handleOnlineQueueStub = sinon.stub(authService, 'handleOnlineQueue').resolves();

    // Login without locale
    const result = await authService.googleLogin({
      credential: 'valid_google_token'
      // locale not provided
    });

    expect(result).to.have.property('user', fakeUser);
    expect(ensureNoActiveSessionStub.calledWith(fakeUser, 'tr')).to.be.true; // Default locale
  });

  it('should handle Customer Supporter online queue correctly', async () => {
    const fakeGooglePayload = {
      email: 'supporter@gmail.com',
      sub: 'google456',
      name: 'Support Agent',
      email_verified: true
    };

    const fakeUser = {
      id: 'supporter123',
      email: 'supporter@gmail.com',
      firstName: 'Support',
      lastName: 'Agent',
      roleName: 'Customer Supporter', // Customer Supporter role
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
      role: { _id: 'role456', name: 'Customer Supporter' },
      googleId: 'google456'
    };

    const fakeTokens = {
      accessToken: 'supporter_token123',
      refreshToken: 'supporter_ref123',
      expireAt: new Date(Date.now() + 3600000)
    };

    // Mock Google token verification
    const mockTicket = {
      getPayload: () => fakeGooglePayload
    };
    mockDeps.googleClient.verifyIdToken.resolves(mockTicket);

    // Mock queryHandler to return user
    mockDeps.queryHandler.dispatch.resolves(fakeUser);

    // Mock AuthService methods
    const ensureEmailVerifiedStub = sinon.stub(authService, 'ensureEmailVerified').returns(true);
    const ensureNoActiveSessionStub = sinon.stub(authService, 'ensureNoActiveSession').resolves(true);
    const createSessionStub = sinon.stub(authService, 'createSession').resolves(fakeTokens);
    const handleOnlineQueueStub = sinon.stub(authService, 'handleOnlineQueue').resolves();

    const result = await authService.googleLogin({
      credential: 'valid_google_token',
      locale: 'tr'
    });

    expect(result).to.have.property('user', fakeUser);
    expect(result).to.have.property('accessToken', 'supporter_token123');
    
    // Verify handleOnlineQueue was called with correct parameters
    expect(handleOnlineQueueStub.calledWith(fakeUser, 'supporter_token123')).to.be.true;
  });
}); 

after(() => {
  // Tüm stub'ları restore et
  sinon.restore();
}); 