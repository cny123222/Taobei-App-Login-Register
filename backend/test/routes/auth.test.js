const request = require('supertest');
const app = require('../../src/app');
const { resetDatabase } = require('../../src/db-instance');

describe('Auth Routes', () => {
  afterAll(() => {
    resetDatabase();
  });
  describe('API-POST-SendVerificationCode', () => {
    test('应该能够发送验证码到指定手机号', async () => {
      const requestData = {
        phoneNumber: '13812345678',
        countryCode: '+86'
      };

      const response = await request(app)
        .post('/api/auth/send-verification-code')
        .send(requestData)
        .expect(200);

      expect(response.body.message).toBe('验证码已发送');
      expect(response.body.expiresIn).toBe(60);
    });

    test('应该验证手机号格式', async () => {
      const requestData = {
        phoneNumber: '', // 空手机号
        countryCode: '+86'
      };

      const response = await request(app)
        .post('/api/auth/send-verification-code')
        .send(requestData)
        .expect(400);

      expect(response.body.error).toBe('请输入正确的手机号码');
    });

    test('应该处理不同的国家代码', async () => {
      const requestData = {
        phoneNumber: '1234567890',
        countryCode: '+1'
      };

      const response = await request(app)
        .post('/api/auth/send-verification-code')
        .send(requestData)
        .expect(400);

      expect(response.body.error).toBe('请输入正确的手机号码');
    });

    test('应该处理默认国家代码', async () => {
      const requestData = {
        phoneNumber: '13812345678'
        // 不提供countryCode，应该使用默认值+86
      };

      const response = await request(app)
        .post('/api/auth/send-verification-code')
        .send(requestData)
        .expect(200);

      expect(response.body.message).toBe('验证码已发送');
      expect(response.body.expiresIn).toBe(60);
    });
  });

  describe('API-POST-Login', () => {
    test('应该能够使用手机号和验证码进行登录', async () => {
      // 首先注册用户
      await request(app)
        .post('/api/auth/send-verification-code')
        .send({
          phoneNumber: '13812345678',
          countryCode: '+86'
        });

      await request(app)
        .post('/api/auth/register')
        .send({
          phoneNumber: '13812345678',
          verificationCode: '123456',
          countryCode: '+86',
          agreeToTerms: true
        });

      // 然后发送验证码进行登录
      await request(app)
        .post('/api/auth/send-verification-code')
        .send({
          phoneNumber: '13812345678',
          countryCode: '+86'
        });

      const requestData = {
        phoneNumber: '13812345678',
        verificationCode: '123456',
        countryCode: '+86'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(requestData)
        .expect(200);

      expect(response.body.token).toBeDefined();
      expect(response.body.user).toBeDefined();
      expect(response.body.user.phoneNumber).toBe('13812345678');
    });

    test('应该验证必需的字段', async () => {
      const requestData = {
        phoneNumber: '13812345678'
        // 缺少verificationCode
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(requestData)
        .expect(400);

      expect(response.body.error).toBe('请输入正确的手机号码');
    });

    test('应该拒绝错误的验证码', async () => {
      const requestData = {
        phoneNumber: '13812345678',
        verificationCode: '000000', // 错误的验证码
        countryCode: '+86'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(requestData)
        .expect(400);

      expect(response.body.error).toBe('验证码错误或已过期');
    });

    test('应该拒绝不存在的用户', async () => {
      const requestData = {
        phoneNumber: '13999999999',
        verificationCode: '123456',
        countryCode: '+86'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(requestData)
        .expect(400);

      expect(response.body.error).toBe('验证码错误或已过期');
    });
  });

  describe('API-POST-Register', () => {
    test('应该能够注册新用户', async () => {
      // 首先发送验证码
      await request(app)
        .post('/api/auth/send-verification-code')
        .send({
          phoneNumber: '13987654321',
          countryCode: '+86'
        });

      const requestData = {
        phoneNumber: '13987654321',
        verificationCode: '123456',
        countryCode: '+86',
        agreeToTerms: true
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(requestData)
        .expect(201);

      expect(response.body.token).toBeDefined();
      expect(response.body.user).toBeDefined();
      expect(response.body.user.phoneNumber).toBe('13987654321');
    });

    test('应该验证服务条款同意', async () => {
      const requestData = {
        phoneNumber: '13812345678',
        verificationCode: '123456',
        countryCode: '+86',
        agreeToTerms: false // 未同意服务条款
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(requestData)
        .expect(400);

      expect(response.body.error).toBe('必须同意服务条款');
    });

    test('应该拒绝已注册的手机号', async () => {
      // 首先发送验证码
      await request(app)
        .post('/api/auth/send-verification-code')
        .send({
          phoneNumber: '13555666777',
          countryCode: '+86'
        });

      const requestData = {
        phoneNumber: '13555666777',
        verificationCode: '123456',
        countryCode: '+86',
        agreeToTerms: true
      };

      // 第一次注册
      await request(app)
        .post('/api/auth/register')
        .send(requestData)
        .expect(201);

      // 为第二次注册重新发送验证码
      await request(app)
        .post('/api/auth/send-verification-code')
        .send({
          phoneNumber: '13555666777',
          countryCode: '+86'
        });

      // 第二次注册相同手机号
      const response = await request(app)
        .post('/api/auth/register')
        .send(requestData)
        .expect(400);

      expect(response.body.error).toBe('该手机号已注册');
    });

    test('应该验证验证码', async () => {
      const requestData = {
        phoneNumber: '13812345678',
        verificationCode: '000000', // 错误的验证码
        countryCode: '+86',
        agreeToTerms: true
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(requestData)
        .expect(400);

      expect(response.body.error).toBe('验证码错误或已过期');
    });
  });

  describe('API-GET-UserProfile', () => {
    test('应该能够获取用户信息', async () => {
      // 首先注册一个用户获取token
      await request(app)
        .post('/api/auth/send-verification-code')
        .send({
          phoneNumber: '13999888777',
          countryCode: '+86'
        });

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          phoneNumber: '13999888777',
          verificationCode: '123456',
          countryCode: '+86',
          agreeToTerms: true
        });

      const token = registerResponse.body.token;

      const response = await request(app)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.phoneNumber).toBe('13999888777');
      expect(response.body.countryCode).toBe('+86');
    });

    test('应该验证用户身份认证', async () => {
      const response = await request(app)
        .get('/api/user/profile')
        // 不提供认证token
        .expect(401);

      expect(response.body.error).toBe('未授权访问');
    });

    test('应该拒绝无效的token', async () => {
      const response = await request(app)
        .get('/api/user/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.error).toBe('未授权访问');
    });
  });
});