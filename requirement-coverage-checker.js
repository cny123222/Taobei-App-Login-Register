const fs = require('fs');
const path = require('path');

/**
 * 需求覆盖率检查器
 * 验证需求文档中的每个需求都有对应的测试用例
 */
class RequirementCoverageChecker {
  constructor() {
    this.requirements = [];
    this.testCases = [];
    this.coverage = {
      totalRequirements: 0,
      coveredRequirements: 0,
      uncoveredRequirements: [],
      coverageReport: []
    };
  }

  /**
   * 解析需求文档，提取所有需求
   */
  parseRequirements(requirementFilePath) {
    try {
      const content = fs.readFileSync(requirementFilePath, 'utf8');
      const lines = content.split('\n');
      
      let currentSection = '';
      let currentRequirement = null;
      
      lines.forEach((line, index) => {
        const trimmedLine = line.trim();
        
        // 识别主要章节
        if (trimmedLine.match(/^\d+\.\s+/)) {
          currentSection = trimmedLine;
        }
        
        // 识别子需求
        if (trimmedLine.match(/^\d+\.\d+/)) {
          if (currentRequirement) {
            this.requirements.push(currentRequirement);
          }
          
          currentRequirement = {
            id: trimmedLine.split(' ')[0],
            title: trimmedLine,
            section: currentSection,
            description: '',
            scenarios: [],
            lineNumber: index + 1
          };
        }
        
        // 识别场景
        if (trimmedLine.startsWith('Scenario:')) {
          if (currentRequirement) {
            const scenario = {
              name: trimmedLine.replace('Scenario:', '').trim(),
              steps: [],
              lineNumber: index + 1
            };
            currentRequirement.scenarios.push(scenario);
          }
        }
        
        // 收集场景步骤
        if (currentRequirement && currentRequirement.scenarios.length > 0) {
          const currentScenario = currentRequirement.scenarios[currentRequirement.scenarios.length - 1];
          if (trimmedLine.match(/^\s*(Given|When|Then|And)\s+/)) {
            currentScenario.steps.push(trimmedLine.trim());
          }
        }
        
        // 收集需求描述
        if (currentRequirement && !trimmedLine.startsWith('Scenario:') && 
            !trimmedLine.match(/^\s*(Given|When|Then|And)\s+/) && 
            trimmedLine.length > 0 && !trimmedLine.match(/^\d+\.\d+/)) {
          currentRequirement.description += trimmedLine + ' ';
        }
      });
      
      // 添加最后一个需求
      if (currentRequirement) {
        this.requirements.push(currentRequirement);
      }
      
      this.coverage.totalRequirements = this.requirements.length;
      console.log(`✅ 解析需求文档完成，共找到 ${this.requirements.length} 个需求`);
      
    } catch (error) {
      console.error('❌ 解析需求文档失败:', error.message);
      throw error;
    }
  }

  /**
   * 扫描测试文件，提取测试用例
   */
  scanTestFiles(testDirectory) {
    try {
      const testFiles = this.findTestFiles(testDirectory);
      
      testFiles.forEach(filePath => {
        const content = fs.readFileSync(filePath, 'utf8');
        const testCases = this.extractTestCases(content, filePath);
        this.testCases.push(...testCases);
      });
      
      console.log(`✅ 扫描测试文件完成，共找到 ${this.testCases.length} 个测试用例`);
      
    } catch (error) {
      console.error('❌ 扫描测试文件失败:', error.message);
      throw error;
    }
  }

  /**
   * 递归查找所有测试文件
   */
  findTestFiles(directory) {
    const testFiles = [];
    
    const scanDirectory = (dir) => {
      const items = fs.readdirSync(dir);
      
      items.forEach(item => {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          scanDirectory(fullPath);
        } else if (item.endsWith('.test.js') || item.endsWith('.test.tsx') || item.endsWith('.test.ts')) {
          testFiles.push(fullPath);
        }
      });
    };
    
    scanDirectory(directory);
    return testFiles;
  }

  /**
   * 从测试文件内容中提取测试用例
   */
  extractTestCases(content, filePath) {
    const testCases = [];
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      // 匹配测试用例
      const testMatch = trimmedLine.match(/test\s*\(\s*['"`]([^'"`]+)['"`]/);
      if (testMatch) {
        testCases.push({
          name: testMatch[1],
          file: filePath,
          lineNumber: index + 1,
          requirementId: this.extractRequirementId(testMatch[1])
        });
      }
      
      // 匹配describe块
      const describeMatch = trimmedLine.match(/describe\s*\(\s*['"`]([^'"`]+)['"`]/);
      if (describeMatch) {
        testCases.push({
          name: describeMatch[1],
          file: filePath,
          lineNumber: index + 1,
          type: 'describe',
          requirementId: this.extractRequirementId(describeMatch[1])
        });
      }
    });
    
    return testCases;
  }

  /**
   * 从测试用例名称中提取需求ID
   */
  extractRequirementId(testName) {
    // 匹配 REQ-X.X.X 格式
    const reqMatch = testName.match(/REQ-(\d+\.\d+(?:\.\d+)?)/);
    if (reqMatch) {
      return reqMatch[1];
    }
    
    // 匹配中文需求描述中的数字
    const chineseMatch = testName.match(/(\d+\.\d+(?:\.\d+)?)/);
    if (chineseMatch) {
      return chineseMatch[1];
    }
    
    return null;
  }

  /**
   * 检查需求覆盖率
   */
  checkCoverage() {
    this.requirements.forEach(req => {
      const relatedTests = this.testCases.filter(test => {
        return test.requirementId === req.id || 
               test.name.includes(req.id) ||
               this.isRelatedTest(req, test);
      });
      
      const coverageItem = {
        requirementId: req.id,
        title: req.title,
        description: req.description.trim(),
        scenarios: req.scenarios,
        testCases: relatedTests,
        covered: relatedTests.length > 0,
        scenarioCoverage: this.checkScenarioCoverage(req, relatedTests)
      };
      
      this.coverage.coverageReport.push(coverageItem);
      
      if (relatedTests.length > 0) {
        this.coverage.coveredRequirements++;
      } else {
        this.coverage.uncoveredRequirements.push(req);
      }
    });
    
    // 计算覆盖率百分比
    this.coverage.coveragePercentage = this.coverage.totalRequirements > 0 
      ? (this.coverage.coveredRequirements / this.coverage.totalRequirements * 100).toFixed(2)
      : 0;
  }

  /**
   * 检查场景覆盖率
   */
  checkScenarioCoverage(requirement, testCases) {
    const scenarioCoverage = requirement.scenarios.map(scenario => {
      const relatedTests = testCases.filter(test => 
        test.name.toLowerCase().includes(scenario.name.toLowerCase()) ||
        scenario.name.toLowerCase().includes(test.name.toLowerCase())
      );
      
      return {
        scenario: scenario.name,
        covered: relatedTests.length > 0,
        tests: relatedTests
      };
    });
    
    return scenarioCoverage;
  }

  /**
   * 判断测试用例是否与需求相关
   */
  isRelatedTest(requirement, testCase) {
    const reqKeywords = requirement.title.toLowerCase().split(/\s+/);
    const testKeywords = testCase.name.toLowerCase().split(/\s+/);
    
    // 检查关键词匹配
    const matchCount = reqKeywords.filter(keyword => 
      testKeywords.some(testKeyword => 
        testKeyword.includes(keyword) || keyword.includes(testKeyword)
      )
    ).length;
    
    return matchCount >= 2; // 至少匹配2个关键词
  }

  /**
   * 生成覆盖率报告
   */
  generateReport() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 需求覆盖率检查报告');
    console.log('='.repeat(80));
    
    console.log(`\n📈 总体覆盖率: ${this.coverage.coveragePercentage}%`);
    console.log(`📋 总需求数: ${this.coverage.totalRequirements}`);
    console.log(`✅ 已覆盖需求: ${this.coverage.coveredRequirements}`);
    console.log(`❌ 未覆盖需求: ${this.coverage.uncoveredRequirements.length}`);
    
    // 详细覆盖率报告
    console.log('\n📝 详细覆盖率报告:');
    console.log('-'.repeat(80));
    
    this.coverage.coverageReport.forEach(item => {
      const status = item.covered ? '✅' : '❌';
      console.log(`\n${status} ${item.requirementId}: ${item.title}`);
      
      if (item.testCases.length > 0) {
        console.log(`   📋 相关测试用例 (${item.testCases.length}个):`);
        item.testCases.forEach(test => {
          const fileName = path.basename(test.file);
          console.log(`      - ${test.name} (${fileName}:${test.lineNumber})`);
        });
      }
      
      if (item.scenarios.length > 0) {
        console.log(`   🎭 场景覆盖率:`);
        item.scenarioCoverage.forEach(scenario => {
          const scenarioStatus = scenario.covered ? '✅' : '❌';
          console.log(`      ${scenarioStatus} ${scenario.scenario}`);
        });
      }
      
      if (!item.covered) {
        console.log(`   ⚠️  建议: 为此需求添加测试用例`);
      }
    });
    
    // 未覆盖需求列表
    if (this.coverage.uncoveredRequirements.length > 0) {
      console.log('\n🚨 未覆盖的需求:');
      console.log('-'.repeat(80));
      this.coverage.uncoveredRequirements.forEach(req => {
        console.log(`❌ ${req.id}: ${req.title}`);
        if (req.scenarios.length > 0) {
          console.log(`   场景数: ${req.scenarios.length}`);
          req.scenarios.forEach(scenario => {
            console.log(`   - ${scenario.name}`);
          });
        }
      });
    }
    
    // 测试质量分析
    console.log('\n🔍 测试质量分析:');
    console.log('-'.repeat(80));
    
    const testFileStats = this.analyzeTestFiles();
    console.log(`📁 测试文件数: ${testFileStats.fileCount}`);
    console.log(`🧪 测试用例总数: ${testFileStats.totalTests}`);
    console.log(`📊 平均每文件测试数: ${testFileStats.avgTestsPerFile}`);
    
    // 建议
    console.log('\n💡 改进建议:');
    console.log('-'.repeat(80));
    
    if (this.coverage.coveragePercentage < 80) {
      console.log('⚠️  覆盖率低于80%，建议增加测试用例');
    }
    
    if (this.coverage.uncoveredRequirements.length > 0) {
      console.log('⚠️  存在未覆盖的需求，建议补充相应测试');
    }
    
    const orphanTests = this.findOrphanTests();
    if (orphanTests.length > 0) {
      console.log(`⚠️  发现 ${orphanTests.length} 个可能的孤立测试用例（未关联到具体需求）`);
    }
    
    console.log('\n' + '='.repeat(80));
  }

  /**
   * 分析测试文件统计信息
   */
  analyzeTestFiles() {
    const fileGroups = {};
    
    this.testCases.forEach(test => {
      if (!fileGroups[test.file]) {
        fileGroups[test.file] = 0;
      }
      fileGroups[test.file]++;
    });
    
    const fileCount = Object.keys(fileGroups).length;
    const totalTests = this.testCases.length;
    const avgTestsPerFile = fileCount > 0 ? (totalTests / fileCount).toFixed(1) : 0;
    
    return {
      fileCount,
      totalTests,
      avgTestsPerFile
    };
  }

  /**
   * 查找孤立的测试用例（没有关联到需求的测试）
   */
  findOrphanTests() {
    return this.testCases.filter(test => {
      return !this.requirements.some(req => 
        test.requirementId === req.id || 
        test.name.includes(req.id) ||
        this.isRelatedTest(req, test)
      );
    });
  }

  /**
   * 保存报告到文件
   */
  saveReport(outputPath) {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalRequirements: this.coverage.totalRequirements,
        coveredRequirements: this.coverage.coveredRequirements,
        coveragePercentage: this.coverage.coveragePercentage,
        uncoveredCount: this.coverage.uncoveredRequirements.length
      },
      coverage: this.coverage.coverageReport,
      uncoveredRequirements: this.coverage.uncoveredRequirements,
      testStats: this.analyzeTestFiles(),
      orphanTests: this.findOrphanTests()
    };
    
    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
    console.log(`\n💾 报告已保存到: ${outputPath}`);
  }
}

/**
 * 主函数
 */
async function main() {
  try {
    console.log('🚀 开始需求覆盖率检查...\n');
    
    const checker = new RequirementCoverageChecker();
    
    // 解析需求文档
    const requirementPath = path.join(__dirname, 'requirement_new.md');
    checker.parseRequirements(requirementPath);
    
    // 扫描测试文件
    const testDirectories = [
      path.join(__dirname, 'frontend/test'),
      path.join(__dirname, 'backend/test')
    ];
    
    for (const testDir of testDirectories) {
      if (fs.existsSync(testDir)) {
        checker.scanTestFiles(testDir);
      }
    }
    
    // 检查覆盖率
    checker.checkCoverage();
    
    // 生成报告
    checker.generateReport();
    
    // 保存报告
    const reportPath = path.join(__dirname, 'requirement-coverage-report.json');
    checker.saveReport(reportPath);
    
    // 返回结果
    const success = checker.coverage.coveragePercentage >= 80;
    process.exit(success ? 0 : 1);
    
  } catch (error) {
    console.error('❌ 需求覆盖率检查失败:', error.message);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = RequirementCoverageChecker;