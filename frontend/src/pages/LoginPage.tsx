import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiService } from '../services/api'

const LoginPage: React.FC = () => {
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(0)
  const navigate = useNavigate()

  const handleSendCode = async () => {
    if (countdown > 0) return
    
    if (!phone.trim()) {
      setError('请输入手机号')
      return
    }
    
    try {
      setError('')
      
      // 调用API发送验证码
      const response = await apiService.sendVerificationCode({
        phoneNumber: phone.trim(),
        countryCode: '+86'
      })
      
      if (response.success) {
        // Start countdown
        setCountdown(60)
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer)
              return 0
            }
            return prev - 1
          })
        }, 1000)
      } else {
        setError(response.message || '发送验证码失败')
      }
    } catch (err) {
      setError('发送验证码失败，请检查网络连接')
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    
    if (!phone.trim()) {
      setError('请输入手机号')
      setIsLoading(false)
      return
    }
    
    if (!code.trim()) {
      setError('请输入验证码')
      setIsLoading(false)
      return
    }
    
    try {
      // 调用API登录
      const response = await apiService.login({
        phoneNumber: phone.trim(),
        countryCode: '+86',
        verificationCode: code.trim()
      })
      
      if (response.success) {
        // 登录成功，可以保存用户信息到localStorage或状态管理
        localStorage.setItem('userInfo', JSON.stringify(response.data))
        // 跳转到主页或其他页面
        alert('登录成功！')
      } else {
        setError(response.message || '登录失败')
      }
    } catch (err) {
      setError('登录失败，请检查网络连接')
    } finally {
      setIsLoading(false)
    }
  }

  const goToRegister = () => {
    navigate('/register')
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '40px 30px',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e0e0e0'
      }}>
        {/* Title */}
        <h1 style={{
          fontSize: '24px',
          fontWeight: '600',
          textAlign: 'center',
          marginBottom: '30px',
          color: '#333'
        }}>登录</h1>

        {/* Phone Input */}
        <div style={{
          marginBottom: '20px'
        }}>
          <label htmlFor="phone" style={{
            display: 'block',
            fontSize: '16px',
            fontWeight: '500',
            marginBottom: '8px',
            color: '#333'
          }}>手机号:</label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="请输入手机号"
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              fontSize: '16px',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Verification Code Input */}
        <div style={{
          marginBottom: '30px'
        }}>
          <label htmlFor="code" style={{
            display: 'block',
            fontSize: '16px',
            fontWeight: '500',
            marginBottom: '8px',
            color: '#333'
          }}>验证码:</label>
          <div style={{
            display: 'flex',
            gap: '10px',
            alignItems: 'center'
          }}>
            <input
              id="code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="请输入验证码"
              style={{
                flex: 1,
                padding: '12px 16px',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                fontSize: '16px',
                outline: 'none'
              }}
            />
            <button
              type="button"
              onClick={handleSendCode}
              disabled={countdown > 0}
              style={{
                padding: '12px 20px',
                border: 'none',
                backgroundColor: countdown > 0 ? '#ccc' : '#ff6b35',
                color: 'white',
                borderRadius: '8px',
                fontSize: '14px',
                cursor: countdown > 0 ? 'not-allowed' : 'pointer',
                minWidth: '100px'
              }}
            >
              {countdown > 0 ? `${countdown}s` : '发送验证码'}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error" style={{
            color: '#ff4444',
            fontSize: '14px',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        {/* Login Button */}
        <button
          type="submit"
          onClick={handleLogin}
          disabled={isLoading}
          style={{
            width: '100%',
            padding: '16px',
            backgroundColor: '#ff6b35',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '18px',
            fontWeight: '600',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            marginBottom: '30px',
            opacity: isLoading ? 0.7 : 1
          }}
        >
          {isLoading ? '登录中...' : '登录'}
        </button>

        {/* Social Login Icons and Register Link */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '20px',
          marginBottom: '20px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: '#1877f2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}>
            <span style={{ color: 'white', fontSize: '20px' }}>f</span>
          </div>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: '#1da1f2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}>
            <span style={{ color: 'white', fontSize: '16px' }}>▶</span>
          </div>
        </div>

        <div style={{
          textAlign: 'center',
          fontSize: '14px',
          color: '#666'
        }}>
          <span>还没有账号？</span>
          <button
            type="button"
            onClick={goToRegister}
            style={{
              background: 'none',
              border: 'none',
              color: '#ff6b35',
              cursor: 'pointer',
              fontSize: '14px',
              marginLeft: '8px',
              textDecoration: 'underline'
            }}
          >
            立即注册
          </button>
        </div>
      </div>
    </div>
  )
}

export default LoginPage