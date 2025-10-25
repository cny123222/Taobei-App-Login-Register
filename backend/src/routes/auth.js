const express = require('express');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const Database = require('../database');

const router = express.Router();

// JWT密钥（生产环境应使用环境变量）
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// 验证码发送限制
const verificationCodeLimit = process.env.NODE_ENV === 'test' 
  ? (req, res, next) => next() // 测试环境跳过rate limiting
  : rateLimit({
      windowMs: 60 * 1000, // 生产环境1分钟
      max: 1, // 每个窗口期只允许1次请求
      message: { error: '发送验证码过于频繁，请稍后再试' },
      keyGenerator: (req) => req.body.phoneNumber || req.ip // 基于手机号限制
    });

// 手机号格式验证
function validatePhoneNumber(phoneNumber) {
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phoneNumber);
}

// POST /api/auth/send-verification-code
router.post('/send-verification-code', verificationCodeLimit, async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    
    // 验证请求参数
    if (!phoneNumber) {
      return res.status(400).json({ 
        error: '手机号不能为空' 
      });
    }
    
    // 验证手机号格式
    if (!validatePhoneNumber(phoneNumber)) {
      return res.status(400).json({ 
        error: '手机号格式不正确' 
      });
    }
    
    // 获取共享数据库连接
    const db = req.app.locals.database;
    if (!db) {
      return res.status(500).json({ 
        success: false, 
        message: '数据库连接不可用' 
      });
    }
    
    // 生成验证码并存储到数据库
    const verificationData = await db.generateVerificationCode(phoneNumber);
    
    // 模拟发送短信（实际项目中应调用短信服务）
    console.log(`发送验证码到 ${phoneNumber}: ${verificationData.code}`);
    
    const responseData = {
      phoneNumber: phoneNumber,
      expiresIn: 300 // 5分钟
    };
    
    // 在测试环境中返回验证码
    if (process.env.NODE_ENV === 'test') {
      responseData.verificationCode = verificationData.code;
    }
    
    res.status(200).json({ 
      success: true, 
      message: '验证码发送成功',
      timestamp: new Date().toISOString(),
      data: responseData
    });
  } catch (error) {
    console.error('发送验证码错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器内部错误' 
    });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { phoneNumber, verificationCode } = req.body;
    
    // 验证请求参数
    if (!phoneNumber || !verificationCode) {
      return res.status(400).json({ 
        error: '手机号和验证码不能为空' 
      });
    }
    
    // 验证手机号格式
    if (!validatePhoneNumber(phoneNumber)) {
      return res.status(400).json({ 
        error: '手机号格式不正确' 
      });
    }
    
    // 获取共享数据库连接
    const db = req.app.locals.database;
    if (!db) {
      return res.status(500).json({ 
        success: false, 
        message: '数据库连接不可用' 
      });
    }
      // 验证验证码
      const isValidCode = await db.verifyCode(phoneNumber, verificationCode);
      if (!isValidCode) {
        return res.status(400).json({ 
          error: '验证码无效或已过期' 
        });
      }
      
      // 检查用户是否存在
      const user = await db.findUserByPhone(phoneNumber);
      if (!user) {
        return res.status(404).json({ 
          error: '用户不存在，请先注册' 
        });
      }
      
      // 生成JWT令牌
      const token = jwt.sign(
        { userId: user.id, phoneNumber: user.phone_number },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      
      res.status(200).json({ 
        success: true, 
        message: '登录成功',
        data: {
          token: token,
          user: {
            id: user.id,
            phoneNumber: user.phone_number,
            createdAt: user.created_at
          }
        }
      });

  } catch (error) {
    console.error('用户登录错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器内部错误' 
    });
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { phoneNumber, verificationCode, agreeToTerms } = req.body;
    
    // 验证请求参数
    if (!phoneNumber || !verificationCode) {
      return res.status(400).json({ 
        error: '手机号和验证码不能为空' 
      });
    }
    
    // 验证手机号格式
    if (!validatePhoneNumber(phoneNumber)) {
      return res.status(400).json({ 
        error: '手机号格式不正确' 
      });
    }
    
    // 验证用户协议同意状态
    if (!agreeToTerms) {
      return res.status(400).json({ 
        error: '请同意用户协议' 
      });
    }
    
    // 获取共享数据库连接
    const db = req.app.locals.database;
    if (!db) {
      return res.status(500).json({ 
        success: false, 
        message: '数据库连接不可用' 
      });
    }
      // 验证验证码
      const isValidCode = await db.verifyCode(phoneNumber, verificationCode);
      if (!isValidCode) {
        return res.status(400).json({ 
          error: '验证码无效或已过期' 
        });
      }
      
      // 检查用户是否已存在
      const existingUser = await db.findUserByPhone(phoneNumber);
      if (existingUser) {
        return res.status(400).json({ 
          error: '用户已存在，请直接登录' 
        });
      }
      
      // 创建新用户
      const newUser = await db.createUser(phoneNumber);
      
      // 生成JWT令牌
      const token = jwt.sign(
        { userId: newUser.id, phoneNumber: newUser.phone_number },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      
      res.status(201).json({ 
        success: true, 
        message: '注册成功',
        data: {
          token: token,
          user: {
            id: newUser.id,
            phoneNumber: newUser.phone_number,
            createdAt: newUser.created_at
          }
        }
      });

  } catch (error) {
    console.error('用户注册错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器内部错误' 
    });
  }
});

module.exports = router;