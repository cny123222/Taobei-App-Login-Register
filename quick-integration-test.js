#!/usr/bin/env node

import http from 'http'

// 配置
const CONFIG = {
  BACKEND_PORT: 3000,
  FRONTEND_PORT: 5173,
  TIMEOUT: 10000
}

// 颜色输出
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green')
}

function logError(message) {
  log(`❌ ${message}`, 'red')
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue')
}

// 检查端口是否可用
function checkPort(port) {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: port,
      method: 'GET',
      path: '/',
      timeout: 5000
    }, (res) => {
      resolve(true)
    })

    req.on('error', () => {
      resolve(false)
    })

    req.on('timeout', () => {
      req.destroy()
      resolve(false)
    })

    req.end()
  })
}

// 测试API端点
function testApiEndpoint(path, method = 'GET', data = null) {
  return new Promise((resolve) => {
    const postData = data ? JSON.stringify(data) : null
    
    const options = {
      hostname: 'localhost',
      port: CONFIG.BACKEND_PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: CONFIG.TIMEOUT
    }

    if (postData) {
      options.headers['Content-Length'] = Buffer.byteLength(postData)
    }

    const req = http.request(options, (res) => {
      let responseData = ''
      
      res.on('data', (chunk) => {
        responseData += chunk
      })
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData)
          resolve({
            success: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            data: parsed
          })
        } catch (e) {
          resolve({
            success: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            data: responseData
          })
        }
      })
    })

    req.on('error', (error) => {
      resolve({
        success: false,
        error: error.message
      })
    })

    req.on('timeout', () => {
      req.destroy()
      resolve({
        success: false,
        error: 'Request timeout'
      })
    })

    if (postData) {
      req.write(postData)
    }
    
    req.end()
  })
}

async function runQuickIntegrationTest() {
  log('\n' + '='.repeat(50), 'bold')
  log('🧪 快速集成测试开始', 'bold')
  log('='.repeat(50), 'bold')

  const results = {
    backendHealth: false,
    frontendHealth: false,
    apiEndpoints: {},
    totalTests: 0,
    passedTests: 0
  }

  // 1. 检查后端服务
  logInfo('检查后端服务状态...')
  results.backendHealth = await checkPort(CONFIG.BACKEND_PORT)
  results.totalTests++
  
  if (results.backendHealth) {
    logSuccess('后端服务运行正常')
    results.passedTests++
  } else {
    logError('后端服务未运行')
  }

  // 2. 检查前端服务
  logInfo('检查前端服务状态...')
  results.frontendHealth = await checkPort(CONFIG.FRONTEND_PORT)
  results.totalTests++
  
  if (results.frontendHealth) {
    logSuccess('前端服务运行正常')
    results.passedTests++
  } else {
    logError('前端服务未运行')
  }

  // 3. 测试API端点（仅在后端运行时）
  if (results.backendHealth) {
    logInfo('测试API端点...')
    
    const apiTests = [
      {
        name: '发送验证码',
        path: '/api/auth/send-verification-code',
        method: 'POST',
        data: { phone: '13812345678' }
      },
      {
        name: '用户注册',
        path: '/api/auth/register',
        method: 'POST',
        data: { phone: '13812345678', code: '123456', password: 'password123' }
      },
      {
        name: '用户登录',
        path: '/api/auth/login',
        method: 'POST',
        data: { phone: '13812345678', code: '123456' }
      }
    ]

    for (const test of apiTests) {
      results.totalTests++
      const result = await testApiEndpoint(test.path, test.method, test.data)
      results.apiEndpoints[test.name] = result.success
      
      if (result.success) {
        logSuccess(`${test.name} API 测试通过`)
        results.passedTests++
      } else {
        logError(`${test.name} API 测试失败: ${result.error || result.status}`)
      }
    }
  }

  // 生成测试报告
  log('\n' + '='.repeat(50), 'bold')
  log('📊 集成测试报告', 'bold')
  log('='.repeat(50), 'bold')

  const successRate = Math.round((results.passedTests / results.totalTests) * 100)
  
  log(`\n测试结果: ${results.passedTests}/${results.totalTests} 通过 (${successRate}%)`)
  
  if (successRate >= 80) {
    logSuccess('🎉 集成测试通过！系统运行正常')
  } else if (successRate >= 60) {
    log('⚠️  集成测试部分通过，需要检查失败项目', 'yellow')
  } else {
    logError('❌ 集成测试失败，系统存在问题')
  }

  return {
    success: successRate >= 60,
    passed: results.passedTests,
    total: results.totalTests,
    successRate: successRate,
    details: results
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  runQuickIntegrationTest()
    .then(result => {
      process.exit(result.success ? 0 : 1)
    })
    .catch(error => {
      logError(`集成测试发生错误: ${error.message}`)
      process.exit(1)
    })
}

export { runQuickIntegrationTest }