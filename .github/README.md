# GitHub Actions CI/CD 配置说明

## 概述

本项目配置了完整的 GitHub Actions CI/CD 流水线，可以在每次提交时自动运行前后端测试和集成测试。

## 工作流文件

### 1. `ci.yml` - 主要 CI/CD 流水线

**触发条件：**
- 推送到 `master`、`main`、`develop` 分支
- 创建针对这些分支的 Pull Request

**包含的作业：**

#### 🔧 Backend Tests
- 安装后端依赖
- 运行后端单元测试
- 生成测试覆盖率报告
- 上传测试结果

#### 🎨 Frontend Tests  
- 安装前端依赖
- 运行前端单元测试
- 生成测试覆盖率报告
- 上传测试结果

#### 🔗 Integration Tests
- 启动后端服务器
- 构建并启动前端服务器
- 等待服务就绪
- 运行集成测试
- 运行系统验证
- 清理服务进程

#### 🏗️ Build Verification
- 验证前端构建过程
- 检查构建产物
- 上传构建文件

#### 📋 Test Summary
- 汇总所有测试结果
- 生成测试报告
- 提供测试状态概览

### 2. `test.yml` - 快速测试工作流

**触发条件：**
- 手动触发（workflow_dispatch）

**用途：**
- 快速验证基本功能
- 调试 CI/CD 配置
- 测试环境验证

## 本地测试脚本

项目根目录的 `package.json` 包含以下测试脚本：

```json
{
  "scripts": {
    "test": "npm run test:backend && npm run test:frontend",
    "test:backend": "cd backend && npm test",
    "test:frontend": "cd frontend && npm test",
    "test:integration": "node integration-test.js",
    "test:system": "node verify-system.js"
  }
}
```

## 使用方法

### 自动触发

1. **推送代码到主分支：**
   ```bash
   git push origin master
   ```

2. **创建 Pull Request：**
   - 在 GitHub 上创建 PR
   - CI/CD 会自动运行

### 手动触发

1. 访问 GitHub 仓库的 Actions 页面
2. 选择 "Quick Test" 工作流
3. 点击 "Run workflow" 按钮

### 查看结果

1. **GitHub Actions 页面：**
   - 访问 `https://github.com/your-username/your-repo/actions`
   - 查看工作流运行状态和日志

2. **测试报告：**
   - 在 Actions 运行完成后下载 Artifacts
   - 包含测试覆盖率报告和详细结果

3. **状态徽章：**
   可以在 README 中添加状态徽章：
   ```markdown
   ![CI/CD](https://github.com/your-username/your-repo/workflows/CI/CD%20Pipeline/badge.svg)
   ```

## 配置说明

### 环境变量

```yaml
env:
  NODE_VERSION: '18'
  BACKEND_PORT: 3001
  FRONTEND_PORT: 4173
```

### 依赖缓存

- 使用 npm 缓存加速依赖安装
- 分别缓存前后端依赖

### 服务启动

- 后端：`npm start`（端口 3001）
- 前端：`npm run preview`（端口 4173）
- 使用 `wait-on` 等待服务就绪

### 测试超时

- 默认超时：60 秒
- 可在配置文件中调整

## 故障排除

### 常见问题

1. **依赖安装失败：**
   - 检查 `package-lock.json` 文件
   - 确保 Node.js 版本兼容

2. **测试超时：**
   - 增加 `wait-on` 超时时间
   - 检查服务启动日志

3. **端口冲突：**
   - 确保端口配置正确
   - 检查服务是否正常启动

### 调试方法

1. **查看详细日志：**
   - 在 Actions 页面展开每个步骤
   - 查看完整的控制台输出

2. **本地复现：**
   ```bash
   # 运行相同的测试命令
   npm run test
   npm run test:integration
   npm run test:system
   ```

3. **手动触发测试：**
   - 使用 Quick Test 工作流
   - 逐步验证每个组件

## 最佳实践

1. **提交前本地测试：**
   ```bash
   npm run test
   ```

2. **小步提交：**
   - 避免大量更改一次提交
   - 便于定位问题

3. **监控测试结果：**
   - 及时查看 CI/CD 状态
   - 修复失败的测试

4. **保持依赖更新：**
   - 定期更新依赖版本
   - 确保安全性和兼容性

## 扩展配置

### 添加新的测试类型

1. 在相应的 `package.json` 中添加脚本
2. 在 `ci.yml` 中添加对应的步骤
3. 配置适当的环境和依赖

### 部署配置

可以在 `ci.yml` 中添加部署步骤：

```yaml
deploy:
  runs-on: ubuntu-latest
  needs: [backend-tests, frontend-tests, integration-tests]
  if: github.ref == 'refs/heads/master'
  steps:
    # 部署步骤
```

### 通知配置

可以添加 Slack、邮件等通知：

```yaml
- name: Notify on failure
  if: failure()
  uses: 8398a7/action-slack@v3
  with:
    status: failure
```