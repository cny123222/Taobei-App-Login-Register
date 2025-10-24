const request = require('supertest');
const app = require('../../src/app');
const Database = require('../../src/database');

describe('Authentication API', () => {
  let db;

  beforeAll(async () => {
    db = new Database();
    await db.init();
  });

  afterAll(async () => {
    if (db) {
      await db.close();
    }
  });

  beforeEach(async () => {
    // 清理测试数据
    await db.clearTestData();
  });

  describe('POST /api/auth/send-verification-code', () => {
    it('应该成功发送验证码给有效手机号', async () => {
      const response = await request(app)
        .post('/api/auth/send-verification-code')
        .send({
          phoneNumber: '13812345678'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', '验证码发送成功');
      expect(response.body).toHaveProperty('countdown', 60);
    });

    it('应该拒绝无效的手机号格式', async () => {
      const response = await request(app)
        .post('/api/auth/send-verification-code')
        .send({
          phoneNumber: '12345'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', '请输入正确的手机号码');
    });

    it('应该拒绝空的手机号', async () => {
      const response = await request(app)
        .post('/api/auth/send-verification-code')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', '请输入正确的手机号码');
    });

    it('应该限制同一手机号的发送频率', async () => {
      const phoneNumber = '13812345678';
      
      // 第一次发送
      await request(app)
        .post('/api/auth/send-verification-code')
        .send({ phoneNumber });

      // 立即再次发送
      const response = await request(app)
        .post('/api/auth/send-verification-code')
        .send({ phoneNumber });

      expect(response.status).toBe(429);
      expect(response.body).toHaveProperty('error', '验证码发送过于频繁，请稍后再试');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // 预先创建用户
      await db.createUser('13812345678');
      await db.saveVerificationCode('13812345678', '123456');
    });

    it('应该成功登录已注册用户', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          phoneNumber: '13812345678',
          verificationCode: '123456'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', '登录成功');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('phoneNumber', '13812345678');
    });

    it('应该拒绝未注册的手机号', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          phoneNumber: '13987654321',
          verificationCode: '123456'
        });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', '该手机号未注册，请先完成注册');
    });

    it('应该拒绝错误的验证码', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          phoneNumber: '13812345678',
          verificationCode: '654321'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', '验证码错误或已过期');
    });

    it('应该拒绝无效的手机号格式', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          phoneNumber: '12345',
          verificationCode: '123456'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', '请输入正确的手机号码');
    });

    it('应该拒绝空的验证码', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          phoneNumber: '13812345678',
          verificationCode: ''
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', '请输入验证码');
    });
  });

  describe('POST /api/auth/register', () => {
    beforeEach(async () => {
      // 预先保存验证码
      await db.saveVerificationCode('13812345678', '123456');
    });

    it('应该成功注册新用户', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          phoneNumber: '13812345678',
          verificationCode: '123456',
          agreeToTerms: true
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', '注册成功');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('phoneNumber', '13812345678');
    });

    it('应该拒绝未同意用户协议的注册', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          phoneNumber: '13812345678',
          verificationCode: '123456',
          agreeToTerms: false
        });

      expect(response.status).toBe(422);
      expect(response.body).toHaveProperty('error', '请同意用户协议');
    });

    it('应该拒绝已注册的手机号', async () => {
      // 先注册一次
      await db.createUser('13812345678');

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          phoneNumber: '13812345678',
          verificationCode: '123456',
          agreeToTerms: true
        });

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('error', '该手机号已注册，请直接登录');
    });

    it('应该拒绝错误的验证码', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          phoneNumber: '13812345678',
          verificationCode: '654321',
          agreeToTerms: true
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', '验证码错误或已过期');
    });

    it('应该拒绝无效的手机号格式', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          phoneNumber: '12345',
          verificationCode: '123456',
          agreeToTerms: true
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', '请输入正确的手机号码');
    });
  });
});