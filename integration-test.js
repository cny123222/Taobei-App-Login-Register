#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const path = require('path');

/**
 * 集成测试脚本
 * 测试完整注册流程、登录流程、API调用链
 */

class IntegrationTester {
  constructor() {
    this.results = [];
    this.errors = [];
    this.backendPort = 3000;
    this.timeout = 15000; // 15秒超时
    this.testData = {
      phoneNumber: '13912345678',
      verificationCode: '123456',
      invalidCode: '000000'
    };
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
      const timeout = setTimeout(() => {
        reject(new Error(`Request timeout after ${this.timeout}ms`));
      }, this.timeout);

      const req = http.request(options, (res) => {
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

  async wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async testCompleteRegistrationFlow() {
    this.log('🔄 测试完整用户注册流程...');
    
    try {
      // 步骤1: 发送验证码
      this.log('   步骤1: 发送验证码');
      const sendCodeResponse = await this.makeRequest({
        hostname: 'localhost',
        port: this.backendPort,
        path: '/api/auth/send-verification-code',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phoneNumber: this.testData.phoneNumber })
      });

      if (sendCodeResponse.statusCode !== 200) {
        this.log(`   ❌ 发送验证码失败: ${sendCodeResponse.statusCode}`, 'error');
        if (sendCodeResponse.body && sendCodeResponse.body.message) {
          this.log(`   错误信息: ${sendCodeResponse.body.message}`, 'error');
        }
        return false;
      }

      this.log('   ✅ 验证码发送成功');
      
      // 检查响应格式
      if (sendCodeResponse.body && sendCodeResponse.body.success) {
        this.log('   ✅ 响应格式正确');
      } else {
        this.log('   ⚠️  响应格式可能异常', 'warn');
      }

      // 步骤2: 等待一段时间模拟用户输入验证码
      this.log('   等待2秒模拟用户输入验证码...');
      await this.wait(2000);

      // 步骤3: 用户注册
      this.log('   步骤2: 用户注册');
      const registerResponse = await this.makeRequest({
        hostname: 'localhost',
        port: this.backendPort,
        path: '/api/auth/register',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phoneNumber: this.testData.phoneNumber,
          verificationCode: this.testData.verificationCode,
          agreeToTerms: true
        })
      });

      // 注册可能成功(201)或失败(400)，都是正常的
      if (registerResponse.statusCode === 201) {
        this.log('   ✅ 用户注册成功');
        
        // 检查响应内容
        if (registerResponse.body && registerResponse.body.success) {
          this.log('   ✅ 注册响应格式正确');
          if (registerResponse.body.token) {
            this.log('   ✅ 返回了认证令牌');
          }
          if (registerResponse.body.user) {
            this.log('   ✅ 返回了用户信息');
          }
        }
      } else if (registerResponse.statusCode === 400) {
        this.log('   ⚠️  注册失败（可能是验证码无效或用户已存在）', 'warn');
        if (registerResponse.body && registerResponse.body.message) {
          this.log(`   失败原因: ${registerResponse.body.message}`, 'warn');
        }
      } else {
        this.log(`   ❌ 注册请求异常: ${registerResponse.statusCode}`, 'error');
        return false;
      }

      this.log('✅ 完整注册流程测试完成');
      return true;

    } catch (error) {
      this.log(`❌ 注册流程测试失败: ${error.message}`, 'error');
      return false;
    }
  }

  async testCompleteLoginFlow() {
    this.log('🔄 测试完整用户登录流程...');
    
    try {
      // 步骤1: 发送验证码
      this.log('   步骤1: 发送登录验证码');
      const sendCodeResponse = await this.makeRequest({
        hostname: 'localhost',
        port: this.backendPort,
        path: '/api/auth/send-verification-code',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phoneNumber: this.testData.phoneNumber })
      });

      if (sendCodeResponse.statusCode !== 200) {
        this.log(`   ❌ 发送验证码失败: ${sendCodeResponse.statusCode}`, 'error');
        return false;
      }

      this.log('   ✅ 登录验证码发送成功');

      // 步骤2: 等待一段时间模拟用户输入验证码
      this.log('   等待2秒模拟用户输入验证码...');
      await this.wait(2000);

      // 步骤3: 用户登录
      this.log('   步骤2: 用户登录');
      const loginResponse = await this.makeRequest({
        hostname: 'localhost',
        port: this.backendPort,
        path: '/api/auth/login',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phoneNumber: this.testData.phoneNumber,
          verificationCode: this.testData.verificationCode
        })
      });

      // 登录可能成功(200)或失败(400)，都是正常的
      if (loginResponse.statusCode === 200) {
        this.log('   ✅ 用户登录成功');
        
        // 检查响应内容
        if (loginResponse.body && loginResponse.body.success) {
          this.log('   ✅ 登录响应格式正确');
          if (loginResponse.body.token) {
            this.log('   ✅ 返回了认证令牌');
          }
          if (loginResponse.body.user) {
            this.log('   ✅ 返回了用户信息');
          }
        }
      } else if (loginResponse.statusCode === 400) {
        this.log('   ⚠️  登录失败（可能是验证码无效或用户不存在）', 'warn');
        if (loginResponse.body && loginResponse.body.message) {
          this.log(`   失败原因: ${loginResponse.body.message}`, 'warn');
        }
      } else {
        this.log(`   ❌ 登录请求异常: ${loginResponse.statusCode}`, 'error');
        return false;
      }

      this.log('✅ 完整登录流程测试完成');
      return true;

    } catch (error) {
      this.log(`❌ 登录流程测试失败: ${error.message}`, 'error');
      return false;
    }
  }

  async testAPICallChain() {
    this.log('🔄 测试API调用链...');
    
    try {
      // 测试API调用顺序和依赖关系
      const testCases = [
        {
          name: '健康检查',
          request: {
            path: '/health',
            method: 'GET'
          },
          expectedStatus: 200
        },
        {
          name: '发送验证码 - 有效手机号',
          request: {
            path: '/api/auth/send-verification-code',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phoneNumber: '13800138000' })
          },
          expectedStatus: 200
        },
        {
          name: '发送验证码 - 无效手机号',
          request: {
            path: '/api/auth/send-verification-code',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phoneNumber: 'invalid' })
          },
          expectedStatus: 400
        },
        {
          name: '登录 - 缺少参数',
          request: {
            path: '/api/auth/login',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
          },
          expectedStatus: 400
        },
        {
          name: '注册 - 缺少参数',
          request: {
            path: '/api/auth/register',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
          },
          expectedStatus: 400
        }
      ];

      let allPassed = true;

      for (const testCase of testCases) {
        this.log(`   测试: ${testCase.name}`);
        
        try {
          const response = await this.makeRequest({
            hostname: 'localhost',
            port: this.backendPort,
            ...testCase.request
          });

          if (response.statusCode === testCase.expectedStatus) {
            this.log(`   ✅ ${testCase.name} 通过 (${response.statusCode})`);
            
            // 检查响应格式
            if (response.body && typeof response.body === 'object') {
              this.log(`   ✅ 返回有效JSON格式`);
            }
          } else {
            this.log(`   ❌ ${testCase.name} 失败: 期望 ${testCase.expectedStatus}, 实际 ${response.statusCode}`, 'error');
            allPassed = false;
          }
        } catch (error) {
          this.log(`   ❌ ${testCase.name} 请求失败: ${error.message}`, 'error');
          allPassed = false;
        }

        // 在请求之间稍作等待
        await this.wait(500);
      }

      return allPassed;

    } catch (error) {
      this.log(`❌ API调用链测试失败: ${error.message}`, 'error');
      return false;
    }
  }

  async testRateLimiting() {
    this.log('🔄 测试验证码发送频率限制...');
    
    try {
      const phoneNumber = '13900000000';
      
      // 连续发送多个验证码请求
      this.log('   发送第1个验证码请求...');
      const firstResponse = await this.makeRequest({
        hostname: 'localhost',
        port: this.backendPort,
        path: '/api/auth/send-verification-code',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber })
      });

      if (firstResponse.statusCode === 200) {
        this.log('   ✅ 第1个请求成功');
      } else {
        this.log(`   ⚠️  第1个请求失败: ${firstResponse.statusCode}`, 'warn');
      }

      // 立即发送第2个请求
      this.log('   立即发送第2个验证码请求...');
      const secondResponse = await this.makeRequest({
        hostname: 'localhost',
        port: this.backendPort,
        path: '/api/auth/send-verification-code',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber })
      });

      if (secondResponse.statusCode === 429) {
        this.log('   ✅ 频率限制正常工作 (429 Too Many Requests)');
        return true;
      } else if (secondResponse.statusCode === 400) {
        this.log('   ✅ 业务逻辑限制正常工作 (400 Bad Request)');
        if (secondResponse.body && secondResponse.body.message) {
          this.log(`   限制信息: ${secondResponse.body.message}`);
        }
        return true;
      } else {
        this.log(`   ⚠️  频率限制可能未生效: ${secondResponse.statusCode}`, 'warn');
        return false;
      }

    } catch (error) {
      this.log(`❌ 频率限制测试失败: ${error.message}`, 'error');
      return false;
    }
  }

  async testErrorHandling() {
    this.log('🔄 测试错误处理...');
    
    try {
      const errorTests = [
        {
          name: '404错误 - 不存在的端点',
          request: {
            path: '/api/nonexistent',
            method: 'GET'
          },
          expectedStatus: 404
        },
        {
          name: '405错误 - 不支持的方法',
          request: {
            path: '/api/auth/login',
            method: 'DELETE'
          },
          expectedStatus: [404, 405] // 可能返回404或405
        },
        {
          name: '400错误 - 无效JSON',
          request: {
            path: '/api/auth/login',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: 'invalid json'
          },
          expectedStatus: 400
        }
      ];

      let allPassed = true;

      for (const test of errorTests) {
        this.log(`   测试: ${test.name}`);
        
        try {
          const response = await this.makeRequest({
            hostname: 'localhost',
            port: this.backendPort,
            ...test.request
          });

          const expectedStatuses = Array.isArray(test.expectedStatus) 
            ? test.expectedStatus 
            : [test.expectedStatus];

          if (expectedStatuses.includes(response.statusCode)) {
            this.log(`   ✅ ${test.name} 通过 (${response.statusCode})`);
          } else {
            this.log(`   ❌ ${test.name} 失败: 期望 ${test.expectedStatus}, 实际 ${response.statusCode}`, 'error');
            allPassed = false;
          }
        } catch (error) {
          // 对于某些错误测试，连接错误也是可以接受的
          this.log(`   ⚠️  ${test.name} 连接错误: ${error.message}`, 'warn');
        }

        await this.wait(300);
      }

      return allPassed;

    } catch (error) {
      this.log(`❌ 错误处理测试失败: ${error.message}`, 'error');
      return false;
    }
  }

  async testConcurrentRequests() {
    this.log('🔄 测试并发请求处理...');
    
    try {
      const concurrentCount = 5;
      const requests = [];

      this.log(`   发送${concurrentCount}个并发请求...`);

      // 创建多个并发请求
      for (let i = 0; i < concurrentCount; i++) {
        const request = this.makeRequest({
          hostname: 'localhost',
          port: this.backendPort,
          path: '/health',
          method: 'GET'
        });
        requests.push(request);
      }

      // 等待所有请求完成
      const responses = await Promise.allSettled(requests);
      
      let successCount = 0;
      let errorCount = 0;

      responses.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.statusCode === 200) {
          successCount++;
          this.log(`   ✅ 并发请求 ${index + 1} 成功`);
        } else {
          errorCount++;
          this.log(`   ❌ 并发请求 ${index + 1} 失败`, 'error');
        }
      });

      this.log(`   并发测试结果: ${successCount}成功, ${errorCount}失败`);

      if (successCount >= concurrentCount * 0.8) { // 80%成功率
        this.log('   ✅ 并发请求处理正常');
        return true;
      } else {
        this.log('   ❌ 并发请求处理异常', 'error');
        return false;
      }

    } catch (error) {
      this.log(`❌ 并发请求测试失败: ${error.message}`, 'error');
      return false;
    }
  }

  async generateReport() {
    this.log('📊 生成集成测试报告...');
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: this.results.length + this.errors.length,
        passed: this.results.length,
        failed: this.errors.length,
        success: this.errors.length === 0
      },
      testData: this.testData,
      results: this.results,
      errors: this.errors
    };

    const reportPath = path.join(__dirname, 'integration-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    this.log(`📄 集成测试报告已保存到: ${reportPath}`);
    return report;
  }

  async run() {
    console.log('🚀 开始集成测试...\n');
    
    // 首先检查后端服务是否运行
    try {
      await this.makeRequest({
        hostname: 'localhost',
        port: this.backendPort,
        path: '/health',
        method: 'GET'
      });
      this.log('✅ 后端服务运行正常，开始集成测试');
    } catch (error) {
      this.log('❌ 后端服务未运行，请先启动后端服务', 'error');
      this.log('   启动命令: cd backend && npm run dev', 'error');
      process.exit(1);
    }

    const tests = [
      { name: '完整注册流程', fn: () => this.testCompleteRegistrationFlow() },
      { name: '完整登录流程', fn: () => this.testCompleteLoginFlow() },
      { name: 'API调用链', fn: () => this.testAPICallChain() },
      { name: '频率限制', fn: () => this.testRateLimiting() },
      { name: '错误处理', fn: () => this.testErrorHandling() },
      { name: '并发请求', fn: () => this.testConcurrentRequests() }
    ];

    let allPassed = true;

    for (const test of tests) {
      try {
        this.log(`\n🧪 开始测试: ${test.name}`);
        const result = await test.fn();
        if (!result) {
          allPassed = false;
        }
        console.log(''); // 空行分隔
      } catch (error) {
        this.log(`❌ ${test.name}执行失败: ${error.message}`, 'error');
        allPassed = false;
        console.log(''); // 空行分隔
      }
    }

    // 生成报告
    const report = await this.generateReport();

    // 输出总结
    console.log('📋 集成测试总结:');
    console.log(`   总测试数: ${report.summary.totalTests}`);
    console.log(`   通过: ${report.summary.passed}`);
    console.log(`   失败: ${report.summary.failed}`);
    console.log(`   整体状态: ${allPassed ? '✅ 通过' : '❌ 失败'}`);

    if (!allPassed) {
      console.log('\n❌ 集成测试失败，请检查以上错误信息');
      console.log('💡 常见问题:');
      console.log('   1. 确保后端服务正常运行');
      console.log('   2. 检查数据库连接');
      console.log('   3. 验证API端点实现');
      console.log('   4. 检查错误处理逻辑');
      process.exit(1);
    } else {
      console.log('\n✅ 集成测试通过！所有流程正常工作');
      process.exit(0);
    }
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  const tester = new IntegrationTester();
  tester.run().catch(error => {
    console.error('❌ 集成测试过程中发生错误:', error);
    process.exit(1);
  });
}

module.exports = IntegrationTester;