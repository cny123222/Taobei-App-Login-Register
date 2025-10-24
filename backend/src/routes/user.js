const express = require('express');
const jwt = require('jsonwebtoken');
const { getDatabase } = require('../db-instance');

const router = express.Router();
const db = getDatabase();

// JWT密钥（生产环境应该使用环境变量）
const JWT_SECRET = process.env.JWT_SECRET || 'taobei-secret-key';

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

// API-GET-UserProfile: 获取用户信息
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const { phoneNumber } = req.user;
    
    // 查找用户信息
    const user = await db.findUserByPhone(phoneNumber);
    
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    res.json({
      phoneNumber: user.phone_number,
      countryCode: user.country_code
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({
      error: '服务器内部错误'
    });
  }
});

module.exports = router;