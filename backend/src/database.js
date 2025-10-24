const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
  constructor() {
    // 单例模式：在测试环境中确保只有一个实例
    if (process.env.NODE_ENV === 'test' && Database.instance) {
      return Database.instance;
    }
    
    const dbPath = process.env.DB_PATH || path.join(__dirname, '../app.db');
    
    // 在测试环境下，确保数据库以读写模式打开
    if (process.env.NODE_ENV === 'test') {
      this.db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE);
      Database.instance = this;
    } else {
      this.db = new sqlite3.Database(dbPath);
    }
    
    // 在非测试环境下同步初始化
    if (process.env.NODE_ENV !== 'test') {
      this.init().catch(console.error);
    }
  }

  // 验证手机号格式
  isValidPhoneNumber(phoneNumber) {
    if (!phoneNumber || typeof phoneNumber !== 'string') {
      return false;
    }
    // 中国大陆手机号格式：11位数字，以1开头
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phoneNumber);
  }

  init() {
    return new Promise((resolve, reject) => {
      // 创建用户表
      this.db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          phone_number TEXT UNIQUE NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          reject(err);
          return;
        }
        
        // 创建验证码表
        this.db.run(`
          CREATE TABLE IF NOT EXISTS verification_codes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            phone_number TEXT NOT NULL,
            code TEXT NOT NULL,
            expires_at DATETIME NOT NULL,
            used BOOLEAN DEFAULT FALSE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    });
  }

  // DB-FindUserByPhone
  findUserByPhone(phoneNumber) {
    return new Promise((resolve, reject) => {
      if (!phoneNumber) {
        return reject(new Error('手机号不能为空'));
      }

      if (!this.isValidPhoneNumber(phoneNumber)) {
        return reject(new Error('无效的手机号格式'));
      }

      const sql = 'SELECT * FROM users WHERE phone_number = ?';
      this.db.get(sql, [phoneNumber], (err, row) => {
        if (err) {
          reject(err);
        } else {
          if (row) {
            // 转换数据库字段名为驼峰命名
            resolve({
              id: row.id,
              phoneNumber: row.phone_number,
              createdAt: row.created_at
            });
          } else {
            resolve(null);
          }
        }
      });
    });
  }

  // DB-CreateUser
  createUser(phoneNumber) {
    return new Promise((resolve, reject) => {
      if (!phoneNumber) {
        return reject(new Error('手机号不能为空'));
      }

      if (!this.isValidPhoneNumber(phoneNumber)) {
        return reject(new Error('无效的手机号格式'));
      }

      const sql = 'INSERT INTO users (phone_number) VALUES (?)';
      this.db.run(sql, [phoneNumber], function(err) {
        if (err) {
          if (err.code === 'SQLITE_CONSTRAINT_UNIQUE' || err.message.includes('UNIQUE constraint failed')) {
            reject(new Error('用户已存在'));
          } else {
            reject(err);
          }
        } else {
          resolve({ 
            id: this.lastID, 
            phoneNumber: phoneNumber,
            createdAt: new Date().toISOString()
          });
        }
      });
    });
  }

  // DB-SaveVerificationCode
  saveVerificationCode(phoneNumber, code, customExpiresAt = null) {
    return new Promise((resolve, reject) => {
      if (!phoneNumber) {
        return reject(new Error('手机号不能为空'));
      }

      if (!code) {
        return reject(new Error('验证码不能为空'));
      }

      if (!this.isValidPhoneNumber(phoneNumber)) {
        return reject(new Error('无效的手机号格式'));
      }

      // 验证码必须是6位数字
      if (!/^\d{6}$/.test(code)) {
        return reject(new Error('验证码必须是6位数字'));
      }

      const expiresAt = customExpiresAt ? customExpiresAt.toISOString() : new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5分钟后过期
      
      // 先删除该手机号的旧验证码
      const deleteSql = 'DELETE FROM verification_codes WHERE phone_number = ?';
      this.db.run(deleteSql, [phoneNumber], (err) => {
        if (err) {
          reject(err);
          return;
        }

        // 插入新验证码
        const insertSql = 'INSERT INTO verification_codes (phone_number, code, expires_at) VALUES (?, ?, ?)';
        this.db.run(insertSql, [phoneNumber, code, expiresAt], function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({
              id: this.lastID,
              phoneNumber: phoneNumber,
              code: code,
              expiresAt: expiresAt
            });
          }
        });
      });
    });
  }

  // DB-VerifyCode
  verifyCode(phoneNumber, code) {
    return new Promise((resolve, reject) => {
      if (!phoneNumber) {
        return reject(new Error('手机号不能为空'));
      }

      if (!code) {
        return reject(new Error('验证码不能为空'));
      }

      if (!this.isValidPhoneNumber(phoneNumber)) {
        return reject(new Error('无效的手机号格式'));
      }

      const currentTime = new Date().toISOString();
      const sql = `
        SELECT * FROM verification_codes 
        WHERE phone_number = ? AND code = ? AND used = FALSE AND expires_at > ?
      `;
      
      this.db.get(sql, [phoneNumber, code, currentTime], (err, row) => {
        if (err) {
          reject(err);
          return;
        }

        if (!row) {
          resolve(false); // 验证码不存在、错误或已过期
          return;
        }

        // 标记验证码为已使用
        const updateSql = 'UPDATE verification_codes SET used = TRUE WHERE id = ?';
        this.db.run(updateSql, [row.id], (updateErr) => {
          if (updateErr) {
            reject(updateErr);
          } else {
            resolve(true); // 验证成功
          }
        });
      });
    });
  }

  // 测试辅助方法
  async clearTestData() {
    if (process.env.NODE_ENV === 'test') {
      return new Promise((resolve, reject) => {
        this.db.serialize(() => {
          this.db.run('DELETE FROM users', (err) => {
            if (err) reject(err);
          });
          this.db.run('DELETE FROM verification_codes', (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      });
    }
  }

  async close() {
    return new Promise((resolve) => {
      this.db.close((err) => {
        if (err) console.error(err);
        resolve();
      });
    });
  }
}

module.exports = Database;