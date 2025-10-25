const databaseManager = require('../../src/models/databaseManager');

describe('Database', () => {
  let db;

  beforeEach(async () => {
    db = await databaseManager.getInstance();
  });

  afterEach(() => {
    // 不在这里关闭数据库，因为使用的是单例
  });

  describe('DB-FindUserByPhone', () => {
    it('应该能够根据手机号查找存在的用户', async () => {
      // Given: 数据库中存在用户
      const testPhone = '13800138001';
      await db.createUser(testPhone);

      // When: 根据手机号查找用户
      const user = await db.findUserByPhone(testPhone);

      // Then: 应该返回用户信息
      expect(user).toBeDefined();
      expect(user.phone).toBe(testPhone);
      expect(user.id).toBeDefined();
      expect(user.created_at).toBeDefined();
    });

    it('应该在用户不存在时返回undefined', async () => {
      // Given: 数据库中不存在该用户
      const nonExistentPhone = '13800138999';

      // When: 根据手机号查找用户
      const user = await db.findUserByPhone(nonExistentPhone);

      // Then: 应该返回undefined
      expect(user).toBeUndefined();
    });

    it('应该处理无效的手机号格式', async () => {
      // Given: 无效的手机号
      const invalidPhone = 'invalid-phone';

      // When: 根据手机号查找用户
      const user = await db.findUserByPhone(invalidPhone);

      // Then: 应该返回undefined
      expect(user).toBeUndefined();
    });
  });

  describe('DB-CreateUser', () => {
    it('应该能够创建新用户并返回用户信息', async () => {
      // Given: 有效的手机号
      const testPhone = '13800138002';

      // When: 创建用户
      const user = await db.createUser(testPhone);

      // Then: 应该返回创建的用户信息
      expect(user).toBeDefined();
      expect(user.id).toBeDefined();
      expect(user.phone).toBe(testPhone);

      // And: 用户应该被保存到数据库
      const savedUser = await db.findUserByPhone(testPhone);
      expect(savedUser).toBeDefined();
      expect(savedUser.phone).toBe(testPhone);
    });

    it('应该拒绝创建重复手机号的用户', async () => {
      // Given: 数据库中已存在用户
      const testPhone = '13800138003';
      await db.createUser(testPhone);

      // When & Then: 尝试创建重复用户应该抛出错误
      await expect(db.createUser(testPhone)).rejects.toThrow();
    });

    it('应该拒绝空手机号', async () => {
      // Given: 空手机号
      const emptyPhone = '';

      // When & Then: 创建用户应该失败
      await expect(db.createUser(emptyPhone)).rejects.toThrow();
    });
  });

  describe('DB-CreateVerificationCode', () => {
    it('应该能够创建验证码记录', async () => {
      // Given: 验证码信息
      const phone = '13800138004';
      const code = '123456';
      const type = 'login';
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

      // When: 创建验证码
      const result = await db.createVerificationCode(phone, code, type, expiresAt);

      // Then: 应该返回创建的记录ID
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(typeof result.id).toBe('number');
    });

    it('应该允许同一手机号创建多个验证码', async () => {
      // Given: 同一手机号的多个验证码
      const phone = '13800138005';
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

      // When: 创建多个验证码
      const result1 = await db.createVerificationCode(phone, '123456', 'login', expiresAt);
      const result2 = await db.createVerificationCode(phone, '654321', 'register', expiresAt);

      // Then: 两个验证码都应该创建成功
      expect(result1.id).toBeDefined();
      expect(result2.id).toBeDefined();
      expect(result1.id).not.toBe(result2.id);
    });
  });

  describe('DB-VerifyCode', () => {
    it('应该能够验证有效的验证码', async () => {
      // Given: 有效的验证码
      const phone = '13800138006';
      const code = '123456';
      const type = 'login';
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
      
      await db.createVerificationCode(phone, code, type, expiresAt);

      // When: 验证验证码
      const result = await db.verifyCode(phone, code, type);

      // Then: 应该返回验证码记录
      expect(result).toBeDefined();
      expect(result.phone).toBe(phone);
      expect(result.code).toBe(code);
      expect(result.type).toBe(type);
      expect(result.used).toBe(0);
    });

    it('应该拒绝错误的验证码', async () => {
      // Given: 数据库中的验证码
      const phone = '13800138007';
      const correctCode = '123456';
      const wrongCode = '654321';
      const type = 'login';
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
      
      await db.createVerificationCode(phone, correctCode, type, expiresAt);

      // When: 使用错误的验证码
      const result = await db.verifyCode(phone, wrongCode, type);

      // Then: 应该返回null或undefined
      expect(result).toBeFalsy();
    });

    it('应该拒绝过期的验证码', async () => {
      // Given: 过期的验证码
      const phone = '13800138008';
      const code = '123456';
      const type = 'login';
      const expiredTime = new Date(Date.now() - 1000).toISOString(); // 1秒前过期
      
      await db.createVerificationCode(phone, code, type, expiredTime);

      // When: 验证过期的验证码
      const result = await db.verifyCode(phone, code, type);

      // Then: 应该返回null或undefined
      expect(result).toBeFalsy();
    });

    it('应该拒绝已使用的验证码', async () => {
      // Given: 已使用的验证码
      const phone = '13800138009';
      const code = '123456';
      const type = 'login';
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
      
      const created = await db.createVerificationCode(phone, code, type, expiresAt);
      await db.markCodeAsUsed(created.id);

      // When: 验证已使用的验证码
      const result = await db.verifyCode(phone, code, type);

      // Then: 应该返回null或undefined
      expect(result).toBeFalsy();
    });
  });

  describe('DB-MarkCodeAsUsed', () => {
    it('应该能够标记验证码为已使用', async () => {
      // Given: 未使用的验证码
      const phone = '13800138010';
      const code = '123456';
      const type = 'login';
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
      
      const created = await db.createVerificationCode(phone, code, type, expiresAt);

      // When: 标记为已使用
      await db.markCodeAsUsed(created.id);

      // Then: 验证码应该无法再次验证
      const result = await db.verifyCode(phone, code, type);
      expect(result).toBeFalsy();
    });

    it('应该处理不存在的验证码ID', async () => {
      // Given: 不存在的验证码ID
      const nonExistentId = 99999;

      // When & Then: 标记不存在的验证码不应该抛出错误
      await expect(db.markCodeAsUsed(nonExistentId)).resolves.not.toThrow();
    });
  });

  describe('DB-CleanupExpiredCodes', () => {
    it('应该能够清理过期的验证码', async () => {
      // Given: 过期和未过期的验证码
      const phone = '13800138011';
      const expiredTime = new Date(Date.now() - 1000).toISOString();
      const validTime = new Date(Date.now() + 5 * 60 * 1000).toISOString();
      
      await db.createVerificationCode(phone, '111111', 'login', expiredTime);
      await db.createVerificationCode(phone, '222222', 'login', validTime);

      // When: 清理过期验证码
      await db.cleanupExpiredCodes();

      // Then: 过期验证码应该被删除，有效验证码应该保留
      const expiredResult = await db.verifyCode(phone, '111111', 'login');
      const validResult = await db.verifyCode(phone, '222222', 'login');
      
      expect(expiredResult).toBeFalsy();
      expect(validResult).toBeDefined();
    });

    it('应该在没有过期验证码时正常执行', async () => {
      // Given: 没有过期的验证码
      const phone = '13800138012';
      const validTime = new Date(Date.now() + 5 * 60 * 1000).toISOString();
      
      await db.createVerificationCode(phone, '123456', 'login', validTime);

      // When & Then: 清理操作应该正常执行
      await expect(db.cleanupExpiredCodes()).resolves.not.toThrow();

      // And: 有效验证码应该保留
      const result = await db.verifyCode(phone, '123456', 'login');
      expect(result).toBeDefined();
    });
  });
});