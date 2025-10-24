// 设置测试环境变量
process.env.NODE_ENV = 'test';
// 使用内存数据库避免文件权限问题
process.env.DB_PATH = ':memory:';