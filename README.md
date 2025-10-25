# 淘贝应用 - 测试驱动开发项目

## 项目概述

这是一个基于测试驱动开发(TDD)原则构建的淘贝应用项目，包含用户注册和登录功能。项目采用前后端分离架构，严格遵循"测试先行"的开发理念。

## 技术栈

### 后端
- **框架**: Node.js + Express.js
- **数据库**: SQLite
- **测试框架**: Jest + Supertest
- **其他**: CORS, JWT, bcrypt, express-rate-limit

### 前端
- **框架**: React + TypeScript
- **构建工具**: Vite
- **测试框架**: Vitest + React Testing Library
- **其他**: React Router DOM

## 项目结构

```
├── backend/
│   ├── src/
│   │   ├── models/          # 数据模型
│   │   ├── routes/          # API路由
│   │   ├── middleware/      # 中间件
│   │   ├── utils/           # 工具函数
│   │   └── app.js           # 应用入口
│   ├── test/
│   │   ├── models/          # 模型测试
│   │   ├── routes/          # 路由测试
│   │   └── integration/     # 集成测试
│   ├── package.json
│   └── jest.config.js
├── frontend/
│   ├── src/
│   │   ├── components/      # React组件
│   │   └── utils/           # 工具函数
│   ├── test/
│   │   ├── components/      # 组件测试
│   │   └── e2e/             # 端到端测试
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
├── verify-system.js         # 系统验证脚本
├── integration-test.js      # 集成测试脚本
└── README.md
```

## 快速开始

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
npm start

# 启动前端服务 (端口 5173)
cd frontend
npm run dev
```

### 3. 验证系统

```bash
# 在项目根目录运行系统验证
node verify-system.js
```

## 测试指南

### 🚨 重要：测试超时配置

本项目配置了严格的测试超时控制，确保测试快速失败：

- **前端测试超时**: 10秒
- **后端测试超时**: 10秒
- **系统验证超时**: 5秒
- **集成测试超时**: 10秒

### 运行测试

#### 后端测试

```bash
cd backend

# 运行所有测试
npm test

# 运行特定测试文件
npm test -- test/models/database.test.js
npm test -- test/routes/auth.test.js
npm test -- test/integration/api.test.js

# 运行测试并生成覆盖率报告
npm run test:coverage
```

#### 前端测试

```bash
cd frontend

# 运行所有测试
npm test

# 运行特定测试文件
npm test -- test/components/LoginForm.test.tsx
npm test -- test/components/RegisterForm.test.tsx
npm test -- test/e2e/user-flows.test.tsx

# 运行测试并生成覆盖率报告
npm run test:coverage
```

#### 系统验证

```bash
# 验证系统完整性
node verify-system.js

# 运行集成测试
node integration-test.js
```

### 测试覆盖范围

#### 后端测试覆盖
- ✅ 数据库操作 (DB-FindUserByPhone, DB-CreateUser, DB-CreateVerificationCode, etc.)
- ✅ API端点 (发送验证码, 用户注册, 用户登录)
- ✅ 错误处理和验证
- ✅ 集成测试和API调用链
- ✅ CORS和安全性配置

#### 前端测试覆盖
- ✅ 组件渲染和UI元素
- ✅ 用户交互和表单验证
- ✅ 状态管理和生命周期
- ✅ 错误处理和加载状态
- ✅ 端到端用户流程

#### 系统测试覆盖
- ✅ 服务健康检查
- ✅ 前后端通信
- ✅ 数据库连接
- ✅ API端点可用性
- ✅ 完整用户流程

## API接口文档

### 发送验证码
```
POST /api/auth/send-code
Content-Type: application/json

{
  "phone": "13800138001",
  "type": "register" | "login"
}
```

### 用户注册
```
POST /api/auth/register
Content-Type: application/json

{
  "phone": "13800138001",
  "code": "123456"
}
```

### 用户登录
```
POST /api/auth/login
Content-Type: application/json

{
  "phone": "13800138001",
  "code": "123456"
}
```

### 健康检查
```
GET /api/health
```

## 测试数据

### 测试用户
- 手机号格式: 138xxxxxxxx
- 测试验证码: 123456 (开发环境)

### 测试场景
1. **正常流程**: 发送验证码 → 注册/登录 → 获取Token
2. **错误处理**: 无效手机号、错误验证码、重复注册等
3. **边界条件**: 输入长度限制、超时处理等

## 开发规范

### 测试驱动开发流程
1. **红色阶段**: 编写失败的测试用例
2. **绿色阶段**: 编写最少代码使测试通过
3. **重构阶段**: 优化代码结构和性能

### 代码质量要求
- 测试覆盖率 > 90%
- 所有测试必须通过
- 代码符合ESLint规范
- 提交前必须运行完整测试套件

### Git工作流
```bash
# 开发新功能
git checkout -b feature/new-feature

# 运行测试确保质量
npm test

# 提交代码
git add .
git commit -m "feat: add new feature with tests"

# 合并到主分支前再次验证
node verify-system.js
node integration-test.js
```

## 故障排除

### 常见问题

1. **测试超时**
   - 检查服务是否正常启动
   - 确认数据库连接正常
   - 验证网络连接

2. **依赖安装失败**
   ```bash
   # 清理缓存重新安装
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **端口冲突**
   - 后端默认端口: 3000
   - 前端默认端口: 5173
   - 可在配置文件中修改

4. **数据库问题**
   - SQLite文件会自动创建
   - 测试使用独立的测试数据库
   - 可手动删除database.sqlite重新初始化

### 调试技巧

1. **查看详细测试输出**
   ```bash
   npm test -- --verbose
   ```

2. **运行单个测试**
   ```bash
   npm test -- --testNamePattern="specific test name"
   ```

3. **查看测试覆盖率**
   ```bash
   npm run test:coverage
   open coverage/lcov-report/index.html
   ```

## 贡献指南

1. Fork项目
2. 创建功能分支
3. 编写测试用例
4. 实现功能代码
5. 确保所有测试通过
6. 提交Pull Request

## 许可证

MIT License

---

**记住：测试不仅是验证代码正确性的工具，更是设计和文档的重要组成部分！**