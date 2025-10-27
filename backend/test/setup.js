const path = require('path');
const fs = require('fs');

// 设置测试环境变量
process.env.NODE_ENV = 'test';
process.env.DB_PATH = path.join(__dirname, '../test.db');
process.env.JWT_SECRET = 'test-jwt-secret-key';

// 清理测试数据库（仅在测试开始前）
beforeAll(async () => {
  const dbPath = process.env.DB_PATH;
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
  }
});

// 每个测试之间清理验证码表以避免频率限制
beforeEach(async () => {
  const databaseManager = require('../src/models/databaseManager');
  try {
    const database = await databaseManager.getInstance();
    await database.run('DELETE FROM verification_codes');
  } catch (error) {
    // 忽略错误，可能是表还不存在
  }
});

// 测试完成后清理
afterAll(async () => {
  const dbPath = process.env.DB_PATH;
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
  }
});