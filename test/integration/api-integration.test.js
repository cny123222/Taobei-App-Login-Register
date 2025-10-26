import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals'
import request from 'supertest'
import { spawn } from 'child_process'
import { promisify } from 'util'

const sleep = promisify(setTimeout)

describe('前后端API集成测试', () => {
  let backendProcess
  let frontendProcess
  const BACKEND_PORT = 3000
  const FRONTEND_PORT = 5173
  const API_BASE_URL = `http://localhost:${BACKEND_PORT}`

  beforeAll(async () => {
    // 启动后端服务
    backendProcess = spawn('npm', ['start'], {
      cwd: './backend',
      stdio: 'pipe',
      detached: false
    })

    // 等待后端服务启动
    await sleep(3000)

    // 验证后端服务是否启动成功
    try {
      const response = await request(API_BASE_URL).get('/api/health')
      expect(response.status).toBe(200)
    } catch (error) {
      console.warn('后端服务启动失败，测试将在模拟环境下运行')
    }
  }, 30000)

  afterAll(async () => {
    // 清理进程
    if (backendProcess) {
      backendProcess.kill('SIGTERM')
    }
    if (frontendProcess) {
      frontendProcess.kill('SIGTERM')
    }
    await sleep(1000)
  })

  beforeEach(async () => {
    // 每个测试前等待一下确保服务稳定
    await sleep(100)
  })

  describe('API连通性测试', () => {
    describe('健康检查端点', () => {
      it('应该返回健康状态', async () => {
        const response = await request(API_BASE_URL)
          .get('/api/health')
          .expect(200)

        expect(response.body).toEqual({
          status: 'ok',
          timestamp: expect.any(String)
        })
      })

      it('应该在合理时间内响应', async () => {
        const startTime = Date.now()
        await request(API_BASE_URL)
          .get('/api/health')
          .expect(200)
        const endTime = Date.now()

        expect(endTime - startTime).toBeLessThan(1000) // 1秒内响应
      })
    })

    describe('CORS配置测试', () => {
      it('应该允许前端域名的跨域请求', async () => {
        const response = await request(API_BASE_URL)
          .get('/api/health')
          .set('Origin', `http://localhost:${FRONTEND_PORT}`)
          .expect(200)

        expect(response.headers['access-control-allow-origin']).toBeDefined()
      })

      it('应该支持OPTIONS预检请求', async () => {
        const response = await request(API_BASE_URL)
          .options('/api/auth/send-code')
          .set('Origin', `http://localhost:${FRONTEND_PORT}`)
          .set('Access-Control-Request-Method', 'POST')
          .set('Access-Control-Request-Headers', 'Content-Type')

        expect(response.status).toBe(200)
        expect(response.headers['access-control-allow-methods']).toContain('POST')
        expect(response.headers['access-control-allow-headers']).toContain('Content-Type')
      })
    })
  })

  describe('认证API集成测试', () => {
    describe('发送验证码接口', () => {
      it('应该接受有效的手机号请求', async () => {
        const response = await request(API_BASE_URL)
          .post('/api/auth/send-code')
          .send({ phone: '13812345678' })
          .expect(200)

        expect(response.body).toEqual({
          success: false,
          message: '功能未实现'
        })
      })

      it('应该拒绝无效的手机号', async () => {
        const response = await request(API_BASE_URL)
          .post('/api/auth/send-code')
          .send({ phone: 'invalid-phone' })
          .expect(400)

        expect(response.body).toHaveProperty('success', false)
        expect(response.body).toHaveProperty('message')
      })

      it('应该拒绝空的请求体', async () => {
        const response = await request(API_BASE_URL)
          .post('/api/auth/send-code')
          .send({})
          .expect(400)

        expect(response.body).toHaveProperty('success', false)
        expect(response.body).toHaveProperty('message')
      })

      it('应该正确处理Content-Type', async () => {
        const response = await request(API_BASE_URL)
          .post('/api/auth/send-code')
          .set('Content-Type', 'application/json')
          .send({ phone: '13812345678' })
          .expect(200)

        expect(response.headers['content-type']).toMatch(/application\/json/)
      })
    })

    describe('用户登录接口', () => {
      it('应该接受有效的登录请求', async () => {
        const response = await request(API_BASE_URL)
          .post('/api/auth/login')
          .send({
            phone: '13812345678',
            code: '123456'
          })
          .expect(200)

        expect(response.body).toEqual({
          success: false,
          message: '功能未实现'
        })
      })

      it('应该拒绝缺少参数的请求', async () => {
        const response = await request(API_BASE_URL)
          .post('/api/auth/login')
          .send({ phone: '13812345678' })
          .expect(400)

        expect(response.body).toHaveProperty('success', false)
        expect(response.body).toHaveProperty('message')
      })

      it('应该拒绝无效的验证码格式', async () => {
        const response = await request(API_BASE_URL)
          .post('/api/auth/login')
          .send({
            phone: '13812345678',
            code: 'invalid-code'
          })
          .expect(400)

        expect(response.body).toHaveProperty('success', false)
        expect(response.body).toHaveProperty('message')
      })

      it('应该处理并发登录请求', async () => {
        const requests = Array(5).fill().map(() =>
          request(API_BASE_URL)
            .post('/api/auth/login')
            .send({
              phone: '13812345678',
              code: '123456'
            })
        )

        const responses = await Promise.all(requests)
        responses.forEach(response => {
          expect(response.status).toBe(200)
          expect(response.body).toHaveProperty('success')
        })
      })
    })

    describe('用户注册接口', () => {
      it('应该接受有效的注册请求', async () => {
        const response = await request(API_BASE_URL)
          .post('/api/auth/register')
          .send({
            phone: '13812345678',
            code: '123456',
            password: 'password123'
          })
          .expect(200)

        expect(response.body).toEqual({
          success: false,
          message: '功能未实现'
        })
      })

      it('应该拒绝弱密码', async () => {
        const response = await request(API_BASE_URL)
          .post('/api/auth/register')
          .send({
            phone: '13812345678',
            code: '123456',
            password: '123'
          })
          .expect(400)

        expect(response.body).toHaveProperty('success', false)
        expect(response.body).toHaveProperty('message')
      })

      it('应该拒绝重复的手机号', async () => {
        const userData = {
          phone: '13812345678',
          code: '123456',
          password: 'password123'
        }

        // 第一次注册
        await request(API_BASE_URL)
          .post('/api/auth/register')
          .send(userData)

        // 第二次注册相同手机号
        const response = await request(API_BASE_URL)
          .post('/api/auth/register')
          .send(userData)
          .expect(400)

        expect(response.body).toHaveProperty('success', false)
        expect(response.body.message).toContain('已存在')
      })

      it('应该验证所有必需字段', async () => {
        const incompleteData = [
          { phone: '13812345678', code: '123456' }, // 缺少密码
          { phone: '13812345678', password: 'password123' }, // 缺少验证码
          { code: '123456', password: 'password123' } // 缺少手机号
        ]

        for (const data of incompleteData) {
          const response = await request(API_BASE_URL)
            .post('/api/auth/register')
            .send(data)
            .expect(400)

          expect(response.body).toHaveProperty('success', false)
          expect(response.body).toHaveProperty('message')
        }
      })
    })
  })

  describe('错误处理集成测试', () => {
    it('应该处理不存在的路由', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/nonexistent')
        .expect(404)

      expect(response.body).toHaveProperty('error')
    })

    it('应该处理无效的JSON格式', async () => {
      const response = await request(API_BASE_URL)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('invalid-json')
        .expect(400)

      expect(response.body).toHaveProperty('error')
    })

    it('应该处理超大请求体', async () => {
      const largeData = {
        phone: '13812345678',
        code: '123456',
        password: 'a'.repeat(10000) // 10KB密码
      }

      const response = await request(API_BASE_URL)
        .post('/api/auth/register')
        .send(largeData)
        .expect(400)

      expect(response.body).toHaveProperty('success', false)
    })

    it('应该处理请求超时', async () => {
      // 模拟慢请求
      const response = await request(API_BASE_URL)
        .post('/api/auth/send-code')
        .send({ phone: '13812345678' })
        .timeout(5000)

      expect(response.status).toBeLessThan(500)
    }, 10000)
  })

  describe('数据格式验证测试', () => {
    it('应该返回一致的JSON格式', async () => {
      const endpoints = [
        { method: 'post', path: '/api/auth/send-code', data: { phone: '13812345678' } },
        { method: 'post', path: '/api/auth/login', data: { phone: '13812345678', code: '123456' } },
        { method: 'post', path: '/api/auth/register', data: { phone: '13812345678', code: '123456', password: 'password123' } }
      ]

      for (const endpoint of endpoints) {
        const response = await request(API_BASE_URL)
          [endpoint.method](endpoint.path)
          .send(endpoint.data)

        expect(response.headers['content-type']).toMatch(/application\/json/)
        expect(response.body).toHaveProperty('success')
        expect(response.body).toHaveProperty('message')
      }
    })

    it('应该正确处理中文字符', async () => {
      const response = await request(API_BASE_URL)
        .post('/api/auth/register')
        .send({
          phone: '13812345678',
          code: '123456',
          password: '中文密码123'
        })

      expect(response.status).toBeLessThan(500)
      expect(response.body).toHaveProperty('success')
    })

    it('应该正确处理特殊字符', async () => {
      const response = await request(API_BASE_URL)
        .post('/api/auth/register')
        .send({
          phone: '13812345678',
          code: '123456',
          password: '!@#$%^&*()'
        })

      expect(response.status).toBeLessThan(500)
      expect(response.body).toHaveProperty('success')
    })
  })

  describe('性能测试', () => {
    it('应该在合理时间内处理请求', async () => {
      const startTime = Date.now()
      
      await request(API_BASE_URL)
        .post('/api/auth/send-code')
        .send({ phone: '13812345678' })
        
      const endTime = Date.now()
      expect(endTime - startTime).toBeLessThan(2000) // 2秒内响应
    })

    it('应该处理并发请求', async () => {
      const concurrentRequests = 10
      const requests = Array(concurrentRequests).fill().map((_, index) =>
        request(API_BASE_URL)
          .post('/api/auth/send-code')
          .send({ phone: `1381234567${index}` })
      )

      const responses = await Promise.all(requests)
      
      responses.forEach(response => {
        expect(response.status).toBeLessThan(500)
        expect(response.body).toHaveProperty('success')
      })
    })

    it('应该正确处理请求队列', async () => {
      const requests = []
      
      // 发送多个请求
      for (let i = 0; i < 5; i++) {
        requests.push(
          request(API_BASE_URL)
            .post('/api/auth/login')
            .send({
              phone: `1381234567${i}`,
              code: '123456'
            })
        )
      }

      const responses = await Promise.all(requests)
      
      // 验证所有请求都得到了响应
      expect(responses).toHaveLength(5)
      responses.forEach(response => {
        expect(response.status).toBeLessThan(500)
      })
    })
  })
})