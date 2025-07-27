import { expect } from 'chai';
import sinon from 'sinon';
import bcrypt from 'bcrypt';
import authService from '../../src/services/auth.service.js';
import { commandHandler, queryHandler, QUERY_TYPES } from '../../src/cqrs/index.js';
import JWTService from '../../src/middlewares/jwt.service.js';
import cacheService from '../../src/config/cache.js';
import { sendAgentOnlineEvent } from '../../src/kafka/kafkaProducer.js';
import translation from '../../src/config/translation.js';

// Environment variables for testing
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-purposes-only';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-key-for-testing-purposes-only';
process.env.JWT_EXPIRES_IN = '24h';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
process.env.EMAIL_VERIFY_TOKEN_SECRET = 'test-email-verify-secret';
process.env.MONGODB_URI = 'mongodb://localhost:27017/auth-service-test';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.KAFKA_BROKERS = 'localhost:9092';
process.env.WEBSITE_URL = 'http://localhost:3000';
process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
process.env.NODE_ENV = 'test';

describe('AuthService - Login Tests', () => {
  let sandbox;
  let mockReq;
  let mockRes;
  let mockUser;

  beforeEach(async () => {
    sandbox = sinon.createSandbox();
    
    // Mock request objesi
    mockReq = {
      body: {
        email: 'test@example.com',
        password: 'password123'
      },
      user: null
    };

    // Mock response objesi
    mockRes = {
      cookie: sandbox.stub(),
      status: sandbox.stub().returnsThis(),
      json: sandbox.stub()
    };

    // Mock kullanıcı objesi
    mockUser = {
      id: '507f1f77bcf86cd799439011',
      email: 'test@example.com',
      password: 'hashedPassword123',
      firstName: 'Test',
      lastName: 'User',
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
      role: {
        _id: '507f1f77bcf86cd799439012',
        name: 'User'
      },
      roleName: 'User'
    };

    // CQRS handler'ları kaydet
    const { registerAuthHandlers } = await import('../../src/services/auth.service.js');
    registerAuthHandlers();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('login() - Başarılı Login Testleri', () => {
    it('geçerli email ve şifre ile başarılı login yapmalı', async () => {
      // Arrange
      const hashedPassword = await bcrypt.hash('password123', 10);
      const userWithHashedPassword = { ...mockUser, password: hashedPassword };
      
      // Mock queryHandler.dispatch to return our user
      const originalDispatch = queryHandler.dispatch;
      queryHandler.dispatch = sandbox.stub().resolves(userWithHashedPassword);
      
      // Mock JWTService methods
      sandbox.stub(JWTService, 'findActiveSession').resolves(null);
      sandbox.stub(JWTService, 'buildJWTPayload').returns({
        id: mockUser.id,
        email: mockUser.email,
        roleId: mockUser.role._id,
        roleName: mockUser.roleName
      });
      sandbox.stub(JWTService, 'generateAccessToken').returns('mock-access-token');
      sandbox.stub(JWTService, 'generateRefreshToken').returns('mock-refresh-token');
      sandbox.stub(JWTService, 'getTokenExpireDate').returns(new Date());
      sandbox.stub(JWTService, 'addActiveSession').resolves();
      
      // Mock cache and kafka
      sandbox.stub(cacheService.client, 'lRange').resolves([]);
      sandbox.stub(cacheService.client, 'rPush').resolves();
      sandbox.stub(sendAgentOnlineEvent).resolves();

      // Act
      await authService.login(mockReq, mockRes);

      // Assert
      expect(mockRes.json.calledOnce).to.be.true;
      const responseCall = mockRes.json.getCall(0);
      expect(responseCall.args[0]).to.have.property('success', true);
      expect(responseCall.args[0]).to.have.property('data');
      expect(responseCall.args[0].data).to.have.property('user');
      expect(responseCall.args[0].data).to.have.property('accessToken');
      
      // Restore original method
      queryHandler.dispatch = originalDispatch;
    });

    it('Customer Supporter rolü ile login yapıldığında online queue\'ya eklenmeli', async () => {
      // Arrange
      const customerSupporterUser = {
        ...mockUser,
        roleName: 'Customer Supporter',
        password: await bcrypt.hash('password123', 10)
      };

      // Mock queryHandler.dispatch
      const originalDispatch = queryHandler.dispatch;
      queryHandler.dispatch = sandbox.stub().resolves(customerSupporterUser);
      
      // Mock JWTService methods
      sandbox.stub(JWTService, 'findActiveSession').resolves(null);
      sandbox.stub(JWTService, 'buildJWTPayload').returns({
        id: customerSupporterUser.id,
        email: customerSupporterUser.email,
        roleId: customerSupporterUser.role._id,
        roleName: customerSupporterUser.roleName
      });
      sandbox.stub(JWTService, 'generateAccessToken').returns('mock-access-token');
      sandbox.stub(JWTService, 'generateRefreshToken').returns('mock-refresh-token');
      sandbox.stub(JWTService, 'getTokenExpireDate').returns(new Date());
      sandbox.stub(JWTService, 'addActiveSession').resolves();
      
      const lRangeStub = sandbox.stub(cacheService.client, 'lRange').resolves([]);
      const rPushStub = sandbox.stub(cacheService.client, 'rPush').resolves();
      const sendAgentOnlineEventStub = sandbox.stub(sendAgentOnlineEvent).resolves();

      // Act
      await authService.login(mockReq, mockRes);

      // Assert
      expect(lRangeStub.calledOnce).to.be.true;
      expect(rPushStub.calledOnce).to.be.true;
      expect(sendAgentOnlineEventStub.calledOnce).to.be.true;
      expect(rPushStub.calledWith('online_users_queue', customerSupporterUser.id)).to.be.true;
      
      // Restore original method
      queryHandler.dispatch = originalDispatch;
    });

    it('Customer Supporter zaten online ise tekrar eklenmemeli', async () => {
      // Arrange
      const customerSupporterUser = {
        ...mockUser,
        roleName: 'Customer Supporter',
        password: await bcrypt.hash('password123', 10)
      };

      // Mock queryHandler.dispatch
      const originalDispatch = queryHandler.dispatch;
      queryHandler.dispatch = sandbox.stub().resolves(customerSupporterUser);
      
      // Mock JWTService methods
      sandbox.stub(JWTService, 'findActiveSession').resolves(null);
      sandbox.stub(JWTService, 'buildJWTPayload').returns({
        id: customerSupporterUser.id,
        email: customerSupporterUser.email,
        roleId: customerSupporterUser.role._id,
        roleName: customerSupporterUser.roleName
      });
      sandbox.stub(JWTService, 'generateAccessToken').returns('mock-access-token');
      sandbox.stub(JWTService, 'generateRefreshToken').returns('mock-refresh-token');
      sandbox.stub(JWTService, 'getTokenExpireDate').returns(new Date());
      sandbox.stub(JWTService, 'addActiveSession').resolves();
      
      const lRangeStub = sandbox.stub(cacheService.client, 'lRange').resolves([customerSupporterUser.id]);
      const rPushStub = sandbox.stub(cacheService.client, 'rPush').resolves();
      const sendAgentOnlineEventStub = sandbox.stub(sendAgentOnlineEvent).resolves();

      // Act
      await authService.login(mockReq, mockRes);

      // Assert
      expect(lRangeStub.calledOnce).to.be.true;
      expect(rPushStub.called).to.be.false;
      expect(sendAgentOnlineEventStub.called).to.be.false;
      
      // Restore original method
      queryHandler.dispatch = originalDispatch;
    });
  });

  describe('login() - Hata Testleri', () => {
    it('kullanıcı bulunamadığında hata dönmeli', async () => {
      // Arrange
      const originalDispatch = queryHandler.dispatch;
      queryHandler.dispatch = sandbox.stub().resolves(null);

      // Act
      await authService.login(mockReq, mockRes);

      // Assert
      expect(mockRes.json.calledOnce).to.be.true;
      const responseCall = mockRes.json.getCall(0);
      expect(responseCall.args[0]).to.have.property('success', false);
      expect(responseCall.args[0]).to.have.property('message');
      
      // Restore original method
      queryHandler.dispatch = originalDispatch;
    });

    it('email doğrulanmamış kullanıcı ile login yapılamamalı', async () => {
      // Arrange
      const unverifiedUser = {
        ...mockUser,
        isEmailVerified: false,
        emailVerifiedAt: null,
        password: await bcrypt.hash('password123', 10)
      };

      const originalDispatch = queryHandler.dispatch;
      queryHandler.dispatch = sandbox.stub().resolves(unverifiedUser);

      // Act
      await authService.login(mockReq, mockRes);

      // Assert
      expect(mockRes.json.calledOnce).to.be.true;
      const responseCall = mockRes.json.getCall(0);
      expect(responseCall.args[0]).to.have.property('success', false);
      expect(responseCall.args[0]).to.have.property('message');
      
      // Restore original method
      queryHandler.dispatch = originalDispatch;
    });

    it('email doğrulanmış ama emailVerifiedAt null olan kullanıcı ile login yapılamamalı', async () => {
      // Arrange
      const unverifiedUser = {
        ...mockUser,
        isEmailVerified: true,
        emailVerifiedAt: null,
        password: await bcrypt.hash('password123', 10)
      };

      const originalDispatch = queryHandler.dispatch;
      queryHandler.dispatch = sandbox.stub().resolves(unverifiedUser);

      // Act
      await authService.login(mockReq, mockRes);

      // Assert
      expect(mockRes.json.calledOnce).to.be.true;
      const responseCall = mockRes.json.getCall(0);
      expect(responseCall.args[0]).to.have.property('success', false);
      expect(responseCall.args[0]).to.have.property('message');
      
      // Restore original method
      queryHandler.dispatch = originalDispatch;
    });

    it('aktif oturum varsa hata dönmeli', async () => {
      // Arrange
      const userWithHashedPassword = {
        ...mockUser,
        password: await bcrypt.hash('password123', 10)
      };

      const originalDispatch = queryHandler.dispatch;
      queryHandler.dispatch = sandbox.stub().resolves(userWithHashedPassword);
      sandbox.stub(JWTService, 'findActiveSession').resolves({ token: 'existing-token' });

      // Act
      await authService.login(mockReq, mockRes);

      // Assert
      expect(mockRes.json.calledOnce).to.be.true;
      const responseCall = mockRes.json.getCall(0);
      expect(responseCall.args[0]).to.have.property('success', false);
      expect(responseCall.args[0]).to.have.property('message');
      
      // Restore original method
      queryHandler.dispatch = originalDispatch;
    });

    it('yanlış şifre ile login yapılamamalı', async () => {
      // Arrange
      const userWithHashedPassword = {
        ...mockUser,
        password: await bcrypt.hash('wrongpassword', 10)
      };

      const originalDispatch = queryHandler.dispatch;
      queryHandler.dispatch = sandbox.stub().resolves(userWithHashedPassword);
      sandbox.stub(JWTService, 'findActiveSession').resolves(null);

      // Act
      await authService.login(mockReq, mockRes);

      // Assert
      expect(mockRes.json.calledOnce).to.be.true;
      const responseCall = mockRes.json.getCall(0);
      expect(responseCall.args[0]).to.have.property('success', false);
      expect(responseCall.args[0]).to.have.property('message');
      
      // Restore original method
      queryHandler.dispatch = originalDispatch;
    });
  });

  describe('login() - Servis İçi Kullanım Testleri', () => {
    it('response objesi olmadan çağrıldığında obje dönmeli', async () => {
      // Arrange
      const userWithHashedPassword = {
        ...mockUser,
        password: await bcrypt.hash('password123', 10)
      };

      const originalDispatch = queryHandler.dispatch;
      queryHandler.dispatch = sandbox.stub().resolves(userWithHashedPassword);
      
      sandbox.stub(JWTService, 'findActiveSession').resolves(null);
      sandbox.stub(JWTService, 'buildJWTPayload').returns({
        id: mockUser.id,
        email: mockUser.email,
        roleId: mockUser.role._id,
        roleName: mockUser.roleName
      });
      sandbox.stub(JWTService, 'generateAccessToken').returns('mock-access-token');
      sandbox.stub(JWTService, 'generateRefreshToken').returns('mock-refresh-token');
      sandbox.stub(JWTService, 'getTokenExpireDate').returns(new Date());
      sandbox.stub(JWTService, 'addActiveSession').resolves();
      sandbox.stub(cacheService.client, 'lRange').resolves([]);
      sandbox.stub(cacheService.client, 'rPush').resolves();
      sandbox.stub(sendAgentOnlineEvent).resolves();

      // Act
      const result = await authService.login(mockReq, null);

      // Assert
      expect(result).to.have.property('user');
      expect(result).to.have.property('accessToken');
      expect(result).to.have.property('refreshToken');
      expect(result).to.have.property('expireAt');
      
      // Restore original method
      queryHandler.dispatch = originalDispatch;
    });

    it('hata durumunda response objesi yoksa exception fırlatmalı', async () => {
      // Arrange
      const originalDispatch = queryHandler.dispatch;
      queryHandler.dispatch = sandbox.stub().rejects(new Error('Database error'));

      // Act & Assert
      try {
        await authService.login(mockReq, null);
        expect.fail('Exception fırlatılmalıydı');
      } catch (error) {
        expect(error).to.be.instanceOf(Error);
        expect(error.message).to.equal('Database error');
      }
      
      // Restore original method
      queryHandler.dispatch = originalDispatch;
    });
  });

  describe('login() - Edge Case Testleri', () => {
    it('boş email ile login yapılamamalı', async () => {
      // Arrange
      mockReq.body.email = '';

      // Act
      await authService.login(mockReq, mockRes);

      // Assert
      expect(mockRes.json.calledOnce).to.be.true;
      const responseCall = mockRes.json.getCall(0);
      expect(responseCall.args[0]).to.have.property('success', false);
    });

    it('boş şifre ile login yapılamamalı', async () => {
      // Arrange
      mockReq.body.password = '';

      // Act
      await authService.login(mockReq, mockRes);

      // Assert
      expect(mockRes.json.calledOnce).to.be.true;
      const responseCall = mockRes.json.getCall(0);
      expect(responseCall.args[0]).to.have.property('success', false);
    });

    it('null request body ile hata dönmeli', async () => {
      // Arrange
      mockReq.body = null;

      // Act
      await authService.login(mockReq, mockRes);

      // Assert
      expect(mockRes.json.calledOnce).to.be.true;
      const responseCall = mockRes.json.getCall(0);
      expect(responseCall.args[0]).to.have.property('success', false);
    });

    it('undefined request body ile hata dönmeli', async () => {
      // Arrange
      mockReq.body = undefined;

      // Act
      await authService.login(mockReq, mockRes);

      // Assert
      expect(mockRes.json.calledOnce).to.be.true;
      const responseCall = mockRes.json.getCall(0);
      expect(responseCall.args[0]).to.have.property('success', false);
    });
  });

  describe('login() - Redis Hata Testleri', () => {
    it('Redis bağlantı hatası durumunda login devam etmeli', async () => {
      // Arrange
      const customerSupporterUser = {
        ...mockUser,
        roleName: 'Customer Supporter',
        password: await bcrypt.hash('password123', 10)
      };

      const originalDispatch = queryHandler.dispatch;
      queryHandler.dispatch = sandbox.stub().resolves(customerSupporterUser);
      
      sandbox.stub(JWTService, 'findActiveSession').resolves(null);
      sandbox.stub(JWTService, 'buildJWTPayload').returns({
        id: customerSupporterUser.id,
        email: customerSupporterUser.email,
        roleId: customerSupporterUser.role._id,
        roleName: customerSupporterUser.roleName
      });
      sandbox.stub(JWTService, 'generateAccessToken').returns('mock-access-token');
      sandbox.stub(JWTService, 'generateRefreshToken').returns('mock-refresh-token');
      sandbox.stub(JWTService, 'getTokenExpireDate').returns(new Date());
      sandbox.stub(JWTService, 'addActiveSession').resolves();
      
      sandbox.stub(cacheService.client, 'lRange').rejects(new Error('Redis connection error'));
      sandbox.stub(sendAgentOnlineEvent).resolves();

      // Act
      await authService.login(mockReq, mockRes);

      // Assert
      expect(mockRes.json.calledOnce).to.be.true;
      const responseCall = mockRes.json.getCall(0);
      expect(responseCall.args[0]).to.have.property('success', true);
      
      // Restore original method
      queryHandler.dispatch = originalDispatch;
    });

    it('Kafka event gönderme hatası durumunda login devam etmeli', async () => {
      // Arrange
      const customerSupporterUser = {
        ...mockUser,
        roleName: 'Customer Supporter',
        password: await bcrypt.hash('password123', 10)
      };

      const originalDispatch = queryHandler.dispatch;
      queryHandler.dispatch = sandbox.stub().resolves(customerSupporterUser);
      
      sandbox.stub(JWTService, 'findActiveSession').resolves(null);
      sandbox.stub(JWTService, 'buildJWTPayload').returns({
        id: customerSupporterUser.id,
        email: customerSupporterUser.email,
        roleId: customerSupporterUser.role._id,
        roleName: customerSupporterUser.roleName
      });
      sandbox.stub(JWTService, 'generateAccessToken').returns('mock-access-token');
      sandbox.stub(JWTService, 'generateRefreshToken').returns('mock-refresh-token');
      sandbox.stub(JWTService, 'getTokenExpireDate').returns(new Date());
      sandbox.stub(JWTService, 'addActiveSession').resolves();
      
      sandbox.stub(cacheService.client, 'lRange').resolves([]);
      sandbox.stub(cacheService.client, 'rPush').resolves();
      sandbox.stub(sendAgentOnlineEvent).rejects(new Error('Kafka error'));

      // Act
      await authService.login(mockReq, mockRes);

      // Assert
      expect(mockRes.json.calledOnce).to.be.true;
      const responseCall = mockRes.json.getCall(0);
      expect(responseCall.args[0]).to.have.property('success', true);
      
      // Restore original method
      queryHandler.dispatch = originalDispatch;
    });
  });
});
