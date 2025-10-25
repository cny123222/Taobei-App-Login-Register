# 淘贝应用 - 测试驱动开发项目

这是一个基于测试驱动开发(TDD)原则构建的手机验证码登录/注册系统。

## 🏗️ 项目架构

### 技术栈
- **前端**: React + TypeScript + Vite
- **后端**: Node.js + Express + SQLite
- **测试框架**: 
  - 前端: Vitest + React Testing Library
  - 后端: Jest + Supertest

### 项目结构
```
├── backend/                 # 后端服务
│   ├── src/                # 源代码
│   │   ├── app.js         # Express应用主文件
│   │   ├── database.js    # 数据库操作类
│   │   └── routes/        # API路由
│   │       └── auth.js    # 认证相关路由
│   ├── test/              # 测试文件
│   │   ├── database.test.js           # 数据库测试
│   │   ├── routes/auth.test.js        # 路由测试
│   │   └── integration/api.integration.test.js  # 集成测试
│   ├── package.json       # 后端依赖配置
│   └── jest.config.js     # Jest测试配置
├── frontend/               # 前端应用
│   ├── src/               # 源代码
│   │   └── components/    # React组件
│   │       ├── LoginForm.tsx
│   │       ├── RegisterForm.tsx
│   │       └── CountryCodeSelector.tsx
│   ├── test/              # 测试文件
│   │   ├── components/    # 组件测试
│   │   ├── e2e/          # 端到端测试
│   │   └── setup.ts      # 测试环境配置
│   ├── package.json       # 前端依赖配置
│   ├── vite.config.ts     # Vite配置
│   └── tsconfig.json      # TypeScript配置
├── verify-system.js        # 系统验证脚本
├── integration-test.js     # 集成测试脚本
└── .artifacts/            # 接口定义文件
    ├── ui_interface.yml
    ├── api_interface.yml
    └── data_interface.yml
```

## 🚀 快速开始

### 1. 安装依赖

```bash
# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd ../frontend
npm install
```

### 2. 启动服务

```bash
# 启动后端服务 (端口 3000)
cd backend
npm run dev

# 新开终端，启动前端服务 (端口 5173)
cd frontend
npm run dev
```

### 3. 验证系统

```bash
# 在项目根目录运行系统验证
./verify-system.js

# 或者使用 node 运行
node verify-system.js
```

## 🧪 测试指南

### 测试类型

1. **单元测试**: 测试单个组件或函数
2. **集成测试**: 测试组件间的交互
3. **端到端测试**: 测试完整的用户流程
4. **系统验证**: 验证服务启动和连通性

### 运行测试

```bash
# 后端测试
cd backend
npm test                                    # 运行所有测试
npm test -- --verbose --bail --forceExit   # 详细输出，遇错停止

# 前端测试
cd frontend
npm test                                    # 运行所有测试
npm test -- --run --reporter=verbose --bail=1  # 详细输出，遇错停止

# 系统验证
./verify-system.js                         # 验证系统状态

# 集成测试
./integration-test.js                      # 测试完整流程
```

### 测试覆盖率

项目要求达到以下测试覆盖率：
- 每个API接口必须有对应的单元测试
- 每个React组件必须有对应的组件测试
- 每个用户流程必须有对应的端到端测试
- 所有错误处理场景必须有对应的测试用例

## 📋 功能特性

### 用户认证系统
- ✅ 手机号验证码登录
- ✅ 手机号验证码注册
- ✅ 国家/地区代码选择
- ✅ 验证码发送频率限制
- ✅ 用户协议确认

### API接口
- `GET /health` - 健康检查
- `POST /api/auth/send-verification-code` - 发送验证码
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/register` - 用户注册

### 安全特性
- ✅ CORS跨域配置
- ✅ 请求频率限制
- ✅ 输入验证和清理
- ✅ 错误处理和日志记录

## 🔧 开发工具

### 测试配置

**后端测试配置 (jest.config.js)**:
```javascript
module.exports = {
  testTimeout: 10000,
  bail: 1,
  verbose: true,
  forceExit: true,
  detectOpenHandles: true
}
```

**前端测试配置 (vite.config.ts)**:
```typescript
export default defineConfig({
  test: {
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 10000,
    bail: 1,
    reporter: ['verbose'],
    environment: 'jsdom'
  }
})
```

### 代理配置

前端开发服务器配置了API代理，将 `/api/*` 请求转发到后端服务器:
```typescript
server: {
  port: 5173,
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true
    }
  }
}
```

## 🐛 故障排除

### 常见问题

1. **端口被占用**
   ```bash
   # 检查端口占用
   lsof -i :3000  # 后端端口
   lsof -i :5173  # 前端端口
   
   # 杀死占用进程
   kill -9 <PID>
   ```

2. **数据库连接失败**
   - 确保SQLite数据库文件权限正确
   - 检查数据库文件路径是否存在

3. **测试失败**
   - 确保所有依赖已正确安装
   - 检查测试环境配置
   - 查看详细错误日志

4. **CORS错误**
   - 确认后端CORS配置正确
   - 检查前端代理配置

### 日志和调试

- 后端日志: 控制台输出
- 前端日志: 浏览器开发者工具
- 测试报告: `system-verification-report.json` 和 `integration-test-report.json`

## 📊 测试报告

运行系统验证和集成测试后，会生成详细的JSON报告：

- `system-verification-report.json` - 系统验证报告
- `integration-test-report.json` - 集成测试报告

这些报告包含：
- 测试执行时间戳
- 测试通过/失败统计
- 详细的测试结果
- 错误信息和建议

## 🤝 贡献指南

1. 遵循测试驱动开发原则
2. 确保所有测试通过
3. 保持代码覆盖率
4. 遵循代码规范和最佳实践

## 📄 许可证

本项目仅用于学习和教育目的。