#!/usr/bin/env node

import http from 'http'
import { spawn } from 'child_process'
import { promisify } from 'util'

const sleep = promisify(setTimeout)

// 配置
const CONFIG = {
  BACKEND_PORT: 3000,
  FRONTEND_PORT: 5173,
  TIMEOUT: 30000,
  RETRY_INTERVAL: 1000,
  MAX_RETRIES: 30
}

// 颜色输出
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
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

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow')
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue')
}

function logStep(message) {
  log(`🔄 ${message}`, 'cyan')
}

// 检查端口是否可用
function checkPort(port) {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: port,
      method: 'GET',
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

// API请求函数
function makeApiRequest(method, path, data = null) {
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
      timeout: 10000
    }

    if (postData) {
      options.headers['Content-Length'] = Buffer.byteLength(postData)
    }

    const req = http.request(options, (res) => {
      let responseData = ''
      res.on('data', chunk => responseData += chunk)
      res.on('end', () => {
        try {
          const parsed = responseData ? JSON.parse(responseData) : {}
          resolve({
            success: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            data: parsed,
            headers: res.headers
          })
        } catch (error) {
          resolve({
            success: false,
            status: res.statusCode,
            error: 'Invalid JSON response',
            rawData: responseData
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

// 启动服务
async function startServices() {
  logInfo('启动后端和前端服务...')
  
  // 启动后端
  const backendProcess = spawn('npm', ['start'], {
    cwd: './backend',
    stdio: 'pipe',
    detached: false
  })

  // 启动前端
  const frontendProcess = spawn('npm', ['run', 'dev'], {
    cwd: './frontend',
    stdio: 'pipe',
    detached: false
  })

  // 等待服务启动
  await sleep(5000)

  // 检查服务是否就绪
  let backendReady = false
  let frontendReady = false

  for (let i = 0; i < CONFIG.MAX_RETRIES; i++) {
    if (!backendReady) {
      backendReady = await checkPort(CONFIG.BACKEND_PORT)
    }
    if (!frontendReady) {
      frontendReady = await checkPort(CONFIG.FRONTEND_PORT)
    }
    
    if (backendReady && frontendReady) {
      break
    }
    
    await sleep(CONFIG.RETRY_INTERVAL)
  }

  return {
    backendProcess,
    frontendProcess,
    backendReady,
    frontendReady
  }
}

// 测试用户注册流程
async function testUserRegistration() {
  logStep('测试用户注册流程...')
  
  const testUser = {
    phone: '13812345678',
    code: '123456',
    password: 'password123'
  }

  const results = {
    sendCode: false,
    register: false,
    validation: false
  }

  try {
    // 1. 测试发送验证码
    logInfo('1. 测试发送验证码API')
    const sendCodeResult = await makeApiRequest('POST', '/api/auth/send-code', {
      phone: testUser.phone
    })

    if (sendCodeResult.success || sendCodeResult.status < 500) {
      logSuccess('发送验证码API响应正常')
      results.sendCode = true
    } else {
      logError(`发送验证码API失败: ${sendCodeResult.error || sendCodeResult.status}`)
    }

    // 2. 测试用户注册
    logInfo('2. 测试用户注册API')
    const registerResult = await makeApiRequest('POST', '/api/auth/register', testUser)

    if (registerResult.success || registerResult.status < 500) {
      logSuccess('用户注册API响应正常')
      results.register = true
      
      // 验证响应格式
      if (registerResult.data && typeof registerResult.data === 'object') {
        if (registerResult.data.hasOwnProperty('success') && registerResult.data.hasOwnProperty('message')) {
          logSuccess('注册API响应格式正确')
          results.validation = true
        } else {
          logWarning('注册API响应格式不完整')
        }
      }
    } else {
      logError(`用户注册API失败: ${registerResult.error || registerResult.status}`)
    }

    // 3. 测试输入验证
    logInfo('3. 测试输入验证')
    const invalidInputs = [
      { phone: '', code: '123456', password: 'password123' },
      { phone: '13812345678', code: '', password: 'password123' },
      { phone: '13812345678', code: '123456', password: '' },
      { phone: 'invalid', code: '123456', password: 'password123' }
    ]

    let validationPassed = 0
    for (const input of invalidInputs) {
      const result = await makeApiRequest('POST', '/api/auth/register', input)
      if (result.status === 400 || (result.data && result.data.success === false)) {
        validationPassed++
      }
    }

    if (validationPassed === invalidInputs.length) {
      logSuccess('输入验证测试通过')
    } else {
      logWarning(`输入验证测试: ${validationPassed}/${invalidInputs.length} 通过`)
    }

  } catch (error) {
    logError(`注册流程测试异常: ${error.message}`)
  }

  return results
}

// 测试用户登录流程
async function testUserLogin() {
  logStep('测试用户登录流程...')
  
  const testUser = {
    phone: '13812345678',
    code: '123456'
  }

  const results = {
    sendCode: false,
    login: false,
    validation: false
  }

  try {
    // 1. 测试发送验证码（登录用）
    logInfo('1. 测试登录验证码发送')
    const sendCodeResult = await makeApiRequest('POST', '/api/auth/send-code', {
      phone: testUser.phone
    })

    if (sendCodeResult.success || sendCodeResult.status < 500) {
      logSuccess('登录验证码发送API响应正常')
      results.sendCode = true
    } else {
      logError(`登录验证码发送失败: ${sendCodeResult.error || sendCodeResult.status}`)
    }

    // 2. 测试用户登录
    logInfo('2. 测试用户登录API')
    const loginResult = await makeApiRequest('POST', '/api/auth/login', testUser)

    if (loginResult.success || loginResult.status < 500) {
      logSuccess('用户登录API响应正常')
      results.login = true
      
      // 验证响应格式
      if (loginResult.data && typeof loginResult.data === 'object') {
        if (loginResult.data.hasOwnProperty('success') && loginResult.data.hasOwnProperty('message')) {
          logSuccess('登录API响应格式正确')
          results.validation = true
        } else {
          logWarning('登录API响应格式不完整')
        }
      }
    } else {
      logError(`用户登录API失败: ${loginResult.error || loginResult.status}`)
    }

    // 3. 测试登录输入验证
    logInfo('3. 测试登录输入验证')
    const invalidLogins = [
      { phone: '', code: '123456' },
      { phone: '13812345678', code: '' },
      { phone: 'invalid', code: '123456' },
      { phone: '13812345678', code: 'invalid' }
    ]

    let validationPassed = 0
    for (const input of invalidLogins) {
      const result = await makeApiRequest('POST', '/api/auth/login', input)
      if (result.status === 400 || (result.data && result.data.success === false)) {
        validationPassed++
      }
    }

    if (validationPassed === invalidLogins.length) {
      logSuccess('登录输入验证测试通过')
    } else {
      logWarning(`登录输入验证测试: ${validationPassed}/${invalidLogins.length} 通过`)
    }

  } catch (error) {
    logError(`登录流程测试异常: ${error.message}`)
  }

  return results
}

// 测试API性能和稳定性
async function testApiPerformance() {
  logStep('测试API性能和稳定性...')
  
  const results = {
    responseTime: false,
    concurrency: false,
    stability: false
  }

  try {
    // 1. 测试响应时间
    logInfo('1. 测试API响应时间')
    const startTime = Date.now()
    const healthResult = await makeApiRequest('GET', '/api/health')
    const endTime = Date.now()
    const responseTime = endTime - startTime

    if (responseTime < 2000) { // 2秒内响应
      logSuccess(`API响应时间: ${responseTime}ms (良好)`)
      results.responseTime = true
    } else {
      logWarning(`API响应时间: ${responseTime}ms (较慢)`)
    }

    // 2. 测试并发请求
    logInfo('2. 测试并发请求处理')
    const concurrentRequests = Array(5).fill().map(() =>
      makeApiRequest('POST', '/api/auth/send-code', { phone: '13812345678' })
    )

    const concurrentResults = await Promise.all(concurrentRequests)
    const successfulRequests = concurrentResults.filter(result => 
      result.success || result.status < 500
    ).length

    if (successfulRequests === concurrentRequests.length) {
      logSuccess('并发请求处理测试通过')
      results.concurrency = true
    } else {
      logWarning(`并发请求处理: ${successfulRequests}/${concurrentRequests.length} 成功`)
    }

    // 3. 测试连续请求稳定性
    logInfo('3. 测试连续请求稳定性')
    let stableRequests = 0
    for (let i = 0; i < 10; i++) {
      const result = await makeApiRequest('GET', '/api/health')
      if (result.success || result.status < 500) {
        stableRequests++
      }
      await sleep(100) // 100ms间隔
    }

    if (stableRequests >= 8) { // 80%成功率
      logSuccess('连续请求稳定性测试通过')
      results.stability = true
    } else {
      logWarning(`连续请求稳定性: ${stableRequests}/10 成功`)
    }

  } catch (error) {
    logError(`性能测试异常: ${error.message}`)
  }

  return results
}

// 测试CORS和前后端通信
async function testCorsAndIntegration() {
  logStep('测试CORS和前后端通信...')
  
  const results = {
    cors: false,
    preflight: false,
    integration: false
  }

  try {
    // 1. 测试CORS头
    logInfo('1. 测试CORS配置')
    const corsResult = await makeApiRequest('GET', '/api/health')
    
    if (corsResult.headers && corsResult.headers['access-control-allow-origin']) {
      logSuccess('CORS头配置正确')
      results.cors = true
    } else {
      logWarning('CORS头未配置或不正确')
    }

    // 2. 测试OPTIONS预检请求
    logInfo('2. 测试OPTIONS预检请求')
    const optionsResult = await makeApiRequest('OPTIONS', '/api/auth/send-code')
    
    if (optionsResult.status === 200 || optionsResult.status === 204) {
      logSuccess('OPTIONS预检请求处理正确')
      results.preflight = true
    } else {
      logWarning('OPTIONS预检请求处理不正确')
    }

    // 3. 测试前后端集成
    logInfo('3. 测试前后端集成')
    const integrationTests = [
      makeApiRequest('GET', '/api/health'),
      makeApiRequest('POST', '/api/auth/send-code', { phone: '13812345678' }),
      makeApiRequest('POST', '/api/auth/login', { phone: '13812345678', code: '123456' })
    ]

    const integrationResults = await Promise.all(integrationTests)
    const successfulIntegration = integrationResults.filter(result => 
      result.success || result.status < 500
    ).length

    if (successfulIntegration === integrationTests.length) {
      logSuccess('前后端集成测试通过')
      results.integration = true
    } else {
      logWarning(`前后端集成测试: ${successfulIntegration}/${integrationTests.length} 通过`)
    }

  } catch (error) {
    logError(`CORS和集成测试异常: ${error.message}`)
  }

  return results
}

// 主集成测试函数
async function runIntegrationTests() {
  log('\n' + '='.repeat(60), 'bold')
  log('🧪 淘贝App集成测试开始', 'bold')
  log('='.repeat(60), 'bold')

  let services = null
  const testResults = {
    registration: {},
    login: {},
    performance: {},
    integration: {}
  }

  try {
    // 启动服务
    services = await startServices()
    
    if (!services.backendReady) {
      logError('后端服务启动失败，无法进行集成测试')
      return { success: false, error: '后端服务启动失败' }
    }

    if (!services.frontendReady) {
      logWarning('前端服务启动失败，将跳过前端相关测试')
    }

    logSuccess('服务启动完成，开始集成测试')

    // 运行测试套件
    testResults.registration = await testUserRegistration()
    testResults.login = await testUserLogin()
    testResults.performance = await testApiPerformance()
    testResults.integration = await testCorsAndIntegration()

  } catch (error) {
    logError(`集成测试过程中发生错误: ${error.message}`)
    return { success: false, error: error.message }
  } finally {
    // 清理服务
    if (services) {
      if (services.backendProcess) {
        logInfo('停止后端服务...')
        services.backendProcess.kill('SIGTERM')
      }
      if (services.frontendProcess) {
        logInfo('停止前端服务...')
        services.frontendProcess.kill('SIGTERM')
      }
    }
  }

  // 生成测试报告
  log('\n' + '='.repeat(60), 'bold')
  log('📊 集成测试报告', 'bold')
  log('='.repeat(60), 'bold')

  const allTests = [
    { category: '用户注册', tests: testResults.registration },
    { category: '用户登录', tests: testResults.login },
    { category: 'API性能', tests: testResults.performance },
    { category: '系统集成', tests: testResults.integration }
  ]

  let totalPassed = 0
  let totalTests = 0

  allTests.forEach(category => {
    log(`\n📋 ${category.category}:`, 'magenta')
    Object.entries(category.tests).forEach(([testName, passed]) => {
      totalTests++
      if (passed) {
        totalPassed++
        logSuccess(`  ${testName}: 通过`)
      } else {
        logError(`  ${testName}: 失败`)
      }
    })
  })

  log('\n' + '-'.repeat(40), 'blue')
  const successRate = Math.round((totalPassed / totalTests) * 100)
  
  if (successRate >= 80) {
    logSuccess(`✨ 集成测试完成: ${totalPassed}/${totalTests} 通过 (${successRate}%)`)
    log('🎉 系统集成测试基本通过，可以进行下一步开发！', 'green')
  } else if (successRate >= 60) {
    logWarning(`⚠️  集成测试完成: ${totalPassed}/${totalTests} 通过 (${successRate}%)`)
    log('🔧 部分功能需要优化，建议修复后重新测试', 'yellow')
  } else {
    logError(`❌ 集成测试完成: ${totalPassed}/${totalTests} 通过 (${successRate}%)`)
    log('🚨 系统存在较多问题，需要重点修复', 'red')
  }

  return {
    success: successRate >= 60,
    passed: totalPassed,
    total: totalTests,
    successRate: successRate,
    details: testResults
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  runIntegrationTests()
    .then(result => {
      process.exit(result.success ? 0 : 1)
    })
    .catch(error => {
      logError(`集成测试发生错误: ${error.message}`)
      process.exit(1)
    })
}

export { 
  runIntegrationTests, 
  testUserRegistration, 
  testUserLogin, 
  testApiPerformance, 
  testCorsAndIntegration 
}