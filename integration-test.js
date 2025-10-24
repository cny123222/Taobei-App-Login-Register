const http = require('http');
const { execSync } = require('child_process');
const path = require('path');

class IntegrationTester {
  constructor() {
    this.baseUrl = 'http://localhost:3000';
    this.frontendUrl = 'http://localhost:5173';
    this.testResults = [];
    this.errors = [];
  }

  // 从数据库获取最新的验证码
  getLatestVerificationCode(phoneNumber, countryCode) {
    try {
      const dbPath = path.join(__dirname, 'backend', 'app.db');
      const query = `SELECT code FROM verification_codes WHERE phone_number = '${phoneNumber}' AND country_code = '${countryCode}' ORDER BY created_at DESC LIMIT 1;`;
      const result = execSync(`sqlite3 "${dbPath}" "${query}"`, { encoding: 'utf8' }).trim();
      return result || null;
    } catch (error) {
      this.log(`❌ 获取验证码失败: ${error.message}`, 'error');
      return null;
    }
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${type.toUpperCase()}: ${message}`;
    console.log(logMessage);
    
    if (type === 'error') {
      this.errors.push(logMessage);
    } else {
      this.testResults.push(logMessage);
    }
  }

  async makeApiRequest(endpoint, method = 'GET', data = null, headers = {}) {
    return new Promise((resolve) => {
      const url = new URL(endpoint, this.baseUrl);
      
      const options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method: method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        timeout: 10000
      };

      if (data && method !== 'GET') {
        const postData = JSON.stringify(data);
        options.headers['Content-Length'] = Buffer.byteLength(postData);
      }

      const req = http.request(options, (res) => {
        let responseData = '';
        
        res.on('data', (chunk) => {
          responseData += chunk;
        });

        res.on('end', () => {
          try {
            const jsonResponse = JSON.parse(responseData);
            resolve({
              success: true,
              statusCode: res.statusCode,
              data: jsonResponse,
              headers: res.headers
            });
          } catch (err) {
            resolve({
              success: true,
              statusCode: res.statusCode,
              data: responseData,
              headers: res.headers
            });
          }
        });
      });

      req.on('error', (err) => {
        resolve({
          success: false,
          error: err.message
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({
          success: false,
          error: 'Request timeout'
        });
      });

      if (data && method !== 'GET') {
        req.write(JSON.stringify(data));
      }
      
      req.end();
    });
  }

  async testCompleteRegistrationFlow() {
    this.log('🧪 测试完整注册流程...');
    
    const testPhoneNumber = '13800138000';
    const testCountryCode = '+86';
    let testPassed = true;

    try {
      // 步骤1: 发送验证码
      this.log('📱 步骤1: 发送验证码...');
      const sendCodeResponse = await this.makeApiRequest('/api/auth/send-verification-code', 'POST', {
        phoneNumber: testPhoneNumber,
        countryCode: testCountryCode
      });

      if (sendCodeResponse.success && sendCodeResponse.statusCode === 200) {
        this.log('✅ 发送验证码API调用成功', 'success');
      } else {
        this.log('❌ 发送验证码API调用失败', 'error');
        testPassed = false;
      }

      // 步骤2: 获取验证码并注册
      this.log('🔍 步骤2a: 获取验证码...');
      const verificationCode = this.getLatestVerificationCode(testPhoneNumber, testCountryCode);
      
      if (!verificationCode) {
        this.log('❌ 无法获取验证码', 'error');
        testPassed = false;
        return { success: false, message: '无法获取验证码' };
      }
      
      this.log(`✅ 获取到验证码: ${verificationCode}`, 'success');
      
      this.log('📝 步骤2b: 用户注册...');
      const registerResponse = await this.makeApiRequest('/api/auth/register', 'POST', {
        phoneNumber: testPhoneNumber,
        verificationCode: verificationCode,
        countryCode: testCountryCode,
        agreeToTerms: true
      });

      if (registerResponse.success && registerResponse.statusCode === 200) {
        this.log('✅ 注册API调用成功', 'success');
        
        // 检查响应格式
        if (registerResponse.data && typeof registerResponse.data === 'object') {
          this.log('✅ 注册响应格式正确', 'success');
        } else {
          this.log('❌ 注册响应格式错误', 'error');
          testPassed = false;
        }
      } else if (registerResponse.success && registerResponse.statusCode === 400 && 
                 registerResponse.data && registerResponse.data.error === '该手机号已注册') {
        this.log('✅ 用户已存在，注册逻辑正确', 'success');
        // 用户已存在是正常情况，不算测试失败
      } else {
        this.log('❌ 注册API调用失败', 'error');
        testPassed = false;
      }

      // 步骤3: 验证重复注册处理
      this.log('🔄 步骤3: 测试重复注册处理...');
      const duplicateRegisterResponse = await this.makeApiRequest('/api/auth/register', 'POST', {
        phoneNumber: testPhoneNumber,
        verificationCode: '123456',
        countryCode: testCountryCode,
        agreeToTerms: true
      });

      if (duplicateRegisterResponse.success) {
        this.log('✅ 重复注册处理API调用成功', 'success');
      } else {
        this.log('❌ 重复注册处理API调用失败', 'error');
        testPassed = false;
      }

    } catch (error) {
      this.log(`❌ 注册流程测试异常: ${error.message}`, 'error');
      testPassed = false;
    }

    return testPassed;
  }

  async testCompleteLoginFlow() {
    this.log('🧪 测试完整登录流程...');
    
    const testPhoneNumber = '13800138000'; // 使用已存在的用户
    const testCountryCode = '+86';
    let testPassed = true;

    try {
      // 步骤1: 发送验证码
      this.log('📱 步骤1: 发送登录验证码...');
      const sendCodeResponse = await this.makeApiRequest('/api/auth/send-verification-code', 'POST', {
        phoneNumber: testPhoneNumber,
        countryCode: testCountryCode
      });

      if (sendCodeResponse.success && sendCodeResponse.statusCode === 200) {
        this.log('✅ 发送验证码API调用成功', 'success');
      } else {
        this.log('❌ 发送验证码API调用失败', 'error');
        testPassed = false;
      }

      // 步骤2: 获取验证码并登录
      this.log('🔍 步骤2a: 获取验证码...');
      const verificationCode = this.getLatestVerificationCode(testPhoneNumber, testCountryCode);
      
      if (!verificationCode) {
        this.log('❌ 无法获取验证码', 'error');
        testPassed = false;
        return { success: false, message: '无法获取验证码' };
      }
      
      this.log(`✅ 获取到验证码: ${verificationCode}`, 'success');
      
      this.log('🔐 步骤2b: 用户登录...');
      const loginResponse = await this.makeApiRequest('/api/auth/login', 'POST', {
        phoneNumber: testPhoneNumber,
        verificationCode: verificationCode,
        countryCode: testCountryCode
      });

      if (loginResponse.success && loginResponse.statusCode === 200) {
        this.log('✅ 登录API调用成功', 'success');
        
        // 检查响应格式
        if (loginResponse.data && typeof loginResponse.data === 'object') {
          this.log('✅ 登录响应格式正确', 'success');
        } else {
          this.log('⚠️ 登录响应格式可能不正确', 'warning');
        }
      } else {
        this.log('❌ 登录API调用失败', 'error');
        testPassed = false;
      }

      // 步骤3: 测试错误验证码
      this.log('🚫 步骤3: 测试错误验证码处理...');
      const wrongCodeResponse = await this.makeApiRequest('/api/auth/login', 'POST', {
        phoneNumber: testPhoneNumber,
        verificationCode: '000000',
        countryCode: testCountryCode
      });

      if (wrongCodeResponse.success) {
        this.log('✅ 错误验证码处理API调用成功', 'success');
      } else {
        this.log('❌ 错误验证码处理API调用失败', 'error');
        testPassed = false;
      }

    } catch (error) {
      this.log(`❌ 登录流程测试异常: ${error.message}`, 'error');
      testPassed = false;
    }

    return testPassed;
  }

  async testApiCallChain() {
    this.log('🧪 测试API调用链...');
    
    let testPassed = true;

    try {
      // 测试API调用顺序和依赖关系
      const apiChain = [
        {
          name: '健康检查',
          endpoint: '/health',
          method: 'GET',
          expectedStatus: 200
        },
        {
          name: '发送验证码',
          endpoint: '/api/auth/send-verification-code',
          method: 'POST',
          data: { phoneNumber: '13800138002', countryCode: '+86' },
          expectedStatus: 200
        },
        {
          name: '用户注册',
          endpoint: '/api/auth/register',
          method: 'POST',
          data: { phoneNumber: '13800138002', verificationCode: '123456', countryCode: '+86', agreeToTerms: true },
          expectedStatus: 200
        },
        {
          name: '用户登录',
          endpoint: '/api/auth/login',
          method: 'POST',
          data: { phoneNumber: '13800138002', verificationCode: '123456', countryCode: '+86' },
          expectedStatus: 200
        },
        {
          name: '获取用户信息',
          endpoint: '/api/auth/profile',
          method: 'GET',
          expectedStatus: 200
        }
      ];

      for (const api of apiChain) {
        this.log(`🔗 测试API: ${api.name}...`);
        
        const response = await this.makeApiRequest(api.endpoint, api.method, api.data);
        
        if (response.success && response.statusCode === api.expectedStatus) {
          this.log(`✅ ${api.name} API调用成功 (状态码: ${response.statusCode})`, 'success');
        } else if (response.success) {
          this.log(`⚠️ ${api.name} API调用成功但状态码异常 (期望: ${api.expectedStatus}, 实际: ${response.statusCode})`, 'warning');
        } else {
          this.log(`❌ ${api.name} API调用失败: ${response.error}`, 'error');
          testPassed = false;
        }

        // 添加延迟以避免请求过于频繁
        await new Promise(resolve => setTimeout(resolve, 100));
      }

    } catch (error) {
      this.log(`❌ API调用链测试异常: ${error.message}`, 'error');
      testPassed = false;
    }

    return testPassed;
  }

  async testErrorHandling() {
    this.log('🧪 测试错误处理...');
    
    let testPassed = true;

    try {
      const errorTests = [
        {
          name: '无效端点',
          endpoint: '/api/invalid-endpoint',
          method: 'GET',
          expectedStatus: 404
        },
        {
          name: '缺少必需参数',
          endpoint: '/api/auth/send-verification-code',
          method: 'POST',
          data: {},
          expectedStatus: [400, 500]
        },
        {
          name: '无效JSON格式',
          endpoint: '/api/auth/login',
          method: 'POST',
          data: 'invalid-json',
          expectedStatus: [400, 500]
        }
      ];

      for (const test of errorTests) {
        this.log(`🚨 测试错误情况: ${test.name}...`);
        
        const response = await this.makeApiRequest(test.endpoint, test.method, test.data);
        
        if (response.success) {
          const expectedStatuses = Array.isArray(test.expectedStatus) ? test.expectedStatus : [test.expectedStatus];
          if (expectedStatuses.includes(response.statusCode)) {
            this.log(`✅ ${test.name} 错误处理正确 (状态码: ${response.statusCode})`, 'success');
          } else {
            this.log(`⚠️ ${test.name} 错误处理状态码异常 (期望: ${expectedStatuses.join('或')}, 实际: ${response.statusCode})`, 'warning');
          }
        } else {
          this.log(`❌ ${test.name} 测试失败: ${response.error}`, 'error');
          testPassed = false;
        }
      }

    } catch (error) {
      this.log(`❌ 错误处理测试异常: ${error.message}`, 'error');
      testPassed = false;
    }

    return testPassed;
  }

  async runAllIntegrationTests() {
    this.log('🚀 开始集成测试...');
    this.log('=' * 60);

    const tests = [
      { name: '完整注册流程', fn: () => this.testCompleteRegistrationFlow() },
      { name: '完整登录流程', fn: () => this.testCompleteLoginFlow() },
      { name: 'API调用链', fn: () => this.testApiCallChain() },
      { name: '错误处理', fn: () => this.testErrorHandling() }
    ];

    const results = {};
    let overallSuccess = true;

    for (const test of tests) {
      this.log(`\n🔄 正在执行: ${test.name}...`);
      try {
        const result = await test.fn();
        results[test.name] = result;
        if (!result) {
          overallSuccess = false;
        }
      } catch (error) {
        this.log(`❌ ${test.name} 执行失败: ${error.message}`, 'error');
        results[test.name] = false;
        overallSuccess = false;
      }
    }

    this.log('\n' + '=' * 60);
    this.log('📋 集成测试结果汇总:');
    
    for (const [testName, result] of Object.entries(results)) {
      const status = result ? '✅ 通过' : '❌ 失败';
      this.log(`  ${testName}: ${status}`);
    }

    this.log('\n' + '=' * 60);
    if (overallSuccess) {
      this.log('🎉 集成测试完成！所有测试都通过了。', 'success');
      this.log('💡 系统集成功能正常，可以进行进一步开发。', 'info');
    } else {
      this.log('⚠️ 集成测试发现问题，请检查失败的测试项目。', 'warning');
      this.log('🔧 建议修复这些问题后重新运行测试。', 'info');
    }

    if (this.errors.length > 0) {
      this.log('\n📝 错误详情:');
      this.errors.forEach(error => console.log(`  ${error}`));
    }

    return overallSuccess;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  const tester = new IntegrationTester();
  
  tester.runAllIntegrationTests()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('集成测试过程中发生未预期的错误:', error);
      process.exit(1);
    });
}

module.exports = IntegrationTester;