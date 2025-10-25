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

// 测试完成后清理
afterAll(async () => {
  const dbPath = process.env.DB_PATH;
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
  }
});