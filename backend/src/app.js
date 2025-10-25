const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const Database = require('./database');

const app = express();

// 中间件
app.use(cors());
app.use(express.json());

// JSON解析错误处理
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON format' });
  }
  next(err);
});

// 数据库初始化
let database;

async function initializeDatabase() {
  if (!database) {
    database = new Database();
    await database.initialize();
    app.locals.database = database;
  }
  return database;
}

// 路由
app.use('/api/auth', authRoutes);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// 启动服务器
const PORT = process.env.PORT || 3000;

// 初始化数据库（用于测试环境）
if (process.env.NODE_ENV === 'test') {
  initializeDatabase().catch(console.error);
}

if (require.main === module) {
  initializeDatabase().then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  }).catch(console.error);
}

module.exports = { app, initializeDatabase };