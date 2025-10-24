const Database = require('./database');

// 创建单例数据库实例
let dbInstance = null;

function getDatabase() {
  if (!dbInstance) {
    dbInstance = new Database();
  }
  return dbInstance;
}

// 重置数据库实例（主要用于测试）
function resetDatabase() {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

module.exports = { getDatabase, resetDatabase };