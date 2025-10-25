const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// TODO: 配置中间件
app.use(cors());
app.use(express.json());

// TODO: 配置路由
app.use('/api/auth', authRoutes);

// TODO: 健康检查接口
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '服务运行正常' });
});

// TODO: 404处理
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false,
    message: '接口不存在' 
  });
});

// TODO: 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  // 处理JSON解析错误
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: '请求格式错误'
    });
  }
  
  res.status(500).json({ 
    success: false,
    message: '服务器内部错误' 
  });
});

// 启动服务器
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`服务器运行在端口 ${PORT}`);
  });
}

module.exports = app;