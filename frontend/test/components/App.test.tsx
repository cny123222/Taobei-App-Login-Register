import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// Mock the page components BEFORE importing App
vi.mock('../../src/pages/LoginPage', () => ({
  default: () => <div data-testid="login-page">Login Page</div>
}))

vi.mock('../../src/pages/RegisterPage', () => ({
  default: () => <div data-testid="register-page">Register Page</div>
}))

import App from '../../src/App'

const renderAppWithRoute = (initialEntries: string[]) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <App />
    </MemoryRouter>
  )
}

describe('App', () => {
  describe('路由测试', () => {
    it('应该在根路径"/"时重定向到登录页面', () => {
      renderAppWithRoute(['/'])
      
      expect(screen.getByTestId('login-page')).toBeInTheDocument()
      expect(screen.getByText('Login Page')).toBeInTheDocument()
    })

    it('应该在"/login"路径时显示登录页面', () => {
      renderAppWithRoute(['/login'])
      
      expect(screen.getByTestId('login-page')).toBeInTheDocument()
      expect(screen.getByText('Login Page')).toBeInTheDocument()
    })

    it('应该在"/register"路径时显示注册页面', () => {
      renderAppWithRoute(['/register'])
      
      expect(screen.getByTestId('register-page')).toBeInTheDocument()
      expect(screen.getByText('Register Page')).toBeInTheDocument()
    })

    it('应该在未知路径时重定向到登录页面', () => {
      renderAppWithRoute(['/unknown-path'])
      
      expect(screen.getByTestId('login-page')).toBeInTheDocument()
      expect(screen.getByText('Login Page')).toBeInTheDocument()
    })
  })

  describe('应用结构测试', () => {
    it('应该包含正确的应用容器结构', () => {
      renderAppWithRoute(['/login'])
      
      const appContainer = screen.getByTestId('login-page').closest('.App')
      expect(appContainer).toBeInTheDocument()
    })

    it('应该正确渲染Router组件', () => {
      renderAppWithRoute(['/login'])
      
      // 验证路由功能正常工作
      expect(screen.getByTestId('login-page')).toBeInTheDocument()
    })
  })

  describe('导航测试', () => {
    it('应该支持导航到注册页面', () => {
      renderAppWithRoute(['/register'])
      expect(screen.getByTestId('register-page')).toBeInTheDocument()
    })

    it('应该支持导航到登录页面', () => {
      renderAppWithRoute(['/login'])
      expect(screen.getByTestId('login-page')).toBeInTheDocument()
    })
  })

  describe('边界条件测试', () => {
    it('应该处理多个路径历史记录', () => {
      renderAppWithRoute(['/', '/login', '/register'])
      
      // 应该显示最后一个路径的页面
      expect(screen.getByTestId('register-page')).toBeInTheDocument()
    })

    it('应该处理空的初始路径', () => {
      // 使用默认路径而不是空数组
      render(
        <MemoryRouter>
          <App />
        </MemoryRouter>
      )
      
      // 应该默认显示登录页面
      expect(screen.getByTestId('login-page')).toBeInTheDocument()
    })

    it('应该处理带查询参数的路径', () => {
      renderAppWithRoute(['/login?redirect=home'])
      
      expect(screen.getByTestId('login-page')).toBeInTheDocument()
    })

    it('应该处理带哈希的路径', () => {
      renderAppWithRoute(['/login#section'])
      
      expect(screen.getByTestId('login-page')).toBeInTheDocument()
    })
  })

  describe('异常处理测试', () => {
    it('应该处理无效的路径格式', () => {
      renderAppWithRoute(['//invalid//path'])
      
      expect(screen.getByTestId('login-page')).toBeInTheDocument()
    })

    it('应该处理特殊字符路径', () => {
      renderAppWithRoute(['/login%20test'])
      
      expect(screen.getByTestId('login-page')).toBeInTheDocument()
    })
  })
})