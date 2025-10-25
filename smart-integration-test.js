#!/usr/bin/env node

/**
 * 智能API集成测试
 * 支持动态验证码和完整的前后端通信测试
 */

const axios = require('axios');
const { spawn } = require('child_process');

const BACKEND_URL = 'http://localhost:3000';
const FRONTEND_URL = 'http://localhost:5173';

class SmartIntegrationTester {
  constructor() {
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      errors: []
    };
    this.testData = {
      phone: '13800138000',
      password: 'test123456'
    };
  }

  async runTest(name, testFn) {
    this.results.total++;
    console.log(`\n🧪 测试: ${name}`);
    
    try {
      await testFn();
      this.results.passed++;
      console.log(`✅ ${name} - 通过`);
      return true;
    } catch (error) {
      let errorMessage = error.message;
      if (error.response) {
        errorMessage += ` (状态码: ${error.response.status})`;
        if (error.response.data) {
          errorMessage += ` - 响应: ${JSON.stringify(error.response.data)}`;
        }
      }
      this.results.failed++;
      this.results.errors.push({ name, error: errorMessage });
      console.log(`❌ ${name} - 失败: ${errorMessage}`);
      return false;
    }
  }

  async testServiceHealth() {
    await this.runTest('后端服务健康检查', async () => {
      const response = await axios.get(`${BACKEND_URL}/api/health`, {
        timeout: 5000
      });
      
      if (response.status !== 200) {
        throw new Error(`期望状态码200，实际${response.status}`);
      }
      
      if (!response.data.status || response.data.status !== 'ok') {
        throw new Error('健康检查响应格式不正确');
      }
    });

    await this.runTest('前端服务可访问性', async () => {
      const response = await axios.get(FRONTEND_URL, {
        timeout: 5000
      });
      
      if (response.status !== 200) {
        throw new Error(`期望状态码200，实际${response.status}`);
      }
    });
  }

  async testSendVerificationCodeAPI() {
    await this.runTest('发送验证码API - 有效请求', async () => {
      const response = await axios.post(`${BACKEND_URL}/api/auth/send-verification-code`, {
        phone: this.testData.phone,
        type: 'register'
      }, {
        timeout: 5000,
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.status !== 200) {
        throw new Error(`期望状态码200，实际${response.status}`);
      }
      
      if (!response.data.success) {
        throw new Error('响应中success字段应为true');
      }

      if (!response.data.countdown || response.data.countdown !== 300) {
        throw new Error('倒计时应为300秒');
      }
    });

    await this.runTest('发送验证码API - 无效手机号', async () => {
      try {
        await axios.post(`${BACKEND_URL}/api/auth/send-verification-code`, {
          phone: '123',
          type: 'register'
        }, {
          timeout: 5000,
          headers: { 'Content-Type': 'application/json' }
        });
        throw new Error('无效手机号应该返回错误');
      } catch (error) {
        if (error.response && error.response.status === 400) {
          return; // 期望的错误响应
        }
        throw error;
      }
    });

    await this.runTest('发送验证码API - 缺少type字段', async () => {
      try {
        await axios.post(`${BACKEND_URL}/api/auth/send-verification-code`, {
          phone: this.testData.phone
        }, {
          timeout: 5000,
          headers: { 'Content-Type': 'application/json' }
        });
        throw new Error('缺少type字段应该返回错误');
      } catch (error) {
        if (error.response && error.response.status === 400) {
          return; // 期望的错误响应
        }
        throw error;
      }
    });
  }

  async testUserRegistrationWithTestEnv() {
    await this.runTest('用户注册流程 - 测试环境', async () => {
      // 1. 发送验证码
      const sendCodeResponse = await axios.post(`${BACKEND_URL}/api/auth/send-verification-code`, {
        phone: this.testData.phone,
        type: 'register'
      }, {
        timeout: 5000,
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (sendCodeResponse.status !== 200 || !sendCodeResponse.data.success) {
        throw new Error('发送验证码失败');
      }

      // 等待一小段时间确保验证码保存到数据库
      await new Promise(resolve => setTimeout(resolve, 100));

      // 2. 使用固定验证码注册（测试环境）
      const registerResponse = await axios.post(`${BACKEND_URL}/api/auth/register`, {
        phone: this.testData.phone,
        code: '123456', // 测试环境固定验证码
        password: this.testData.password
      }, {
        timeout: 5000,
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (registerResponse.status !== 200) {
        throw new Error(`注册失败，状态码: ${registerResponse.status}`);
      }
      
      if (!registerResponse.data.success) {
        throw new Error(`注册失败: ${registerResponse.data.message}`);
      }
    });
  }

  async testUserLoginWithTestEnv() {
    await this.runTest('用户登录流程 - 测试环境', async () => {
      // 1. 发送登录验证码
      const sendCodeResponse = await axios.post(`${BACKEND_URL}/api/auth/send-verification-code`, {
        phone: this.testData.phone,
        type: 'login'
      }, {
        timeout: 5000,
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (sendCodeResponse.status !== 200 || !sendCodeResponse.data.success) {
        throw new Error('发送登录验证码失败');
      }

      // 2. 使用固定验证码登录
      const loginResponse = await axios.post(`${BACKEND_URL}/api/auth/login`, {
        phone: this.testData.phone,
        code: '123456' // 测试环境固定验证码
      }, {
        timeout: 5000,
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (loginResponse.status !== 200) {
        throw new Error(`登录失败，状态码: ${loginResponse.status}`);
      }
      
      if (!loginResponse.data.success) {
        throw new Error(`登录失败: ${loginResponse.data.message}`);
      }
    });
  }

  async testErrorHandling() {
    await this.runTest('错误处理 - 404端点', async () => {
      try {
        await axios.get(`${BACKEND_URL}/api/nonexistent`, {
          timeout: 5000
        });
        throw new Error('不存在的端点应该返回404');
      } catch (error) {
        if (error.response && error.response.status === 404) {
          return; // 期望的404响应
        }
        throw error;
      }
    });

    await this.runTest('错误处理 - 无效JSON', async () => {
      try {
        await axios.post(`${BACKEND_URL}/api/auth/send-verification-code`, 
          'invalid json', {
          timeout: 5000,
          headers: { 'Content-Type': 'application/json' }
        });
        throw new Error('无效JSON应该返回错误');
      } catch (error) {
        if (error.response && error.response.status === 400) {
          return; // 期望的错误响应
        }
        throw error;
      }
    });
  }

  async testCORSConfiguration() {
    await this.runTest('CORS配置验证', async () => {
      const response = await axios.options(`${BACKEND_URL}/api/health`, {
        headers: {
          'Origin': FRONTEND_URL,
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type'
        },
        timeout: 5000
      });
      
      if (response.status !== 200 && response.status !== 204) {
        throw new Error(`CORS预检请求失败，状态码: ${response.status}`);
      }
    });
  }

  async testAPIPerformance() {
    await this.runTest('API性能测试', async () => {
      const testCases = [
        { name: '健康检查', url: `${BACKEND_URL}/api/health`, method: 'GET' },
        { 
          name: '发送验证码', 
          url: `${BACKEND_URL}/api/auth/send-verification-code`, 
          method: 'POST',
          data: { phone: this.testData.phone, type: 'register' }
        }
      ];

      for (const testCase of testCases) {
        const startTime = Date.now();
        
        if (testCase.method === 'GET') {
          await axios.get(testCase.url, { timeout: 5000 });
        } else {
          await axios.post(testCase.url, testCase.data, {
            timeout: 5000,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        const responseTime = Date.now() - startTime;
        
        if (responseTime > 2000) {
          throw new Error(`${testCase.name} 响应时间过长: ${responseTime}ms`);
        }
        
        console.log(`  ✓ ${testCase.name}: ${responseTime}ms`);
      }
    });
  }

  async runWithTestEnvironment() {
    console.log('🚀 开始智能API集成测试（测试环境）');
    console.log('==================================================');
    
    // 设置测试环境变量
    process.env.NODE_ENV = 'test';
    
    try {
      await this.testServiceHealth();
      await this.testSendVerificationCodeAPI();
      await this.testUserRegistrationWithTestEnv();
      await this.testUserLoginWithTestEnv();
      await this.testErrorHandling();
      await this.testCORSConfiguration();
      await this.testAPIPerformance();
      
      this.printResults();
      
      if (this.results.failed > 0) {
        process.exit(1);
      }
      
    } catch (error) {
      console.error('❌ 测试执行失败:', error.message);
      process.exit(1);
    } finally {
      // 恢复环境变量
      delete process.env.NODE_ENV;
    }
  }

  printResults() {
    console.log('\n📊 智能集成测试结果');
    console.log('==================================================');
    console.log(`总测试数: ${this.results.total}`);
    console.log(`通过: ${this.results.passed}`);
    console.log(`失败: ${this.results.failed}`);
    
    if (this.results.errors.length > 0) {
      console.log('\n❌ 失败详情:');
      this.results.errors.forEach(({ name, error }) => {
        console.log(`  - ${name}: ${error}`);
      });
    }
    
    if (this.results.failed === 0) {
      console.log('\n🎉 所有智能集成测试通过！');
    } else {
      console.log('\n⚠️  存在失败的测试，请检查并修复。');
    }
  }
}

// 运行测试
if (require.main === module) {
  const tester = new SmartIntegrationTester();
  tester.runWithTestEnvironment().catch(error => {
    console.error('测试运行失败:', error);
    process.exit(1);
  });
}

module.exports = SmartIntegrationTester;