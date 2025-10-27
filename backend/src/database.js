const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const isTest = process.env.NODE_ENV === 'test';
const dbPath = isTest 
  ? path.join(__dirname, '../test/test.db')
  : path.join(__dirname, 'database.db');

class Database {
  constructor() {
    this.db = null;
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          console.error('Error opening database:', err);
          reject(err);
        } else {
          console.log(`Connected to SQLite database: ${dbPath}`);
          this.initTables().then(resolve).catch(reject);
        }
      });
    });
  }

  initTables() {
    return new Promise((resolve, reject) => {
      const createUsersTable = `
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          phone TEXT UNIQUE NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `;

      const createVerificationCodesTable = `
        CREATE TABLE IF NOT EXISTS verification_codes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          phone TEXT NOT NULL,
          code TEXT NOT NULL,
          expires_at DATETIME NOT NULL,
          used BOOLEAN DEFAULT FALSE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `;

      this.db.serialize(() => {
        this.db.run(createUsersTable, (err) => {
          if (err) reject(err);
        });
        
        this.db.run(createVerificationCodesTable, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    });
  }

  close() {
    return new Promise((resolve) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) console.error('Error closing database:', err);
          else console.log('Database connection closed');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  // 根据手机号查找用户
  findUserByPhone(phone) {
    return new Promise((resolve, reject) => {
      if (!phone || typeof phone !== 'string') {
        resolve(null);
        return;
      }

      const sql = 'SELECT * FROM users WHERE phone = ?';
      this.db.get(sql, [phone], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row || null);
        }
      });
    });
  }

  // 创建新用户
  createUser(phone) {
    return new Promise((resolve, reject) => {
      if (!phone || typeof phone !== 'string') {
        reject(new Error('Invalid phone number'));
        return;
      }

      const sql = 'INSERT INTO users (phone) VALUES (?)';
      this.db.run(sql, [phone], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, phone });
        }
      });
    });
  }

  // 创建验证码记录
  createVerificationCode(phone, code, expiresAt) {
    return new Promise((resolve, reject) => {
      if (!phone || !code || !expiresAt) {
        reject(new Error('Missing required parameters'));
        return;
      }

      const sql = 'INSERT INTO verification_codes (phone, code, expires_at) VALUES (?, ?, ?)';
      this.db.run(sql, [phone, code, expiresAt.toISOString()], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, phone, code });
        }
      });
    });
  }

  // 验证验证码
  verifyCode(phone, code) {
    return new Promise((resolve, reject) => {
      if (!phone || !code) {
        resolve(false);
        return;
      }

      const sql = `
        SELECT * FROM verification_codes 
        WHERE phone = ? AND code = ? AND used = FALSE AND expires_at > datetime('now')
        ORDER BY created_at DESC LIMIT 1
      `;
      
      this.db.get(sql, [phone, code], (err, row) => {
        if (err) {
          reject(err);
        } else if (row) {
          // 标记验证码为已使用
          const updateSql = 'UPDATE verification_codes SET used = TRUE WHERE id = ?';
          this.db.run(updateSql, [row.id], (updateErr) => {
            if (updateErr) {
              reject(updateErr);
            } else {
              resolve(true);
            }
          });
        } else {
          resolve(false);
        }
      });
    });
  }

  // 清理过期验证码
  cleanExpiredCodes() {
    return new Promise((resolve, reject) => {
      const sql = "DELETE FROM verification_codes WHERE expires_at < datetime('now')";
      this.db.run(sql, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
}

module.exports = new Database();