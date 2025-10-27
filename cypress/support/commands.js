// Cypress自定义命令

// 自定义命令：填写手机号
Cypress.Commands.add('fillPhoneNumber', (phoneNumber) => {
  cy.get('[data-testid="phone-input"]')
    .should('be.visible')
    .clear()
    .type(phoneNumber)
    .should('have.value', phoneNumber);
});

// 自定义命令：填写验证码
Cypress.Commands.add('fillVerificationCode', (code) => {
  cy.get('[data-testid="code-input"]')
    .should('be.visible')
    .clear()
    .type(code)
    .should('have.value', code);
});

// 自定义命令：点击发送验证码按钮
Cypress.Commands.add('clickSendCode', () => {
  cy.get('[data-testid="send-code-button"]')
    .should('be.visible')
    .should('not.be.disabled')
    .click();
});

// 自定义命令：点击登录按钮
Cypress.Commands.add('clickLogin', () => {
  cy.get('[data-testid="login-button"]')
    .should('be.visible')
    .should('not.be.disabled')
    .click();
});

// 自定义命令：点击注册按钮
Cypress.Commands.add('clickRegister', () => {
  cy.get('[data-testid="register-button"]')
    .should('be.visible')
    .should('not.be.disabled')
    .click();
});

// 自定义命令：切换到注册页面
Cypress.Commands.add('switchToRegister', () => {
  cy.get('[data-testid="switch-to-register"]')
    .should('be.visible')
    .click();
});

// 自定义命令：切换到登录页面
Cypress.Commands.add('switchToLogin', () => {
  cy.get('[data-testid="switch-to-login"]')
    .should('be.visible')
    .click();
});

// 自定义命令：同意协议
Cypress.Commands.add('agreeToTerms', () => {
  cy.get('[data-testid="terms-checkbox"]')
    .should('be.visible')
    .check()
    .should('be.checked');
});

// 自定义命令：验证错误消息
Cypress.Commands.add('verifyErrorMessage', (message) => {
  cy.get('[data-testid="error-message"]')
    .should('be.visible')
    .should('contain.text', message);
});

// 自定义命令：验证成功消息
Cypress.Commands.add('verifySuccessMessage', (message) => {
  cy.get('[data-testid="success-message"]')
    .should('be.visible')
    .should('contain.text', message);
});

// 自定义命令：等待API请求完成
Cypress.Commands.add('waitForAPI', (alias) => {
  cy.wait(`@${alias}`).then((interception) => {
    expect(interception.response.statusCode).to.be.oneOf([200, 201]);
  });
});

// 自定义命令：验证倒计时
Cypress.Commands.add('verifyCountdown', () => {
  cy.get('[data-testid="countdown"]')
    .should('be.visible')
    .should('contain.text', '秒');
});

// 自定义命令：验证按钮状态
Cypress.Commands.add('verifyButtonState', (selector, state) => {
  const button = cy.get(selector).should('be.visible');
  
  if (state === 'disabled') {
    button.should('be.disabled');
  } else if (state === 'enabled') {
    button.should('not.be.disabled');
  } else if (state === 'loading') {
    button.should('contain.text', '发送中').should('be.disabled');
  }
});

// 自定义命令：模拟网络延迟
Cypress.Commands.add('simulateNetworkDelay', (delay = 1000) => {
  cy.intercept('POST', '**/api/auth/**', (req) => {
    req.reply((res) => {
      return new Promise((resolve) => {
        setTimeout(() => resolve(res), delay);
      });
    });
  });
});

// 自定义命令：验证页面标题
Cypress.Commands.add('verifyPageTitle', (title) => {
  cy.title().should('contain', title);
});

// 自定义命令：验证URL
Cypress.Commands.add('verifyURL', (path) => {
  cy.url().should('include', path);
});