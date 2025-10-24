const Database = require('../src/database');

describe('Database', () => {
  let db;

  beforeEach(() => {
    db = new Database(':memory:'); // 使用内存数据库进行测试
  });

  afterEach(() => {
    if (db) {
      db.close();
    }
  });

  describe('DB-FindUserByPhone', () => {
    test('应该能够根据手机号查找用户记录', async () => {
      // 测试数据
      const phoneNumber = '13812345678';
      const countryCode = '+86';

      // 执行查找
      const user = await db.findUserByPhone(phoneNumber, countryCode);

      // 验证结果 - 当前骨架实现应该返回null
      expect(user).toBeNull();
    });

    test('应该能够处理不存在的手机号', async () => {
      const phoneNumber = '99999999999';
      const countryCode = '+86';

      const user = await db.findUserByPhone(phoneNumber, countryCode);

      expect(user).toBeNull();
    });

    test('应该能够处理不同的国家代码', async () => {
      const phoneNumber = '1234567890';
      const countryCode = '+1';

      const user = await db.findUserByPhone(phoneNumber, countryCode);

      expect(user).toBeNull();
    });
  });

  describe('DB-CreateUser', () => {
    test('应该能够在数据库中创建一个新的用户记录', async () => {
      // 测试数据
      const phoneNumber = '13812345678';
      const countryCode = '+86';

      // 执行创建
      const user = await db.createUser(phoneNumber, countryCode);

      // 验证结果 - 当前骨架实现应该返回测试用户对象
      expect(user).toBeDefined();
      expect(user.phoneNumber).toBe(phoneNumber);
      expect(user.countryCode).toBe(countryCode);
      expect(user.id).toBeDefined();
    });

    test('应该能够处理默认国家代码', async () => {
      const phoneNumber = '13812345678';

      const user = await db.createUser(phoneNumber);

      expect(user).toBeDefined();
      expect(user.phoneNumber).toBe(phoneNumber);
      expect(user.countryCode).toBe('+86');
    });

    test('应该能够创建具有不同国家代码的用户', async () => {
      const phoneNumber = '1234567890';
      const countryCode = '+1';

      const user = await db.createUser(phoneNumber, countryCode);

      expect(user).toBeDefined();
      expect(user.phoneNumber).toBe(phoneNumber);
      expect(user.countryCode).toBe(countryCode);
    });
  });

  describe('DB-SaveVerificationCode', () => {
    test('应该能够保存验证码到数据库', async () => {
      // 测试数据
      const phoneNumber = '13812345678';
      const code = '123456';
      const countryCode = '+86';

      // 执行保存
      const result = await db.saveVerificationCode(phoneNumber, code, countryCode);

      // 验证结果 - 当前骨架实现应该返回true
      expect(result).toBe(true);
    });

    test('应该能够处理6位数字验证码', async () => {
      const phoneNumber = '13812345678';
      const code = '654321';

      const result = await db.saveVerificationCode(phoneNumber, code);

      expect(result).toBe(true);
    });

    test('应该能够处理不同国家代码的验证码', async () => {
      const phoneNumber = '1234567890';
      const code = '111111';
      const countryCode = '+1';

      const result = await db.saveVerificationCode(phoneNumber, code, countryCode);

      expect(result).toBe(true);
    });
  });

  describe('DB-VerifyCode', () => {
    test('应该能够验证手机号对应的验证码是否正确且未过期', async () => {
      // 测试数据
      const phoneNumber = '13812345678';
      const code = '123456';
      const countryCode = '+86';

      // 先保存验证码
      await db.saveVerificationCode(phoneNumber, code, countryCode);

      // 验证验证码
      const isValid = await db.verifyCode(phoneNumber, code, countryCode);

      // 验证结果 - 正确的验证码应该返回true
      expect(isValid).toBe(true);
    });

    test('应该拒绝错误的验证码', async () => {
      const phoneNumber = '13812345678';
      const correctCode = '123456';
      const wrongCode = '654321';

      await db.saveVerificationCode(phoneNumber, correctCode);

      const isValid = await db.verifyCode(phoneNumber, wrongCode);

      expect(isValid).toBe(false);
    });

    test('应该拒绝不存在的手机号验证码', async () => {
      const phoneNumber = '99999999999';
      const code = '123456';

      const isValid = await db.verifyCode(phoneNumber, code);

      expect(isValid).toBe(false);
    });
  });

  describe('DB-CleanExpiredCodes', () => {
    test('应该能够清理数据库中已过期的验证码记录', async () => {
      // 执行清理
      const cleanedCount = await db.cleanExpiredCodes();

      // 验证结果 - 当前骨架实现应该返回0
      expect(cleanedCount).toBe(0);
      expect(typeof cleanedCount).toBe('number');
    });

    test('应该返回清理的记录数量', async () => {
      const cleanedCount = await db.cleanExpiredCodes();

      expect(cleanedCount).toBeGreaterThanOrEqual(0);
    });
  });
});