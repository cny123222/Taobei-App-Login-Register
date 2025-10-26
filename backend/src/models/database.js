import sqlite3 from 'sqlite3'
import { promisify } from 'util'

let db = null

export async function initDatabase() {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(':memory:', (err) => {
      if (err) {
        reject(err)
        return
      }
      
      // Create tables
      db.serialize(() => {
        db.run(`CREATE TABLE users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          phone TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
          if (err) {
            reject(err)
            return
          }
        })
        
        db.run(`CREATE TABLE verification_codes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          phone TEXT NOT NULL,
          code TEXT NOT NULL,
          expires_at DATETIME NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
          if (err) {
            reject(err)
            return
          }
          resolve()
        })
      })
    })
  })
}

export function getDatabase() {
  return db
}

// Database operations
export async function findUserByPhone(phone) {
  if (!phone || typeof phone !== 'string') {
    return null
  }
  
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT * FROM users WHERE phone = ?',
      [phone],
      (err, row) => {
        if (err) {
          resolve(null)
        } else {
          resolve(row || null)
        }
      }
    )
  })
}

export async function createUser(phone, password = null) {
  if (!phone || typeof phone !== 'string') {
    return null
  }
  
  // 验证手机号长度
  if (phone.length >= 50) {
    return null
  }
  
  // 验证密码（如果提供且不为空字符串）
  if (password !== null && password !== '') {
    if (typeof password !== 'string' || password.length >= 100) {
      return null
    }
    // 拒绝特殊字符和Unicode字符密码
    if (/[^\w\s]/.test(password) || /[^\x00-\x7F]/.test(password)) {
      return null
    }
  }
  
  // 空密码应该返回null
  if (password === '') {
    return null
  }
  
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO users (phone, password) VALUES (?, ?)',
      [phone, password || ''],
      function(err) {
        if (err) {
          resolve(null)
        } else {
          resolve({
            id: this.lastID,
            phone: phone,
            password: password || '',
            created_at: new Date().toISOString()
          })
        }
      }
    )
  })
}

export async function storeVerificationCode(phone, code, expiresAt) {
  if (!phone || !code) {
    return null
  }
  
  // 验证验证码格式：必须是6位数字
  if (!/^\d{6}$/.test(code)) {
    return null
  }
  
  // 验证过期时间
  if (expiresAt === null || (expiresAt && (!(expiresAt instanceof Date) || isNaN(expiresAt.getTime())))) {
    return null
  }
  
  const expirationTime = expiresAt || new Date(Date.now() + 60000) // 60 seconds from now
  
  // 检查过期时间是否在过去
  if (expirationTime <= new Date()) {
    return null
  }
  
  return new Promise((resolve, reject) => {
    // First, delete any existing codes for this phone
    db.run(
      'DELETE FROM verification_codes WHERE phone = ?',
      [phone],
      (err) => {
        if (err) {
          resolve(null)
          return
        }
        
        // Then insert the new code
        db.run(
          'INSERT INTO verification_codes (phone, code, expires_at) VALUES (?, ?, ?)',
          [phone, code, expirationTime.toISOString()],
          function(err) {
            if (err) {
              resolve(null)
            } else {
              resolve({
                id: this.lastID,
                phone: phone,
                code: code,
                expires_at: expirationTime.toISOString(),
                created_at: new Date().toISOString()
              })
            }
          }
        )
      }
    )
  })
}

export async function verifyCode(phone, code) {
  if (!phone || !code) {
    return false
  }
  
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT * FROM verification_codes WHERE phone = ? AND code = ? AND expires_at > datetime("now")',
      [phone, code],
      (err, row) => {
        if (err) {
          resolve(false)
        } else {
          if (row) {
            // Delete the used code
            db.run(
              'DELETE FROM verification_codes WHERE id = ?',
              [row.id],
              (deleteErr) => {
                if (deleteErr) {
                  console.error('Error deleting used verification code:', deleteErr)
                }
                resolve(true)
              }
            )
          } else {
            resolve(false)
          }
        }
      }
    )
  })
}