# Taobei 应用测试框架

## 项目概述

这是一个基于"测试先行"原则构建的 Taobei 应用项目，包含完整的前后端代码骨架和测试用例。

## 技术架构

### 技术栈
- **前端**: React + TypeScript + Vite
- **后端**: Node.js + Express + SQLite
- **前端测试**: Vitest + React Testing Library
- **后端测试**: Jest + Supertest

### 项目结构
```
├── backend/
│   ├── src/
│   │   ├── app.js           # Express 应用主文件
│   │   ├── auth.js          # 认证相关路由
│   │   └── database.js      # 数据库操作模块
│   ├── test/
│   │   ├── setup.js         # 测试环境配置
│   │   ├── database.test.js # 数据库模块测试
│   │   └── auth.test.js     # 认证API测试
│   ├── package.json         # 后端依赖配置
│   └── jest.config.js       # Jest 测试配置
├── frontend/
│   ├── src/
│   │   └── components/
│   │       ├── LoginForm.tsx    # 登录表单组件
│   │       └── RegisterForm.tsx # 注册表单组件
│   ├── test/
│   │   ├── setup.ts             # 测试环境配置
│   │   ├── LoginForm.test.tsx   # 登录表单测试
│   │   └── RegisterForm.test.tsx # 注册表单测试
│   ├── package.json             # 前端依赖配置
│   └── vite.config.ts           # Vite 配置
├── verify-system.js             # 系统验证脚本
├── integration-test.js          # 集成测试脚本
└── README.md                    # 项目说明文档
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

### 2. 运行测试

#### 后端测试
```bash
cd backend
npm test -- --verbose --bail --forceExit
```

#### 前端测试
```bash
cd frontend
npm test -- --run --reporter=verbose --bail=1
```

### 3. 系统验证

#### 验证系统状态
```bash
# 在项目根目录运行
node verify-system.js
```

#### 运行集成测试
```bash
# 在项目根目录运行
node integration-test.js
```

### 4. 启动开发服务器

#### 启动后端服务器
```bash
cd backend
npm start
# 服务器将在 http://localhost:3000 启动
```

#### 启动前端开发服务器
```bash
cd frontend
npm run dev
# 开发服务器将在 http://localhost:5173 启动
```

## 测试覆盖范围

### 后端测试
- **数据库模块测试** (`database.test.js`)
  - 用户查找功能
  - 用户创建功能
  - 验证码保存功能
  - 验证码验证功能
  - 过期验证码清理功能

- **认证API测试** (`auth.test.js`)
  - 发送验证码接口
  - 用户登录接口
  - 用户注册接口
  - 用户信息获取接口

### 前端测试
- **登录表单测试** (`LoginForm.test.tsx`)
  - 组件渲染测试
  - 用户交互测试
  - 表单提交测试
  - 验证码发送测试

- **注册表单测试** (`RegisterForm.test.tsx`)
  - 组件渲染测试
  - 用户交互测试
  - 表单提交测试
  - 条款同意测试

### 集成测试
- **完整用户流程测试**
  - 注册流程测试
  - 登录流程测试
  - API调用链测试
  - 错误处理测试

### 系统验证
- **服务状态检查**
  - 后端服务连通性
  - 前端服务连通性
  - API端点可访问性
  - 数据库连接状态

## 测试配置

### 后端测试配置 (jest.config.js)
```javascript
module.exports = {
  testTimeout: 10000,
  bail: 1,
  verbose: true,
  forceExit: true,
  detectOpenHandles: true
}
```

### 前端测试配置 (vite.config.ts)
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

## API 接口说明

### 认证相关接口

#### 发送验证码
- **路径**: `POST /api/auth/send-verification-code`
- **参数**: `{ phoneNumber, countryCode }`
- **响应**: `{ success: boolean, message: string }`

#### 用户登录
- **路径**: `POST /api/auth/login`
- **参数**: `{ phoneNumber, verificationCode, countryCode }`
- **响应**: `{ success: boolean, user: object, token: string }`

#### 用户注册
- **路径**: `POST /api/auth/register`
- **参数**: `{ phoneNumber, verificationCode, countryCode, agreeToTerms }`
- **响应**: `{ success: boolean, user: object, token: string }`

#### 获取用户信息
- **路径**: `GET /api/auth/profile`
- **响应**: `{ success: boolean, user: object }`

## 开发指南

### 测试驱动开发流程

1. **运行现有测试** - 确保所有测试都失败（红色状态）
2. **实现最小功能** - 编写最少的代码使测试通过
3. **重构代码** - 在保持测试通过的前提下优化代码
4. **添加新测试** - 为新功能编写测试用例
5. **重复循环** - 继续TDD循环

### 代码实现注意事项

- 所有标记为 `// TODO` 的代码需要实现
- 数据库操作需要实现真实的SQLite操作
- API响应格式需要符合接口规范
- 错误处理需要返回适当的HTTP状态码
- 前端组件需要实现真实的用户交互逻辑

### 测试最佳实践

- 使用真实有效的测试数据
- 确保测试用例独立运行
- 包含正常、边界、异常情况测试
- 使用精确的断言语句
- 正确处理异步操作

## 故障排除

### 常见问题

1. **测试超时**
   - 检查测试配置中的超时设置
   - 确保异步操作正确处理

2. **数据库连接失败**
   - 检查SQLite数据库文件权限
   - 确保测试环境配置正确

3. **API调用失败**
   - 检查服务器是否正常启动
   - 验证API端点路径是否正确

4. **前端组件测试失败**
   - 检查React Testing Library配置
   - 确保组件正确导入

### 获取帮助

如果遇到问题，请检查：
1. 控制台错误信息
2. 测试输出日志
3. 系统验证脚本结果
4. 集成测试报告

## 下一步开发

1. 实现所有 `// TODO` 标记的功能
2. 完善错误处理逻辑
3. 添加更多测试用例
4. 优化用户界面
5. 添加更多功能特性

---

**注意**: 这是一个测试驱动开发的项目模板，所有功能都需要根据测试用例的要求进行实现。