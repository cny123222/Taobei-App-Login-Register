const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
  constructor(dbPath = null) {
    const isTest = process.env.NODE_ENV === 'test';
    this.dbPath = dbPath || (isTest ? ':memory:' : path.join(__dirname, '../database.db'));
    this.db = null;
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async initialize() {
    await this.connect();
    await this.createTables();
  }

  async createTables() {
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phone_number TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const createVerificationCodesTable = `
      CREATE TABLE IF NOT EXISTS verification_codes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phone_number TEXT NOT NULL,
        code TEXT NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run(createUsersTable);
        this.db.run(createVerificationCodesTable, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    });
  }

  async findUserByPhone(phoneNumber) {
    if (!this.db) {
      throw new Error('Database is not connected');
    }
    
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM users WHERE phone_number = ?';
      this.db.get(query, [phoneNumber], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row || null);
        }
      });
    });
  }

  async createUser(phoneNumber) {
    if (!this.db) {
      throw new Error('Database is not connected');
    }

    // 验证手机号格式
    if (!phoneNumber || !/^1[3-9]\d{9}$/.test(phoneNumber)) {
      throw new Error('Invalid phone number format');
    }
    
    return new Promise((resolve, reject) => {
      const now = new Date().toISOString();
      const query = 'INSERT INTO users (phone_number, created_at) VALUES (?, ?)';
      const db = this.db;
      db.run(query, [phoneNumber, now], function(err) {
        if (err) {
          reject(err);
        } else {
          const userId = this.lastID;
          // 返回完整的用户对象
          const user = {
            id: userId,
            phone_number: phoneNumber,
            created_at: now
          };
          resolve(user);
        }
      });
    });
  }

  async generateVerificationCode(phoneNumber) {
    // 检查数据库连接状态
    if (!this.db) {
      throw new Error('Database is not connected');
    }

    // 验证手机号格式
    if (!phoneNumber || !/^1[3-9]\d{9}$/.test(phoneNumber)) {
      throw new Error('Invalid phone number format');
    }

    // 生成6位随机验证码
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // 设置过期时间为5分钟后
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    
    return new Promise((resolve, reject) => {
      // 先删除该手机号的旧验证码
      const deleteQuery = 'DELETE FROM verification_codes WHERE phone_number = ?';
      this.db.run(deleteQuery, [phoneNumber], (err) => {
        if (err) {
          reject(err);
          return;
        }
        
        // 插入新验证码
        const insertQuery = 'INSERT INTO verification_codes (phone_number, code, expires_at) VALUES (?, ?, ?)';
        this.db.run(insertQuery, [phoneNumber, code, expiresAt], function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({
              id: this.lastID,
              phone_number: phoneNumber,
              code: code,
              expires_at: expiresAt,
              created_at: new Date().toISOString()
            });
          }
        });
      });
    });
  }

  async verifyCode(phoneNumber, code) {
    if (!this.db) {
      throw new Error('Database is not connected');
    }
    
    return new Promise((resolve, reject) => {
      const query = `
        SELECT * FROM verification_codes 
        WHERE phone_number = ? AND code = ? AND expires_at > datetime('now')
        ORDER BY created_at DESC 
        LIMIT 1
      `;
      
      this.db.get(query, [phoneNumber, code], (err, row) => {
        if (err) {
          reject(err);
        } else if (!row) {
          resolve(false); // 验证码无效或已过期
        } else {
          // 验证成功后删除验证码
          const deleteQuery = 'DELETE FROM verification_codes WHERE id = ?';
          this.db.run(deleteQuery, [row.id], (deleteErr) => {
            if (deleteErr) {
              reject(deleteErr);
            } else {
              resolve(true);
            }
          });
        }
      });
    });
  }

  async close() {
    if (this.db) {
      return new Promise((resolve) => {
        this.db.close(resolve);
      });
    }
  }
}

module.exports = Database;