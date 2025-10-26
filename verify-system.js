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

// 检查API端点
function checkApiEndpoint(path, expectedStatus = 200) {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: CONFIG.BACKEND_PORT,
      path: path,
      method: 'GET',
      timeout: 5000
    }, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        resolve({
          success: res.statusCode === expectedStatus,
          status: res.statusCode,
          data: data
        })
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

    req.end()
  })
}

// 检查POST API端点
function checkPostEndpoint(path, postData) {
  return new Promise((resolve) => {
    const data = JSON.stringify(postData)
    
    const req = http.request({
      hostname: 'localhost',
      port: CONFIG.BACKEND_PORT,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      },
      timeout: 5000
    }, (res) => {
      let responseData = ''
      res.on('data', chunk => responseData += chunk)
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData)
          resolve({
            success: res.statusCode < 500,
            status: res.statusCode,
            data: parsed
          })
        } catch (error) {
          resolve({
            success: false,
            error: 'Invalid JSON response'
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

    req.write(data)
    req.end()
  })
}

// 启动服务进程
function startService(command, args, cwd, serviceName) {
  return new Promise((resolve, reject) => {
    logInfo(`启动${serviceName}服务...`)
    
    const process = spawn(command, args, {
      cwd: cwd,
      stdio: 'pipe',
      detached: false
    })

    let output = ''
    let errorOutput = ''

    process.stdout.on('data', (data) => {
      output += data.toString()
    })

    process.stderr.on('data', (data) => {
      errorOutput += data.toString()
    })

    process.on('error', (error) => {
      logError(`${serviceName}启动失败: ${error.message}`)
      reject(error)
    })

    // 给服务一些时间启动
    setTimeout(() => {
      if (process.pid) {
        logInfo(`${serviceName}进程已启动 (PID: ${process.pid})`)
        resolve(process)
      } else {
        logError(`${serviceName}启动超时`)
        reject(new Error(`${serviceName}启动超时`))
      }
    }, 3000)
  })
}

// 等待服务就绪
async function waitForService(port, serviceName, maxRetries = CONFIG.MAX_RETRIES) {
  logInfo(`等待${serviceName}服务就绪 (端口 ${port})...`)
  
  for (let i = 0; i < maxRetries; i++) {
    const isReady = await checkPort(port)
    if (isReady) {
      logSuccess(`${serviceName}服务已就绪`)
      return true
    }
    
    if (i < maxRetries - 1) {
      await sleep(CONFIG.RETRY_INTERVAL)
    }
  }
  
  logError(`${serviceName}服务启动超时`)
  return false
}

// 主验证函数
async function verifySystem() {
  log('\n' + '='.repeat(50), 'bold')
  log('🚀 淘贝App系统验证开始', 'bold')
  log('='.repeat(50), 'bold')

  const results = {
    backend: false,
    frontend: false,
    database: false,
    api: false,
    integration: false
  }

  let backendProcess = null
  let frontendProcess = null

  try {
    // 1. 验证后端服务
    log('\n📦 步骤 1: 验证后端服务', 'blue')
    
    try {
      backendProcess = await startService('npm', ['start'], './backend', '后端')
      const backendReady = await waitForService(CONFIG.BACKEND_PORT, '后端')
      
      if (backendReady) {
        logSuccess('后端服务启动成功')
        results.backend = true
      } else {
        logError('后端服务启动失败')
      }
    } catch (error) {
      logError(`后端服务启动异常: ${error.message}`)
    }

    // 2. 验证前端服务
    log('\n🎨 步骤 2: 验证前端服务', 'blue')
    
    try {
      frontendProcess = await startService('npm', ['run', 'dev'], './frontend', '前端')
      const frontendReady = await waitForService(CONFIG.FRONTEND_PORT, '前端')
      
      if (frontendReady) {
        logSuccess('前端服务启动成功')
        results.frontend = true
      } else {
        logError('前端服务启动失败')
      }
    } catch (error) {
      logError(`前端服务启动异常: ${error.message}`)
    }

    // 3. 验证数据库连接
    log('\n🗄️  步骤 3: 验证数据库连接', 'blue')
    
    if (results.backend) {
      const healthCheck = await checkApiEndpoint('/api/health')
      if (healthCheck.success) {
        logSuccess('数据库连接正常')
        results.database = true
      } else {
        logError('数据库连接失败')
      }
    } else {
      logWarning('跳过数据库验证（后端服务未启动）')
    }

    // 4. 验证API端点
    log('\n🔌 步骤 4: 验证API端点', 'blue')
    
    if (results.backend) {
      const apiTests = [
        {
          name: '健康检查',
          test: () => checkApiEndpoint('/api/health')
        },
        {
          name: '发送验证码',
          test: () => checkPostEndpoint('/api/auth/send-code', { phone: '13812345678' })
        },
        {
          name: '用户登录',
          test: () => checkPostEndpoint('/api/auth/login', { phone: '13812345678', code: '123456' })
        },
        {
          name: '用户注册',
          test: () => checkPostEndpoint('/api/auth/register', { 
            phone: '13812345678', 
            code: '123456', 
            password: 'password123' 
          })
        }
      ]

      let apiSuccessCount = 0
      for (const apiTest of apiTests) {
        const result = await apiTest.test()
        if (result.success) {
          logSuccess(`${apiTest.name} API 可访问`)
          apiSuccessCount++
        } else {
          logError(`${apiTest.name} API 失败: ${result.error || result.status}`)
        }
      }

      if (apiSuccessCount === apiTests.length) {
        logSuccess('所有API端点验证通过')
        results.api = true
      } else {
        logWarning(`API端点验证: ${apiSuccessCount}/${apiTests.length} 通过`)
      }
    } else {
      logWarning('跳过API验证（后端服务未启动）')
    }

    // 5. 验证前后端集成
    log('\n🔗 步骤 5: 验证前后端集成', 'blue')
    
    if (results.frontend && results.backend) {
      // 检查前端是否能访问后端API
      const corsCheck = await checkApiEndpoint('/api/health')
      if (corsCheck.success) {
        logSuccess('前后端通信正常')
        results.integration = true
      } else {
        logError('前后端通信失败')
      }
    } else {
      logWarning('跳过集成验证（前端或后端服务未启动）')
    }

  } catch (error) {
    logError(`系统验证过程中发生错误: ${error.message}`)
  } finally {
    // 清理进程
    if (backendProcess) {
      logInfo('停止后端服务...')
      backendProcess.kill('SIGTERM')
    }
    if (frontendProcess) {
      logInfo('停止前端服务...')
      frontendProcess.kill('SIGTERM')
    }
  }

  // 生成验证报告
  log('\n' + '='.repeat(50), 'bold')
  log('📊 系统验证报告', 'bold')
  log('='.repeat(50), 'bold')

  const checks = [
    { name: '后端服务', status: results.backend },
    { name: '前端服务', status: results.frontend },
    { name: '数据库连接', status: results.database },
    { name: 'API端点', status: results.api },
    { name: '前后端集成', status: results.integration }
  ]

  checks.forEach(check => {
    if (check.status) {
      logSuccess(`${check.name}: 通过`)
    } else {
      logError(`${check.name}: 失败`)
    }
  })

  const passedCount = checks.filter(check => check.status).length
  const totalCount = checks.length

  log('\n' + '-'.repeat(30), 'blue')
  if (passedCount === totalCount) {
    logSuccess(`✨ 系统验证完成: ${passedCount}/${totalCount} 项检查通过`)
    log('🎉 系统运行正常，可以开始开发！', 'green')
  } else {
    logWarning(`⚠️  系统验证完成: ${passedCount}/${totalCount} 项检查通过`)
    log('🔧 请检查失败的项目并修复后重新验证', 'yellow')
  }

  // 返回验证结果
  return {
    success: passedCount === totalCount,
    passed: passedCount,
    total: totalCount,
    details: results
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  verifySystem()
    .then(result => {
      process.exit(result.success ? 0 : 1)
    })
    .catch(error => {
      logError(`验证过程发生错误: ${error.message}`)
      process.exit(1)
    })
}

export { verifySystem, checkPort, checkApiEndpoint, checkPostEndpoint }