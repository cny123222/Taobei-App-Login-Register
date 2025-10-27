# 淘贝购物应用 - 用户登录注册系统

[![Version](https://img.shields.io/badge/version-v2.0.1-blue.svg)](https://github.com/cny123222/Taobei-App-Login-Register/releases/tag/v2.0.1)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/tests-passing-brightgreen.svg)](#测试执行)

一个基于 React + Node.js + Express + SQLite 的现代化用户认证系统，支持手机号验证码登录和注册功能。

## 📋 项目文档

### 需求文档
- **主要需求文档**: [`requirement_new.md`](./requirement_new.md)
  - 详细描述了用户登录、注册、主页功能需求
  - 包含完整的用户场景和验收标准
  - 定义了API接口规范和数据流

### 系统提示词
项目采用AI辅助开发，包含以下角色的系统提示词：

- **设计师**: [`system_prompt/designer.txt`](./system_prompt/designer.txt) - 负责UI/UX设计和界面规范
- **测试生成器**: [`system_prompt/test_generator.txt`](./system_prompt/test_generator.txt) - 负责生成测试用例
- **后端开发**: [`system_prompt/backend_developer.txt`](./system_prompt/backend_developer.txt) - 负责API开发和数据库设计
- **前端开发**: [`system_prompt/frontend_developer.txt`](./system_prompt/frontend_developer.txt) - 负责React组件开发
- **集成测试**: [`system_prompt/integration_tester.txt`](./system_prompt/integration_tester.txt) - 负责端到端测试

### 用户提示词
- **用户提示词文档**: [`user_prompt.md`](./user_prompt.md)
  - 包含各角色的任务分配
  - 定义了开发流程和协作方式
  - 提供了UI参考图片

## 🚀 项目运行方式

### 环境要求
- Node.js >= 16.0.0
- npm >= 8.0.0

### 快速开始

1. **克隆项目**
   ```bash
   git clone https://github.com/cny123222/Taobei-App-Login-Register.git
   cd taobei-app-new
   ```

2. **安装依赖**
   ```bash
   npm run install:all
   ```
   这个命令会自动安装根目录、后端和前端的所有依赖。

3. **系统验证**
   ```bash
   npm run verify
   ```
   验证系统环境和配置是否正确。

4. **启动开发服务器**
   ```bash
   npm run dev
   ```
   这会同时启动前端和后端服务：
   - 前端服务: http://localhost:3000
   - 后端服务: http://localhost:5000

### 单独运行服务

**仅启动后端服务:**
```bash
npm run dev:backend
```

**仅启动前端服务:**
```bash
npm run dev:frontend
```

### 生产环境构建

```bash
npm run build
```

## 🧪 测试执行方式

### 1. 前端测试
```bash
npm run test:frontend
```
- **测试框架**: Vitest + React Testing Library
- **测试覆盖**: 106个测试用例
- **测试内容**: 
  - 组件渲染测试
  - 用户交互测试
  - 表单验证测试
  - UI元素测试

### 2. 后端测试
```bash
npm run test:backend
```
- **测试框架**: Jest + Supertest
- **测试覆盖**: 43个测试用例
- **测试内容**:
  - API接口测试
  - 数据库操作测试
  - 验证码生成测试
  - 错误处理测试

### 3. 集成测试
```bash
npm run integration
```
- **测试覆盖**: 22个集成测试用例
- **测试内容**:
  - 前后端通信测试
  - 端到端用户流程测试
  - 数据一致性测试
  - 性能测试

### 4. 系统验证
```bash
npm run verify
```
- **验证内容**:
  - 系统环境检查
  - 服务健康检查
  - API端点验证
  - 数据库连接测试

### 运行所有测试
```bash
npm test
```
这会依次执行前端和后端的所有测试用例。

### 其他测试工具

**UI验证报告:**
```bash
npm run ui-report
```

**需求验证报告:**
```bash
npm run req-report
```

**测试覆盖率检查:**
```bash
npm run coverage
```

## 📁 项目结构

```
taobei-app-new/
├── frontend/                 # React前端应用
│   ├── src/
│   │   ├── components/      # React组件
│   │   ├── api/            # API调用
│   │   └── ...
│   ├── test/               # 前端测试
│   └── vite.config.ts      # Vite配置
├── backend/                 # Node.js后端应用
│   ├── src/
│   │   ├── app.js          # Express应用
│   │   ├── database.js     # 数据库配置
│   │   └── routes/         # API路由
│   └── test/               # 后端测试
├── system_prompt/          # AI系统提示词
├── images/                 # UI参考图片
├── .artifacts/             # 接口定义文件
├── requirement_new.md      # 需求文档
├── user_prompt.md          # 用户提示词
└── package.json           # 项目配置
```

## 🎯 核心功能

- ✅ **用户登录**: 手机号 + 验证码登录
- ✅ **用户注册**: 手机号注册流程
- ✅ **验证码系统**: 60秒有效期验证码
- ✅ **主页展示**: 登录后的用户主页
- ✅ **响应式设计**: 适配移动端和桌面端
- ✅ **错误处理**: 完善的错误提示和处理

## 🔧 技术栈

**前端:**
- React 18 + TypeScript
- Vite (构建工具)
- CSS3 (响应式设计)
- Axios (HTTP客户端)

**后端:**
- Node.js + Express
- SQLite (数据库)
- CORS (跨域支持)

**测试:**
- Vitest (前端测试)
- Jest + Supertest (后端测试)
- Puppeteer (E2E测试)

## 📊 测试状态

| 测试类型 | 状态 | 测试用例数 |
|---------|------|-----------|
| 前端测试 | ✅ 通过 | 106 |
| 后端测试 | ✅ 通过 | 43 |
| 集成测试 | ✅ 通过 | 22 |
| 系统验证 | ✅ 通过 | 全部 |

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📝 更新日志

查看 [Releases](https://github.com/cny123222/Taobei-App-Login-Register/releases) 获取详细的版本更新信息。

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 联系方式

- 项目链接: [https://github.com/cny123222/Taobei-App-Login-Register](https://github.com/cny123222/Taobei-App-Login-Register)
- 问题反馈: [Issues](https://github.com/cny123222/Taobei-App-Login-Register/issues)