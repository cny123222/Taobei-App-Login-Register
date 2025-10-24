const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
  constructor(dbPath = null) {
    // 使用测试数据库或生产数据库
    const dbFile = dbPath || (process.env.NODE_ENV === 'test' ? ':memory:' : path.join(__dirname, '../app.db'));
    this.db = new sqlite3.Database(dbFile);
    this.init();
  }

  init() {
    // 创建用户表
    this.db.serialize(() => {
      this.db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          phone_number TEXT UNIQUE NOT NULL,
          country_code TEXT DEFAULT '+86',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 创建验证码表
      this.db.run(`
        CREATE TABLE IF NOT EXISTS verification_codes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          phone_number TEXT NOT NULL,
          country_code TEXT DEFAULT '+86',
          code TEXT NOT NULL,
          expires_at DATETIME NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
    });
  }

  // DB-FindUserByPhone: 根据手机号查找用户记录
  async findUserByPhone(phoneNumber, countryCode = '+86') {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM users WHERE phone_number = ? AND country_code = ?';
      this.db.get(sql, [phoneNumber, countryCode], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row || null);
        }
      });
    });
  }

  // DB-CreateUser: 在数据库中创建一个新的用户记录
  async createUser(phoneNumber, countryCode = '+86') {
    return new Promise((resolve, reject) => {
      const sql = 'INSERT INTO users (phone_number, country_code) VALUES (?, ?)';
      this.db.run(sql, [phoneNumber, countryCode], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({
            id: this.lastID,
            phoneNumber,
            countryCode,
            createdAt: new Date().toISOString()
          });
        }
      });
    });
  }

  // DB-SaveVerificationCode: 保存验证码到数据库
  async saveVerificationCode(phoneNumber, code, countryCode = '+86') {
    return new Promise((resolve, reject) => {
      // 先删除该手机号的旧验证码
      const deleteSql = 'DELETE FROM verification_codes WHERE phone_number = ? AND country_code = ?';
      this.db.run(deleteSql, [phoneNumber, countryCode], (err) => {
        if (err) {
          reject(err);
          return;
        }
        
        // 插入新验证码，有效期60秒
        const expiresAt = new Date(Date.now() + 60 * 1000).toISOString();
        const insertSql = 'INSERT INTO verification_codes (phone_number, country_code, code, expires_at) VALUES (?, ?, ?, ?)';
        this.db.run(insertSql, [phoneNumber, countryCode, code, expiresAt], function(err) {
          if (err) {
            reject(err);
          } else {
            resolve(true);
          }
        });
      });
    });
  }

  // DB-VerifyCode: 验证手机号对应的验证码是否正确且未过期
  async verifyCode(phoneNumber, code, countryCode = '+86') {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM verification_codes WHERE phone_number = ? AND country_code = ? AND code = ?';
      this.db.get(sql, [phoneNumber, countryCode, code], (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        
        if (!row) {
          resolve(false); // 验证码不存在
          return;
        }
        
        // 检查是否过期
        const now = new Date();
        const expiresAt = new Date(row.expires_at);
        
        if (now > expiresAt) {
          resolve(false); // 验证码已过期
          return;
        }
        
        // 验证成功，删除验证码
        const deleteSql = 'DELETE FROM verification_codes WHERE id = ?';
        this.db.run(deleteSql, [row.id], (deleteErr) => {
          if (deleteErr) {
            reject(deleteErr);
          } else {
            resolve(true);
          }
        });
      });
    });
  }

  // DB-CleanExpiredCodes: 清理数据库中已过期的验证码记录
  async cleanExpiredCodes() {
    return new Promise((resolve, reject) => {
      const now = new Date().toISOString();
      const sql = 'DELETE FROM verification_codes WHERE expires_at < ?';
      this.db.run(sql, [now], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes); // 返回删除的记录数
        }
      });
    });
  }

  close() {
    this.db.close();
  }
}

module.exports = Database;