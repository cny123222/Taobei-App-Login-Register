const express = require('express');
const Database = require('../database');
const crypto = require('crypto');

const router = express.Router();
const db = new Database();

// 在测试环境中确保数据库初始化
if (process.env.NODE_ENV === 'test') {
  db.init().catch(console.error);
}

// 手机号格式验证
function isValidPhoneNumber(phone) {
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phone);
}

// 生成6位验证码
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// 生成简单的JWT令牌（实际项目中应使用专业的JWT库）
function generateToken(userId) {
  const payload = {
    userId: userId,
    timestamp: Date.now()
  };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

// 频率限制存储（实际项目中应使用Redis）
const rateLimitStore = new Map();

// API-POST-SendVerificationCode
router.post('/send-verification-code', async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    
    // 验证手机号格式
    if (!phoneNumber || !isValidPhoneNumber(phoneNumber)) {
      return res.status(400).json({ error: "请输入正确的手机号码" });
    }

    // 检查频率限制（60秒内只能发送一次）
    const lastSentTime = rateLimitStore.get(phoneNumber);
    const now = Date.now();
    if (lastSentTime && (now - lastSentTime) < 60000) {
      return res.status(429).json({ error: "验证码发送过于频繁，请稍后再试" });
    }

    // 生成验证码
    const verificationCode = generateVerificationCode();
    
    // 保存验证码到数据库
    await db.saveVerificationCode(phoneNumber, verificationCode);
    
    // 在控制台打印验证码（模拟发送短信）
    console.log(`验证码已发送到 ${phoneNumber}: ${verificationCode}`);
    
    // 更新频率限制
    rateLimitStore.set(phoneNumber, now);
    
    res.status(200).json({ 
      message: "验证码发送成功", 
      countdown: 60 
    });
  } catch (error) {
    console.error('发送验证码错误:', error);
    res.status(500).json({ error: "服务器内部错误" });
  }
});

// API-POST-Login
router.post('/login', async (req, res) => {
  try {
    const { phoneNumber, verificationCode } = req.body;
    
    // 验证手机号格式
    if (!phoneNumber || !isValidPhoneNumber(phoneNumber)) {
      return res.status(400).json({ error: "请输入正确的手机号码" });
    }

    // 验证验证码是否为空
    if (!verificationCode) {
      return res.status(400).json({ error: "请输入验证码" });
    }

    // 查找用户
    const user = await db.findUserByPhone(phoneNumber);
    if (!user) {
      return res.status(404).json({ error: "该手机号未注册，请先完成注册" });
    }

    // 验证验证码
    const isCodeValid = await db.verifyCode(phoneNumber, verificationCode);
    if (!isCodeValid) {
      return res.status(401).json({ error: "验证码错误或已过期" });
    }

    // 生成令牌
    const token = generateToken(user.id);
    
    res.status(200).json({ 
      message: "登录成功", 
      user: {
        id: user.id.toString(),
        phoneNumber: user.phoneNumber
      },
      token: token
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ error: "服务器内部错误" });
  }
});

// API-POST-Register
router.post('/register', async (req, res) => {
  try {
    const { phoneNumber, verificationCode, agreeToTerms } = req.body;
    
    // 验证手机号格式
    if (!phoneNumber || !isValidPhoneNumber(phoneNumber)) {
      return res.status(400).json({ error: "请输入正确的手机号码" });
    }

    // 验证验证码是否为空
    if (!verificationCode) {
      return res.status(400).json({ error: "请输入验证码" });
    }

    // 验证是否同意用户协议
    if (!agreeToTerms) {
      return res.status(422).json({ error: "请同意用户协议" });
    }

    // 验证验证码
    const isCodeValid = await db.verifyCode(phoneNumber, verificationCode);
    if (!isCodeValid) {
      return res.status(401).json({ error: "验证码错误或已过期" });
    }

    // 检查用户是否已存在
    const existingUser = await db.findUserByPhone(phoneNumber);
    if (existingUser) {
      return res.status(409).json({ error: "该手机号已注册，请直接登录" });
    }

    // 创建新用户
    const newUser = await db.createUser(phoneNumber);
    
    // 生成令牌（自动登录）
    const token = generateToken(newUser.id);
    
    res.status(201).json({ 
      message: "注册成功", 
      user: {
        id: newUser.id.toString(),
        phoneNumber: newUser.phoneNumber
      },
      token: token
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ error: "服务器内部错误" });
  }
});

module.exports = router;