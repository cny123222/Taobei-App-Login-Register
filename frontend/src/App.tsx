import React, { useState, useEffect } from 'react'
import LoginForm from './components/LoginForm'
import RegisterForm from './components/RegisterForm'
import HomePage from './pages/HomePage'

// 简单的路由状态管理
type Page = 'home' | 'login' | 'register'

interface User {
  id: string
  phoneNumber: string
  token: string
}

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home')
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // 检查本地存储中的用户信息
  useEffect(() => {
    const savedUser = localStorage.getItem('taobei_user')
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser)
        setUser(userData)
      } catch (error) {
        console.error('解析用户数据失败:', error)
        localStorage.removeItem('taobei_user')
      }
    }
    setIsLoading(false)
  }, [])

  // 登录成功处理
  const handleLoginSuccess = () => {
    // 这个函数会在LoginForm组件内部处理用户数据
    setCurrentPage('home')
  }

  // 注册成功处理
  const handleRegisterSuccess = () => {
    // 这个函数会在RegisterForm组件内部处理用户数据
    setCurrentPage('home')
  }

  // 退出登录处理
  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem('taobei_user')
    setCurrentPage('home')
  }

  // 页面导航处理
  const navigateToLogin = () => setCurrentPage('login')
  const navigateToRegister = () => setCurrentPage('register')
  const navigateToHome = () => setCurrentPage('home')

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px',
        color: '#666'
      }}>
        加载中...
      </div>
    )
  }

  return (
    <div className="app">
      {currentPage === 'home' && (
        <HomePage
          user={user ? { phoneNumber: user.phoneNumber } : undefined}
          onNavigateToLogin={navigateToLogin}
          onNavigateToRegister={navigateToRegister}
          onLogout={handleLogout}
        />
      )}
      
      {currentPage === 'login' && (
        <LoginForm
          onLoginSuccess={handleLoginSuccess}
          onNavigateToRegister={navigateToRegister}
        />
      )}
      
      {currentPage === 'register' && (
        <RegisterForm
          onRegisterSuccess={handleRegisterSuccess}
          onNavigateToLogin={navigateToLogin}
        />
      )}
    </div>
  )
}

export default App