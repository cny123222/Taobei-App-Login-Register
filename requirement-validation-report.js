const fs = require('fs');
const path = require('path');

/**
 * 需求验证报告生成器
 * 检查需求文档中的每个需求是否有对应的测试用例
 */
class RequirementValidationReporter {
  constructor() {
    this.requirements = [];
    this.testCases = [];
    this.coverageResults = [];
    this.projectRoot = __dirname;
  }

  /**
   * 运行需求验证报告生成
   */
  async generateReport() {
    console.log('📋 开始生成需求验证报告...\n');

    try {
      // 1. 解析需求文档
      await this.parseRequirements();

      // 2. 扫描测试文件
      await this.scanTestFiles();

      // 3. 分析覆盖率
      await this.analyzeCoverage();

      // 4. 生成详细报告
      this.generateDetailedReport();

      // 5. 生成覆盖率矩阵
      this.generateCoverageMatrix();

      // 6. 保存报告文件
      this.saveReports();

    } catch (error) {
      console.error('❌ 需求验证报告生成失败:', error.message);
      throw error;
    }
  }

  /**
   * 解析需求文档
   */
  async parseRequirements() {
    console.log('📖 解析需求文档...');

    const requirementFiles = [
      'requirement_new.md',
      'requirement.md',
      '.artifacts/ui_interface.yml',
      '.artifacts/api_interface.yml',
      '.artifacts/data_interface.yml'
    ];

    for (const fileName of requirementFiles) {
      const filePath = path.join(this.projectRoot, fileName);
      
      if (fs.existsSync(filePath)) {
        console.log(`   📄 解析文件: ${fileName}`);
        
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          
          if (fileName.endsWith('.md')) {
            this.parseMarkdownRequirements(content, fileName);
          } else if (fileName.endsWith('.yml')) {
            this.parseYamlRequirements(content, fileName);
          }
        } catch (error) {
          console.warn(`   ⚠️ 解析文件失败: ${fileName} - ${error.message}`);
        }
      } else {
        console.warn(`   ⚠️ 文件不存在: ${fileName}`);
      }
    }

    console.log(`   ✅ 共解析到 ${this.requirements.length} 个需求\n`);
  }

  /**
   * 解析Markdown格式的需求
   */
  parseMarkdownRequirements(content, fileName) {
    const lines = content.split('\n');
    let currentSection = '';
    let currentRequirement = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // 检测章节标题
      if (line.startsWith('###')) {
        currentSection = line.replace(/^#+\s*/, '');
        continue;
      }

      // 检测需求项
      if (line.startsWith('-') || line.match(/^\d+\./)) {
        if (currentRequirement) {
          this.requirements.push(currentRequirement);
        }

        currentRequirement = {
          id: `REQ-${this.requirements.length + 1}`,
          source: fileName,
          section: currentSection,
          description: line.replace(/^[-\d.]\s*/, ''),
          details: [],
          acceptanceCriteria: [],
          type: this.determineRequirementType(line, currentSection)
        };
      }

      // 检测验收标准
      if (line.includes('验收标准') || line.includes('acceptance') || line.includes('应该') || line.includes('必须')) {
        if (currentRequirement) {
          currentRequirement.acceptanceCriteria.push(line);
        }
      }

      // 检测详细描述
      if (currentRequirement && line && !line.startsWith('#') && !line.startsWith('-') && !line.match(/^\d+\./)) {
        currentRequirement.details.push(line);
      }
    }

    // 添加最后一个需求
    if (currentRequirement) {
      this.requirements.push(currentRequirement);
    }
  }

  /**
   * 解析YAML格式的需求
   */
  parseYamlRequirements(content, fileName) {
    try {
      // 简单的YAML解析（针对接口文档）
      const lines = content.split('\n');
      let currentInterface = null;

      for (const line of lines) {
        const trimmedLine = line.trim();

        // 检测接口定义
        if (trimmedLine.includes(':') && !trimmedLine.startsWith('#')) {
          const [key, value] = trimmedLine.split(':').map(s => s.trim());

          if (key && !key.includes(' ')) {
            if (currentInterface) {
              this.requirements.push(currentInterface);
            }

            currentInterface = {
              id: `API-${this.requirements.length + 1}`,
              source: fileName,
              section: 'API接口',
              description: `${key} 接口实现`,
              details: [value || ''],
              acceptanceCriteria: [],
              type: 'api'
            };
          }
        }

        // 检测验收标准
        if (trimmedLine.includes('acceptanceCriteria') || trimmedLine.includes('验收标准')) {
          if (currentInterface) {
            currentInterface.acceptanceCriteria.push(trimmedLine);
          }
        }
      }

      // 添加最后一个接口
      if (currentInterface) {
        this.requirements.push(currentInterface);
      }

    } catch (error) {
      console.warn(`   ⚠️ YAML解析失败: ${fileName} - ${error.message}`);
    }
  }

  /**
   * 确定需求类型
   */
  determineRequirementType(description, section) {
    const lowerDesc = description.toLowerCase();
    const lowerSection = section.toLowerCase();

    if (lowerSection.includes('ui') || lowerSection.includes('界面') || lowerSection.includes('页面')) {
      return 'ui';
    }
    
    if (lowerSection.includes('api') || lowerSection.includes('接口') || lowerDesc.includes('接口')) {
      return 'api';
    }
    
    if (lowerSection.includes('数据') || lowerSection.includes('database') || lowerDesc.includes('数据库')) {
      return 'data';
    }
    
    if (lowerDesc.includes('登录') || lowerDesc.includes('注册') || lowerDesc.includes('认证')) {
      return 'auth';
    }
    
    if (lowerDesc.includes('验证') || lowerDesc.includes('校验')) {
      return 'validation';
    }

    return 'functional';
  }

  /**
   * 扫描测试文件
   */
  async scanTestFiles() {
    console.log('🔍 扫描测试文件...');

    const testDirectories = [
      'frontend/test',
      'backend/test',
      'test'
    ];

    for (const testDir of testDirectories) {
      const testPath = path.join(this.projectRoot, testDir);
      
      if (fs.existsSync(testPath)) {
        console.log(`   📁 扫描目录: ${testDir}`);
        await this.scanDirectory(testPath, testDir);
      }
    }

    // 扫描根目录的测试文件
    const rootTestFiles = [
      'integration-test.js',
      'verify-system.js',
      'ui-validation-report.js',
      'requirement-coverage-checker.js'
    ];

    for (const testFile of rootTestFiles) {
      const testPath = path.join(this.projectRoot, testFile);
      
      if (fs.existsSync(testPath)) {
        console.log(`   📄 扫描文件: ${testFile}`);
        await this.parseTestFile(testPath, testFile);
      }
    }

    console.log(`   ✅ 共发现 ${this.testCases.length} 个测试用例\n`);
  }

  /**
   * 递归扫描目录
   */
  async scanDirectory(dirPath, relativePath) {
    const items = fs.readdirSync(dirPath);

    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const stat = fs.statSync(itemPath);

      if (stat.isDirectory()) {
        await this.scanDirectory(itemPath, path.join(relativePath, item));
      } else if (item.endsWith('.test.js') || item.endsWith('.test.tsx') || item.endsWith('.spec.js')) {
        await this.parseTestFile(itemPath, path.join(relativePath, item));
      }
    }
  }

  /**
   * 解析测试文件
   */
  async parseTestFile(filePath, relativePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const testCases = this.extractTestCases(content, relativePath);
      this.testCases.push(...testCases);
    } catch (error) {
      console.warn(`   ⚠️ 解析测试文件失败: ${relativePath} - ${error.message}`);
    }
  }

  /**
   * 提取测试用例
   */
  extractTestCases(content, filePath) {
    const testCases = [];
    const lines = content.split('\n');

    let currentDescribe = '';
    let currentTest = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // 检测describe块
      const describeMatch = line.match(/describe\s*\(\s*['"`]([^'"`]+)['"`]/);
      if (describeMatch) {
        currentDescribe = describeMatch[1];
        continue;
      }

      // 检测test/it块
      const testMatch = line.match(/(test|it)\s*\(\s*['"`]([^'"`]+)['"`]/);
      if (testMatch) {
        if (currentTest) {
          testCases.push(currentTest);
        }

        currentTest = {
          id: `TEST-${testCases.length + 1}`,
          file: filePath,
          describe: currentDescribe,
          name: testMatch[2],
          type: this.determineTestType(testMatch[2], currentDescribe, filePath),
          keywords: this.extractKeywords(testMatch[2]),
          lineNumber: i + 1
        };
      }

      // 检测expect语句
      if (currentTest && line.includes('expect(')) {
        if (!currentTest.assertions) {
          currentTest.assertions = [];
        }
        currentTest.assertions.push(line);
      }
    }

    // 添加最后一个测试
    if (currentTest) {
      testCases.push(currentTest);
    }

    return testCases;
  }

  /**
   * 确定测试类型
   */
  determineTestType(testName, describeName, filePath) {
    const combined = `${testName} ${describeName} ${filePath}`.toLowerCase();

    if (combined.includes('ui') || combined.includes('element') || combined.includes('component')) {
      return 'ui';
    }
    
    if (combined.includes('api') || combined.includes('endpoint') || combined.includes('route')) {
      return 'api';
    }
    
    if (combined.includes('database') || combined.includes('db') || combined.includes('data')) {
      return 'data';
    }
    
    if (combined.includes('integration') || combined.includes('e2e') || combined.includes('end-to-end')) {
      return 'integration';
    }
    
    if (combined.includes('auth') || combined.includes('login') || combined.includes('register')) {
      return 'auth';
    }

    return 'unit';
  }

  /**
   * 提取关键词
   */
  extractKeywords(text) {
    const keywords = [];
    const commonKeywords = [
      '登录', '注册', '验证码', '手机号', '用户', '密码', '认证',
      'login', 'register', 'verification', 'phone', 'user', 'password', 'auth',
      '按钮', '输入框', '页面', '表单', '链接', '图片',
      'button', 'input', 'page', 'form', 'link', 'image',
      '数据库', '接口', 'API', '端点', '请求', '响应',
      'database', 'api', 'endpoint', 'request', 'response'
    ];

    for (const keyword of commonKeywords) {
      if (text.toLowerCase().includes(keyword.toLowerCase())) {
        keywords.push(keyword);
      }
    }

    return keywords;
  }

  /**
   * 分析覆盖率
   */
  async analyzeCoverage() {
    console.log('📊 分析需求覆盖率...');

    for (const requirement of this.requirements) {
      const matchingTests = this.findMatchingTests(requirement);
      
      const coverageResult = {
        requirement: requirement,
        matchingTests: matchingTests,
        coverageLevel: this.calculateCoverageLevel(requirement, matchingTests),
        gaps: this.identifyGaps(requirement, matchingTests)
      };

      this.coverageResults.push(coverageResult);
    }

    console.log(`   ✅ 覆盖率分析完成\n`);
  }

  /**
   * 查找匹配的测试用例
   */
  findMatchingTests(requirement) {
    const matchingTests = [];

    for (const testCase of this.testCases) {
      const matchScore = this.calculateMatchScore(requirement, testCase);
      
      if (matchScore > 0.3) { // 30%以上匹配度认为相关
        matchingTests.push({
          testCase: testCase,
          matchScore: matchScore,
          matchReasons: this.getMatchReasons(requirement, testCase)
        });
      }
    }

    // 按匹配度排序
    return matchingTests.sort((a, b) => b.matchScore - a.matchScore);
  }

  /**
   * 计算匹配分数
   */
  calculateMatchScore(requirement, testCase) {
    let score = 0;

    // 类型匹配
    if (requirement.type === testCase.type) {
      score += 0.3;
    }

    // 关键词匹配
    const reqText = `${requirement.description} ${requirement.details.join(' ')} ${requirement.acceptanceCriteria.join(' ')}`.toLowerCase();
    const testText = `${testCase.name} ${testCase.describe}`.toLowerCase();

    for (const keyword of testCase.keywords) {
      if (reqText.includes(keyword.toLowerCase())) {
        score += 0.1;
      }
    }

    // 描述相似度
    const commonWords = this.findCommonWords(reqText, testText);
    score += Math.min(commonWords.length * 0.05, 0.3);

    return Math.min(score, 1.0);
  }

  /**
   * 获取匹配原因
   */
  getMatchReasons(requirement, testCase) {
    const reasons = [];

    if (requirement.type === testCase.type) {
      reasons.push(`类型匹配: ${requirement.type}`);
    }

    const reqText = `${requirement.description} ${requirement.details.join(' ')}`.toLowerCase();
    const testText = `${testCase.name} ${testCase.describe}`.toLowerCase();

    for (const keyword of testCase.keywords) {
      if (reqText.includes(keyword.toLowerCase())) {
        reasons.push(`关键词匹配: ${keyword}`);
      }
    }

    return reasons;
  }

  /**
   * 查找共同词汇
   */
  findCommonWords(text1, text2) {
    const words1 = text1.split(/\s+/).filter(w => w.length > 2);
    const words2 = text2.split(/\s+/).filter(w => w.length > 2);
    
    return words1.filter(word => words2.includes(word));
  }

  /**
   * 计算覆盖级别
   */
  calculateCoverageLevel(requirement, matchingTests) {
    if (matchingTests.length === 0) {
      return 'NONE';
    }

    const highQualityMatches = matchingTests.filter(m => m.matchScore > 0.7).length;
    const mediumQualityMatches = matchingTests.filter(m => m.matchScore > 0.5).length;

    if (highQualityMatches >= 2) {
      return 'FULL';
    } else if (highQualityMatches >= 1 || mediumQualityMatches >= 2) {
      return 'PARTIAL';
    } else {
      return 'MINIMAL';
    }
  }

  /**
   * 识别覆盖缺口
   */
  identifyGaps(requirement, matchingTests) {
    const gaps = [];

    // 检查验收标准覆盖
    if (requirement.acceptanceCriteria.length > 0) {
      const coveredCriteria = requirement.acceptanceCriteria.filter(criteria => {
        return matchingTests.some(match => 
          match.testCase.name.toLowerCase().includes(criteria.toLowerCase()) ||
          (match.testCase.assertions && match.testCase.assertions.some(assertion => 
            assertion.toLowerCase().includes(criteria.toLowerCase())
          ))
        );
      });

      if (coveredCriteria.length < requirement.acceptanceCriteria.length) {
        gaps.push(`验收标准覆盖不足: ${coveredCriteria.length}/${requirement.acceptanceCriteria.length}`);
      }
    }

    // 检查测试类型覆盖
    const testTypes = [...new Set(matchingTests.map(m => m.testCase.type))];
    const expectedTypes = this.getExpectedTestTypes(requirement);
    
    for (const expectedType of expectedTypes) {
      if (!testTypes.includes(expectedType)) {
        gaps.push(`缺少${expectedType}测试`);
      }
    }

    return gaps;
  }

  /**
   * 获取期望的测试类型
   */
  getExpectedTestTypes(requirement) {
    const types = [];

    switch (requirement.type) {
      case 'ui':
        types.push('ui', 'integration');
        break;
      case 'api':
        types.push('api', 'integration');
        break;
      case 'data':
        types.push('data', 'unit');
        break;
      case 'auth':
        types.push('auth', 'api', 'integration');
        break;
      default:
        types.push('unit');
    }

    return types;
  }

  /**
   * 生成详细报告
   */
  generateDetailedReport() {
    console.log('='.repeat(80));
    console.log('📋 需求验证详细报告');
    console.log('='.repeat(80));

    // 总体统计
    const totalRequirements = this.requirements.length;
    const fullyCovered = this.coverageResults.filter(r => r.coverageLevel === 'FULL').length;
    const partiallyCovered = this.coverageResults.filter(r => r.coverageLevel === 'PARTIAL').length;
    const minimallyCovered = this.coverageResults.filter(r => r.coverageLevel === 'MINIMAL').length;
    const notCovered = this.coverageResults.filter(r => r.coverageLevel === 'NONE').length;

    const overallCoverage = totalRequirements > 0 ? 
      ((fullyCovered + partiallyCovered * 0.5 + minimallyCovered * 0.2) / totalRequirements * 100).toFixed(2) : 0;

    console.log(`\n📊 覆盖率统计:`);
    console.log(`   总需求数: ${totalRequirements}`);
    console.log(`   完全覆盖: ${fullyCovered} (${(fullyCovered/totalRequirements*100).toFixed(1)}%)`);
    console.log(`   部分覆盖: ${partiallyCovered} (${(partiallyCovered/totalRequirements*100).toFixed(1)}%)`);
    console.log(`   最小覆盖: ${minimallyCovered} (${(minimallyCovered/totalRequirements*100).toFixed(1)}%)`);
    console.log(`   未覆盖: ${notCovered} (${(notCovered/totalRequirements*100).toFixed(1)}%)`);
    console.log(`   总体覆盖率: ${overallCoverage}%`);

    // 按类型分析
    console.log(`\n📈 按类型分析:`);
    const typeStats = {};
    
    for (const result of this.coverageResults) {
      const type = result.requirement.type;
      if (!typeStats[type]) {
        typeStats[type] = { total: 0, covered: 0 };
      }
      typeStats[type].total++;
      if (result.coverageLevel !== 'NONE') {
        typeStats[type].covered++;
      }
    }

    Object.keys(typeStats).forEach(type => {
      const stats = typeStats[type];
      const coverage = (stats.covered / stats.total * 100).toFixed(1);
      console.log(`   ${type}: ${stats.covered}/${stats.total} (${coverage}%)`);
    });

    // 未覆盖需求详情
    const uncoveredRequirements = this.coverageResults.filter(r => r.coverageLevel === 'NONE');
    if (uncoveredRequirements.length > 0) {
      console.log(`\n❌ 未覆盖需求 (${uncoveredRequirements.length}个):`);
      uncoveredRequirements.forEach((result, index) => {
        console.log(`   ${index + 1}. [${result.requirement.type}] ${result.requirement.description}`);
        console.log(`      来源: ${result.requirement.source}`);
        if (result.requirement.acceptanceCriteria.length > 0) {
          console.log(`      验收标准: ${result.requirement.acceptanceCriteria.length}个`);
        }
      });
    }

    // 覆盖缺口分析
    const requirementsWithGaps = this.coverageResults.filter(r => r.gaps.length > 0);
    if (requirementsWithGaps.length > 0) {
      console.log(`\n⚠️ 存在覆盖缺口的需求 (${requirementsWithGaps.length}个):`);
      requirementsWithGaps.slice(0, 10).forEach((result, index) => {
        console.log(`   ${index + 1}. [${result.requirement.type}] ${result.requirement.description}`);
        result.gaps.forEach(gap => {
          console.log(`      - ${gap}`);
        });
      });
      
      if (requirementsWithGaps.length > 10) {
        console.log(`   ... 还有 ${requirementsWithGaps.length - 10} 个需求存在缺口`);
      }
    }

    // 测试质量分析
    console.log(`\n🎯 测试质量分析:`);
    const totalTests = this.testCases.length;
    const testTypeStats = {};
    
    for (const testCase of this.testCases) {
      const type = testCase.type;
      testTypeStats[type] = (testTypeStats[type] || 0) + 1;
    }

    console.log(`   总测试用例数: ${totalTests}`);
    Object.keys(testTypeStats).forEach(type => {
      const count = testTypeStats[type];
      const percentage = (count / totalTests * 100).toFixed(1);
      console.log(`   ${type}测试: ${count} (${percentage}%)`);
    });

    console.log('\n' + '='.repeat(80));
  }

  /**
   * 生成覆盖率矩阵
   */
  generateCoverageMatrix() {
    console.log('📊 需求-测试覆盖矩阵');
    console.log('='.repeat(80));

    // 按需求类型分组
    const requirementsByType = {};
    for (const result of this.coverageResults) {
      const type = result.requirement.type;
      if (!requirementsByType[type]) {
        requirementsByType[type] = [];
      }
      requirementsByType[type].push(result);
    }

    Object.keys(requirementsByType).forEach(type => {
      console.log(`\n📋 ${type.toUpperCase()} 需求覆盖情况:`);
      console.log('-'.repeat(60));

      const requirements = requirementsByType[type];
      requirements.forEach((result, index) => {
        const req = result.requirement;
        const coverageIcon = this.getCoverageIcon(result.coverageLevel);
        const testCount = result.matchingTests.length;

        console.log(`${coverageIcon} ${req.id}: ${req.description.substring(0, 50)}${req.description.length > 50 ? '...' : ''}`);
        console.log(`   测试用例: ${testCount}个 | 覆盖级别: ${result.coverageLevel}`);
        
        if (result.matchingTests.length > 0) {
          const topMatches = result.matchingTests.slice(0, 3);
          topMatches.forEach(match => {
            const score = (match.matchScore * 100).toFixed(0);
            console.log(`   - ${match.testCase.name} (匹配度: ${score}%)`);
          });
        }

        if (result.gaps.length > 0) {
          console.log(`   缺口: ${result.gaps.join(', ')}`);
        }

        console.log('');
      });
    });
  }

  /**
   * 获取覆盖级别图标
   */
  getCoverageIcon(level) {
    switch (level) {
      case 'FULL': return '✅';
      case 'PARTIAL': return '🟡';
      case 'MINIMAL': return '🟠';
      case 'NONE': return '❌';
      default: return '❓';
    }
  }

  /**
   * 保存报告文件
   */
  saveReports() {
    console.log('💾 保存报告文件...');

    // 保存详细报告
    const detailedReport = {
      timestamp: new Date().toISOString(),
      summary: {
        totalRequirements: this.requirements.length,
        totalTestCases: this.testCases.length,
        coverageStats: this.calculateCoverageStats(),
        typeStats: this.calculateTypeStats()
      },
      requirements: this.requirements,
      testCases: this.testCases,
      coverageResults: this.coverageResults
    };

    const reportPath = path.join(this.projectRoot, 'requirement-validation-detailed-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(detailedReport, null, 2));
    console.log(`   📄 详细报告: ${reportPath}`);

    // 保存覆盖率矩阵
    const matrixReport = this.generateMatrixReport();
    const matrixPath = path.join(this.projectRoot, 'requirement-coverage-matrix.json');
    fs.writeFileSync(matrixPath, JSON.stringify(matrixReport, null, 2));
    console.log(`   📊 覆盖率矩阵: ${matrixPath}`);

    // 保存简要报告
    const summaryReport = this.generateSummaryReport();
    const summaryPath = path.join(this.projectRoot, 'requirement-validation-summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summaryReport, null, 2));
    console.log(`   📋 简要报告: ${summaryPath}`);

    console.log('\n✅ 需求验证报告生成完成！');
  }

  /**
   * 计算覆盖率统计
   */
  calculateCoverageStats() {
    const total = this.coverageResults.length;
    const full = this.coverageResults.filter(r => r.coverageLevel === 'FULL').length;
    const partial = this.coverageResults.filter(r => r.coverageLevel === 'PARTIAL').length;
    const minimal = this.coverageResults.filter(r => r.coverageLevel === 'MINIMAL').length;
    const none = this.coverageResults.filter(r => r.coverageLevel === 'NONE').length;

    return {
      total,
      full,
      partial,
      minimal,
      none,
      overallCoverage: total > 0 ? ((full + partial * 0.5 + minimal * 0.2) / total * 100) : 0
    };
  }

  /**
   * 计算类型统计
   */
  calculateTypeStats() {
    const stats = {};
    
    for (const result of this.coverageResults) {
      const type = result.requirement.type;
      if (!stats[type]) {
        stats[type] = { total: 0, covered: 0 };
      }
      stats[type].total++;
      if (result.coverageLevel !== 'NONE') {
        stats[type].covered++;
      }
    }

    return stats;
  }

  /**
   * 生成矩阵报告
   */
  generateMatrixReport() {
    return {
      timestamp: new Date().toISOString(),
      matrix: this.coverageResults.map(result => ({
        requirementId: result.requirement.id,
        requirementType: result.requirement.type,
        requirementDescription: result.requirement.description,
        coverageLevel: result.coverageLevel,
        testCases: result.matchingTests.map(match => ({
          testId: match.testCase.id,
          testName: match.testCase.name,
          testFile: match.testCase.file,
          matchScore: match.matchScore,
          matchReasons: match.matchReasons
        })),
        gaps: result.gaps
      }))
    };
  }

  /**
   * 生成简要报告
   */
  generateSummaryReport() {
    const stats = this.calculateCoverageStats();
    const typeStats = this.calculateTypeStats();

    return {
      timestamp: new Date().toISOString(),
      overallCoverage: stats.overallCoverage,
      totalRequirements: stats.total,
      totalTestCases: this.testCases.length,
      coverageBreakdown: {
        full: stats.full,
        partial: stats.partial,
        minimal: stats.minimal,
        none: stats.none
      },
      typeBreakdown: typeStats,
      recommendations: this.generateRecommendations()
    };
  }

  /**
   * 生成建议
   */
  generateRecommendations() {
    const recommendations = [];
    const stats = this.calculateCoverageStats();

    if (stats.none > 0) {
      recommendations.push(`需要为 ${stats.none} 个未覆盖的需求编写测试用例`);
    }

    if (stats.minimal > 0) {
      recommendations.push(`需要增强 ${stats.minimal} 个最小覆盖需求的测试用例`);
    }

    const requirementsWithGaps = this.coverageResults.filter(r => r.gaps.length > 0);
    if (requirementsWithGaps.length > 0) {
      recommendations.push(`需要补充 ${requirementsWithGaps.length} 个需求的测试缺口`);
    }

    if (stats.overallCoverage < 80) {
      recommendations.push('总体覆盖率偏低，建议增加更多测试用例');
    }

    return recommendations;
  }
}

/**
 * 主函数
 */
async function main() {
  const reporter = new RequirementValidationReporter();
  await reporter.generateReport();
}

// 如果直接运行此脚本
if (require.main === module) {
  main().catch(error => {
    console.error('❌ 需求验证报告生成失败:', error);
    process.exit(1);
  });
}

module.exports = RequirementValidationReporter;