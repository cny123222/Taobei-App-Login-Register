const request = require('supertest');
const app = require('../../src/app');
const databaseManager = require('../../src/models/databaseManager');

let db;describe('Integration Tests', () => {
  let db;

  beforeAll(async () => {
    db = await databaseManager.getInstance();
  });

  beforeEach(async () => {
    try {
      await db.run('DELETE FROM users');
      await db.run('DELETE FROM verification_codes');
    } catch (error) {
      console.error('清理数据库失败:', error);
    }
  });

  afterAll(async () => {
    databaseManager.closeInstance();
  });

  describe('健康检查接口', () => {
    it('应该返回服务状态正常', async () => {
      // When: 调用健康检查接口
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      // Then: 应该返回正确的状态信息
      expect(response.body).toEqual({
        status: 'ok',
        message: '服务运行正常'
      });
    });
  });

  describe('发送验证码接口集成测试', () => {
    it('应该成功发送验证码给新用户', async () => {
      // Given: 新用户手机号
      const phone = '13800138001';

      // When: 发送验证码
      const response = await request(app)
        .post('/api/auth/send-verification-code')
        .send({ phone, type: 'register' })
        .expect(200);

      // Then: 应该返回成功响应
      expect(response.body).toEqual({
        success: true,
        message: '验证码发送成功',
        countdown: 300
      });

      // And: 验证码应该被保存到数据库
      const codes = await db.all('SELECT * FROM verification_codes WHERE phone = ?', [phone]);
      expect(codes).toHaveLength(1);
      expect(codes[0].phone).toBe(phone);
      expect(codes[0].type).toBe('register');
      expect(codes[0].used).toBe(0);
    });

    it('应该成功发送验证码给已存在用户', async () => {
      // Given: 已存在的用户
      const phone = '13800138002';
      await db.run(
        'INSERT INTO users (phone, created_at) VALUES (?, ?)',
        [phone, new Date().toISOString()]
      );

      // When: 发送登录验证码
      const response = await request(app)
        .post('/api/auth/send-verification-code')
        .send({ phone, type: 'login' })
        .expect(200);

      // Then: 应该返回成功响应
      expect(response.body).toEqual({
        success: true,
        message: '验证码发送成功',
        countdown: 300
      });
    });

    it('应该拒绝无效的手机号格式', async () => {
      // When: 发送无效手机号
      const response = await request(app)
        .post('/api/auth/send-verification-code')
        .send({ phone: '123', type: 'register' })
        .expect(400);

      // Then: 应该返回错误响应
      expect(response.body).toEqual({
        success: false,
        message: '手机号格式不正确'
      });
    });

    it('应该拒绝缺少必填字段的请求', async () => {
      // When: 发送缺少字段的请求
      const response = await request(app)
        .post('/api/auth/send-verification-code')
        .send({ phone: '13800138001' }) // 缺少type字段
        .expect(400);

      // Then: 应该返回错误响应
      expect(response.body).toEqual({
        success: false,
        message: '类型参数无效'
      });
    });
  });

  describe('用户注册接口集成测试', () => {
    it('应该成功注册新用户', async () => {
      // Given: 有效的验证码
      const phone = '13800138003';
      const code = '123456';
      
      // 先创建验证码
      await db.run(
        'INSERT INTO verification_codes (phone, code, type, expires_at, created_at) VALUES (?, ?, ?, ?, ?)',
        [phone, code, 'register', new Date(Date.now() + 300000).toISOString(), new Date().toISOString()]
      );

      // When: 注册用户
      const response = await request(app)
        .post('/api/auth/register')
        .send({ phone, code })
        .expect(201);

      // Then: 应该返回成功响应和token
      expect(response.body).toEqual({
        success: true,
        message: '注册成功',
        token: expect.any(String),
        user: {
          id: expect.any(Number),
          phone: phone
        }
      });

      // And: 用户应该被创建
      const users = await db.all('SELECT * FROM users WHERE phone = ?', [phone]);
      expect(users).toHaveLength(1);
      expect(users[0].phone).toBe(phone);

      // And: 验证码应该被标记为已使用
      const codes = await db.all('SELECT * FROM verification_codes WHERE phone = ? AND code = ?', [phone, code]);
      expect(codes[0].used).toBe(1);
    });

    it('应该拒绝重复注册', async () => {
      // Given: 已存在的用户和有效验证码
      const phone = '13800138004';
      const code = '123456';
      
      await db.run(
        'INSERT INTO users (phone, created_at) VALUES (?, ?)',
        [phone, new Date().toISOString()]
      );
      
      await db.run(
        'INSERT INTO verification_codes (phone, code, type, expires_at, created_at) VALUES (?, ?, ?, ?, ?)',
        [phone, code, 'register', new Date(Date.now() + 300000).toISOString(), new Date().toISOString()]
      );

      // When: 尝试重复注册
      const response = await request(app)
        .post('/api/auth/register')
        .send({ phone, code })
        .expect(409);

      // Then: 应该返回错误响应
      expect(response.body).toEqual({
        success: false,
        message: '用户已存在，请直接登录'
      });
    });

    it('应该拒绝无效的验证码', async () => {
      // Given: 新用户手机号
      const phone = '13800138005';

      // When: 使用无效验证码注册
      const response = await request(app)
        .post('/api/auth/register')
        .send({ phone, code: '999999' })
        .expect(400);

      // Then: 应该返回错误响应
      expect(response.body).toEqual({
        success: false,
        message: '验证码无效或已过期'
      });
    });
  });

  describe('用户登录接口集成测试', () => {
    it('应该成功登录已存在用户', async () => {
      // Given: 已存在的用户和有效验证码
      const phone = '13800138006';
      const code = '123456';
      
      await db.run(
        'INSERT INTO users (phone, created_at) VALUES (?, ?)',
        [phone, new Date().toISOString()]
      );
      
      await db.run(
        'INSERT INTO verification_codes (phone, code, type, expires_at, created_at) VALUES (?, ?, ?, ?, ?)',
        [phone, code, 'login', new Date(Date.now() + 300000).toISOString(), new Date().toISOString()]
      );

      // When: 登录用户
      const response = await request(app)
        .post('/api/auth/login')
        .send({ phone, code })
        .expect(200);

      // Then: 应该返回成功响应和token
      expect(response.body).toEqual({
        success: true,
        message: '登录成功',
        token: expect.any(String),
        user: {
          id: expect.any(Number),
          phone: phone,
          created_at: expect.any(String)
        }
      });

      // And: 验证码应该被标记为已使用
      const codes = await db.all('SELECT * FROM verification_codes WHERE phone = ? AND code = ?', [phone, code]);
      expect(codes[0].used).toBe(1);
    });

    it('应该为不存在的用户自动创建账户并登录', async () => {
      // Given: 不存在的用户手机号，但先发送验证码
      const phone = '13800138007';
      
      // 先发送验证码
      await request(app)
        .post('/api/auth/send-verification-code')
        .send({ phone, type: 'login' })
        .expect(200);

      // 获取验证码
      const codes = await db.all('SELECT * FROM verification_codes WHERE phone = ? AND type = ? ORDER BY created_at DESC LIMIT 1', [phone, 'login']);
      const code = codes[0].code;

      // When: 尝试登录
      const response = await request(app)
        .post('/api/auth/login')
        .send({ phone, code })
        .expect(200);

      // Then: 应该自动创建用户并登录成功
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.user.phone).toBe(phone);
      expect(response.body.user.created_at).toBeDefined();
    });
  });

  describe('完整用户流程集成测试', () => {
    it('应该完成完整的注册流程', async () => {
      const phone = '13800138008';
      
      // Step 1: 发送注册验证码
      const sendCodeResponse = await request(app)
        .post('/api/auth/send-verification-code')
        .send({ phone, type: 'register' })
        .expect(200);

      expect(sendCodeResponse.body.success).toBe(true);

      // Step 2: 获取生成的验证码
      const codes = await db.all('SELECT * FROM verification_codes WHERE phone = ? ORDER BY created_at DESC LIMIT 1', [phone]);
      const generatedCode = codes[0].code;

      // Step 3: 使用验证码注册
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({ phone, code: generatedCode })
        .expect(201);

      expect(registerResponse.body.success).toBe(true);
      expect(registerResponse.body.token).toBeDefined();
      expect(registerResponse.body.user.id).toBeDefined();
      expect(registerResponse.body.user.phone).toBe(phone);
    });

    it('应该完成完整的登录流程', async () => {
      const phone = '13800138009';
      
      // Step 1: 先注册用户
      await db.run(
        'INSERT INTO users (phone, created_at) VALUES (?, ?)',
        [phone, new Date().toISOString()]
      );

      // Step 2: 发送登录验证码
      const sendCodeResponse = await request(app)
        .post('/api/auth/send-verification-code')
        .send({ phone, type: 'login' })
        .expect(200);

      expect(sendCodeResponse.body.success).toBe(true);

      // Step 3: 获取生成的验证码
      const codes = await db.all('SELECT * FROM verification_codes WHERE phone = ? ORDER BY created_at DESC LIMIT 1', [phone]);
      const generatedCode = codes[0].code;

      // Step 4: 使用验证码登录
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ phone, code: generatedCode })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
      expect(loginResponse.body.token).toBeDefined();
      expect(loginResponse.body.user.id).toBeDefined();
      expect(loginResponse.body.user.phone).toBe(phone);
    });
  });

  describe('错误处理集成测试', () => {
    it('应该正确处理无效手机号', async () => {
      // When: 发送无效手机号
      const response = await request(app)
        .post('/api/auth/send-verification-code')
        .send({ phone: '123', type: 'register' });

      // Then: 应该返回400错误
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('手机号格式不正确');
    });

    it('应该正确处理无效的JSON请求', async () => {
      // When: 发送无效JSON
      const response = await request(app)
        .post('/api/auth/send-verification-code')
        .set('Content-Type', 'application/json')
        .send('invalid json');

      // Then: 应该返回400错误
      expect(response.status).toBe(400);
    });

    it('应该正确处理不存在的路由', async () => {
      // When: 访问不存在的路由
      const response = await request(app)
        .get('/api/nonexistent')
        .expect(404);

      // Then: 应该返回404错误
      expect(response.body).toEqual({
        success: false,
        message: '接口不存在'
      });
    });
  });

  describe('CORS和安全性集成测试', () => {
    it('应该正确设置CORS头', async () => {
      // When: 发送跨域请求
      const response = await request(app)
        .get('/api/health')
        .set('Origin', 'http://localhost:5173');

      // Then: 应该包含CORS头
      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });

    it('应该正确处理OPTIONS预检请求', async () => {
      // When: 发送OPTIONS请求
      const response = await request(app)
        .options('/api/auth/send-verification-code')
        .set('Origin', 'http://localhost:5173')
        .set('Access-Control-Request-Method', 'POST');

      // Then: 应该返回正确的预检响应
      expect(response.status).toBe(204);
      expect(response.headers['access-control-allow-methods']).toBeDefined();
    });
  });
});