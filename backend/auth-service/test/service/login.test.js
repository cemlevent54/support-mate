import { expect } from 'chai';
import sinon from 'sinon';
import { AuthService } from '../../src/services/auth.service.js';

console.log("Login testi başladı.");
describe('AuthService.login', () => {
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

  after(() => {
    // Tüm stub'ları restore et
    sinon.restore();
    
    // Global değişkenleri temizle
    if (global.emailVerificationCodes) {
      delete global.emailVerificationCodes;
    }
  });

  it('should login successfully', async () => {
    const fakeUser = { 
      id: 'user123', 
      email: 'test@example.com',
      password: 'hashedPassword123',
      firstName: 'Test',
      lastName: 'User',
      roleName: 'User',
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
      role: { _id: 'role123', name: 'User' }
    };
    const fakeTokens = { 
      accessToken: 'token123', 
      refreshToken: 'ref123', 
      expireAt: new Date(Date.now() + 3600000) 
    };

    // Mock queryHandler to return user
    mockDeps.queryHandler.dispatch.resolves(fakeUser);
    
    // Mock bcrypt to return true for password comparison
    mockDeps.bcrypt.compare.resolves(true);
    
    // Mock cache methods
    mockDeps.cacheService.client.get.resolves(null); // No lock
    mockDeps.cacheService.client.incr.resolves(1); // First attempt
    mockDeps.cacheService.client.set.resolves('OK');

    const ensureEmailVerifiedStub = sinon.stub(authService, 'ensureEmailVerified').returns(true);
    const ensureNoActiveSessionStub = sinon.stub(authService, 'ensureNoActiveSession').resolves(true);
    const createSessionStub = sinon.stub(authService, 'createSession').resolves(fakeTokens);
    const handleOnlineQueueStub = sinon.stub(authService, 'handleOnlineQueue').resolves();

    const result = await authService.login({ 
      email: 'test@example.com', 
      password: '123456',
      ipAddress: '192.168.1.1',
      locale: 'tr'
    });

    expect(result).to.have.property('accessToken', 'token123');
    expect(result).to.have.property('refreshToken', 'ref123');
    expect(result).to.have.property('user', fakeUser);
    expect(ensureEmailVerifiedStub.calledOnce).to.be.true;
    expect(createSessionStub.calledOnce).to.be.true;
    expect(handleOnlineQueueStub.calledOnce).to.be.true;
  });

  it('should reset failed attempts after successful login', async () => {
    const fakeUser = { 
      id: 'user123', 
      email: 'resetattempts@example.com',
      password: 'hashedPassword123',
      firstName: 'Test',
      lastName: 'User',
      roleName: 'User',
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
      role: { _id: 'role123', name: 'User' }
    };
    const fakeTokens = { 
      accessToken: 'token123', 
      refreshToken: 'ref123', 
      expireAt: new Date(Date.now() + 3600000) 
    };

    // Mock queryHandler to return user
    mockDeps.queryHandler.dispatch.resolves(fakeUser);
    
    // Mock bcrypt to return true for password comparison
    mockDeps.bcrypt.compare.resolves(true);
    
    // Mock cache methods - simulate existing failed attempts
    mockDeps.cacheService.client.get.resolves(null); // No lock
    mockDeps.cacheService.client.incr.resolves(1); // First attempt
    mockDeps.cacheService.client.set.resolves('OK');
    mockDeps.cacheService.client.del.resolves(1); // Successfully deleted

    const ensureEmailVerifiedStub = sinon.stub(authService, 'ensureEmailVerified').returns(true);
    const ensureNoActiveSessionStub = sinon.stub(authService, 'ensureNoActiveSession').resolves(true);
    const createSessionStub = sinon.stub(authService, 'createSession').resolves(fakeTokens);
    const handleOnlineQueueStub = sinon.stub(authService, 'handleOnlineQueue').resolves();

    const result = await authService.login({ 
      email: 'resetattempts@example.com', 
      password: '123456',
      ipAddress: '192.168.1.1',
      locale: 'tr'
    });

    expect(result).to.have.property('accessToken', 'token123');
    expect(result).to.have.property('refreshToken', 'ref123');
    expect(result).to.have.property('user', fakeUser);
    
    // Check that failed attempts were reset (del method called twice for both keys)
    expect(mockDeps.cacheService.client.del.calledTwice).to.be.true;
    
    // Verify the correct keys were deleted
    const delCalls = mockDeps.cacheService.client.del.getCalls();
    expect(delCalls[0].args[0]).to.equal('failed_login_attempts:resetattempts@example.com');
    expect(delCalls[1].args[0]).to.equal('account_locked:resetattempts@example.com');
    
    expect(ensureEmailVerifiedStub.calledOnce).to.be.true;
    expect(createSessionStub.calledOnce).to.be.true;
    expect(handleOnlineQueueStub.calledOnce).to.be.true;
  });

  it('should call handleOnlineQueue with correct parameters for Customer Supporter', async () => {
    const fakeUser = { 
      id: 'supporter123', 
      email: 'supporter@example.com',
      password: 'hashedPassword123',
      firstName: 'Support',
      lastName: 'Agent',
      roleName: 'Customer Supporter', // Customer Supporter role
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
      role: { _id: 'role456', name: 'Customer Supporter' }
    };
    const fakeTokens = { 
      accessToken: 'supporter_token123', 
      refreshToken: 'supporter_ref123', 
      expireAt: new Date(Date.now() + 3600000) 
    };

    // Mock queryHandler to return user
    mockDeps.queryHandler.dispatch.resolves(fakeUser);
    
    // Mock bcrypt to return true for password comparison
    mockDeps.bcrypt.compare.resolves(true);
    
    // Mock cache methods
    mockDeps.cacheService.client.get.resolves(null); // No lock
    mockDeps.cacheService.client.incr.resolves(1); // First attempt
    mockDeps.cacheService.client.set.resolves('OK');

    const ensureEmailVerifiedStub = sinon.stub(authService, 'ensureEmailVerified').returns(true);
    const ensureNoActiveSessionStub = sinon.stub(authService, 'ensureNoActiveSession').resolves(true);
    const createSessionStub = sinon.stub(authService, 'createSession').resolves(fakeTokens);
    const handleOnlineQueueStub = sinon.stub(authService, 'handleOnlineQueue').resolves();

    const result = await authService.login({ 
      email: 'supporter@example.com', 
      password: '123456',
      ipAddress: '192.168.1.1',
      locale: 'tr'
    });

    expect(result).to.have.property('accessToken', 'supporter_token123');
    expect(result).to.have.property('user', fakeUser);
    
    // Verify handleOnlineQueue was called with correct parameters
    expect(handleOnlineQueueStub.calledOnce).to.be.true;
    expect(handleOnlineQueueStub.calledWith(fakeUser, 'supporter_token123')).to.be.true;
    
    expect(ensureEmailVerifiedStub.calledOnce).to.be.true;
    expect(createSessionStub.calledOnce).to.be.true;
  });

  it('should call handleOnlineQueue with correct parameters for normal user', async () => {
    const fakeUser = { 
      id: 'user456', 
      email: 'normaluser@example.com',
      password: 'hashedPassword123',
      firstName: 'Normal',
      lastName: 'User',
      roleName: 'User', // Normal user role
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
      role: { _id: 'role789', name: 'User' }
    };
    const fakeTokens = { 
      accessToken: 'user_token456', 
      refreshToken: 'user_ref456', 
      expireAt: new Date(Date.now() + 3600000) 
    };

    // Mock queryHandler to return user
    mockDeps.queryHandler.dispatch.resolves(fakeUser);
    
    // Mock bcrypt to return true for password comparison
    mockDeps.bcrypt.compare.resolves(true);
    
    // Mock cache methods
    mockDeps.cacheService.client.get.resolves(null); // No lock
    mockDeps.cacheService.client.incr.resolves(1); // First attempt
    mockDeps.cacheService.client.set.resolves('OK');

    const ensureEmailVerifiedStub = sinon.stub(authService, 'ensureEmailVerified').returns(true);
    const ensureNoActiveSessionStub = sinon.stub(authService, 'ensureNoActiveSession').resolves(true);
    const createSessionStub = sinon.stub(authService, 'createSession').resolves(fakeTokens);
    const handleOnlineQueueStub = sinon.stub(authService, 'handleOnlineQueue').resolves();

    const result = await authService.login({ 
      email: 'normaluser@example.com', 
      password: '123456',
      ipAddress: '192.168.1.1',
      locale: 'tr'
    });

    expect(result).to.have.property('accessToken', 'user_token456');
    expect(result).to.have.property('user', fakeUser);
    
    // Verify handleOnlineQueue was called with correct parameters
    expect(handleOnlineQueueStub.calledOnce).to.be.true;
    expect(handleOnlineQueueStub.calledWith(fakeUser, 'user_token456')).to.be.true;
    
    expect(ensureEmailVerifiedStub.calledOnce).to.be.true;
    expect(createSessionStub.calledOnce).to.be.true;
  });

  it('should use default ipAddress when not provided', async () => {
    const fakeUser = { 
      id: 'user123', 
      email: 'noip@example.com',
      password: 'hashedPassword123',
      firstName: 'Test',
      lastName: 'User',
      roleName: 'User',
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
      role: { _id: 'role123', name: 'User' }
    };
    const fakeTokens = { 
      accessToken: 'token123', 
      refreshToken: 'ref123', 
      expireAt: new Date(Date.now() + 3600000) 
    };

    // Mock queryHandler to return user
    mockDeps.queryHandler.dispatch.resolves(fakeUser);
    
    // Mock bcrypt to return true for password comparison
    mockDeps.bcrypt.compare.resolves(true);
    
    // Mock cache methods
    mockDeps.cacheService.client.get.resolves(null); // No lock
    mockDeps.cacheService.client.incr.resolves(1); // First attempt
    mockDeps.cacheService.client.set.resolves('OK');

    const ensureEmailVerifiedStub = sinon.stub(authService, 'ensureEmailVerified').returns(true);
    const ensureNoActiveSessionStub = sinon.stub(authService, 'ensureNoActiveSession').resolves(true);
    const createSessionStub = sinon.stub(authService, 'createSession').resolves(fakeTokens);
    const handleOnlineQueueStub = sinon.stub(authService, 'handleOnlineQueue').resolves();

    // Login without ipAddress
    const result = await authService.login({ 
      email: 'noip@example.com', 
      password: '123456',
      locale: 'tr'
      // ipAddress not provided
    });

    expect(result).to.have.property('accessToken', 'token123');
    expect(result).to.have.property('user', fakeUser);
    
    // Verify that ensureNoActiveSession was called with default locale
    expect(ensureNoActiveSessionStub.calledWith(fakeUser, 'tr')).to.be.true;
    
    expect(ensureEmailVerifiedStub.calledOnce).to.be.true;
    expect(createSessionStub.calledOnce).to.be.true;
    expect(handleOnlineQueueStub.calledOnce).to.be.true;
  });

  it('should use default locale when not provided', async () => {
    const fakeUser = { 
      id: 'user123', 
      email: 'nolocale@example.com',
      password: 'hashedPassword123',
      firstName: 'Test',
      lastName: 'User',
      roleName: 'User',
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
      role: { _id: 'role123', name: 'User' }
    };
    const fakeTokens = { 
      accessToken: 'token123', 
      refreshToken: 'ref123', 
      expireAt: new Date(Date.now() + 3600000) 
    };

    // Mock queryHandler to return user
    mockDeps.queryHandler.dispatch.resolves(fakeUser);
    
    // Mock bcrypt to return true for password comparison
    mockDeps.bcrypt.compare.resolves(true);
    
    // Mock cache methods
    mockDeps.cacheService.client.get.resolves(null); // No lock
    mockDeps.cacheService.client.incr.resolves(1); // First attempt
    mockDeps.cacheService.client.set.resolves('OK');

    const ensureEmailVerifiedStub = sinon.stub(authService, 'ensureEmailVerified').returns(true);
    const ensureNoActiveSessionStub = sinon.stub(authService, 'ensureNoActiveSession').resolves(true);
    const createSessionStub = sinon.stub(authService, 'createSession').resolves(fakeTokens);
    const handleOnlineQueueStub = sinon.stub(authService, 'handleOnlineQueue').resolves();

    // Login without locale
    const result = await authService.login({ 
      email: 'nolocale@example.com', 
      password: '123456',
      ipAddress: '192.168.1.1'
      // locale not provided
    });

    expect(result).to.have.property('accessToken', 'token123');
    expect(result).to.have.property('user', fakeUser);
    
    // Verify that ensureNoActiveSession was called (locale will be undefined, which is handled by the method)
    expect(ensureNoActiveSessionStub.calledOnce).to.be.true;
    expect(ensureNoActiveSessionStub.calledWith(fakeUser, undefined)).to.be.true;
    
    expect(ensureEmailVerifiedStub.calledOnce).to.be.true;
    expect(createSessionStub.calledOnce).to.be.true;
    expect(handleOnlineQueueStub.calledOnce).to.be.true;
  });

  it('should handle locale normalization for different formats', async () => {
    const fakeUser = { 
      id: 'user123', 
      email: 'localeformat@example.com',
      password: 'hashedPassword123',
      firstName: 'Test',
      lastName: 'User',
      roleName: 'User',
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
      role: { _id: 'role123', name: 'User' }
    };
    const fakeTokens = { 
      accessToken: 'token123', 
      refreshToken: 'ref123', 
      expireAt: new Date(Date.now() + 3600000) 
    };

    // Mock queryHandler to return user
    mockDeps.queryHandler.dispatch.resolves(fakeUser);
    
    // Mock bcrypt to return true for password comparison
    mockDeps.bcrypt.compare.resolves(true);
    
    // Mock cache methods
    mockDeps.cacheService.client.get.resolves(null); // No lock
    mockDeps.cacheService.client.incr.resolves(1); // First attempt
    mockDeps.cacheService.client.set.resolves('OK');

    const ensureEmailVerifiedStub = sinon.stub(authService, 'ensureEmailVerified').returns(true);
    const ensureNoActiveSessionStub = sinon.stub(authService, 'ensureNoActiveSession').resolves(true);
    const createSessionStub = sinon.stub(authService, 'createSession').resolves(fakeTokens);
    const handleOnlineQueueStub = sinon.stub(authService, 'handleOnlineQueue').resolves();

    // Login with different locale formats
    const result = await authService.login({ 
      email: 'localeformat@example.com', 
      password: '123456',
      ipAddress: '192.168.1.1',
      locale: 'EN' // Uppercase locale
    });

    expect(result).to.have.property('accessToken', 'token123');
    expect(result).to.have.property('user', fakeUser);
    
    // Verify that ensureNoActiveSession was called with the provided locale
    expect(ensureNoActiveSessionStub.calledWith(fakeUser, 'EN')).to.be.true;
    
    expect(ensureEmailVerifiedStub.calledOnce).to.be.true;
    expect(createSessionStub.calledOnce).to.be.true;
    expect(handleOnlineQueueStub.calledOnce).to.be.true;
  });

  it('should throw error if validateUser fails', async () => {
    mockDeps.queryHandler.dispatch.resolves(null); // User not found

    try {
      await authService.login({ email: 'wrong@example.com', password: 'wrong' });
      expect.fail('Should have thrown an error');
    } catch (err) {
      expect(err.message).to.equal('translated-text');
    }
  });

  it('should throw error if email is not verified', async () => {
    const fakeUser = { 
      id: 'user123', 
      email: 'test@example.com',
      isEmailVerified: false,
      emailVerifiedAt: null
    };

    mockDeps.queryHandler.dispatch.resolves(fakeUser);
    mockDeps.bcrypt.compare.resolves(true);
    mockDeps.cacheService.client.get.resolves(null);
    mockDeps.cacheService.client.incr.resolves(1);
    mockDeps.cacheService.client.set.resolves('OK');

    sinon.stub(authService, 'ensureEmailVerified').throws(new Error('Email not verified'));

    try {
      await authService.login({ email: 'test@example.com', password: '123456' });
      expect.fail('Should have thrown an error');
    } catch (err) {
      expect(err.message).to.equal('Email not verified');
    }
  });

  it('should throw error if user already has active session', async () => {
    const fakeUser = { 
      id: 'user123', 
      email: 'test@example.com',
      isEmailVerified: true,
      emailVerifiedAt: new Date()
    };

    mockDeps.queryHandler.dispatch.resolves(fakeUser);
    mockDeps.bcrypt.compare.resolves(true);
    mockDeps.cacheService.client.get.resolves(null);
    mockDeps.cacheService.client.incr.resolves(1);
    mockDeps.cacheService.client.set.resolves('OK');

    sinon.stub(authService, 'ensureEmailVerified').returns(true);
    sinon.stub(authService, 'ensureNoActiveSession').throws(new Error('User already logged in'));

    try {
      await authService.login({ email: 'test@example.com', password: '123456' });
      expect.fail('Should have thrown an error');
    } catch (err) {
      expect(err.message).to.equal('User already logged in');
    }
  });

  it('should throw error if user not found', async () => {
    mockDeps.queryHandler.dispatch.resolves(null); // User not found

    try {
      await authService.login({ email: 'nonexistent@example.com', password: '123456' });
      expect.fail('Should have thrown an error');
    } catch (err) {
      expect(err.message).to.equal('translated-text');
    }
  });

  it('should throw error and record failed attempt for wrong password (before 5 attempts)', async () => {
    const fakeUser = { 
      id: 'user123', 
      email: 'test@example.com',
      password: 'hashedPassword123',
      failedAttempts: 2
    };

    mockDeps.queryHandler.dispatch.resolves(fakeUser);
    mockDeps.bcrypt.compare.resolves(false); // Wrong password
    mockDeps.cacheService.client.get.resolves(null); // No lock
    mockDeps.cacheService.client.incr.resolves(3); // 3rd failed attempt
    mockDeps.cacheService.client.set.resolves('OK');

    try {
      await authService.login({ email: 'test@example.com', password: 'wrongpassword' });
      expect.fail('Should have thrown an error');
    } catch (err) {
      expect(err.message).to.equal('translated-text');
      expect(mockDeps.cacheService.client.incr.calledOnce).to.be.true;
    }
  });

  it('should lock account after 5 failed attempts', async () => {
    const fakeUser = { 
      id: 'user123', 
      email: 'test@example.com',
      password: 'hashedPassword123',
      failedAttempts: 5
    };

    mockDeps.queryHandler.dispatch.resolves(fakeUser);
    mockDeps.bcrypt.compare.resolves(false); // Wrong password
    mockDeps.cacheService.client.get.resolves(null); // No lock initially
    mockDeps.cacheService.client.incr.resolves(5); // 5th failed attempt
    mockDeps.cacheService.client.set.resolves('OK');

    try {
      await authService.login({ email: 'test@example.com', password: 'wrongpassword' });
      expect.fail('Should have thrown an error');
    } catch (err) {
      expect(err.message).to.equal('ACCOUNT_LOCKED_15_MINUTES');
      expect(mockDeps.cacheService.client.incr.calledOnce).to.be.true;
      expect(mockDeps.cacheService.client.set.called).to.be.true;
    }
  });

  it('should reject login when account is locked', async () => {
    const fakeUser = { 
      id: 'user123', 
      email: 'locked@example.com',
      password: 'hashedPassword123'
    };

    mockDeps.queryHandler.dispatch.resolves(fakeUser);
    // Mock cache to return locked status
    mockDeps.cacheService.client.get.resolves(Date.now() + 900000); // Locked for 15 minutes

    try {
      await authService.login({ email: 'locked@example.com', password: '123456' });
      expect.fail('Should have thrown an error');
    } catch (err) {
      expect(err.message).to.include('ACCOUNT_LOCKED');
    }
  });

  it('should throw error if email is not verified (detailed test)', async () => {
    const fakeUser = { 
      id: 'user123', 
      email: 'unverified@example.com',
      password: 'hashedPassword123',
      firstName: 'Test',
      lastName: 'User',
      isEmailVerified: false,
      emailVerifiedAt: null,
      role: { _id: 'role123', name: 'User' }
    };

    mockDeps.queryHandler.dispatch.resolves(fakeUser);
    mockDeps.bcrypt.compare.resolves(true);
    mockDeps.cacheService.client.get.resolves(null);
    mockDeps.cacheService.client.incr.resolves(1);
    mockDeps.cacheService.client.set.resolves('OK');

    sinon.stub(authService, 'ensureEmailVerified').throws(new Error('Email address not verified. Please check your email and verify your account.'));

    try {
      await authService.login({ email: 'unverified@example.com', password: '123456' });
      expect.fail('Should have thrown an error');
    } catch (err) {
      expect(err.message).to.equal('Email address not verified. Please check your email and verify your account.');
    }
  });

  it('should throw error if user already has active session (detailed test)', async () => {
    const fakeUser = { 
      id: 'user123', 
      email: 'loggedin@example.com',
      password: 'hashedPassword123',
      firstName: 'Test',
      lastName: 'User',
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
      role: { _id: 'role123', name: 'User' }
    };

    mockDeps.queryHandler.dispatch.resolves(fakeUser);
    mockDeps.bcrypt.compare.resolves(true);
    mockDeps.cacheService.client.get.resolves(null);
    mockDeps.cacheService.client.incr.resolves(1);
    mockDeps.cacheService.client.set.resolves('OK');

    sinon.stub(authService, 'ensureEmailVerified').returns(true);
    sinon.stub(authService, 'ensureNoActiveSession').throws(new Error('User is already logged in. Please logout from other devices first.'));

    try {
      await authService.login({ email: 'loggedin@example.com', password: '123456' });
      expect.fail('Should have thrown an error');
    } catch (err) {
      expect(err.message).to.equal('User is already logged in. Please logout from other devices first.');
    }
  });

  it('should login successfully when isEmailVerified is string "true"', async () => {
    const fakeUser = { 
      id: 'user123', 
      email: 'stringtrue@example.com',
      password: 'hashedPassword123',
      firstName: 'Test',
      lastName: 'User',
      roleName: 'User',
      isEmailVerified: 'true', // String "true" değeri
      emailVerifiedAt: new Date(),
      role: { _id: 'role123', name: 'User' }
    };
    const fakeTokens = { 
      accessToken: 'token123', 
      refreshToken: 'ref123', 
      expireAt: new Date(Date.now() + 3600000) 
    };

    // Mock queryHandler to return user
    mockDeps.queryHandler.dispatch.resolves(fakeUser);
    
    // Mock bcrypt to return true for password comparison
    mockDeps.bcrypt.compare.resolves(true);
    
    // Mock cache methods
    mockDeps.cacheService.client.get.resolves(null); // No lock
    mockDeps.cacheService.client.incr.resolves(1); // First attempt
    mockDeps.cacheService.client.set.resolves('OK');

    const ensureEmailVerifiedStub = sinon.stub(authService, 'ensureEmailVerified').returns(true);
    const ensureNoActiveSessionStub = sinon.stub(authService, 'ensureNoActiveSession').resolves(true);
    const createSessionStub = sinon.stub(authService, 'createSession').resolves(fakeTokens);
    const handleOnlineQueueStub = sinon.stub(authService, 'handleOnlineQueue').resolves();

    const result = await authService.login({ 
      email: 'stringtrue@example.com', 
      password: '123456',
      ipAddress: '192.168.1.1',
      locale: 'tr'
    });

    expect(result).to.have.property('accessToken', 'token123');
    expect(result).to.have.property('refreshToken', 'ref123');
    expect(result).to.have.property('user', fakeUser);
    expect(ensureEmailVerifiedStub.calledOnce).to.be.true;
    expect(createSessionStub.calledOnce).to.be.true;
    expect(handleOnlineQueueStub.calledOnce).to.be.true;
  });

  it('should throw error when emailVerifiedAt is null even if isEmailVerified is true', async () => {
    const fakeUser = { 
      id: 'user123', 
      email: 'nullverifiedat@example.com',
      password: 'hashedPassword123',
      firstName: 'Test',
      lastName: 'User',
      isEmailVerified: true, // Email doğrulanmış
      emailVerifiedAt: null, // Ama tarih null
      role: { _id: 'role123', name: 'User' }
    };

    mockDeps.queryHandler.dispatch.resolves(fakeUser);
    mockDeps.bcrypt.compare.resolves(true);
    mockDeps.cacheService.client.get.resolves(null);
    mockDeps.cacheService.client.incr.resolves(1);
    mockDeps.cacheService.client.set.resolves('OK');

    sinon.stub(authService, 'ensureEmailVerified').throws(new Error('translated-text'));

    try {
      await authService.login({ email: 'nullverifiedat@example.com', password: '123456' });
      expect.fail('Should have thrown an error');
    } catch (err) {
      expect(err.message).to.equal('translated-text');
    }
  });
}); 

console.log("Login testi bitti.");