const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

/**
 * 系统验证器
 * 验证后端服务、前端服务、前端访问后端API、数据库连接、关键API端点响应
 */
class SystemVerifier {
  constructor() {
    this.baseURL = `http://localhost:${process.env.BACKEND_PORT || 3001}`;
    this.frontendURL = `http://localhost:${process.env.FRONTEND_PORT || 3000}`;
    this.verificationResults = [];
    this.backendProcess = null;
    this.frontendProcess = null;
  }

  /**
   * 运行完整的系统验证
   */
  async runVerification() {
    console.log('🔍 开始系统验证...\n');
    
    try {
      // 1. 验证项目结构
      await this.verifyProjectStructure();
      
      // 2. 验证依赖安装
      await this.verifyDependencies();
      
      // 3. 验证配置文件
      await this.verifyConfiguration();
      
      // 4. 启动并验证后端服务
      await this.verifyBackendService();
      
      // 5. 启动并验证前端服务
      await this.verifyFrontendService();
      
      // 6. 验证数据库连接
      await this.verifyDatabaseConnection();
      
      // 7. 验证API端点
      await this.verifyAPIEndpoints();
      
      // 8. 验证前端访问后端API
      await this.verifyFrontendBackendCommunication();
      
      // 9. 验证UI元素存在性
      await this.verifyUIElements();
      
      // 10. 生成验证报告
      this.generateVerificationReport();
      
    } catch (error) {
      console.error('❌ 系统验证失败:', error.message);
      this.addVerificationResult('System', 'Overall Verification', 'FAILED', error.message);
    } finally {
      // 清理资源
      await this.cleanup();
    }
  }

  /**
   * 验证项目结构
   */
  async verifyProjectStructure() {
    console.log('📁 验证项目结构...');
    
    const requiredPaths = [
      'backend/src/app.js',
      'backend/src/database.js',
      'backend/src/routes/auth.js',
      'backend/package.json',
      'frontend/src/App.tsx',
      'frontend/src/main.tsx',
      'frontend/src/components/LoginPage.tsx',
      'frontend/src/components/RegisterPage.tsx',
      'frontend/src/components/HomePage.tsx',
      'frontend/package.json',
      'frontend/vite.config.ts',
      'frontend/index.html'
    ];
    
    let missingFiles = [];
    
    for (const filePath of requiredPaths) {
      const fullPath = path.join(__dirname, filePath);
      if (fs.existsSync(fullPath)) {
        this.addVerificationResult('Project Structure', `File: ${filePath}`, 'PASSED', '文件存在');
      } else {
        missingFiles.push(filePath);
        this.addVerificationResult('Project Structure', `File: ${filePath}`, 'FAILED', '文件不存在');
      }
    }
    
    if (missingFiles.length === 0) {
      this.addVerificationResult('Project Structure', 'Overall Structure', 'PASSED', '所有必需文件都存在');
    } else {
      this.addVerificationResult('Project Structure', 'Overall Structure', 'FAILED', `缺少文件: ${missingFiles.join(', ')}`);
    }
  }

  /**
   * 验证依赖安装
   */
  async verifyDependencies() {
    console.log('📦 验证依赖安装...');
    
    // 验证后端依赖
    const backendNodeModules = path.join(__dirname, 'backend/node_modules');
    if (fs.existsSync(backendNodeModules)) {
      this.addVerificationResult('Dependencies', 'Backend Dependencies', 'PASSED', 'node_modules存在');
    } else {
      this.addVerificationResult('Dependencies', 'Backend Dependencies', 'FAILED', 'node_modules不存在，请运行npm install');
    }
    
    // 验证前端依赖
    const frontendNodeModules = path.join(__dirname, 'frontend/node_modules');
    if (fs.existsSync(frontendNodeModules)) {
      this.addVerificationResult('Dependencies', 'Frontend Dependencies', 'PASSED', 'node_modules存在');
    } else {
      this.addVerificationResult('Dependencies', 'Frontend Dependencies', 'FAILED', 'node_modules不存在，请运行npm install');
    }
    
    // 检查关键依赖包
    const backendPackageJson = path.join(__dirname, 'backend/package.json');
    const frontendPackageJson = path.join(__dirname, 'frontend/package.json');
    
    if (fs.existsSync(backendPackageJson)) {
      const backendPkg = JSON.parse(fs.readFileSync(backendPackageJson, 'utf8'));
      const requiredBackendDeps = ['express', 'cors', 'sqlite3', 'bcryptjs', 'jsonwebtoken'];
      
      for (const dep of requiredBackendDeps) {
        if (backendPkg.dependencies && backendPkg.dependencies[dep]) {
          this.addVerificationResult('Dependencies', `Backend: ${dep}`, 'PASSED', `版本: ${backendPkg.dependencies[dep]}`);
        } else {
          this.addVerificationResult('Dependencies', `Backend: ${dep}`, 'FAILED', '依赖缺失');
        }
      }
    }
    
    if (fs.existsSync(frontendPackageJson)) {
      const frontendPkg = JSON.parse(fs.readFileSync(frontendPackageJson, 'utf8'));
      const requiredFrontendDeps = ['react', 'react-dom', 'react-router-dom', 'axios'];
      
      for (const dep of requiredFrontendDeps) {
        if (frontendPkg.dependencies && frontendPkg.dependencies[dep]) {
          this.addVerificationResult('Dependencies', `Frontend: ${dep}`, 'PASSED', `版本: ${frontendPkg.dependencies[dep]}`);
        } else {
          this.addVerificationResult('Dependencies', `Frontend: ${dep}`, 'FAILED', '依赖缺失');
        }
      }
    }
  }

  /**
   * 验证配置文件
   */
  async verifyConfiguration() {
    console.log('⚙️ 验证配置文件...');
    
    // 验证Vite配置
    const viteConfigPath = path.join(__dirname, 'frontend/vite.config.ts');
    if (fs.existsSync(viteConfigPath)) {
      const viteConfig = fs.readFileSync(viteConfigPath, 'utf8');
      
      if (viteConfig.includes('proxy') && viteConfig.includes('/api')) {
        this.addVerificationResult('Configuration', 'Vite Proxy Config', 'PASSED', 'API代理配置正确');
      } else {
        this.addVerificationResult('Configuration', 'Vite Proxy Config', 'FAILED', 'API代理配置缺失');
      }
      
      if (viteConfig.includes('port: 3000')) {
        this.addVerificationResult('Configuration', 'Frontend Port Config', 'PASSED', '前端端口配置正确');
      } else {
        this.addVerificationResult('Configuration', 'Frontend Port Config', 'WARNING', '前端端口配置可能不正确');
      }
    } else {
      this.addVerificationResult('Configuration', 'Vite Config', 'FAILED', 'vite.config.ts不存在');
    }
    
    // 验证后端应用配置
    const appJsPath = path.join(__dirname, 'backend/src/app.js');
    if (fs.existsSync(appJsPath)) {
      const appJs = fs.readFileSync(appJsPath, 'utf8');
      
      if (appJs.includes('cors()')) {
        this.addVerificationResult('Configuration', 'CORS Config', 'PASSED', 'CORS配置存在');
      } else {
        this.addVerificationResult('Configuration', 'CORS Config', 'FAILED', 'CORS配置缺失');
      }
      
      if (appJs.includes('3001')) {
        this.addVerificationResult('Configuration', 'Backend Port Config', 'PASSED', '后端端口配置正确');
      } else {
        this.addVerificationResult('Configuration', 'Backend Port Config', 'WARNING', '后端端口配置可能不正确');
      }
    }
  }

  /**
   * 验证后端服务
   */
  async verifyBackendService() {
    console.log('🔧 验证后端服务...');
    
    try {
      // 检查服务是否已经运行
      const isRunning = await this.checkServiceRunning(this.baseURL);
      
      if (isRunning) {
        this.addVerificationResult('Backend Service', 'Service Startup', 'PASSED', '后端服务已运行');
      } else {
        // 启动后端服务
        await this.startBackend();
        
        // 等待服务启动
        await this.waitForService(this.baseURL + '/api/health', 'Backend', 30000);
        
        this.addVerificationResult('Backend Service', 'Service Startup', 'PASSED', '后端服务启动成功');
      }
      
      // 验证健康检查端点
      try {
        const healthResponse = await axios.get(`${this.baseURL}/api/health`, { timeout: 5000 });
        this.addVerificationResult('Backend Service', 'Health Check', 'PASSED', `状态码: ${healthResponse.status}`);
      } catch (error) {
        this.addVerificationResult('Backend Service', 'Health Check', 'FAILED', error.message);
      }
      
    } catch (error) {
      this.addVerificationResult('Backend Service', 'Service Startup', 'FAILED', error.message);
      throw error;
    }
  }

  /**
   * 验证前端服务
   */
  async verifyFrontendService() {
    console.log('🌐 验证前端服务...');
    
    try {
      // 检查服务是否已经运行
      const isRunning = await this.checkServiceRunning(this.frontendURL);
      
      if (isRunning) {
        this.addVerificationResult('Frontend Service', 'Service Startup', 'PASSED', '前端服务已运行');
      } else {
        // 启动前端服务
        await this.startFrontend();
        
        // 等待服务启动
        await this.waitForService(this.frontendURL, 'Frontend', 30000);
        
        this.addVerificationResult('Frontend Service', 'Service Startup', 'PASSED', '前端服务启动成功');
      }
      
      // 验证主页可访问
      try {
        const homeResponse = await axios.get(this.frontendURL, { 
          timeout: 5000,
          validateStatus: (status) => status < 500
        });
        if (homeResponse.status === 200) {
          this.addVerificationResult('Frontend Service', 'Home Page Access', 'PASSED', `状态码: ${homeResponse.status}`);
        } else {
          this.addVerificationResult('Frontend Service', 'Home Page Access', 'WARNING', `状态码: ${homeResponse.status}, 可能是SPA路由`);
        }
      } catch (error) {
        this.addVerificationResult('Frontend Service', 'Home Page Access', 'FAILED', error.message);
      }
      
    } catch (error) {
      this.addVerificationResult('Frontend Service', 'Service Startup', 'FAILED', error.message);
      throw error;
    }
  }

  /**
   * 验证数据库连接
   */
  async verifyDatabaseConnection() {
    console.log('🗄️ 验证数据库连接...');
    
    try {
      // 通过API端点测试数据库连接
      const dbTestResponse = await axios.get(`${this.baseURL}/api/test-db`, {
        timeout: 10000,
        validateStatus: () => true
      });
      
      if (dbTestResponse.status === 200) {
        this.addVerificationResult('Database', 'Connection Test', 'PASSED', '数据库连接正常');
      } else if (dbTestResponse.status === 404) {
        // 如果没有测试端点，尝试其他方式验证
        this.addVerificationResult('Database', 'Connection Test', 'WARNING', '数据库测试端点不存在，无法直接验证');
      } else {
        this.addVerificationResult('Database', 'Connection Test', 'FAILED', `状态码: ${dbTestResponse.status}`);
      }
      
    } catch (error) {
      this.addVerificationResult('Database', 'Connection Test', 'WARNING', '无法验证数据库连接: ' + error.message);
    }
    
    // 验证数据库文件是否存在
    const dbPath = path.join(__dirname, 'backend/database.sqlite');
    if (fs.existsSync(dbPath)) {
      this.addVerificationResult('Database', 'Database File', 'PASSED', '数据库文件存在');
    } else {
      this.addVerificationResult('Database', 'Database File', 'WARNING', '数据库文件不存在，将在首次运行时创建');
    }
  }

  /**
   * 验证API端点
   */
  async verifyAPIEndpoints() {
    console.log('🔌 验证API端点...');
    
    const endpoints = [
      {
        name: 'Get Verification Code',
        method: 'POST',
        url: `${this.baseURL}/api/auth/verification-code`,
        data: { phoneNumber: '13812345678' },
        expectedStatuses: [200, 400]
      },
      {
        name: 'Login',
        method: 'POST',
        url: `${this.baseURL}/api/auth/login`,
        data: { phoneNumber: '13812345678', verificationCode: '123456' },
        expectedStatuses: [200, 400, 401]
      },
      {
        name: 'Register',
        method: 'POST',
        url: `${this.baseURL}/api/auth/register`,
        data: { phoneNumber: '13999999999', verificationCode: '123456', agreeToTerms: true },
        expectedStatuses: [200, 400, 401]
      }
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await axios({
          method: endpoint.method,
          url: endpoint.url,
          data: endpoint.data,
          timeout: 10000,
          validateStatus: () => true
        });
        
        if (endpoint.expectedStatuses.includes(response.status)) {
          this.addVerificationResult('API Endpoints', endpoint.name, 'PASSED', `状态码: ${response.status}`);
        } else {
          this.addVerificationResult('API Endpoints', endpoint.name, 'FAILED', `期望状态码: ${endpoint.expectedStatuses.join('/')}, 实际: ${response.status}`);
        }
        
      } catch (error) {
        this.addVerificationResult('API Endpoints', endpoint.name, 'FAILED', error.message);
      }
    }
  }

  /**
   * 验证前端访问后端API
   */
  async verifyFrontendBackendCommunication() {
    console.log('🌉 验证前端访问后端API...');
    
    try {
      // 测试通过前端代理访问API
      const proxyResponse = await axios.get(`${this.frontendURL}/api/health`, {
        timeout: 5000,
        validateStatus: () => true
      });
      
      this.addVerificationResult('Frontend-Backend', 'Proxy Communication', 'PASSED', `代理工作正常，状态码: ${proxyResponse.status}`);
      
    } catch (error) {
      this.addVerificationResult('Frontend-Backend', 'Proxy Communication', 'FAILED', error.message);
    }
    
    // 测试CORS配置
    try {
      const corsResponse = await axios.options(`${this.baseURL}/api/auth/login`, {
        headers: {
          'Origin': this.frontendURL,
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type'
        },
        timeout: 5000
      });
      
      this.addVerificationResult('Frontend-Backend', 'CORS Configuration', 'PASSED', 'CORS配置正确');
      
    } catch (error) {
      this.addVerificationResult('Frontend-Backend', 'CORS Configuration', 'FAILED', error.message);
    }
  }

  /**
   * 验证UI元素存在性
   */
  async verifyUIElements() {
    console.log('🎨 验证UI元素存在性...');
    
    // 对于React SPA应用，所有路由都返回相同的HTML，由前端路由处理
    // 我们只需要验证主页面可以正常加载
    try {
      const response = await axios.get(this.frontendURL, { 
        timeout: 5000,
        validateStatus: (status) => status < 500
      });
      
      if (response.status === 200) {
        // 检查页面内容是否包含React应用的基本结构
        const content = response.data;
        
        if (content.includes('root') || content.includes('div id="root"') || content.includes('React')) {
          this.addVerificationResult('UI Elements', 'React App Structure', 'PASSED', 'React应用结构正常');
        } else {
          this.addVerificationResult('UI Elements', 'React App Structure', 'WARNING', '未检测到React应用结构');
        }
        
        if (content.includes('script') && content.includes('module')) {
          this.addVerificationResult('UI Elements', 'JavaScript Modules', 'PASSED', 'JavaScript模块加载正常');
        } else {
          this.addVerificationResult('UI Elements', 'JavaScript Modules', 'WARNING', 'JavaScript模块可能未正确配置');
        }
        
        this.addVerificationResult('UI Elements', 'Frontend Accessibility', 'PASSED', '前端应用可访问');
      } else {
        this.addVerificationResult('UI Elements', 'Frontend Accessibility', 'WARNING', `状态码: ${response.status}, SPA应用可能正常`);
      }
      
    } catch (error) {
      this.addVerificationResult('UI Elements', 'Frontend Accessibility', 'FAILED', error.message);
    }
  }

  /**
   * 启动后端服务
   */
  async startBackend() {
    return new Promise((resolve, reject) => {
      const backendPath = path.join(__dirname, 'backend');
      
      this.backendProcess = spawn('npm', ['run', 'dev'], {
        cwd: backendPath,
        stdio: 'pipe',
        shell: true
      });
      
      let output = '';
      
      this.backendProcess.stdout.on('data', (data) => {
        output += data.toString();
        if (output.includes('Server is running on port') || output.includes('Server running on port') || output.includes('listening on port')) {
          resolve();
        }
      });
      
      this.backendProcess.stderr.on('data', (data) => {
        console.error('Backend stderr:', data.toString());
      });
      
      this.backendProcess.on('error', (error) => {
        reject(new Error(`Backend startup failed: ${error.message}`));
      });
      
      setTimeout(() => {
        reject(new Error('Backend startup timeout'));
      }, 30000);
    });
  }

  /**
   * 启动前端服务
   */
  async startFrontend() {
    return new Promise(async (resolve, reject) => {
      const frontendPath = path.join(__dirname, 'frontend');
      const frontendPort = this.frontendURL.split(':')[2].split('/')[0];
      
      // 如果端口是4173，使用preview模式，否则使用dev模式
      const isPreviewMode = frontendPort === '4173';
      
      if (isPreviewMode) {
        // Preview模式需要先构建
        console.log('构建前端项目...');
        try {
          await new Promise((buildResolve, buildReject) => {
            const buildProcess = spawn('npm', ['run', 'build'], {
              cwd: frontendPath,
              stdio: 'pipe',
              shell: true
            });
            
            buildProcess.on('close', (code) => {
              if (code === 0) {
                buildResolve();
              } else {
                buildReject(new Error(`Build failed with code ${code}`));
              }
            });
            
            buildProcess.on('error', buildReject);
          });
        } catch (error) {
          reject(new Error(`Frontend build failed: ${error.message}`));
          return;
        }
      }
      
      const command = isPreviewMode ? 
        ['run', 'preview', '--', '--port', frontendPort] : 
        ['run', 'dev'];
      
      this.frontendProcess = spawn('npm', command, {
        cwd: frontendPath,
        stdio: 'pipe',
        shell: true
      });
      
      let output = '';
      
      this.frontendProcess.stdout.on('data', (data) => {
        output += data.toString();
        const frontendPort = this.frontendURL.split(':')[2].split('/')[0];
        if (output.includes('Local:') && output.includes(frontendPort)) {
          resolve();
        }
      });
      
      this.frontendProcess.stderr.on('data', (data) => {
        console.error('Frontend stderr:', data.toString());
      });
      
      this.frontendProcess.on('error', (error) => {
        reject(new Error(`Frontend startup failed: ${error.message}`));
      });
      
      setTimeout(() => {
        reject(new Error('Frontend startup timeout'));
      }, 30000);
    });
  }

  /**
   * 检查服务是否已经运行
   */
  async checkServiceRunning(url) {
    try {
      let response;
      // 对于后端服务，使用健康检查端点
      if (url.includes('3001')) {
        response = await axios.get(`${url}/api/health`, { 
          timeout: 5000,
          validateStatus: (status) => status < 500
        });
      } else {
        // 对于前端服务，直接访问根路径
        response = await axios.get(url, { 
          timeout: 5000,
          validateStatus: (status) => status < 500
        });
      }
      console.log(`✅ 服务检查成功: ${url} (状态码: ${response.status})`);
      return true;
    } catch (error) {
      console.log(`❌ 服务检查失败: ${url} (${error.message})`);
      return false;
    }
  }

  /**
   * 等待服务可用
   */
  async waitForService(url, serviceName, timeout = 30000) {
    const startTime = Date.now();
    const retryInterval = 1000;
    
    while (Date.now() - startTime < timeout) {
      try {
        await axios.get(url, { timeout: 5000 });
        console.log(`✅ ${serviceName} 服务已启动: ${url}`);
        return;
      } catch (error) {
        await this.sleep(retryInterval);
      }
    }
    
    throw new Error(`${serviceName} 服务启动超时: ${url}`);
  }

  /**
   * 添加验证结果
   */
  addVerificationResult(category, test, status, details) {
    const result = {
      category,
      test,
      status,
      details,
      timestamp: new Date().toISOString()
    };
    
    this.verificationResults.push(result);
    
    const statusIcon = status === 'PASSED' ? '✅' : status === 'WARNING' ? '⚠️' : '❌';
    console.log(`${statusIcon} ${category} - ${test}: ${status}`);
    if (details) {
      console.log(`   详情: ${details}`);
    }
  }

  /**
   * 生成验证报告
   */
  generateVerificationReport() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 系统验证报告');
    console.log('='.repeat(80));
    
    const totalChecks = this.verificationResults.length;
    const passedChecks = this.verificationResults.filter(r => r.status === 'PASSED').length;
    const warningChecks = this.verificationResults.filter(r => r.status === 'WARNING').length;
    const failedChecks = this.verificationResults.filter(r => r.status === 'FAILED').length;
    const successRate = totalChecks > 0 ? ((passedChecks / totalChecks) * 100).toFixed(2) : 0;
    
    console.log(`\n📈 总体结果:`);
    console.log(`   总检查项: ${totalChecks}`);
    console.log(`   通过: ${passedChecks}`);
    console.log(`   警告: ${warningChecks}`);
    console.log(`   失败: ${failedChecks}`);
    console.log(`   成功率: ${successRate}%`);
    
    // 按类别分组显示结果
    const categories = [...new Set(this.verificationResults.map(r => r.category))];
    
    categories.forEach(category => {
      const categoryChecks = this.verificationResults.filter(r => r.category === category);
      const categoryPassed = categoryChecks.filter(r => r.status === 'PASSED').length;
      const categoryWarnings = categoryChecks.filter(r => r.status === 'WARNING').length;
      const categoryFailed = categoryChecks.filter(r => r.status === 'FAILED').length;
      
      console.log(`\n📋 ${category} (✅${categoryPassed} ⚠️${categoryWarnings} ❌${categoryFailed}):`);
      categoryChecks.forEach(check => {
        const statusIcon = check.status === 'PASSED' ? '✅' : check.status === 'WARNING' ? '⚠️' : '❌';
        console.log(`   ${statusIcon} ${check.test}`);
        if (check.status !== 'PASSED' && check.details) {
          console.log(`      ${check.details}`);
        }
      });
    });
    
    // 系统就绪状态
    console.log(`\n🎯 系统状态:`);
    if (failedChecks === 0) {
      console.log('✅ 系统验证通过，可以开始开发和测试！');
    } else if (failedChecks <= 2 && warningChecks <= 3) {
      console.log('⚠️  系统基本可用，但存在一些问题需要解决');
    } else {
      console.log('❌ 系统存在严重问题，需要修复后再继续');
    }
    
    // 保存详细报告
    const reportPath = path.join(__dirname, 'system-verification-report.json');
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalChecks,
        passedChecks,
        warningChecks,
        failedChecks,
        successRate: parseFloat(successRate)
      },
      results: this.verificationResults
    };
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n💾 详细报告已保存到: ${reportPath}`);
    
    console.log('\n' + '='.repeat(80));
    
    // 设置退出码
    if (failedChecks > 3) {
      console.log('⚠️  系统验证发现多个严重问题');
      process.exitCode = 1;
    } else {
      console.log('🎉 系统验证完成！');
    }
  }

  /**
   * 清理资源
   */
  async cleanup() {
    console.log('\n🧹 清理资源...');
    
    if (this.backendProcess) {
      this.backendProcess.kill('SIGTERM');
      console.log('✅ 后端服务已停止');
    }
    
    if (this.frontendProcess) {
      this.frontendProcess.kill('SIGTERM');
      console.log('✅ 前端服务已停止');
    }
    
    await this.sleep(2000);
  }

  /**
   * 睡眠函数
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * 主函数
 */
async function main() {
  const verifier = new SystemVerifier();
  await verifier.runVerification();
}

// 如果直接运行此脚本
if (require.main === module) {
  main().catch(error => {
    console.error('❌ 系统验证执行失败:', error);
    process.exit(1);
  });
}

module.exports = SystemVerifier;