const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { getDatabase } = require('../db-instance');

const router = express.Router();
const db = getDatabase();

// JWT密钥（生产环境应该使用环境变量）
const JWT_SECRET = process.env.JWT_SECRET || 'taobei-secret-key';

// 验证手机号格式
const validatePhoneNumber = (phoneNumber) => {
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phoneNumber);
};

// 生成6位验证码
const generateVerificationCode = () => {
  // 在测试环境中使用固定验证码
  if (process.env.NODE_ENV === 'test') {
    return '123456';
  }
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// 生成JWT token
const generateToken = (userId, phoneNumber) => {
  return jwt.sign(
    { userId, phoneNumber },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// 验证JWT token中间件
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '未授权访问' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(401).json({ error: '未授权访问' });
    }
    req.user = user;
    next();
  });
};

// API-POST-SendVerificationCode: 发送验证码
router.post('/send-verification-code', [
  body('phoneNumber').notEmpty().withMessage('手机号不能为空'),
  body('countryCode').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: '请输入正确的手机号码' });
    }

    const { phoneNumber, countryCode = '+86' } = req.body;
    
    // 验证手机号格式
    if (!validatePhoneNumber(phoneNumber)) {
      return res.status(400).json({ error: '请输入正确的手机号码' });
    }

    // 生成6位验证码
    const verificationCode = generateVerificationCode();
    
    // 保存验证码到数据库
    await db.saveVerificationCode(phoneNumber, verificationCode, countryCode);
    
    // 在实际应用中，这里应该调用短信服务发送验证码
    // 目前只是模拟发送成功
    
    res.json({
      message: '验证码已发送',
      expiresIn: 60
    });
  } catch (error) {
    console.error('发送验证码错误:', error);
    res.status(500).json({
      error: '服务器内部错误'
    });
  }
});

// API-POST-Login: 用户登录
router.post('/login', [
  body('phoneNumber').notEmpty().withMessage('手机号不能为空'),
  body('verificationCode').notEmpty().withMessage('验证码不能为空'),
  body('countryCode').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: '请输入正确的手机号码' });
    }

    const { phoneNumber, verificationCode, countryCode = '+86' } = req.body;
    
    // 验证手机号格式
    if (!validatePhoneNumber(phoneNumber)) {
      return res.status(400).json({ error: '请输入正确的手机号码' });
    }

    // 查找用户
    const user = await db.findUserByPhone(phoneNumber, countryCode);
    if (!user) {
      return res.status(400).json({ error: '验证码错误或已过期' });
    }

    // 验证验证码
    const isCodeValid = await db.verifyCode(phoneNumber, verificationCode, countryCode);
    if (!isCodeValid) {
      return res.status(400).json({ error: '验证码错误或已过期' });
    }

    // 生成token
    const token = generateToken(user.id, user.phone_number);
    
    res.json({
      message: '登录成功',
      token,
      user: {
        id: user.id.toString(),
        phoneNumber: user.phone_number,
        countryCode: user.country_code
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({
      error: '服务器内部错误'
    });
  }
});

// API-POST-Register: 用户注册
router.post('/register', [
  body('phoneNumber').notEmpty().withMessage('手机号不能为空'),
  body('verificationCode').notEmpty().withMessage('验证码不能为空'),
  body('agreeToTerms').isBoolean().withMessage('必须同意用户协议'),
  body('countryCode').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: '请输入正确的手机号码' });
    }

    const { phoneNumber, verificationCode, countryCode = '+86', agreeToTerms } = req.body;
    
    // 验证手机号格式
    if (!validatePhoneNumber(phoneNumber)) {
      return res.status(400).json({ error: '请输入正确的手机号码' });
    }

    // 检查是否同意协议
    if (!agreeToTerms) {
      return res.status(400).json({ error: '必须同意服务条款' });
    }

    // 验证验证码
    const isCodeValid = await db.verifyCode(phoneNumber, verificationCode, countryCode);
    if (!isCodeValid) {
      return res.status(400).json({ error: '验证码错误或已过期' });
    }

    // 检查用户是否已存在
    const existingUser = await db.findUserByPhone(phoneNumber, countryCode);
    if (existingUser) {
      return res.status(400).json({ error: '该手机号已注册' });
    }

    // 创建新用户
    const newUser = await db.createUser(phoneNumber, countryCode);
    const token = generateToken(newUser.id, newUser.phoneNumber);
    
    res.status(201).json({
      message: '注册成功',
      token,
      user: {
        id: newUser.id.toString(),
        phoneNumber: newUser.phoneNumber,
        countryCode: newUser.countryCode
      }
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({
      error: '服务器内部错误'
    });
  }
});



module.exports = router;