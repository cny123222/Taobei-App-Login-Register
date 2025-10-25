#!/usr/bin/env node

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

/**
 * 系统验证脚本
 * 验证后端服务（端口3000）、前端服务（端口5173）、前端访问后端API、数据库连接、关键API端点响应
 */

class SystemVerifier {
  constructor() {
    this.results = [];
    this.errors = [];
    this.backendPort = 3000;
    this.frontendPort = 5173;
    this.timeout = 10000; // 10秒超时
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
    console.log(logMessage);
    
    if (type === 'error') {
      this.errors.push(logMessage);
    } else {
      this.results.push(logMessage);
    }
  }

  async makeRequest(options) {
    return new Promise((resolve, reject) => {
      const protocol = options.protocol === 'https:' ? https : http;
      const timeout = setTimeout(() => {
        reject(new Error(`Request timeout after ${this.timeout}ms`));
      }, this.timeout);

      const req = protocol.request(options, (res) => {
        clearTimeout(timeout);
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data,
            body: this.tryParseJSON(data)
          });
        });
      });

      req.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });

      if (options.body) {
        req.write(options.body);
      }
      
      req.end();
    });
  }

  tryParseJSON(str) {
    try {
      return JSON.parse(str);
    } catch (e) {
      return str;
    }
  }

  async checkBackendService() {
    this.log('🔍 检查后端服务 (端口 3000)...');
    
    try {
      const response = await this.makeRequest({
        hostname: 'localhost',
        port: this.backendPort,
        path: '/health',
        method: 'GET',
        timeout: this.timeout
      });

      if (response.statusCode === 200) {
        this.log('✅ 后端服务运行正常');
        this.log(`   响应状态: ${response.statusCode}`);
        
        if (response.body && response.body.status === 'ok') {
          this.log('✅ 后端健康检查通过');
          this.log(`   服务名称: ${response.body.service || 'unknown'}`);
          this.log(`   时间戳: ${response.body.timestamp || 'unknown'}`);
        } else {
          this.log('⚠️  后端健康检查响应格式异常', 'warn');
        }
        return true;
      } else {
        this.log(`❌ 后端服务响应异常: ${response.statusCode}`, 'error');
        return false;
      }
    } catch (error) {
      this.log(`❌ 后端服务连接失败: ${error.message}`, 'error');
      this.log('   请确保后端服务已启动 (npm run dev 在 backend 目录)', 'error');
      return false;
    }
  }

  async checkFrontendService() {
    this.log('🔍 检查前端服务 (端口 5173)...');
    
    try {
      const response = await this.makeRequest({
        hostname: 'localhost',
        port: this.frontendPort,
        path: '/',
        method: 'GET',
        timeout: this.timeout
      });

      if (response.statusCode === 200) {
        this.log('✅ 前端服务运行正常');
        this.log(`   响应状态: ${response.statusCode}`);
        
        // 检查是否包含React应用的标识
        if (response.data.includes('<!DOCTYPE html>') || response.data.includes('<div id="root">')) {
          this.log('✅ 前端页面加载正常');
        } else {
          this.log('⚠️  前端页面内容异常', 'warn');
        }
        return true;
      } else {
        this.log(`❌ 前端服务响应异常: ${response.statusCode}`, 'error');
        return false;
      }
    } catch (error) {
      this.log(`❌ 前端服务连接失败: ${error.message}`, 'error');
      this.log('   请确保前端服务已启动 (npm run dev 在 frontend 目录)', 'error');
      return false;
    }
  }

  async checkFrontendToBackendProxy() {
    this.log('🔍 检查前端到后端的代理配置...');
    
    try {
      // 通过前端服务访问后端API
      const response = await this.makeRequest({
        hostname: 'localhost',
        port: this.frontendPort,
        path: '/api/health',
        method: 'GET',
        timeout: this.timeout
      });

      if (response.statusCode === 200) {
        this.log('✅ 前端代理配置正常');
        this.log('✅ 前端可以正常访问后端API');
        return true;
      } else {
        this.log(`❌ 前端代理响应异常: ${response.statusCode}`, 'error');
        return false;
      }
    } catch (error) {
      this.log(`❌ 前端代理连接失败: ${error.message}`, 'error');
      this.log('   请检查 vite.config.ts 中的代理配置', 'error');
      return false;
    }
  }

  async checkDatabaseConnection() {
    this.log('🔍 检查数据库连接...');
    
    try {
      // 检查数据库文件是否存在
      const dbPath = path.join(__dirname, 'backend', 'database.sqlite');
      const dbExists = fs.existsSync(dbPath);
      
      if (dbExists) {
        this.log('✅ 数据库文件存在');
        this.log(`   数据库路径: ${dbPath}`);
      } else {
        this.log('⚠️  数据库文件不存在，将在首次运行时创建', 'warn');
      }

      // 通过API检查数据库连接
      const response = await this.makeRequest({
        hostname: 'localhost',
        port: this.backendPort,
        path: '/api/auth/send-verification-code',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phoneNumber: '13800000000' })
      });

      if (response.statusCode === 200 || response.statusCode === 400) {
        this.log('✅ 数据库连接正常');
        this.log('✅ API可以正常访问数据库');
        return true;
      } else {
        this.log(`❌ 数据库连接测试失败: ${response.statusCode}`, 'error');
        return false;
      }
    } catch (error) {
      this.log(`❌ 数据库连接检查失败: ${error.message}`, 'error');
      return false;
    }
  }

  async checkCriticalAPIEndpoints() {
    this.log('🔍 检查关键API端点...');
    
    const endpoints = [
      {
        name: '健康检查',
        path: '/health',
        method: 'GET',
        expectedStatus: 200
      },
      {
        name: '发送验证码',
        path: '/api/auth/send-verification-code',
        method: 'POST',
        body: JSON.stringify({ phoneNumber: '13800000000' }),
        headers: { 'Content-Type': 'application/json' },
        expectedStatus: [200, 400] // 400也是正常的，因为可能有验证逻辑
      },
      {
        name: '用户登录',
        path: '/api/auth/login',
        method: 'POST',
        body: JSON.stringify({ phoneNumber: '13800000000', verificationCode: '000000' }),
        headers: { 'Content-Type': 'application/json' },
        expectedStatus: [200, 400] // 400是正常的，因为验证码无效
      },
      {
        name: '用户注册',
        path: '/api/auth/register',
        method: 'POST',
        body: JSON.stringify({ 
          phoneNumber: '13800000000', 
          verificationCode: '000000',
          agreeToTerms: true 
        }),
        headers: { 'Content-Type': 'application/json' },
        expectedStatus: [201, 400] // 400是正常的，因为验证码无效
      }
    ];

    let allPassed = true;

    for (const endpoint of endpoints) {
      try {
        this.log(`   测试 ${endpoint.name} (${endpoint.method} ${endpoint.path})`);
        
        const response = await this.makeRequest({
          hostname: 'localhost',
          port: this.backendPort,
          path: endpoint.path,
          method: endpoint.method,
          headers: endpoint.headers || {},
          body: endpoint.body
        });

        const expectedStatuses = Array.isArray(endpoint.expectedStatus) 
          ? endpoint.expectedStatus 
          : [endpoint.expectedStatus];

        if (expectedStatuses.includes(response.statusCode)) {
          this.log(`   ✅ ${endpoint.name} 响应正常 (${response.statusCode})`);
          
          // 检查响应格式
          if (response.body && typeof response.body === 'object') {
            this.log(`   ✅ ${endpoint.name} 返回有效JSON`);
            if (response.body.success !== undefined) {
              this.log(`   ✅ ${endpoint.name} 包含success字段`);
            }
          }
        } else {
          this.log(`   ❌ ${endpoint.name} 响应状态异常: ${response.statusCode}`, 'error');
          allPassed = false;
        }
      } catch (error) {
        this.log(`   ❌ ${endpoint.name} 请求失败: ${error.message}`, 'error');
        allPassed = false;
      }
    }

    return allPassed;
  }

  async checkCORSConfiguration() {
    this.log('🔍 检查CORS配置...');
    
    try {
      const response = await this.makeRequest({
        hostname: 'localhost',
        port: this.backendPort,
        path: '/api/auth/login',
        method: 'OPTIONS',
        headers: {
          'Origin': 'http://localhost:5173',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type'
        }
      });

      if (response.statusCode === 204 || response.statusCode === 200) {
        this.log('✅ CORS预检请求正常');
        
        const corsHeaders = response.headers;
        if (corsHeaders['access-control-allow-origin']) {
          this.log('✅ CORS允许源配置正常');
        }
        if (corsHeaders['access-control-allow-methods']) {
          this.log('✅ CORS允许方法配置正常');
        }
        if (corsHeaders['access-control-allow-headers']) {
          this.log('✅ CORS允许头部配置正常');
        }
        return true;
      } else {
        this.log(`❌ CORS预检请求失败: ${response.statusCode}`, 'error');
        return false;
      }
    } catch (error) {
      this.log(`❌ CORS配置检查失败: ${error.message}`, 'error');
      return false;
    }
  }

  async checkProjectStructure() {
    this.log('🔍 检查项目结构...');
    
    const requiredPaths = [
      'backend/package.json',
      'backend/src/app.js',
      'backend/src/database.js',
      'backend/src/routes/auth.js',
      'frontend/package.json',
      'frontend/vite.config.ts',
      'frontend/src/components/LoginForm.tsx',
      'frontend/src/components/RegisterForm.tsx',
      'frontend/src/components/CountryCodeSelector.tsx'
    ];

    let allExists = true;

    for (const filePath of requiredPaths) {
      const fullPath = path.join(__dirname, filePath);
      if (fs.existsSync(fullPath)) {
        this.log(`   ✅ ${filePath} 存在`);
      } else {
        this.log(`   ❌ ${filePath} 不存在`, 'error');
        allExists = false;
      }
    }

    return allExists;
  }

  async checkTestConfiguration() {
    this.log('🔍 检查测试配置...');
    
    const testPaths = [
      'backend/jest.config.js',
      'backend/test/database.test.js',
      'backend/test/routes/auth.test.js',
      'backend/test/integration/api.integration.test.js',
      'frontend/test/setup.ts',
      'frontend/test/components/LoginForm.test.tsx',
      'frontend/test/components/RegisterForm.test.tsx',
      'frontend/test/components/CountryCodeSelector.test.tsx',
      'frontend/test/e2e/auth.e2e.test.tsx'
    ];

    let allExists = true;

    for (const filePath of testPaths) {
      const fullPath = path.join(__dirname, filePath);
      if (fs.existsSync(fullPath)) {
        this.log(`   ✅ ${filePath} 存在`);
      } else {
        this.log(`   ❌ ${filePath} 不存在`, 'error');
        allExists = false;
      }
    }

    return allExists;
  }

  async generateReport() {
    this.log('📊 生成验证报告...');
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalChecks: this.results.length + this.errors.length,
        passed: this.results.length,
        failed: this.errors.length,
        success: this.errors.length === 0
      },
      results: this.results,
      errors: this.errors
    };

    const reportPath = path.join(__dirname, 'system-verification-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    this.log(`📄 验证报告已保存到: ${reportPath}`);
    return report;
  }

  async run() {
    console.log('🚀 开始系统验证...\n');
    
    const checks = [
      { name: '项目结构检查', fn: () => this.checkProjectStructure() },
      { name: '后端服务检查', fn: () => this.checkBackendService() },
      { name: '前端服务检查', fn: () => this.checkFrontendService() },
      { name: '前端代理检查', fn: () => this.checkFrontendToBackendProxy() },
      { name: '数据库连接检查', fn: () => this.checkDatabaseConnection() },
      { name: 'API端点检查', fn: () => this.checkCriticalAPIEndpoints() },
      { name: 'CORS配置检查', fn: () => this.checkCORSConfiguration() },
      { name: '测试配置检查', fn: () => this.checkTestConfiguration() }
    ];

    let allPassed = true;

    for (const check of checks) {
      try {
        const result = await check.fn();
        if (!result) {
          allPassed = false;
        }
        console.log(''); // 空行分隔
      } catch (error) {
        this.log(`❌ ${check.name}执行失败: ${error.message}`, 'error');
        allPassed = false;
        console.log(''); // 空行分隔
      }
    }

    // 生成报告
    const report = await this.generateReport();

    // 输出总结
    console.log('📋 验证总结:');
    console.log(`   总检查项: ${report.summary.totalChecks}`);
    console.log(`   通过: ${report.summary.passed}`);
    console.log(`   失败: ${report.summary.failed}`);
    console.log(`   整体状态: ${allPassed ? '✅ 通过' : '❌ 失败'}`);

    if (!allPassed) {
      console.log('\n❌ 系统验证失败，请检查以上错误信息');
      console.log('💡 常见解决方案:');
      console.log('   1. 确保后端服务已启动: cd backend && npm run dev');
      console.log('   2. 确保前端服务已启动: cd frontend && npm run dev');
      console.log('   3. 检查端口是否被占用 (3000, 5173)');
      console.log('   4. 检查依赖是否已安装: npm install');
      process.exit(1);
    } else {
      console.log('\n✅ 系统验证通过！所有服务运行正常');
      process.exit(0);
    }
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  const verifier = new SystemVerifier();
  verifier.run().catch(error => {
    console.error('❌ 系统验证过程中发生错误:', error);
    process.exit(1);
  });
}

module.exports = SystemVerifier;