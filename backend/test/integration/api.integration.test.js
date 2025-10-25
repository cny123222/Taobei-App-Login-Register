const request = require('supertest');
const { app } = require('../../src/app');
const Database = require('../../src/database');

describe('API Integration Tests', () => {
  let server;
  let database;

  beforeAll(async () => {
    // 创建独立的测试数据库实例
    database = new Database(':memory:');
    await database.initialize();
    app.locals.database = database;
    
    // 启动测试服务器
    server = app.listen(0); // 使用随机端口
  });

  afterAll(async () => {
    // 清理资源
    if (database) {
      await database.close();
    }
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  beforeEach(async () => {
    // 每个测试前清理数据库
    if (database && database.db) {
      try {
        await new Promise((resolve, reject) => {
          database.db.run('DELETE FROM users', (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
        await new Promise((resolve, reject) => {
          database.db.run('DELETE FROM verification_codes', (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      } catch (err) {
        console.warn('清理数据库时出错:', err.message);
      }
    }
  });

  describe('健康检查端点', () => {
    it('应该返回服务器状态', async () => {
      // When: 请求健康检查端点
      const response = await request(app)
        .get('/health')
        .expect(200);

      // Then: 应该返回正确的状态
      expect(response.body).toEqual({
        status: 'ok',
        timestamp: expect.any(String),
        service: 'taobei-backend'
      });
    });

    it('应该在服务器运行时始终可用', async () => {
      // When: 多次请求健康检查
      const requests = Array(5).fill().map(() => 
        request(app).get('/health').expect(200)
      );

      // Then: 所有请求都应该成功
      const responses = await Promise.all(requests);
      responses.forEach(response => {
        expect(response.body.status).toBe('ok');
      });
    });
  });

  describe('验证码发送API集成测试', () => {
    it('应该成功发送验证码', async () => {
      // Given: 有效的手机号
      const phoneNumber = '13812345678';

      // When: 发送验证码请求
      const response = await request(app)
        .post('/api/auth/send-verification-code')
        .send({ phoneNumber })
        .expect(200);

      // Then: 应该返回成功响应
      expect(response.body).toEqual({
        success: true,
        message: '验证码已发送',
        expiresIn: 300
      });
    });

    it('应该拒绝无效的手机号格式', async () => {
      // Given: 无效的手机号
      const invalidPhones = ['123', '1234567890123', 'abc', ''];

      for (const phoneNumber of invalidPhones) {
        // When: 发送验证码请求
        const response = await request(app)
          .post('/api/auth/send-verification-code')
          .send({ phoneNumber })
          .expect(400);

        // Then: 应该返回错误响应
        expect(response.body).toEqual({
          success: false,
          message: '手机号格式不正确'
        });
      }
    });

    it('应该实施速率限制', async () => {
      // Given: 有效的手机号
      const phoneNumber = '13812345678';

      // When: 快速连续发送多个请求
      const requests = Array(6).fill().map(() =>
        request(app)
          .post('/api/auth/send-verification-code')
          .send({ phoneNumber })
      );

      const responses = await Promise.all(requests);

      // Then: 前5个请求应该成功，第6个应该被限制
      const successCount = responses.filter(r => r.status === 200).length;
      const rateLimitedCount = responses.filter(r => r.status === 429).length;

      expect(successCount).toBeLessThanOrEqual(5);
      expect(rateLimitedCount).toBeGreaterThan(0);
    });

    it('应该处理数据库错误', async () => {
      // Given: 数据库连接断开
      await database.close();

      // When: 尝试发送验证码
      const response = await request(app)
        .post('/api/auth/send-verification-code')
        .send({ phoneNumber: '13812345678' })
        .expect(500);

      // Then: 应该返回服务器错误
      expect(response.body).toEqual({
        success: false,
        message: '服务器内部错误'
      });

      // 恢复数据库连接
      database = new Database(':memory:');
      await database.initialize();
      app.locals.database = database;
    });
  });

  describe('用户登录API集成测试', () => {
    beforeEach(async () => {
      // 预先创建测试用户和验证码
      await database.createUser('13812345678');
      await database.generateVerificationCode('13812345678');
    });

    it('应该成功登录已注册用户', async () => {
      // Given: 已注册用户和有效验证码
      const phoneNumber = '13812345678';
      const verificationCode = '123456'; // 假设这是生成的验证码

      // When: 发送登录请求
      const response = await request(app)
        .post('/api/auth/login')
        .send({ phoneNumber, verificationCode })
        .expect(200);

      // Then: 应该返回成功响应和token
      expect(response.body).toEqual({
        success: true,
        message: '登录成功',
        token: expect.any(String),
        user: {
          phoneNumber: '13812345678',
          id: expect.any(Number)
        }
      });
    });

    it('应该拒绝未注册用户登录', async () => {
      // Given: 未注册的手机号
      const phoneNumber = '13987654321';
      const verificationCode = '123456';

      // When: 发送登录请求
      const response = await request(app)
        .post('/api/auth/login')
        .send({ phoneNumber, verificationCode })
        .expect(400);

      // Then: 应该返回错误响应
      expect(response.body).toEqual({
        success: false,
        message: '用户不存在，请先注册'
      });
    });

    it('应该拒绝无效验证码', async () => {
      // Given: 已注册用户但无效验证码
      const phoneNumber = '13812345678';
      const verificationCode = '000000';

      // When: 发送登录请求
      const response = await request(app)
        .post('/api/auth/login')
        .send({ phoneNumber, verificationCode })
        .expect(400);

      // Then: 应该返回错误响应
      expect(response.body).toEqual({
        success: false,
        message: '验证码无效或已过期'
      });
    });

    it('应该验证必需字段', async () => {
      // Given: 缺少必需字段的请求
      const testCases = [
        { phoneNumber: '13812345678' }, // 缺少验证码
        { verificationCode: '123456' }, // 缺少手机号
        {} // 两个都缺少
      ];

      for (const testCase of testCases) {
        // When: 发送不完整的登录请求
        const response = await request(app)
          .post('/api/auth/login')
          .send(testCase)
          .expect(400);

        // Then: 应该返回验证错误
        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('必需');
      }
    });
  });

  describe('用户注册API集成测试', () => {
    beforeEach(async () => {
      // 为测试手机号生成验证码
      await database.generateVerificationCode('13812345678');
    });

    it('应该成功注册新用户', async () => {
      // Given: 新用户信息和有效验证码
      const phoneNumber = '13812345678';
      const verificationCode = '123456';
      const agreeToTerms = true;

      // When: 发送注册请求
      const response = await request(app)
        .post('/api/auth/register')
        .send({ phoneNumber, verificationCode, agreeToTerms })
        .expect(201);

      // Then: 应该返回成功响应和token
      expect(response.body).toEqual({
        success: true,
        message: '注册成功',
        token: expect.any(String),
        user: {
          phoneNumber: '13812345678',
          id: expect.any(Number)
        }
      });
    });

    it('应该拒绝已注册用户重复注册', async () => {
      // Given: 已注册的用户
      await database.createUser('13812345678');
      const phoneNumber = '13812345678';
      const verificationCode = '123456';
      const agreeToTerms = true;

      // When: 尝试重复注册
      const response = await request(app)
        .post('/api/auth/register')
        .send({ phoneNumber, verificationCode, agreeToTerms })
        .expect(400);

      // Then: 应该返回错误响应
      expect(response.body).toEqual({
        success: false,
        message: '用户已存在'
      });
    });

    it('应该要求同意服务条款', async () => {
      // Given: 未同意服务条款的注册请求
      const phoneNumber = '13812345678';
      const verificationCode = '123456';
      const agreeToTerms = false;

      // When: 发送注册请求
      const response = await request(app)
        .post('/api/auth/register')
        .send({ phoneNumber, verificationCode, agreeToTerms })
        .expect(400);

      // Then: 应该返回错误响应
      expect(response.body).toEqual({
        success: false,
        message: '必须同意服务条款才能注册'
      });
    });

    it('应该验证验证码有效性', async () => {
      // Given: 无效验证码的注册请求
      const phoneNumber = '13812345678';
      const verificationCode = '000000';
      const agreeToTerms = true;

      // When: 发送注册请求
      const response = await request(app)
        .post('/api/auth/register')
        .send({ phoneNumber, verificationCode, agreeToTerms })
        .expect(400);

      // Then: 应该返回错误响应
      expect(response.body).toEqual({
        success: false,
        message: '验证码无效或已过期'
      });
    });

    it('应该验证所有必需字段', async () => {
      // Given: 各种不完整的注册请求
      const testCases = [
        { phoneNumber: '13812345678', verificationCode: '123456' }, // 缺少agreeToTerms
        { phoneNumber: '13812345678', agreeToTerms: true }, // 缺少验证码
        { verificationCode: '123456', agreeToTerms: true }, // 缺少手机号
        {} // 全部缺少
      ];

      for (const testCase of testCases) {
        // When: 发送不完整的注册请求
        const response = await request(app)
          .post('/api/auth/register')
          .send(testCase)
          .expect(400);

        // Then: 应该返回验证错误
        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('必需');
      }
    });
  });

  describe('CORS和中间件集成测试', () => {
    it('应该正确处理CORS预检请求', async () => {
      // When: 发送OPTIONS预检请求
      const response = await request(app)
        .options('/api/auth/login')
        .set('Origin', 'http://localhost:5173')
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'Content-Type')
        .expect(204);

      // Then: 应该返回正确的CORS头
      expect(response.headers['access-control-allow-origin']).toBe('*');
      expect(response.headers['access-control-allow-methods']).toContain('POST');
      expect(response.headers['access-control-allow-headers']).toContain('Content-Type');
    });

    it('应该正确解析JSON请求体', async () => {
      // Given: JSON格式的请求
      const requestData = { phoneNumber: '13812345678' };

      // When: 发送JSON请求
      const response = await request(app)
        .post('/api/auth/send-verification-code')
        .send(requestData)
        .expect(200);

      // Then: 应该正确解析并处理请求
      expect(response.body.success).toBe(true);
    });

    it('应该处理无效的JSON格式', async () => {
      // When: 发送无效JSON
      const response = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);

      // Then: 应该返回JSON解析错误
      expect(response.body.success).toBe(false);
    });
  });

  describe('错误处理集成测试', () => {
    it('应该处理404错误', async () => {
      // When: 请求不存在的端点
      const response = await request(app)
        .get('/api/nonexistent')
        .expect(404);

      // Then: 应该返回404错误
      expect(response.body).toEqual({
        success: false,
        message: '接口不存在'
      });
    });

    it('应该处理服务器内部错误', async () => {
      // Given: 模拟服务器错误的情况
      // 这个测试需要实际的错误处理实现
      
      // When: 触发服务器错误
      // 例如：数据库连接失败、文件系统错误等
      
      // Then: 应该返回500错误和适当的错误消息
      // 这个测试的具体实现取决于错误处理机制
    });

    it('应该记录错误日志', async () => {
      // Given: 会产生错误的请求
      const response = await request(app)
        .post('/api/auth/login')
        .send({ phoneNumber: 'invalid' })
        .expect(400);

      // Then: 应该记录错误（这需要日志系统的实现）
      expect(response.body.success).toBe(false);
    });
  });

  describe('数据库事务集成测试', () => {
    beforeEach(async () => {
      // 确保数据库连接正常
      if (!database || !database.db) {
        database = new Database(':memory:');
        await database.initialize();
        app.locals.database = database;
      }
    });

    it('应该在注册过程中保持数据一致性', async () => {
      // Given: 注册请求
      await database.generateVerificationCode('13812345678');
      const phoneNumber = '13812345678';
      const verificationCode = '123456';
      const agreeToTerms = true;

      // When: 执行注册
      const response = await request(app)
        .post('/api/auth/register')
        .send({ phoneNumber, verificationCode, agreeToTerms })
        .expect(201);

      // Then: 用户应该被正确创建
      const user = await database.findUserByPhone(phoneNumber);
      expect(user).toBeTruthy();
      expect(user.phoneNumber).toBe(phoneNumber);
    });

    it('应该在验证码过期后清理数据', async () => {
      // Given: 过期的验证码
      await database.generateVerificationCode('13812345678');
      
      // 模拟时间过期（这需要实际的过期机制实现）
      
      // When: 尝试使用过期验证码
      const response = await request(app)
        .post('/api/auth/login')
        .send({ phoneNumber: '13812345678', verificationCode: '123456' })
        .expect(400);

      // Then: 应该拒绝过期验证码
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('过期');
    });
  });

  describe('并发请求处理测试', () => {
    beforeEach(async () => {
      // 确保数据库连接正常
      if (!database || !database.db) {
        database = new Database(':memory:');
        await database.initialize();
        app.locals.database = database;
      }
    });

    it('应该正确处理并发注册请求', async () => {
      // Given: 多个并发注册请求
      await database.generateVerificationCode('13812345678');
      const requests = Array(3).fill().map(() =>
        request(app)
          .post('/api/auth/register')
          .send({
            phoneNumber: '13812345678',
            verificationCode: '123456',
            agreeToTerms: true
          })
      );

      // When: 并发执行请求
      const responses = await Promise.all(requests);

      // Then: 只有一个请求应该成功
      const successCount = responses.filter(r => r.status === 201).length;
      const errorCount = responses.filter(r => r.status === 400).length;

      expect(successCount).toBe(1);
      expect(errorCount).toBe(2);
    });

    it('应该正确处理并发验证码请求', async () => {
      // Given: 多个并发验证码请求
      const requests = Array(3).fill().map(() =>
        request(app)
          .post('/api/auth/send-verification-code')
          .send({ phoneNumber: '13812345678' })
      );

      // When: 并发执行请求
      const responses = await Promise.all(requests);

      // Then: 应该正确处理所有请求（考虑速率限制）
      const successCount = responses.filter(r => r.status === 200).length;
      expect(successCount).toBeGreaterThan(0);
    });
  });
});