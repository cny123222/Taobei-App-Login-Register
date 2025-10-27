const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
  constructor() {
    // 在测试环境使用内存数据库
    if (process.env.NODE_ENV === 'test') {
      this.db = new sqlite3.Database(':memory:');
    } else {
      const dbPath = process.env.DB_PATH || path.join(__dirname, '../../app.db');
      console.log('数据库路径:', dbPath);
      
      // 确保数据库目录存在
      const dbDir = path.dirname(dbPath);
      const fs = require('fs');
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }
      
      this.db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          console.error('数据库连接失败:', err);
        } else {
          console.log('数据库连接成功');
        }
      });
    }
    this.initPromise = this.init();
  }

  async init() {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run(`
          CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            phone TEXT UNIQUE NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `, (err) => {
          if (err) {
            console.error('创建用户表失败:', err);
            reject(err);
            return;
          }
        });

        this.db.run(`
          CREATE TABLE IF NOT EXISTS verification_codes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            phone TEXT NOT NULL,
            code TEXT NOT NULL,
            type TEXT NOT NULL,
            expires_at DATETIME NOT NULL,
            used BOOLEAN DEFAULT FALSE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `, (err) => {
          if (err) {
            console.error('创建验证码表失败:', err);
            reject(err);
            return;
          }
          resolve();
        });
      });
    });
  }

  async waitForInit() {
    return this.initPromise;
  }

  // TODO: 查找用户
  async findUserByPhone(phone) {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM users WHERE phone = ?', [phone], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  // TODO: 创建用户
  async createUser(phone) {
    if (!phone || phone.trim() === '') {
      throw new Error('手机号不能为空');
    }
    return new Promise((resolve, reject) => {
      this.db.run('INSERT INTO users (phone) VALUES (?)', [phone], (err) => {
        if (err) {
          reject(err);
        } else {
          // 获取刚创建的用户完整信息
          this.db.get('SELECT * FROM users WHERE phone = ?', [phone], (err, row) => {
            if (err) reject(err);
            else resolve(row);
          });
        }
      });
    });
  }

  // TODO: 创建验证码
  async createVerificationCode(phone, code, type, expiresAt) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO verification_codes (phone, code, type, expires_at) VALUES (?, ?, ?, ?)',
        [phone, code, type, expiresAt],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID });
        }
      );
    });
  }

  // TODO: 验证验证码
  async verifyCode(phone, code, type) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM verification_codes WHERE phone = ? AND code = ? AND type = ? AND datetime(expires_at) > datetime("now") AND used = 0',
        [phone, code, type],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }

  // TODO: 标记验证码为已使用
  async markCodeAsUsed(id) {
    return new Promise((resolve, reject) => {
      this.db.run('UPDATE verification_codes SET used = 1 WHERE id = ?', [id], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  // TODO: 清理过期验证码
  async cleanupExpiredCodes() {
    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM verification_codes WHERE datetime(expires_at) < datetime("now")', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  // 添加run方法供测试使用
  async run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  }

  // 添加get方法供测试使用
  async get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  // 添加all方法供测试使用
  async all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // 获取验证码记录（仅用于测试）
  async getVerificationCodes(phone) {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('getVerificationCodes只能在测试环境中使用');
    }
    
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM verification_codes WHERE phone = ? ORDER BY created_at ASC',
        [phone],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });
  }

  // 更新验证码过期时间（仅用于测试）
  async updateVerificationCodeExpiry(id, expiresAt) {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('updateVerificationCodeExpiry只能在测试环境中使用');
    }
    
    return new Promise((resolve, reject) => {
      this.db.run(
        'UPDATE verification_codes SET expires_at = ? WHERE id = ?',
        [expiresAt.toISOString(), id],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  // 清理所有表数据（仅用于测试）
  async clearAllTables() {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('clearAllTables只能在测试环境中使用');
    }
    
    if (!this.db || this.db.closed) {
      return; // 数据库已关闭，无需清理
    }
    
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run('DELETE FROM verification_codes', (err) => {
          if (err) {
            reject(err);
            return;
          }
        });
        
        this.db.run('DELETE FROM users', (err) => {
          if (err) {
            reject(err);
            return;
          }
          resolve();
        });
      });
    });
  }

  close() {
    if (this.db && !this.db.closed) {
      this.db.close();
      this.db = null;
    }
  }
}

module.exports = Database;