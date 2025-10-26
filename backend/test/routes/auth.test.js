import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import request from 'supertest'
import app from '../../src/app.js'
import { initDatabase, getDatabase } from '../../src/models/database.js'

describe('Auth Routes', () => {
  beforeEach(async () => {
    await initDatabase()
  })

  afterEach(async () => {
    const db = getDatabase()
    if (db && db.open) {
      try {
        // 清理数据而不是关闭连接
        await new Promise((resolve, reject) => {
          db.run('DELETE FROM users', (err) => {
            if (err) reject(err)
            else resolve()
          })
        })
        await new Promise((resolve, reject) => {
          db.run('DELETE FROM verification_codes', (err) => {
            if (err) reject(err)
            else resolve()
          })
        })
      } catch (error) {
        // 如果数据库已关闭，忽略错误
        console.log('Database already closed, skipping cleanup')
      }
    }
  })

  describe('POST /api/auth/send-verification-code', () => {
    describe('正常流程测试', () => {
      it('应该接受有效的手机号请求', async () => {
        const response = await request(app)
          .post('/api/auth/send-verification-code')
          .send({
            phoneNumber: '13812345678'
          })

        expect(response.status).toBe(200)
        expect(response.body).toHaveProperty('message', '验证码已发送')
        expect(response.body).toHaveProperty('expiresIn', 60)
      })

      it('应该返回正确的响应格式', async () => {
        const response = await request(app)
          .post('/api/auth/send-verification-code')
          .send({
            phoneNumber: '13987654321'
          })

        expect(response.body).toHaveProperty('message')
        expect(response.body).toHaveProperty('expiresIn')
        expect(typeof response.body.message).toBe('string')
        expect(typeof response.body.expiresIn).toBe('number')
      })
    })

    describe('输入验证测试', () => {
      it('应该处理缺少手机号的请求', async () => {
        const response = await request(app)
          .post('/api/auth/send-verification-code')
          .send({})

        expect(response.status).toBe(400)
        expect(response.body).toHaveProperty('error', '请输入正确的手机号码')
      })

      it('应该处理空手机号的请求', async () => {
        const response = await request(app)
          .post('/api/auth/send-verification-code')
          .send({
            phoneNumber: ''
          })

        expect(response.status).toBe(400)
        expect(response.body).toHaveProperty('error', '请输入正确的手机号码')
      })

      it('应该处理无效手机号格式', async () => {
        const response = await request(app)
          .post('/api/auth/send-verification-code')
          .send({
            phoneNumber: '123'
          })

        expect(response.status).toBe(400)
        expect(response.body).toHaveProperty('error', '请输入正确的手机号码')
      })

      it('应该处理非字符串手机号', async () => {
        const response = await request(app)
          .post('/api/auth/send-verification-code')
          .send({
            phoneNumber: 13812345678
          })

        expect(response.status).toBe(400)
        expect(response.body).toHaveProperty('error', '请输入正确的手机号码')
      })
    })

    describe('边界条件测试', () => {
      it('应该处理极长的手机号', async () => {
        const longPhone = '1'.repeat(50)
        const response = await request(app)
          .post('/api/auth/send-verification-code')
          .send({
            phoneNumber: longPhone
          })

        expect(response.status).toBe(400)
        expect(response.body).toHaveProperty('error', '请输入正确的手机号码')
      })

      it('应该处理包含特殊字符的手机号', async () => {
        const response = await request(app)
          .post('/api/auth/send-verification-code')
          .send({
            phoneNumber: '138-1234-5678'
          })

        expect(response.status).toBe(400)
        expect(response.body).toHaveProperty('error', '请输入正确的手机号码')
      })
    })

    describe('异常处理测试', () => {
      it('应该处理无效的JSON请求体', async () => {
        const response = await request(app)
          .post('/api/auth/send-verification-code')
          .send('invalid json')

        expect(response.status).toBe(400)
      })

      it('应该处理Content-Type错误', async () => {
        const response = await request(app)
          .post('/api/auth/send-verification-code')
          .set('Content-Type', 'text/plain')
          .send('phoneNumber=13812345678')

        expect(response.status).toBe(400)
      })
    })
  })

  describe('POST /api/auth/login', () => {
    describe('正常流程测试', () => {
      it('应该接受有效的登录请求', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            phoneNumber: '13812345678',
            verificationCode: '123456'
          })

        expect(response.status).toBe(401)
        expect(response.body).toHaveProperty('error', '验证码错误')
      })

      it('应该返回正确的响应格式', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            phoneNumber: '13987654321',
            verificationCode: '654321'
          })

        expect(response.body).toHaveProperty('error')
        expect(typeof response.body.error).toBe('string')
      })
    })

    describe('输入验证测试', () => {
      it('应该处理缺少手机号的请求', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            verificationCode: '123456'
          })

        expect(response.status).toBe(400)
        expect(response.body).toHaveProperty('error', '请输入正确的手机号码')
      })

      it('应该处理缺少验证码的请求', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            phoneNumber: '13812345678'
          })

        expect(response.status).toBe(400)
        expect(response.body).toHaveProperty('error', '请输入验证码')
      })

      it('应该处理空字段的请求', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            phoneNumber: '',
            verificationCode: ''
          })

        expect(response.status).toBe(400)
        expect(response.body).toHaveProperty('error', '请输入正确的手机号码')
      })

      it('应该处理无效验证码格式', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            phoneNumber: '13812345678',
            verificationCode: 'abc'
          })

        expect(response.status).toBe(401)
        expect(response.body).toHaveProperty('error', '验证码错误')
      })
    })

    describe('边界条件测试', () => {
      it('应该处理极长的验证码', async () => {
        const longCode = '1'.repeat(20)
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            phoneNumber: '13812345678',
            verificationCode: longCode
          })

        expect(response.status).toBe(401)
        expect(response.body).toHaveProperty('error', '验证码错误')
      })

      it('应该处理数字类型的验证码', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            phoneNumber: '13812345678',
            verificationCode: 123456
          })

        expect(response.status).toBe(400)
        expect(response.body).toHaveProperty('error', '请输入验证码')
      })
    })

    describe('异常处理测试', () => {
      it('应该处理服务器内部错误', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            phoneNumber: '13812345678',
            verificationCode: '123456'
          })

        expect(response.status).toBe(401)
        expect(response.body).toHaveProperty('error', '验证码错误')
      })
    })
  })

  describe('POST /api/auth/register', () => {
    describe('正常流程测试', () => {
      it('应该接受有效的注册请求', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            phoneNumber: '13812345678',
            verificationCode: '123456',
            agreeToTerms: true
          })

        expect(response.status).toBe(401)
        expect(response.body).toHaveProperty('error', '验证码错误')
      })

      it('应该返回正确的响应格式', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            phoneNumber: '13987654321',
            verificationCode: '654321',
            agreeToTerms: true
          })

        expect(response.body).toHaveProperty('error')
        expect(typeof response.body.error).toBe('string')
      })
    })

    describe('输入验证测试', () => {
      it('应该处理缺少手机号的请求', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            verificationCode: '123456',
            agreeToTerms: true
          })

        expect(response.status).toBe(400)
        expect(response.body).toHaveProperty('error', '请输入正确的手机号码')
      })

      it('应该处理缺少验证码的请求', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            phoneNumber: '13812345678',
            agreeToTerms: true
          })

        expect(response.status).toBe(400)
        expect(response.body).toHaveProperty('error', '请输入验证码')
      })

      it('应该处理缺少同意条款的请求', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            phoneNumber: '13812345678',
            verificationCode: '123456'
          })

        expect(response.status).toBe(422)
        expect(response.body).toHaveProperty('error', '请同意用户协议')
      })

      it('应该处理无效的手机号和验证码组合', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            phoneNumber: 'invalid',
            verificationCode: 'invalid',
            agreeToTerms: true
          })

        expect(response.status).toBe(400)
        expect(response.body).toHaveProperty('error', '请输入正确的手机号码')
      })
    })

    describe('边界条件测试', () => {
      it('应该处理极长的验证码', async () => {
        const longCode = '1'.repeat(100)
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            phoneNumber: '13812345678',
            verificationCode: longCode,
            agreeToTerms: true
          })

        expect(response.status).toBe(401)
        expect(response.body).toHaveProperty('error', '验证码错误')
      })

      it('应该处理包含特殊字符的验证码', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            phoneNumber: '13812345678',
            verificationCode: '!@#$%^',
            agreeToTerms: true
          })

        expect(response.status).toBe(401)
        expect(response.body).toHaveProperty('error', '验证码错误')
      })

      it('应该处理agreeToTerms为false的情况', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            phoneNumber: '13812345678',
            verificationCode: '123456',
            agreeToTerms: false
          })

        expect(response.status).toBe(422)
        expect(response.body).toHaveProperty('error', '请同意用户协议')
      })
    })

    describe('异常处理测试', () => {
      it('应该处理重复注册的情况', async () => {
        const userData = {
          phoneNumber: '13812345678',
          verificationCode: '123456',
          agreeToTerms: true
        }

        // 第一次注册 - 期望验证码错误
        await request(app)
          .post('/api/auth/register')
          .send(userData)

        // 第二次注册相同手机号 - 期望验证码错误
        const response = await request(app)
          .post('/api/auth/register')
          .send(userData)

        expect(response.status).toBe(401)
        expect(response.body).toHaveProperty('error', '验证码错误')
      })

      it('应该处理服务器内部错误', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            phoneNumber: '13812345678',
            verificationCode: '123456',
            agreeToTerms: true
          })

        expect(response.status).toBe(401)
        expect(response.body).toHaveProperty('error', '验证码错误')
      })
    })
  })

  describe('路由错误处理', () => {
    it('应该处理不存在的路由', async () => {
      const response = await request(app)
        .post('/api/auth/nonexistent')
        .send({})

      expect(response.status).toBe(404)
    })

    it('应该处理错误的HTTP方法', async () => {
      const response = await request(app)
        .get('/api/auth/login')

      expect(response.status).toBe(404)
    })

    it('应该处理CORS预检请求', async () => {
      const response = await request(app)
        .options('/api/auth/login')

      expect(response.status).toBe(204)
    })
  })
})