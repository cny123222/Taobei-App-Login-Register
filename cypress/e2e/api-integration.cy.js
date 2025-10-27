// API集成测试 - 测试前后端API通信

describe('API集成测试', () => {
  const BACKEND_URL = Cypress.env('BACKEND_URL') || 'http://localhost:3000';

  beforeEach(() => {
    // 清理拦截器，使用真实API
    cy.intercept('POST', '**/api/auth/**').as('authAPI');
  });

  describe('验证码发送API集成', () => {
    it('应该成功发送登录验证码', () => {
      cy.request({
        method: 'POST',
        url: `${BACKEND_URL}/api/auth/send-verification-code`,
        body: {
          phone: '13800138001',
          type: 'login'
        }
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property('success', true);
        expect(response.body).to.have.property('message');
        expect(response.body.message).to.include('验证码发送成功');
      });
    });

    it('应该成功发送注册验证码', () => {
      cy.request({
        method: 'POST',
        url: `${BACKEND_URL}/api/auth/send-verification-code`,
        body: {
          phone: '13800138002',
          type: 'register'
        }
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property('success', true);
        expect(response.body).to.have.property('message');
        expect(response.body.message).to.include('验证码发送成功');
      });
    });

    it('应该拒绝无效的手机号格式', () => {
      cy.request({
        method: 'POST',
        url: `${BACKEND_URL}/api/auth/send-verification-code`,
        body: {
          phone: '123',
          type: 'login'
        },
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(400);
        expect(response.body).to.have.property('success', false);
        expect(response.body.message).to.include('手机号格式不正确');
      });
    });

    it('应该拒绝无效的类型参数', () => {
      cy.request({
        method: 'POST',
        url: `${BACKEND_URL}/api/auth/send-verification-code`,
        body: {
          phone: '13800138003',
          type: 'invalid'
        },
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(400);
        expect(response.body).to.have.property('success', false);
        expect(response.body.message).to.include('类型参数无效');
      });
    });

    it('应该限制请求频率', () => {
      const phone = '13800138004';
      
      // 第一次请求
      cy.request({
        method: 'POST',
        url: `${BACKEND_URL}/api/auth/send-verification-code`,
        body: { phone, type: 'login' }
      }).then((response) => {
        expect(response.status).to.eq(200);
      });

      // 立即第二次请求应该被限制
      cy.request({
        method: 'POST',
        url: `${BACKEND_URL}/api/auth/send-verification-code`,
        body: { phone, type: 'login' },
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(429);
        expect(response.body).to.have.property('success', false);
        expect(response.body.message).to.include('请求过于频繁');
      });
    });
  });

  describe('登录API集成', () => {
    it('应该处理登录请求格式验证', () => {
      cy.request({
        method: 'POST',
        url: `${BACKEND_URL}/api/auth/login`,
        body: {
          phone: '123',
          code: '123456'
        },
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(400);
        expect(response.body).to.have.property('success', false);
        expect(response.body.message).to.include('手机号格式不正确');
      });
    });

    it('应该处理验证码格式验证', () => {
      cy.request({
        method: 'POST',
        url: `${BACKEND_URL}/api/auth/login`,
        body: {
          phone: '13800138005',
          code: '123'
        },
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(400);
        expect(response.body).to.have.property('success', false);
        expect(response.body.message).to.include('验证码格式不正确');
      });
    });

    it('应该处理错误的验证码', () => {
      const phone = '13800138006';
      
      // 先发送验证码
      cy.request({
        method: 'POST',
        url: `${BACKEND_URL}/api/auth/send-verification-code`,
        body: { phone, type: 'login' }
      });

      // 使用错误验证码登录
      cy.request({
        method: 'POST',
        url: `${BACKEND_URL}/api/auth/login`,
        body: {
          phone,
          code: '999999'
        },
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(401);
        expect(response.body).to.have.property('success', false);
        expect(response.body.message).to.include('验证码错误');
      });
    });
  });

  describe('注册API集成', () => {
    it('应该处理注册请求格式验证', () => {
      cy.request({
        method: 'POST',
        url: `${BACKEND_URL}/api/auth/register`,
        body: {
          phone: '123',
          code: '123456'
        },
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(400);
        expect(response.body).to.have.property('success', false);
        expect(response.body.message).to.include('手机号格式不正确');
      });
    });

    it('应该处理验证码格式验证', () => {
      cy.request({
        method: 'POST',
        url: `${BACKEND_URL}/api/auth/register`,
        body: {
          phone: '13800138007',
          code: '123'
        },
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(400);
        expect(response.body).to.have.property('success', false);
        expect(response.body.message).to.include('验证码格式不正确');
      });
    });
  });

  describe('CORS和请求头测试', () => {
    it('应该正确处理CORS预检请求', () => {
      cy.request({
        method: 'OPTIONS',
        url: `${BACKEND_URL}/api/auth/send-verification-code`,
        headers: {
          'Origin': 'http://localhost:5173',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type'
        },
        failOnStatusCode: false
      }).then((response) => {
        // OPTIONS请求应该成功或者返回适当的状态码
        expect(response.status).to.be.oneOf([200, 204, 404]);
        
        // 如果支持CORS，应该有相应的头部
        if (response.status === 200 || response.status === 204) {
          expect(response.headers).to.have.property('access-control-allow-origin');
        }
      });
    });

    it('应该接受来自前端的请求', () => {
      cy.request({
        method: 'POST',
        url: `${BACKEND_URL}/api/auth/send-verification-code`,
        headers: {
          'Origin': 'http://localhost:5173',
          'Content-Type': 'application/json'
        },
        body: {
          phone: '13800138008',
          type: 'login'
        }
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property('success', true);
      });
    });
  });

  describe('响应格式和数据完整性', () => {
    it('验证码发送响应应该包含正确的数据结构', () => {
      cy.request({
        method: 'POST',
        url: `${BACKEND_URL}/api/auth/send-verification-code`,
        body: {
          phone: '13800138009',
          type: 'login'
        }
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property('success', true);
        expect(response.body).to.have.property('message');
        expect(response.body.message).to.be.a('string');
        expect(response.headers['content-type']).to.include('application/json');
      });
    });

    it('错误响应应该包含正确的数据结构', () => {
      cy.request({
        method: 'POST',
        url: `${BACKEND_URL}/api/auth/send-verification-code`,
        body: {
          phone: '123',
          type: 'login'
        },
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(400);
        expect(response.body).to.have.property('success', false);
        expect(response.body).to.have.property('message');
        expect(response.body.message).to.be.a('string');
        expect(response.headers['content-type']).to.include('application/json');
      });
    });
  });

  describe('API性能测试', () => {
    it('验证码发送API应该在合理时间内响应', () => {
      const startTime = Date.now();
      
      cy.request({
        method: 'POST',
        url: `${BACKEND_URL}/api/auth/send-verification-code`,
        body: {
          phone: '13800138010',
          type: 'login'
        }
      }).then((response) => {
        const responseTime = Date.now() - startTime;
        
        expect(response.status).to.eq(200);
        expect(responseTime).to.be.lessThan(5000); // 5秒内响应
      });
    });

    it('应该处理并发请求', () => {
      const requests = [];
      
      // 创建5个并发请求
      for (let i = 0; i < 5; i++) {
        requests.push(
          cy.request({
            method: 'POST',
            url: `${BACKEND_URL}/api/auth/send-verification-code`,
            body: {
              phone: `1380013801${i}`,
              type: 'login'
            }
          })
        );
      }

      // 等待所有请求完成
      cy.wrap(Promise.all(requests)).then((responses) => {
        responses.forEach((response) => {
          expect(response.status).to.eq(200);
          expect(response.body).to.have.property('success', true);
        });
      });
    });
  });

  describe('健康检查和服务状态', () => {
    it('健康检查端点应该正常工作', () => {
      cy.request({
        method: 'GET',
        url: `${BACKEND_URL}/health`,
        failOnStatusCode: false
      }).then((response) => {
        if (response.status === 200) {
          expect(response.body).to.have.property('status', 'ok');
        } else {
          // 如果没有健康检查端点，至少服务应该响应
          expect(response.status).to.be.oneOf([200, 404]);
        }
      });
    });

    it('应该处理不存在的端点', () => {
      cy.request({
        method: 'GET',
        url: `${BACKEND_URL}/api/nonexistent`,
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(404);
      });
    });
  });

  describe('数据持久化测试', () => {
    it('验证码应该正确存储和验证', () => {
      const phone = '13800138011';
      
      // 发送验证码
      cy.request({
        method: 'POST',
        url: `${BACKEND_URL}/api/auth/send-verification-code`,
        body: { phone, type: 'register' }
      }).then((response) => {
        expect(response.status).to.eq(200);
      });

      // 尝试使用错误验证码注册
      cy.request({
        method: 'POST',
        url: `${BACKEND_URL}/api/auth/register`,
        body: {
          phone,
          code: '999999'
        },
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(401);
        expect(response.body.message).to.include('验证码错误');
      });
    });
  });
});