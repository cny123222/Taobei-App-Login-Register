// Cypress支持文件 - 全局配置和自定义命令

// 导入Cypress命令
import './commands';

// 全局配置
Cypress.on('uncaught:exception', (err, runnable) => {
  // 防止某些预期的错误导致测试失败
  if (err.message.includes('ResizeObserver loop limit exceeded')) {
    return false;
  }
  if (err.message.includes('Non-Error promise rejection captured')) {
    return false;
  }
  return true;
});

// 在每个测试前清理状态
beforeEach(() => {
  // 清理localStorage和sessionStorage
  cy.clearLocalStorage();
  cy.clearCookies();
  
  // 设置视口
  cy.viewport(1280, 720);
  
  // 拦截API请求以便测试
  cy.intercept('POST', '**/api/auth/send-verification-code', { fixture: 'send-code-success.json' }).as('sendCode');
  cy.intercept('POST', '**/api/auth/login', { fixture: 'login-success.json' }).as('login');
  cy.intercept('POST', '**/api/auth/register', { fixture: 'register-success.json' }).as('register');
});

// 全局测试配置
Cypress.config('defaultCommandTimeout', 10000);
Cypress.config('requestTimeout', 10000);
Cypress.config('responseTimeout', 10000);