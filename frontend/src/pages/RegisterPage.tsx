import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiService } from '../services/api'

const RegisterPage: React.FC = () => {
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    
    // 表单验证
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
    
    if (!password.trim()) {
      setError('请输入密码')
      setIsLoading(false)
      return
    }
    
    if (!confirmPassword.trim()) {
      setError('请确认密码')
      setIsLoading(false)
      return
    }
    
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致')
      setIsLoading(false)
      return
    }
    
    try {
      // 调用API注册
      const response = await apiService.register({
        phoneNumber: phone.trim(),
        countryCode: '+86',
        verificationCode: code.trim(),
        password: password.trim()
      })
      
      if (response.success) {
        // 注册成功，跳转到登录页面
        alert('注册成功！请登录')
        navigate('/login')
      } else {
        setError(response.message || '注册失败')
      }
    } catch (err) {
      setError('注册失败，请检查网络连接')
    } finally {
      setIsLoading(false)
    }
  }

  const goToLogin = () => {
    navigate('/login')
  }

  return (
    <div data-testid="register-page" style={{
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
        <h1 style={{ textAlign: 'center', marginBottom: '30px', fontSize: '24px', color: '#333' }}>注册</h1>
        
        {/* Phone Number Section */}
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
          <div style={{
            display: 'flex',
            gap: '10px',
            alignItems: 'center'
          }}>
            <select style={{
              padding: '12px',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              backgroundColor: 'white',
              fontSize: '14px',
              minWidth: '120px'
            }}>
              <option>中国大陆 +86</option>
            </select>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="请输入手机号"
              style={{
                flex: 1,
                padding: '12px 16px',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                fontSize: '16px',
                outline: 'none'
              }}
            />
          </div>
        </div>

        {/* Verification Code Section */}
        <div style={{
          marginBottom: '20px'
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

        {/* Password Section */}
        <div style={{
          marginBottom: '20px'
        }}>
          <label htmlFor="password" style={{ 
            display: 'block',
            fontSize: '16px',
            fontWeight: '500',
            marginBottom: '8px',
            color: '#333'
          }}>密码:</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="请输入密码"
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

        {/* Confirm Password Section */}
        <div style={{
          marginBottom: '30px'
        }}>
          <label htmlFor="confirmPassword" style={{ 
            display: 'block',
            fontSize: '16px',
            fontWeight: '500',
            marginBottom: '8px',
            color: '#333'
          }}>确认密码:</label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="请再次输入密码"
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

        {/* Register Button */}
        <button
          type="submit"
          onClick={handleRegister}
          style={{
            width: '100%',
            padding: '14px',
            backgroundColor: '#ff6b35',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            marginBottom: '20px'
          }}
        >
          注册
        </button>

        {/* Login Link */}
        <div style={{
          textAlign: 'center',
          fontSize: '14px',
          color: '#666'
        }}>
          已有账号？
          <span 
            onClick={() => navigate('/login')}
            style={{
              color: '#ff6b35',
              textDecoration: 'none',
              marginLeft: '5px',
              cursor: 'pointer'
            }}
          >
            立即登录
          </span>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage