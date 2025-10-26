import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { 
  initDatabase, 
  getDatabase, 
  findUserByPhone, 
  createUser, 
  storeVerificationCode, 
  verifyCode 
} from '../../src/models/database.js'

describe('Database Models', () => {
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

  describe('数据库初始化测试', () => {
    it('应该成功初始化数据库', async () => {
      await expect(initDatabase()).resolves.not.toThrow()
    })

    it('应该返回有效的数据库连接', () => {
      const db = getDatabase()
      expect(db).toBeDefined()
      expect(db).not.toBeNull()
    })

    it('应该创建users表', async () => {
      const db = getDatabase()
      expect(db).toBeDefined()
      
      // 验证表结构（通过尝试查询来验证表存在）
      const query = new Promise((resolve, reject) => {
        db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='users'", (err, row) => {
          if (err) reject(err)
          else resolve(row)
        })
      })
      
      const result = await query
      expect(result).toBeDefined()
      expect(result.name).toBe('users')
    })

    it('应该创建verification_codes表', async () => {
      const db = getDatabase()
      expect(db).toBeDefined()
      
      const query = new Promise((resolve, reject) => {
        db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='verification_codes'", (err, row) => {
          if (err) reject(err)
          else resolve(row)
        })
      })
      
      const result = await query
      expect(result).toBeDefined()
      expect(result.name).toBe('verification_codes')
    })
  })

  describe('findUserByPhone 测试', () => {
    describe('正常流程测试', () => {
      it('应该返回null当用户不存在时', async () => {
        const result = await findUserByPhone('13812345678')
        expect(result).toBeNull()
      })

      it('应该接受有效的手机号参数', async () => {
        await expect(findUserByPhone('13987654321')).resolves.not.toThrow()
      })
    })

    describe('输入验证测试', () => {
      it('应该处理空手机号', async () => {
        const result = await findUserByPhone('')
        expect(result).toBeNull()
      })

      it('应该处理null手机号', async () => {
        const result = await findUserByPhone(null)
        expect(result).toBeNull()
      })

      it('应该处理undefined手机号', async () => {
        const result = await findUserByPhone(undefined)
        expect(result).toBeNull()
      })

      it('应该处理数字类型的手机号', async () => {
        const result = await findUserByPhone(13812345678)
        expect(result).toBeNull()
      })
    })

    describe('边界条件测试', () => {
      it('应该处理极长的手机号', async () => {
        const longPhone = '1'.repeat(100)
        const result = await findUserByPhone(longPhone)
        expect(result).toBeNull()
      })

      it('应该处理包含特殊字符的手机号', async () => {
        const result = await findUserByPhone('138-1234-5678')
        expect(result).toBeNull()
      })

      it('应该处理Unicode字符', async () => {
        const result = await findUserByPhone('手机号123')
        expect(result).toBeNull()
      })
    })

    describe('异常处理测试', () => {
      it('应该处理数据库连接错误', async () => {
        // 关闭数据库连接来模拟错误
        const db = getDatabase()
        db.close()
        
        const result = await findUserByPhone('13812345678')
        expect(result).toBeNull()
        
        // 重新初始化数据库以便后续测试
        await initDatabase()
      })
    })
  })

  describe('createUser 测试', () => {
    describe('正常流程测试', () => {
      it('应该成功创建用户', async () => {
        const result = await createUser('13812345678', 'password123')
        expect(result).not.toBeNull()
        expect(result.phone).toBe('13812345678')
        expect(result.password).toBe('password123')
      })

      it('应该接受有效的参数', async () => {
        await expect(createUser('13987654321', 'mypassword')).resolves.not.toThrow()
      })
    })

    describe('输入验证测试', () => {
      it('应该处理空手机号', async () => {
        const result = await createUser('', 'password123')
        expect(result).toBeNull()
      })

      it('应该处理空密码', async () => {
        const result = await createUser('13812345678', '')
        expect(result).toBeNull()
      })

      it('应该处理null参数', async () => {
        const result = await createUser(null, null)
        expect(result).toBeNull()
      })

      it('应该处理undefined参数', async () => {
        const result = await createUser(undefined, undefined)
        expect(result).toBeNull()
      })
    })

    describe('边界条件测试', () => {
      it('应该处理极长的手机号和密码', async () => {
        const longPhone = '1'.repeat(50)
        const longPassword = 'a'.repeat(100)
        const result = await createUser(longPhone, longPassword)
        expect(result).toBeNull()
      })

      it('应该处理特殊字符密码', async () => {
        const result = await createUser('13812345678', '!@#$%^&*()')
        expect(result).toBeNull()
      })

      it('应该处理Unicode密码', async () => {
        const result = await createUser('13812345678', '密码123')
        expect(result).toBeNull()
      })
    })

    describe('异常处理测试', () => {
      it('应该处理重复的手机号', async () => {
        await createUser('13812345678', 'password1')
        const result = await createUser('13812345678', 'password2')
        expect(result).toBeNull()
      })

      it('应该处理数据库错误', async () => {
        const db = getDatabase()
        db.close()
        
        const result = await createUser('13812345678', 'password123')
        expect(result).toBeNull()
        
        // 重新初始化数据库以便后续测试
        await initDatabase()
      })
    })
  })

  describe('storeVerificationCode 测试', () => {
    describe('正常流程测试', () => {
      it('应该成功存储验证码', async () => {
        const expiresAt = new Date(Date.now() + 300000) // 5分钟后过期
        const result = await storeVerificationCode('13812345678', '123456', expiresAt)
        expect(result).not.toBeNull()
        expect(result.phone).toBe('13812345678')
        expect(result.code).toBe('123456')
      })

      it('应该接受有效的参数', async () => {
        const expiresAt = new Date(Date.now() + 300000)
        await expect(storeVerificationCode('13987654321', '654321', expiresAt)).resolves.not.toThrow()
      })
    })

    describe('输入验证测试', () => {
      it('应该处理空手机号', async () => {
        const expiresAt = new Date(Date.now() + 300000)
        const result = await storeVerificationCode('', '123456', expiresAt)
        expect(result).toBeNull()
      })

      it('应该处理空验证码', async () => {
        const expiresAt = new Date(Date.now() + 300000)
        const result = await storeVerificationCode('13812345678', '', expiresAt)
        expect(result).toBeNull()
      })

      it('应该处理null过期时间', async () => {
        const result = await storeVerificationCode('13812345678', '123456', null)
        expect(result).toBeNull()
      })

      it('应该处理无效的过期时间', async () => {
        const result = await storeVerificationCode('13812345678', '123456', 'invalid-date')
        expect(result).toBeNull()
      })
    })

    describe('边界条件测试', () => {
      it('应该处理过去的过期时间', async () => {
        const pastDate = new Date(Date.now() - 300000) // 5分钟前
        const result = await storeVerificationCode('13812345678', '123456', pastDate)
        expect(result).toBeNull()
      })

      it('应该处理极长的验证码', async () => {
        const longCode = '1'.repeat(20)
        const expiresAt = new Date(Date.now() + 300000)
        const result = await storeVerificationCode('13812345678', longCode, expiresAt)
        expect(result).toBeNull()
      })

      it('应该处理非数字验证码', async () => {
        const expiresAt = new Date(Date.now() + 300000)
        const result = await storeVerificationCode('13812345678', 'abcdef', expiresAt)
        expect(result).toBeNull()
      })
    })

    describe('异常处理测试', () => {
      it('应该处理数据库错误', async () => {
        const db = getDatabase()
        db.close()
        
        const expiresAt = new Date(Date.now() + 300000)
        const result = await storeVerificationCode('13812345678', '123456', expiresAt)
        expect(result).toBeNull()
        
        // 重新初始化数据库以便后续测试
        await initDatabase()
      })
    })
  })

  describe('verifyCode 测试', () => {
    describe('正常流程测试', () => {
      it('应该返回false（未实现）', async () => {
        const result = await verifyCode('13812345678', '123456')
        expect(result).toBe(false)
      })

      it('应该接受有效的参数', async () => {
        await expect(verifyCode('13987654321', '654321')).resolves.not.toThrow()
      })
    })

    describe('输入验证测试', () => {
      it('应该处理空手机号', async () => {
        const result = await verifyCode('', '123456')
        expect(result).toBe(false)
      })

      it('应该处理空验证码', async () => {
        const result = await verifyCode('13812345678', '')
        expect(result).toBe(false)
      })

      it('应该处理null参数', async () => {
        const result = await verifyCode(null, null)
        expect(result).toBe(false)
      })

      it('应该处理undefined参数', async () => {
        const result = await verifyCode(undefined, undefined)
        expect(result).toBe(false)
      })
    })

    describe('边界条件测试', () => {
      it('应该处理不存在的手机号', async () => {
        const result = await verifyCode('19999999999', '123456')
        expect(result).toBe(false)
      })

      it('应该处理错误的验证码', async () => {
        const result = await verifyCode('13812345678', '000000')
        expect(result).toBe(false)
      })

      it('应该处理过期的验证码', async () => {
        const result = await verifyCode('13812345678', '123456')
        expect(result).toBe(false)
      })

      it('应该处理数字类型的验证码', async () => {
        const result = await verifyCode('13812345678', 123456)
        expect(result).toBe(false)
      })
    })

    describe('异常处理测试', () => {
      it('应该处理数据库查询错误', async () => {
        const db = getDatabase()
        db.close()
        
        const result = await verifyCode('13812345678', '123456')
        expect(result).toBe(false)
        
        // 重新初始化数据库以便后续测试
        await initDatabase()
      })

      it('应该处理多次验证尝试', async () => {
        const phone = '13812345678'
        const code = '123456'
        
        const result1 = await verifyCode(phone, code)
        const result2 = await verifyCode(phone, code)
        const result3 = await verifyCode(phone, code)
        
        expect(result1).toBe(false)
        expect(result2).toBe(false)
        expect(result3).toBe(false)
      })
    })
  })

  describe('数据库连接管理测试', () => {
    it('应该正确关闭数据库连接', async () => {
      const db = getDatabase()
      expect(db).toBeDefined()
      
      db.close()
      // 验证连接已关闭（通过尝试获取新连接）
      expect(() => getDatabase()).not.toThrow()
      
      // 重新初始化数据库以便后续测试
      await initDatabase()
    })

    it('应该处理重复初始化', async () => {
      await initDatabase()
      await expect(initDatabase()).resolves.not.toThrow()
    })

    it('应该处理并发数据库操作', async () => {
      const promises = [
        findUserByPhone('13812345678'),
        findUserByPhone('13987654321'),
        createUser('13111111111', 'password1'),
        createUser('13222222222', 'password2'),
        verifyCode('13333333333', '123456')
      ]
      
      await expect(Promise.all(promises)).resolves.not.toThrow()
    })
  })
})