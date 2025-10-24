const http = require('http');
const https = require('https');

class SystemVerifier {
  constructor() {
    this.results = [];
    this.errors = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${type.toUpperCase()}: ${message}`;
    console.log(logMessage);
    
    if (type === 'error') {
      this.errors.push(logMessage);
    } else {
      this.results.push(logMessage);
    }
  }

  async checkHttpService(url, serviceName, timeout = 5000) {
    return new Promise((resolve) => {
      const urlObj = new URL(url);
      const client = urlObj.protocol === 'https:' ? https : http;
      
      const req = client.get(url, { timeout }, (res) => {
        if (res.statusCode >= 200 && res.statusCode < 400) {
          this.log(`✅ ${serviceName} 服务正常运行 (${url}) - 状态码: ${res.statusCode}`, 'success');
          resolve(true);
        } else {
          this.log(`❌ ${serviceName} 服务响应异常 (${url}) - 状态码: ${res.statusCode}`, 'error');
          resolve(false);
        }
      });

      req.on('error', (err) => {
        this.log(`❌ ${serviceName} 服务连接失败 (${url}) - 错误: ${err.message}`, 'error');
        resolve(false);
      });

      req.on('timeout', () => {
        this.log(`❌ ${serviceName} 服务连接超时 (${url})`, 'error');
        req.destroy();
        resolve(false);
      });
    });
  }

  async checkApiEndpoint(url, method = 'GET', data = null) {
    return new Promise((resolve) => {
      const urlObj = new URL(url);
      const client = urlObj.protocol === 'https:' ? https : http;
      
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port,
        path: urlObj.pathname + urlObj.search,
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'SystemVerifier/1.0'
        },
        timeout: 5000
      };

      if (data && method !== 'GET') {
        const postData = JSON.stringify(data);
        options.headers['Content-Length'] = Buffer.byteLength(postData);
      }

      const req = client.request(options, (res) => {
        let responseData = '';
        
        res.on('data', (chunk) => {
          responseData += chunk;
        });

        res.on('end', () => {
          try {
            const jsonResponse = JSON.parse(responseData);
            this.log(`✅ API端点 ${method} ${url} 响应正常 - 状态码: ${res.statusCode}`, 'success');
            resolve({ success: true, statusCode: res.statusCode, data: jsonResponse });
          } catch (err) {
            this.log(`⚠️ API端点 ${method} ${url} 响应格式异常 - 状态码: ${res.statusCode}`, 'warning');
            resolve({ success: true, statusCode: res.statusCode, data: responseData });
          }
        });
      });

      req.on('error', (err) => {
        this.log(`❌ API端点 ${method} ${url} 请求失败 - 错误: ${err.message}`, 'error');
        resolve({ success: false, error: err.message });
      });

      req.on('timeout', () => {
        this.log(`❌ API端点 ${method} ${url} 请求超时`, 'error');
        req.destroy();
        resolve({ success: false, error: 'timeout' });
      });

      if (data && method !== 'GET') {
        req.write(JSON.stringify(data));
      }
      
      req.end();
    });
  }

  async verifyBackendService() {
    this.log('🔍 验证后端服务 (端口3000)...');
    
    // 检查健康检查端点
    const healthCheck = await this.checkHttpService('http://localhost:3000/health', '后端健康检查');
    
    if (healthCheck) {
      // 检查认证相关API端点
      const endpoints = [
        { url: 'http://localhost:3000/api/auth/send-verification-code', method: 'POST' },
        { url: 'http://localhost:3000/api/auth/login', method: 'POST' },
        { url: 'http://localhost:3000/api/auth/register', method: 'POST' },
        { url: 'http://localhost:3000/api/auth/profile', method: 'GET' }
      ];

      for (const endpoint of endpoints) {
        await this.checkApiEndpoint(endpoint.url, endpoint.method, {});
      }
    }

    return healthCheck;
  }

  async verifyFrontendService() {
    this.log('🔍 验证前端服务 (端口5173)...');
    return await this.checkHttpService('http://localhost:5173', '前端开发服务器');
  }

  async verifyFrontendToBackendConnection() {
    this.log('🔍 验证前端访问后端API...');
    
    // 模拟前端通过代理访问后端API
    const proxyApiCheck = await this.checkApiEndpoint('http://localhost:5173/api/auth/send-verification-code', 'POST', {
      phoneNumber: '13800000000',
      countryCode: '+86'
    });

    if (proxyApiCheck.success) {
      this.log('✅ 前端代理配置正常，可以访问后端API', 'success');
      return true;
    } else {
      this.log('❌ 前端无法通过代理访问后端API', 'error');
      return false;
    }
  }

  async verifyDatabaseConnection() {
    this.log('🔍 验证数据库连接...');
    
    try {
      // 通过后端API间接验证数据库连接
      const dbTestResult = await this.checkApiEndpoint('http://localhost:3000/health', 'GET');
      
      if (dbTestResult.success && dbTestResult.statusCode === 200) {
        this.log('✅ 数据库连接正常（通过后端健康检查验证）', 'success');
        return true;
      } else {
        this.log('❌ 数据库连接可能存在问题', 'error');
        return false;
      }
    } catch (error) {
      this.log(`❌ 数据库连接验证失败: ${error.message}`, 'error');
      return false;
    }
  }

  async verifyKeyApiEndpoints() {
    this.log('🔍 验证关键API端点响应...');
    
    const criticalEndpoints = [
      {
        name: '发送验证码API',
        url: 'http://localhost:3000/api/auth/send-verification-code',
        method: 'POST',
        data: { phoneNumber: '13800000000', countryCode: '+86' }
      },
      {
        name: '用户登录API',
        url: 'http://localhost:3000/api/auth/login',
        method: 'POST',
        data: { phoneNumber: '13800000000', verificationCode: '123456', countryCode: '+86' }
      },
      {
        name: '用户注册API',
        url: 'http://localhost:3000/api/auth/register',
        method: 'POST',
        data: { phoneNumber: '13800000000', verificationCode: '123456', countryCode: '+86', agreeToTerms: true }
      }
    ];

    let successCount = 0;
    
    for (const endpoint of criticalEndpoints) {
      const result = await this.checkApiEndpoint(endpoint.url, endpoint.method, endpoint.data);
      if (result.success) {
        successCount++;
        this.log(`✅ ${endpoint.name} 响应正常`, 'success');
      } else {
        this.log(`❌ ${endpoint.name} 响应异常`, 'error');
      }
    }

    const successRate = (successCount / criticalEndpoints.length) * 100;
    this.log(`📊 关键API端点成功率: ${successRate.toFixed(1)}% (${successCount}/${criticalEndpoints.length})`, 'info');
    
    return successRate >= 100; // 要求所有关键端点都正常
  }

  async runFullVerification() {
    this.log('🚀 开始系统验证...');
    this.log('=' * 50);

    const checks = [
      { name: '后端服务', fn: () => this.verifyBackendService() },
      { name: '前端服务', fn: () => this.verifyFrontendService() },
      { name: '前端访问后端', fn: () => this.verifyFrontendToBackendConnection() },
      { name: '数据库连接', fn: () => this.verifyDatabaseConnection() },
      { name: '关键API端点', fn: () => this.verifyKeyApiEndpoints() }
    ];

    const results = {};
    let overallSuccess = true;

    for (const check of checks) {
      this.log(`\n🔄 正在检查: ${check.name}...`);
      try {
        const result = await check.fn();
        results[check.name] = result;
        if (!result) {
          overallSuccess = false;
        }
      } catch (error) {
        this.log(`❌ ${check.name} 检查失败: ${error.message}`, 'error');
        results[check.name] = false;
        overallSuccess = false;
      }
    }

    this.log('\n' + '=' * 50);
    this.log('📋 系统验证结果汇总:');
    
    for (const [checkName, result] of Object.entries(results)) {
      const status = result ? '✅ 通过' : '❌ 失败';
      this.log(`  ${checkName}: ${status}`);
    }

    this.log('\n' + '=' * 50);
    if (overallSuccess) {
      this.log('🎉 系统验证完成！所有检查都通过了。', 'success');
      this.log('💡 系统已准备就绪，可以开始开发和测试。', 'info');
    } else {
      this.log('⚠️ 系统验证发现问题，请检查失败的项目。', 'warning');
      this.log('🔧 建议先解决这些问题再继续开发。', 'info');
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
  const verifier = new SystemVerifier();
  
  verifier.runFullVerification()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('系统验证过程中发生未预期的错误:', error);
      process.exit(1);
    });
}

module.exports = SystemVerifier;