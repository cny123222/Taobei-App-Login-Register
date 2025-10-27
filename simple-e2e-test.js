#!/usr/bin/env node

const http = require('http');
const { spawn } = require('child_process');

// 颜色输出
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// HTTP请求工具函数
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      res.on('end', () => {
        try {
          const parsedData = responseData ? JSON.parse(responseData) : {};
          resolve({
            statusCode: res.statusCode,
            data: parsedData,
            headers: res.headers
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            data: responseData,
            headers: res.headers
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// 生成随机手机号
function generateRandomPhone() {
  const prefix = '138';
  const suffix = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
  return prefix + suffix;
}

// 端到端测试：完整用户注册流程
async function testCompleteRegistrationFlow() {
  logInfo('测试完整用户注册流程...');
  
  const phone = generateRandomPhone();
  logInfo(`使用测试手机号: ${phone}`);

  try {
    // 步骤1: 发送注册验证码
    logInfo('步骤1: 发送注册验证码');
    const sendCodeResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/send-verification-code',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, {
      phone: phone,
      type: 'register'
    });

    if (sendCodeResponse.statusCode !== 200) {
      throw new Error(`发送验证码失败: ${sendCodeResponse.statusCode}`);
    }
    logSuccess('验证码发送成功');

    // 步骤2: 用户注册
    logInfo('步骤2: 用户注册');
    const registerResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/register',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, {
      phone: phone,
      code: '123456', // 测试验证码
      password: 'test123456'
    });

    if (registerResponse.statusCode !== 201) {
      throw new Error(`用户注册失败: ${registerResponse.statusCode}`);
    }
    logSuccess('用户注册成功');

    return { success: true, phone };
  } catch (error) {
    logError(`注册流程失败: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// 端到端测试：完整用户登录流程
async function testCompleteLoginFlow(phone) {
  logInfo('测试完整用户登录流程...');

  try {
    // 步骤1: 发送登录验证码
    logInfo('步骤1: 发送登录验证码');
    const sendCodeResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/send-verification-code',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, {
      phone: phone,
      type: 'login'
    });

    if (sendCodeResponse.statusCode !== 200) {
      throw new Error(`发送验证码失败: ${sendCodeResponse.statusCode}`);
    }
    logSuccess('验证码发送成功');

    // 步骤2: 用户登录
    logInfo('步骤2: 用户登录');
    const loginResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, {
      phone: phone,
      code: '123456' // 测试验证码
    });

    if (loginResponse.statusCode !== 200) {
      throw new Error(`用户登录失败: ${loginResponse.statusCode}`);
    }
    logSuccess('用户登录成功');

    return { success: true };
  } catch (error) {
    logError(`登录流程失败: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// 测试前端页面可访问性
async function testFrontendAccessibility() {
  logInfo('测试前端页面可访问性...');

  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 5173,
      path: '/',
      method: 'GET'
    });

    if (response.statusCode !== 200) {
      throw new Error(`前端页面不可访问: ${response.statusCode}`);
    }
    logSuccess('前端页面可访问');
    return { success: true };
  } catch (error) {
    logError(`前端页面访问失败: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// 主测试函数
async function main() {
  log('\n🧪 简化端到端测试开始', 'bold');
  log('==================================================', 'blue');

  const results = {
    frontend: false,
    registration: false,
    login: false
  };

  // 测试前端可访问性
  const frontendResult = await testFrontendAccessibility();
  results.frontend = frontendResult.success;

  // 测试完整注册流程
  const registrationResult = await testCompleteRegistrationFlow();
  results.registration = registrationResult.success;

  let loginResult = { success: false };
  if (registrationResult.success) {
    // 测试完整登录流程
    loginResult = await testCompleteLoginFlow(registrationResult.phone);
    results.login = loginResult.success;
  }

  // 输出测试结果
  log('\n📊 端到端测试结果汇总', 'bold');
  log('==================================================', 'blue');
  
  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;

  log(`前端可访问性: ${results.frontend ? '✅ 通过' : '❌ 失败'}`, results.frontend ? 'green' : 'red');
  log(`用户注册流程: ${results.registration ? '✅ 通过' : '❌ 失败'}`, results.registration ? 'green' : 'red');
  log(`用户登录流程: ${results.login ? '✅ 通过' : '❌ 失败'}`, results.login ? 'green' : 'red');

  log(`\n总体结果: ${passedTests}/${totalTests} 项测试通过`, passedTests === totalTests ? 'green' : 'yellow');

  if (passedTests === totalTests) {
    log('\n🎉 所有端到端测试通过！', 'green');
    process.exit(0);
  } else {
    log('\n⚠️  部分端到端测试失败，请检查失败项目。', 'yellow');
    process.exit(1);
  }
}

// 错误处理
process.on('uncaughtException', (error) => {
  logError(`未捕获的异常: ${error.message}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logError(`未处理的Promise拒绝: ${reason}`);
  process.exit(1);
});

// 运行测试
if (require.main === module) {
  main().catch((error) => {
    logError(`测试执行失败: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  testCompleteRegistrationFlow,
  testCompleteLoginFlow,
  testFrontendAccessibility
};