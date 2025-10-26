import express from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { findUserByPhone, createUser, storeVerificationCode, verifyCode } from '../models/database.js'

const router = express.Router()

// JWT Secret (in production, this should be in environment variables)
const JWT_SECRET = 'taobei-app-secret-key'

// Phone number validation regex
const PHONE_REGEX = /^1[3-9]\d{9}$/

// Generate 6-digit verification code
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Validate phone number format
function isValidPhone(phone) {
  return typeof phone === 'string' && PHONE_REGEX.test(phone)
}

// Send verification code
router.post('/send-verification-code', async (req, res) => {
  try {
    const { phoneNumber } = req.body
    const phone = phoneNumber // 内部使用phone变量
    
    // Input validation
     if (!phone || typeof phone !== 'string' || phone.trim() === '' || !isValidPhone(phone)) {
       return res.status(400).json({
         error: '请输入正确的手机号码'
       })
     }
    
    // Generate and store verification code
    const code = generateVerificationCode()
    const expiresAt = new Date(Date.now() + 60000) // 60 seconds from now
    
    await storeVerificationCode(phone, code, expiresAt)
    
    // In development environment, log the verification code
    console.log(`Verification code for ${phone}: ${code}`)
    
    res.status(200).json({
       message: '验证码已发送',
       expiresIn: 60
     })
  } catch (error) {
     console.error('Error sending verification code:', error)
     res.status(500).json({
       error: '服务器内部错误'
     })
   }
 })

// User login
 router.post('/login', async (req, res) => {
   try {
     const { phoneNumber, verificationCode } = req.body
     const phone = phoneNumber // 内部使用phone变量
    
    // Input validation
    if (!phone || typeof phone !== 'string' || phone.trim() === '' || !isValidPhone(phone)) {
      return res.status(400).json({
        error: '请输入正确的手机号码'
      })
    }
    
    if (!verificationCode || typeof verificationCode !== 'string' || verificationCode.trim() === '') {
      return res.status(400).json({
        error: '请输入验证码'
      })
    }
    
    // Verify the code
    const isCodeValid = await verifyCode(phone, verificationCode)
    if (!isCodeValid) {
      return res.status(401).json({
        error: '验证码错误'
      })
    }
    
    // Check if user exists
    const user = await findUserByPhone(phone)
    if (!user) {
      return res.status(404).json({
        error: '用户不存在'
      })
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, phone: user.phone },
      JWT_SECRET,
      { expiresIn: '24h' }
    )
    
    res.status(200).json({
      userId: user.id,
      token: token,
      message: '登录成功'
    })
  } catch (error) {
    console.error('Error during login:', error)
    res.status(500).json({
      error: '服务器内部错误'
    })
  }
})

// User registration
 router.post('/register', async (req, res) => {
   try {
     const { phoneNumber, verificationCode, agreeToTerms } = req.body
     const phone = phoneNumber // 内部使用phone变量
    
    // Input validation
    if (!phone || typeof phone !== 'string' || phone.trim() === '' || !isValidPhone(phone)) {
      return res.status(400).json({
        error: '请输入正确的手机号码'
      })
    }
    
    if (!verificationCode || typeof verificationCode !== 'string' || verificationCode.trim() === '') {
      return res.status(400).json({
        error: '请输入验证码'
      })
    }
    
    if (!agreeToTerms) {
      return res.status(422).json({
        error: '请同意用户协议'
      })
    }
    
    // Verify the code
     const isCodeValid = await verifyCode(phone, verificationCode)
     if (!isCodeValid) {
       return res.status(401).json({
         error: '验证码错误'
       })
     }
     
     // Check if user already exists
     const existingUser = await findUserByPhone(phone)
     if (existingUser) {
       // 如已注册则直接登录
       const token = jwt.sign(
         { userId: existingUser.id, phone: existingUser.phone },
         JWT_SECRET,
         { expiresIn: '24h' }
       )
       
       return res.status(409).json({
         error: '该手机号已注册，将直接为您登录',
         userId: existingUser.id,
         token: token
       })
     }
    
    // Create user
    const newUser = await createUser(phone)
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser.id, phone: newUser.phone },
      JWT_SECRET,
      { expiresIn: '24h' }
    )
    
    res.status(201).json({
      userId: newUser.id,
      token: token,
      message: '注册成功'
    })
  } catch (error) {
     console.error('Error during registration:', error)
     if (error.message.includes('UNIQUE constraint failed')) {
       return res.status(409).json({
         error: '该手机号已注册，将直接为您登录'
       })
     }
     res.status(500).json({
       error: '服务器内部错误'
     })
   }
 })

export default router