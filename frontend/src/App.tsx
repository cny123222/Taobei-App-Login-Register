import React, { useState } from 'react'
import LoginForm from './components/LoginForm'
import RegisterForm from './components/RegisterForm'
import HomePage from './components/HomePage'

type PageType = 'home' | 'login' | 'register'

function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('home')
  const [successMessage, setSuccessMessage] = useState<string>('')

  // 发送验证码
  const handleSendCode = async (phone: string) => {
    try {
      const response = await fetch('/api/auth/send-verification-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone,
          type: currentPage === 'login' ? 'login' : 'register'
        }),
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || '发送验证码失败')
      }

      console.log('验证码发送成功:', data)
    } catch (error) {
      console.error('发送验证码失败:', error)
      throw error
    }
  }

  // 用户登录
  const handleLogin = async (data: { phone: string; code: string }) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.message || '登录失败')
      }

      console.log('登录成功:', result)
      // 这里可以保存token到localStorage或进行页面跳转
      localStorage.setItem('token', result.token)
      setSuccessMessage('登录成功')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error) {
      console.error('登录失败:', error)
      throw error
    }
  }

  // 用户注册
  const handleRegister = async (data: { phone: string; code: string }) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.message || '注册失败')
      }

      console.log('注册成功:', result)
      // 注册成功后可以自动登录或跳转到登录页面
      localStorage.setItem('token', result.token)
      setSuccessMessage('注册成功')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error) {
      console.error('注册失败:', error)
      throw error
    }
  }

  return (
    <div className="app">
      {successMessage && (
        <div className="success-message" data-testid="success-message">
          {successMessage}
        </div>
      )}
      {currentPage === 'home' ? (
        <HomePage
          onNavigateToLogin={() => setCurrentPage('login')}
          onNavigateToRegister={() => setCurrentPage('register')}
        />
      ) : currentPage === 'login' ? (
        <LoginForm
          onSubmit={handleLogin}
          onSendCode={handleSendCode}
          onSwitchToRegister={() => setCurrentPage('register')}
        />
      ) : (
        <RegisterForm
          onSubmit={handleRegister}
          onSendCode={handleSendCode}
          onSwitchToLogin={() => setCurrentPage('login')}
        />
      )}
    </div>
  )
}

export default App