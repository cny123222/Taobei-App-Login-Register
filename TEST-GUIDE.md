# 淘贝应用测试指南

## 📋 测试概览

本项目采用"测试先行"原则，包含完整的测试体系：

- **单元测试**: 前端组件和后端API的单元测试
- **集成测试**: 前后端通信和数据流测试
- **端到端测试**: 完整用户流程的自动化测试
- **系统验证**: 服务健康检查和环境验证

## 🚀 快速开始

### 1. 安装依赖

```bash
# 安装根目录依赖（包含Cypress）
npm install

# 安装后端依赖
cd backend && npm install

# 安装前端依赖
cd ../frontend && npm install
```

### 2. 系统验证

在运行测试前，先验证系统环境：

```bash
npm run verify
```

### 3. 运行所有测试

```bash
npm run test:all
```

## 📊 测试类型详解

### 单元测试

#### 后端单元测试
```bash
# 运行后端所有测试
npm run test:backend

# 运行特定测试文件
cd backend && npm test -- auth.test.js

# 运行验收标准测试
cd backend && npm test -- auth.acceptance-criteria.test.js
```

**测试覆盖范围：**
- API路由验证
- 数据库操作
- 验证码生成和验证
- 用户认证流程
- 错误处理

#### 前端单元测试
```bash
# 运行前端所有测试
npm run test:frontend

# 运行特定组件测试
cd frontend && npm test -- HomePage.test.tsx

# 运行新需求测试
cd frontend && npm test -- RegisterForm.new-requirements.test.tsx
```

**测试覆盖范围：**
- React组件渲染
- 用户交互事件
- 表单验证
- 状态管理
- 导航功能

### 集成测试

#### 系统集成测试
```bash
npm run test:integration
```

**测试内容：**
- 后端服务启动和健康检查
- 前端服务启动和访问
- 前后端API通信
- 完整用户注册/登录流程
- CORS配置验证

#### API集成测试
```bash
npm run test:api
```

**测试内容：**
- API端点可访问性
- 请求/响应格式验证
- 错误处理机制
- 数据持久化
- 性能基准测试

### 端到端测试

#### 运行E2E测试
```bash
# 无头模式运行
npm run test:e2e

# 交互模式运行（推荐开发时使用）
npm run test:e2e:open
```

**测试场景：**
- 完整用户注册流程
- 完整用户登录流程
- 表单验证和错误处理
- 响应式设计验证
- 可访问性测试

## 🔧 测试配置

### Jest配置（后端）
```javascript
// backend/jest.config.js
module.exports = {
  testTimeout: 10000,
  bail: 1,
  verbose: true,
  forceExit: true,
  detectOpenHandles: true
}
```

### Vitest配置（前端）
```typescript
// frontend/vite.config.ts
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

### Cypress配置
```javascript
// cypress.config.js
module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000
  }
})
```

## 📈 测试数据和Mock

### 测试数据
- 使用真实有效的手机号格式：`138001380XX`
- 验证码格式：6位数字
- 测试用户数据存储在独立的测试数据库

### Mock配置
- 前端测试：Mock localStorage、sessionStorage、fetch
- E2E测试：使用Cypress fixtures模拟API响应
- 集成测试：使用真实API进行测试

## 🚨 测试最佳实践

### 1. 测试隔离
- 每个测试用例独立运行
- 测试前后清理数据
- 使用独立的测试数据库

### 2. 断言准确性
```javascript
// ✅ 好的断言
expect(response.body).toHaveProperty('success', true);
expect(response.body.message).toContain('验证码发送成功');

// ❌ 避免模糊断言
expect(response.body).toBeTruthy();
```

### 3. 错误处理测试
```javascript
// 测试各种错误场景
it('应该处理无效手机号', async () => {
  const invalidPhones = ['123', '12345678901', 'abc1234567'];
  
  for (const phone of invalidPhones) {
    const response = await request(app)
      .post('/api/auth/send-verification-code')
      .send({ phone, type: 'login' });
    
    expect(response.status).toBe(400);
    expect(response.body.message).toContain('手机号格式不正确');
  }
});
```

### 4. 异步测试处理
```javascript
// ✅ 正确处理异步操作
it('应该处理异步验证码发送', async () => {
  const response = await request(app)
    .post('/api/auth/send-verification-code')
    .send({ phone: '13800138001', type: 'login' });
  
  expect(response.status).toBe(200);
});
```

## 🐛 故障排除

### 常见问题

#### 1. 测试超时
```bash
# 增加超时时间
npm test -- --testTimeout=15000
```

#### 2. 端口冲突
```bash
# 检查端口占用
lsof -i :3000
lsof -i :5173

# 杀死占用进程
kill -9 <PID>
```

#### 3. 数据库连接问题
```bash
# 检查数据库文件权限
ls -la backend/database.sqlite

# 重新初始化数据库
cd backend && npm run db:reset
```

#### 4. Cypress测试失败
```bash
# 清理Cypress缓存
npx cypress cache clear

# 重新安装Cypress
npm uninstall cypress
npm install cypress --save-dev
```

### 调试技巧

#### 1. 查看详细日志
```bash
# 后端测试详细输出
cd backend && npm test -- --verbose

# 前端测试详细输出
cd frontend && npm test -- --reporter=verbose
```

#### 2. 单独运行失败的测试
```bash
# 运行特定测试文件
npm test -- auth.test.js

# 运行特定测试用例
npm test -- --grep "应该验证手机号格式"
```

#### 3. 使用调试模式
```javascript
// 在测试中添加调试点
it('调试测试', async () => {
  console.log('调试信息:', response.body);
  debugger; // 在浏览器开发者工具中暂停
});
```

## 📊 测试报告

### 生成覆盖率报告
```bash
# 后端覆盖率
cd backend && npm test -- --coverage

# 前端覆盖率
cd frontend && npm test -- --coverage
```

### CI/CD集成
```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run test:all
```

## 🎯 测试成功标准

### 通过标准
- 所有单元测试通过率 ≥ 95%
- 集成测试通过率 = 100%
- E2E测试通过率 ≥ 90%
- 代码覆盖率 ≥ 80%

### 质量检查
- 无语法错误
- 无内存泄漏
- 响应时间 < 5秒
- 错误处理完整

---

## 📞 支持

如果遇到测试问题，请检查：
1. 依赖是否正确安装
2. 服务是否正常启动
3. 端口是否被占用
4. 数据库连接是否正常

更多帮助请参考项目文档或联系开发团队。