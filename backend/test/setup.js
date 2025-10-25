// Jest 测试设置文件
const path = require('path');
const fs = require('fs');

// 设置测试环境变量
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.DB_PATH = ':memory:'; // 使用内存数据库进行测试

// 全局测试超时设置
jest.setTimeout(10000);

// 测试前清理
beforeEach(() => {
  // 清理任何可能的测试数据
  jest.clearAllMocks();
});

// 测试后清理
afterEach(() => {
  // 清理测试后的状态
});

// 全局测试完成后清理
afterAll(async () => {
  // 确保所有异步操作完成
  await new Promise(resolve => setTimeout(resolve, 100));
});