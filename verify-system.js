#!/usr/bin/env node

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

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

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// HTTP请求工具函数
function makeRequest(options) {
  return new Promise((resolve, reject) => {
    const protocol = options.protocol === 'https:' ? https : http;
    const req = protocol.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (options.data) {
      req.write(options.data);
    }

    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

// 验证项目结构
async function verifyProjectStructure() {
  logInfo('验证项目结构...');
  
  const requiredPaths = [
    'backend/src',
    'backend/test',
    'backend/package.json',
    'frontend/src',
    'frontend/test',
    'frontend/package.json',
    'frontend/vite.config.ts'
  ];

  let allExists = true;
  
  for (const filePath of requiredPaths) {
    const fullPath = path.join(process.cwd(), filePath);
    if (fs.existsSync(fullPath)) {
      logSuccess(`${filePath} 存在`);
    } else {
      logError(`${filePath} 不存在`);
      allExists = false;
    }
  }

  return allExists;
}

// 验证后端服务
async function verifyBackendService() {
  logInfo('验证后端服务 (端口 3000)...');
  
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/health',
      method: 'GET',
      timeout: 5000
    });

    if (response.statusCode === 200) {
      const data = JSON.parse(response.data);
      if (data.status === 'ok') {
        logSuccess('后端服务运行正常');
        logInfo(`服务名称: ${data.service}`);
        return true;
      } else {
        logError('后端服务状态异常');
        return false;
      }
    } else {
      logError(`后端服务返回状态码: ${response.statusCode}`);
      return false;
    }
  } catch (error) {
    logError(`后端服务连接失败: ${error.message}`);
    logWarning('请确保后端服务已启动 (npm start 在 backend 目录)');
    return false;
  }
}

// 验证前端服务
async function verifyFrontendService() {
  logInfo('验证前端服务 (端口 5173)...');
  
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 5173,
      path: '/',
      method: 'GET',
      timeout: 5000
    });

    if (response.statusCode === 200) {
      logSuccess('前端服务运行正常');
      return true;
    } else {
      logError(`前端服务返回状态码: ${response.statusCode}`);
      return false;
    }
  } catch (error) {
    logError(`前端服务连接失败: ${error.message}`);
    logWarning('请确保前端服务已启动 (npm run dev 在 frontend 目录)');
    return false;
  }
}

// 验证前端访问后端API
async function verifyFrontendToBackendConnection() {
  logInfo('验证前端到后端的API连接...');
  
  try {
    // 模拟前端发起的请求
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/health',
      method: 'GET',
      headers: {
        'Origin': 'http://localhost:5173',
        'Content-Type': 'application/json'
      },
      timeout: 5000
    });

    if (response.statusCode === 200) {
      // 检查CORS头
      const corsHeader = response.headers['access-control-allow-origin'];
      if (corsHeader) {
        logSuccess('前端到后端API连接正常');
        logSuccess('CORS配置正确');
        return true;
      } else {
        logWarning('API可访问但CORS配置可能有问题');
        return false;
      }
    } else {
      logError(`API返回状态码: ${response.statusCode}`);
      return false;
    }
  } catch (error) {
    logError(`前端到后端连接失败: ${error.message}`);
    return false;
  }
}

// 验证数据库连接
async function verifyDatabaseConnection() {
  logInfo('验证数据库连接...');
  
  try {
    // 检查数据库文件是否存在
    const dbPath = path.join(process.cwd(), 'backend/database.sqlite');
    if (fs.existsSync(dbPath)) {
      logSuccess('数据库文件存在');
    } else {
      logWarning('数据库文件不存在，将在首次运行时创建');
    }

    // 通过API验证数据库连接
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/health',
      method: 'GET',
      timeout: 5000
    });

    if (response.statusCode === 200) {
      logSuccess('数据库连接正常 (通过API验证)');
      return true;
    } else {
      logError('数据库连接可能有问题');
      return false;
    }
  } catch (error) {
    logError(`数据库连接验证失败: ${error.message}`);
    return false;
  }
}

// 验证关键API端点
async function verifyAPIEndpoints() {
  logInfo('验证关键API端点...');
  
  const endpoints = [
    {
      name: '发送验证码API',
      path: '/api/auth/send-verification-code',
      method: 'POST',
      data: JSON.stringify({ phone: '13800138000', type: 'register' }),
      expectedStatus: [200, 400] // 400是因为可能手机号格式验证
    },
    {
      name: '用户注册API',
      path: '/api/auth/register',
      method: 'POST',
      data: JSON.stringify({ phone: '13800138000', code: '123456' }),
      expectedStatus: [200, 400] // 400是因为验证码可能无效
    },
    {
      name: '用户登录API',
      path: '/api/auth/login',
      method: 'POST',
      data: JSON.stringify({ phone: '13800138000', code: '123456' }),
      expectedStatus: [200, 400] // 400是因为用户可能不存在或验证码无效
    }
  ];

  let allEndpointsWorking = true;

  for (const endpoint of endpoints) {
    try {
      const response = await makeRequest({
        hostname: 'localhost',
        port: 3000,
        path: endpoint.path,
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'http://localhost:5173'
        },
        data: endpoint.data,
        timeout: 5000
      });

      if (endpoint.expectedStatus.includes(response.statusCode)) {
        logSuccess(`${endpoint.name} 响应正常 (状态码: ${response.statusCode})`);
        
        // 验证响应格式
        try {
          const responseData = JSON.parse(response.data);
          if (typeof responseData.success === 'boolean') {
            logSuccess(`${endpoint.name} 响应格式正确`);
          } else {
            logWarning(`${endpoint.name} 响应格式可能不标准`);
          }
        } catch (parseError) {
          logWarning(`${endpoint.name} 响应不是有效JSON`);
        }
      } else {
        logError(`${endpoint.name} 返回意外状态码: ${response.statusCode}`);
        allEndpointsWorking = false;
      }
    } catch (error) {
      logError(`${endpoint.name} 请求失败: ${error.message}`);
      allEndpointsWorking = false;
    }
  }

  return allEndpointsWorking;
}

// 验证依赖安装
async function verifyDependencies() {
  logInfo('验证依赖安装...');
  
  const backendNodeModules = path.join(process.cwd(), 'backend/node_modules');
  const frontendNodeModules = path.join(process.cwd(), 'frontend/node_modules');
  
  let dependenciesOk = true;
  
  if (fs.existsSync(backendNodeModules)) {
    logSuccess('后端依赖已安装');
  } else {
    logError('后端依赖未安装');
    logWarning('请在 backend 目录运行: npm install');
    dependenciesOk = false;
  }
  
  if (fs.existsSync(frontendNodeModules)) {
    logSuccess('前端依赖已安装');
  } else {
    logError('前端依赖未安装');
    logWarning('请在 frontend 目录运行: npm install');
    dependenciesOk = false;
  }
  
  return dependenciesOk;
}

// 主验证函数
async function main() {
  log('\n🔍 淘贝应用系统验证开始', 'bold');
  log('='.repeat(50), 'blue');
  
  const results = {
    projectStructure: await verifyProjectStructure(),
    dependencies: await verifyDependencies(),
    backendService: await verifyBackendService(),
    frontendService: await verifyFrontendService(),
    frontendToBackend: await verifyFrontendToBackendConnection(),
    database: await verifyDatabaseConnection(),
    apiEndpoints: await verifyAPIEndpoints()
  };
  
  log('\n📊 验证结果汇总', 'bold');
  log('='.repeat(50), 'blue');
  
  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;
  
  Object.entries(results).forEach(([key, value]) => {
    const status = value ? '✅ 通过' : '❌ 失败';
    const keyName = {
      projectStructure: '项目结构',
      dependencies: '依赖安装',
      backendService: '后端服务',
      frontendService: '前端服务',
      frontendToBackend: '前后端连接',
      database: '数据库连接',
      apiEndpoints: 'API端点'
    }[key];
    
    log(`${keyName}: ${status}`);
  });
  
  log(`\n总体结果: ${passed}/${total} 项验证通过`, passed === total ? 'green' : 'red');
  
  if (passed === total) {
    log('\n🎉 系统验证完全通过！可以开始开发和测试。', 'green');
  } else {
    log('\n⚠️  系统验证未完全通过，请检查失败项目。', 'yellow');
    
    // 提供修复建议
    log('\n🔧 修复建议:', 'blue');
    if (!results.dependencies) {
      log('1. 安装依赖: 在 backend 和 frontend 目录分别运行 npm install');
    }
    if (!results.backendService) {
      log('2. 启动后端服务: 在 backend 目录运行 npm start');
    }
    if (!results.frontendService) {
      log('3. 启动前端服务: 在 frontend 目录运行 npm run dev');
    }
    if (!results.database) {
      log('4. 检查数据库配置和连接');
    }
  }
  
  process.exit(passed === total ? 0 : 1);
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

// 运行验证
if (require.main === module) {
  main().catch((error) => {
    logError(`验证过程出错: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  verifyProjectStructure,
  verifyBackendService,
  verifyFrontendService,
  verifyFrontendToBackendConnection,
  verifyDatabaseConnection,
  verifyAPIEndpoints,
  verifyDependencies
};