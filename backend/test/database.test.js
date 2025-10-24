const Database = require('../src/database');
const fs = require('fs');
const path = require('path');

describe('Database Interface', () => {
  let db;
  const testDbPath = path.join(__dirname, 'test.db');

  beforeAll(async () => {
    // 使用测试数据库
    process.env.DB_PATH = testDbPath;
    db = new Database();
    await db.init();
  });

  afterAll(async () => {
    if (db) {
      await db.close();
    }
    // 清理测试数据库文件
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  beforeEach(async () => {
    // 清理测试数据
    await db.clearTestData();
  });

  describe('DB-FindUserByPhone', () => {
    it('应该成功找到存在的用户', async () => {
      // 先创建用户
      await db.createUser('13812345678');
      
      const user = await db.findUserByPhone('13812345678');
      
      expect(user).toBeTruthy();
      expect(user.phoneNumber).toBe('13812345678');
      expect(user.createdAt).toBeTruthy();
    });

    it('应该返回null当用户不存在时', async () => {
      const user = await db.findUserByPhone('13987654321');
      
      expect(user).toBeNull();
    });

    it('应该拒绝无效的手机号格式', async () => {
      await expect(db.findUserByPhone('12345')).rejects.toThrow('无效的手机号格式');
    });

    it('应该拒绝空的手机号', async () => {
      await expect(db.findUserByPhone('')).rejects.toThrow('手机号不能为空');
      await expect(db.findUserByPhone(null)).rejects.toThrow('手机号不能为空');
    });
  });

  describe('DB-CreateUser', () => {
    it('应该成功创建新用户', async () => {
      const user = await db.createUser('13812345678');
      
      expect(user).toBeTruthy();
      expect(user.phoneNumber).toBe('13812345678');
      expect(user.createdAt).toBeTruthy();
      
      // 验证用户确实被创建
      const foundUser = await db.findUserByPhone('13812345678');
      expect(foundUser).toBeTruthy();
    });

    it('应该拒绝创建重复的用户', async () => {
      await db.createUser('13812345678');
      
      await expect(db.createUser('13812345678')).rejects.toThrow('用户已存在');
    });

    it('应该拒绝无效的手机号格式', async () => {
      await expect(db.createUser('12345')).rejects.toThrow('无效的手机号格式');
    });

    it('应该拒绝空的手机号', async () => {
      await expect(db.createUser('')).rejects.toThrow('手机号不能为空');
      await expect(db.createUser(null)).rejects.toThrow('手机号不能为空');
    });
  });

  describe('DB-SaveVerificationCode', () => {
    it('应该成功保存验证码', async () => {
      const result = await db.saveVerificationCode('13812345678', '123456');
      
      expect(result).toBeTruthy();
      expect(result.phoneNumber).toBe('13812345678');
      expect(result.code).toBe('123456');
      expect(result.expiresAt).toBeTruthy();
      
      // 验证过期时间是5分钟后
      const now = new Date();
      const expiresAt = new Date(result.expiresAt);
      const diffMinutes = (expiresAt - now) / (1000 * 60);
      expect(diffMinutes).toBeCloseTo(5, 0);
    });

    it('应该覆盖同一手机号的旧验证码', async () => {
      await db.saveVerificationCode('13812345678', '123456');
      const result = await db.saveVerificationCode('13812345678', '654321');
      
      expect(result.code).toBe('654321');
    });

    it('应该拒绝无效的手机号格式', async () => {
      await expect(db.saveVerificationCode('12345', '123456')).rejects.toThrow('无效的手机号格式');
    });

    it('应该拒绝空的手机号或验证码', async () => {
      await expect(db.saveVerificationCode('', '123456')).rejects.toThrow('手机号不能为空');
      await expect(db.saveVerificationCode('13812345678', '')).rejects.toThrow('验证码不能为空');
    });

    it('应该拒绝无效的验证码格式', async () => {
      await expect(db.saveVerificationCode('13812345678', '12345')).rejects.toThrow('验证码必须是6位数字');
      await expect(db.saveVerificationCode('13812345678', 'abcdef')).rejects.toThrow('验证码必须是6位数字');
    });
  });

  describe('DB-VerifyCode', () => {
    beforeEach(async () => {
      // 预先保存验证码
      await db.saveVerificationCode('13812345678', '123456');
    });

    it('应该成功验证正确的验证码', async () => {
      const result = await db.verifyCode('13812345678', '123456');
      
      expect(result).toBe(true);
    });

    it('应该拒绝错误的验证码', async () => {
      const result = await db.verifyCode('13812345678', '654321');
      
      expect(result).toBe(false);
    });

    it('应该拒绝过期的验证码', async () => {
      // 手动设置过期时间为过去
      const pastTime = new Date(Date.now() - 10 * 60 * 1000); // 10分钟前
      await db.saveVerificationCode('13812345678', '123456', pastTime);
      
      const result = await db.verifyCode('13812345678', '123456');
      
      expect(result).toBe(false);
    });

    it('应该拒绝不存在的手机号', async () => {
      const result = await db.verifyCode('13987654321', '123456');
      
      expect(result).toBe(false);
    });

    it('应该拒绝无效的手机号格式', async () => {
      await expect(db.verifyCode('12345', '123456')).rejects.toThrow('无效的手机号格式');
    });

    it('应该拒绝空的手机号或验证码', async () => {
      await expect(db.verifyCode('', '123456')).rejects.toThrow('手机号不能为空');
      await expect(db.verifyCode('13812345678', '')).rejects.toThrow('验证码不能为空');
    });

    it('验证成功后应该删除验证码', async () => {
      await db.verifyCode('13812345678', '123456');
      
      // 再次验证应该失败
      const result = await db.verifyCode('13812345678', '123456');
      expect(result).toBe(false);
    });
  });
});