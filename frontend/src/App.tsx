import React, { useState } from 'react'
import LoginForm from './components/LoginForm'
import RegisterForm from './components/RegisterForm'
import './App.css'

type View = 'login' | 'register' | 'profile'

interface User {
  phoneNumber: string
  countryCode: string
}

function App() {
  const [currentView, setCurrentView] = useState<View>('login')
  const [user, setUser] = useState<User | null>(null)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')

  const API_BASE_URL = 'http://localhost:3000/api'

  const clearMessages = () => {
    setError('')
    setSuccess('')
  }

  const handleSendVerificationCode = async (phoneNumber: string, countryCode: string) => {
    clearMessages()
    try {
      const response = await fetch(`${API_BASE_URL}/auth/send-verification-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber, countryCode }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('验证码已发送')
      } else {
        setError(data.message || '发送验证码失败')
      }
    } catch (err) {
      setError('网络错误，请稍后重试')
    }
  }

  const handleLogin = async (data: { phoneNumber: string; verificationCode: string; countryCode: string }) => {
    clearMessages()
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (response.ok) {
        setUser({ phoneNumber: data.phoneNumber, countryCode: data.countryCode })
        setCurrentView('profile')
        setSuccess('登录成功')
      } else {
        setError(result.message || '登录失败')
      }
    } catch (err) {
      setError('网络错误，请稍后重试')
    }
  }

  const handleRegister = async (data: { phoneNumber: string; verificationCode: string; countryCode: string; agreeToTerms: boolean }) => {
    clearMessages()
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (response.ok) {
        setUser({ phoneNumber: data.phoneNumber, countryCode: data.countryCode })
        setCurrentView('profile')
        setSuccess('注册成功')
      } else {
        setError(result.message || '注册失败')
      }
    } catch (err) {
      setError('网络错误，请稍后重试')
    }
  }

  const handleLogout = () => {
    setUser(null)
    setCurrentView('login')
    clearMessages()
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case 'login':
        return (
          <LoginForm
            onSubmit={handleLogin}
            onNavigateToRegister={() => setCurrentView('register')}
            onSendVerificationCode={handleSendVerificationCode}
          />
        )
      case 'register':
        return (
          <RegisterForm
            onSubmit={handleRegister}
            onNavigateToLogin={() => setCurrentView('login')}
            onSendVerificationCode={handleSendVerificationCode}
          />
        )
      case 'profile':
        return (
          <div className="profile-view" data-testid="profile-view">
            <h2>用户信息</h2>
            <div className="user-info">
              <p><strong>手机号:</strong> {user?.countryCode} {user?.phoneNumber}</p>
            </div>
            <button onClick={handleLogout} className="btn btn-secondary">
              退出登录
            </button>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="app">
      <div className="container">
        <div className="form-container">
          <div className="logo">
            <h1>淘贝</h1>
            <p>手机验证登录</p>
          </div>
          
          {error && (
            <div className="message error" data-testid="error-message">
              {error}
            </div>
          )}
          
          {success && (
            <div className="message success" data-testid="success-message">
              {success}
            </div>
          )}

          {renderCurrentView()}
        </div>
      </div>
    </div>
  )
}

export default App