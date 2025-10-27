// 用户认证端到端测试

describe('用户认证流程', () => {
  beforeEach(() => {
    // 访问首页
    cy.visit('/');
    
    // 验证页面加载
    cy.get('body').should('be.visible');
  });

  describe('首页功能', () => {
    it('应该显示品牌logo和导航链接', () => {
      // 验证品牌logo
      cy.get('[data-testid="brand-logo"]')
        .should('be.visible')
        .should('contain.text', '淘贝');

      // 验证登录链接
      cy.get('[data-testid="login-link"]')
        .should('be.visible')
        .should('contain.text', '登录');

      // 验证注册链接
      cy.get('[data-testid="register-link"]')
        .should('be.visible')
        .should('contain.text', '注册');
    });

    it('应该能够导航到登录页面', () => {
      cy.get('[data-testid="login-link"]').click();
      
      // 验证登录表单显示
      cy.get('[data-testid="login-form"]').should('be.visible');
      cy.get('[data-testid="phone-input"]').should('be.visible');
      cy.get('[data-testid="code-input"]').should('be.visible');
    });

    it('应该能够导航到注册页面', () => {
      cy.get('[data-testid="register-link"]').click();
      
      // 验证注册表单显示
      cy.get('[data-testid="register-form"]').should('be.visible');
      cy.get('[data-testid="phone-input"]').should('be.visible');
      cy.get('[data-testid="code-input"]').should('be.visible');
      cy.get('[data-testid="terms-checkbox"]').should('be.visible');
    });
  });

  describe('用户注册流程', () => {
    beforeEach(() => {
      // 导航到注册页面
      cy.get('[data-testid="register-link"]').click();
    });

    it('应该完成完整的注册流程', () => {
      const testPhone = '13800138001';
      const testCode = '123456';

      // 步骤1: 输入手机号
      cy.fillPhoneNumber(testPhone);

      // 步骤2: 发送验证码
      cy.clickSendCode();
      cy.waitForAPI('sendCode');

      // 验证倒计时开始
      cy.verifyCountdown();
      cy.verifyButtonState('[data-testid="send-code-button"]', 'disabled');

      // 步骤3: 输入验证码
      cy.fillVerificationCode(testCode);

      // 步骤4: 同意协议
      cy.agreeToTerms();

      // 步骤5: 点击注册
      cy.clickRegister();
      cy.waitForAPI('register');

      // 验证注册成功
      cy.verifySuccessMessage('注册成功');
    });

    it('应该验证手机号格式', () => {
      const invalidPhones = ['123', '12345678901', 'abc1234567'];

      invalidPhones.forEach(phone => {
        cy.fillPhoneNumber(phone);
        cy.clickSendCode();
        
        // 验证错误消息
        cy.verifyErrorMessage('手机号格式不正确');
        
        // 清空输入
        cy.get('[data-testid="phone-input"]').clear();
      });
    });

    it('应该验证验证码格式', () => {
      const validPhone = '13800138001';
      const invalidCodes = ['123', '1234567', 'abc123'];

      // 先输入有效手机号并发送验证码
      cy.fillPhoneNumber(validPhone);
      cy.clickSendCode();
      cy.waitForAPI('sendCode');

      invalidCodes.forEach(code => {
        cy.fillVerificationCode(code);
        cy.agreeToTerms();
        cy.clickRegister();
        
        // 验证错误消息
        cy.verifyErrorMessage('验证码格式不正确');
        
        // 清空验证码输入
        cy.get('[data-testid="code-input"]').clear();
      });
    });

    it('应该要求同意协议才能注册', () => {
      const testPhone = '13800138001';
      const testCode = '123456';

      // 输入有效信息但不同意协议
      cy.fillPhoneNumber(testPhone);
      cy.clickSendCode();
      cy.waitForAPI('sendCode');
      cy.fillVerificationCode(testCode);

      // 验证注册按钮被禁用
      cy.verifyButtonState('[data-testid="register-button"]', 'disabled');

      // 同意协议后按钮应该启用
      cy.agreeToTerms();
      cy.verifyButtonState('[data-testid="register-button"]', 'enabled');
    });

    it('应该能够切换到登录页面', () => {
      cy.switchToLogin();
      
      // 验证登录表单显示
      cy.get('[data-testid="login-form"]').should('be.visible');
      cy.get('[data-testid="register-form"]').should('not.exist');
    });
  });

  describe('用户登录流程', () => {
    beforeEach(() => {
      // 导航到登录页面
      cy.get('[data-testid="login-link"]').click();
    });

    it('应该完成完整的登录流程', () => {
      const testPhone = '13800138001';
      const testCode = '123456';

      // 步骤1: 输入手机号
      cy.fillPhoneNumber(testPhone);

      // 步骤2: 发送验证码
      cy.clickSendCode();
      cy.waitForAPI('sendCode');

      // 验证倒计时开始
      cy.verifyCountdown();

      // 步骤3: 输入验证码
      cy.fillVerificationCode(testCode);

      // 步骤4: 点击登录
      cy.clickLogin();
      cy.waitForAPI('login');

      // 验证登录成功
      cy.verifySuccessMessage('登录成功');
    });

    it('应该验证手机号和验证码格式', () => {
      // 测试无效手机号
      cy.fillPhoneNumber('123');
      cy.clickSendCode();
      cy.verifyErrorMessage('手机号格式不正确');

      // 测试有效手机号但无效验证码
      cy.fillPhoneNumber('13800138001');
      cy.clickSendCode();
      cy.waitForAPI('sendCode');
      
      cy.fillVerificationCode('123');
      cy.clickLogin();
      cy.verifyErrorMessage('验证码格式不正确');
    });

    it('应该能够切换到注册页面', () => {
      cy.switchToRegister();
      
      // 验证注册表单显示
      cy.get('[data-testid="register-form"]').should('be.visible');
      cy.get('[data-testid="login-form"]').should('not.exist');
    });
  });

  describe('验证码发送功能', () => {
    beforeEach(() => {
      cy.get('[data-testid="login-link"]').click();
    });

    it('应该限制验证码发送频率', () => {
      const testPhone = '13800138001';

      // 第一次发送
      cy.fillPhoneNumber(testPhone);
      cy.clickSendCode();
      cy.waitForAPI('sendCode');

      // 验证倒计时开始，按钮被禁用
      cy.verifyCountdown();
      cy.verifyButtonState('[data-testid="send-code-button"]', 'disabled');

      // 尝试再次点击应该无效
      cy.get('[data-testid="send-code-button"]').should('be.disabled');
    });

    it('应该显示发送状态', () => {
      const testPhone = '13800138001';

      // 模拟网络延迟
      cy.simulateNetworkDelay(2000);

      cy.fillPhoneNumber(testPhone);
      cy.clickSendCode();

      // 验证加载状态
      cy.verifyButtonState('[data-testid="send-code-button"]', 'loading');
    });
  });

  describe('错误处理', () => {
    it('应该处理网络错误', () => {
      // 模拟网络错误
      cy.intercept('POST', '**/api/auth/send-verification-code', {
        statusCode: 500,
        body: { success: false, message: '服务器错误' }
      }).as('sendCodeError');

      cy.get('[data-testid="login-link"]').click();
      cy.fillPhoneNumber('13800138001');
      cy.clickSendCode();
      cy.waitForAPI('sendCodeError');

      // 验证错误消息显示
      cy.verifyErrorMessage('服务器错误');
    });

    it('应该处理验证码错误', () => {
      // 模拟验证码错误
      cy.intercept('POST', '**/api/auth/login', {
        statusCode: 401,
        body: { success: false, message: '验证码错误或已过期' }
      }).as('loginError');

      cy.get('[data-testid="login-link"]').click();
      cy.fillPhoneNumber('13800138001');
      cy.clickSendCode();
      cy.waitForAPI('sendCode');
      
      cy.fillVerificationCode('123456');
      cy.clickLogin();
      cy.waitForAPI('loginError');

      // 验证错误消息显示
      cy.verifyErrorMessage('验证码错误或已过期');
    });
  });

  describe('响应式设计', () => {
    it('应该在移动设备上正常显示', () => {
      // 设置移动设备视口
      cy.viewport(375, 667);

      // 验证页面元素在移动设备上可见
      cy.get('[data-testid="brand-logo"]').should('be.visible');
      cy.get('[data-testid="login-link"]').should('be.visible');
      cy.get('[data-testid="register-link"]').should('be.visible');

      // 测试登录表单在移动设备上的显示
      cy.get('[data-testid="login-link"]').click();
      cy.get('[data-testid="login-form"]').should('be.visible');
      cy.get('[data-testid="phone-input"]').should('be.visible');
      cy.get('[data-testid="code-input"]').should('be.visible');
    });

    it('应该在平板设备上正常显示', () => {
      // 设置平板设备视口
      cy.viewport(768, 1024);

      // 验证页面布局
      cy.get('[data-testid="brand-logo"]').should('be.visible');
      cy.get('[data-testid="login-link"]').should('be.visible');
      cy.get('[data-testid="register-link"]').should('be.visible');
    });
  });

  describe('可访问性测试', () => {
    it('应该支持键盘导航', () => {
      // 使用Tab键导航
      cy.get('body').tab();
      cy.focused().should('have.attr', 'data-testid', 'login-link');
      
      cy.focused().tab();
      cy.focused().should('have.attr', 'data-testid', 'register-link');
    });

    it('应该有正确的ARIA标签', () => {
      cy.get('[data-testid="login-link"]').click();
      
      // 验证表单元素有正确的标签
      cy.get('[data-testid="phone-input"]')
        .should('have.attr', 'aria-label')
        .and('include', '手机号');
      
      cy.get('[data-testid="code-input"]')
        .should('have.attr', 'aria-label')
        .and('include', '验证码');
    });
  });
});