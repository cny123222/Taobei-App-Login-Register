import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import HomePage from '../../src/components/HomePage'

describe('HomePage Component', () => {
  let mockOnNavigateToLogin: ReturnType<typeof vi.fn>
  let mockOnNavigateToRegister: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockOnNavigateToLogin = vi.fn()
    mockOnNavigateToRegister = vi.fn()
  })

  describe('品牌logo显示', () => {
    it('应该显示品牌logo "淘贝"', () => {
      render(<HomePage />)
      
      const brandLogo = screen.getByText('淘贝')
      expect(brandLogo).toBeInTheDocument()
      expect(brandLogo.tagName).toBe('H1')
    })

    it('品牌logo应该在正确的容器中', () => {
      render(<HomePage />)
      
      const logoContainer = screen.getByText('淘贝').closest('.brand-logo')
      expect(logoContainer).toBeInTheDocument()
    })
  })

  describe('登录链接功能', () => {
    it('应该显示登录链接', () => {
      render(<HomePage />)
      
      const loginLink = screen.getByTestId('login-link')
      expect(loginLink).toBeInTheDocument()
      expect(loginLink).toHaveTextContent('登录')
    })

    it('点击登录链接应该触发导航回调', () => {
      render(
        <HomePage onNavigateToLogin={mockOnNavigateToLogin} />
      )
      
      const loginLink = screen.getByTestId('login-link')
      fireEvent.click(loginLink)
      
      expect(mockOnNavigateToLogin).toHaveBeenCalledTimes(1)
    })

    it('没有提供回调时点击登录链接不应该报错', () => {
      render(<HomePage />)
      
      const loginLink = screen.getByTestId('login-link')
      expect(() => fireEvent.click(loginLink)).not.toThrow()
    })

    it('登录链接应该是可点击的按钮元素', () => {
      render(<HomePage />)
      
      const loginLink = screen.getByTestId('login-link')
      expect(loginLink.tagName).toBe('BUTTON')
      expect(loginLink).toHaveClass('login-link')
    })
  })

  describe('注册链接功能', () => {
    it('应该显示注册链接', () => {
      render(<HomePage />)
      
      const registerLink = screen.getByTestId('register-link')
      expect(registerLink).toBeInTheDocument()
      expect(registerLink).toHaveTextContent('注册')
    })

    it('点击注册链接应该触发导航回调', () => {
      render(
        <HomePage onNavigateToRegister={mockOnNavigateToRegister} />
      )
      
      const registerLink = screen.getByTestId('register-link')
      fireEvent.click(registerLink)
      
      expect(mockOnNavigateToRegister).toHaveBeenCalledTimes(1)
    })

    it('没有提供回调时点击注册链接不应该报错', () => {
      render(<HomePage />)
      
      const registerLink = screen.getByTestId('register-link')
      expect(() => fireEvent.click(registerLink)).not.toThrow()
    })

    it('注册链接应该是可点击的按钮元素', () => {
      render(<HomePage />)
      
      const registerLink = screen.getByTestId('register-link')
      expect(registerLink.tagName).toBe('BUTTON')
      expect(registerLink).toHaveClass('register-link')
    })
  })

  describe('导航链接容器', () => {
    it('登录和注册链接应该在同一个导航容器中', () => {
      render(<HomePage />)
      
      const loginLink = screen.getByTestId('login-link')
      const registerLink = screen.getByTestId('register-link')
      
      const navigationContainer = loginLink.closest('.navigation-links')
      expect(navigationContainer).toBeInTheDocument()
      expect(navigationContainer).toContain(registerLink)
    })
  })

  describe('组件结构', () => {
    it('应该有正确的根容器类名', () => {
      const { container } = render(<HomePage />)
      
      const homePageContainer = container.querySelector('.home-page')
      expect(homePageContainer).toBeInTheDocument()
    })

    it('应该包含所有必需的子元素', () => {
      render(<HomePage />)
      
      // 验证品牌logo存在
      expect(screen.getByText('淘贝')).toBeInTheDocument()
      
      // 验证导航链接存在
      expect(screen.getByTestId('login-link')).toBeInTheDocument()
      expect(screen.getByTestId('register-link')).toBeInTheDocument()
    })
  })

  describe('回调函数接口', () => {
    it('应该正确接收和使用onNavigateToLogin属性', () => {
      const customCallback = vi.fn()
      render(<HomePage onNavigateToLogin={customCallback} />)
      
      fireEvent.click(screen.getByTestId('login-link'))
      expect(customCallback).toHaveBeenCalledTimes(1)
    })

    it('应该正确接收和使用onNavigateToRegister属性', () => {
      const customCallback = vi.fn()
      render(<HomePage onNavigateToRegister={customCallback} />)
      
      fireEvent.click(screen.getByTestId('register-link'))
      expect(customCallback).toHaveBeenCalledTimes(1)
    })

    it('应该支持同时提供两个回调函数', () => {
      render(
        <HomePage 
          onNavigateToLogin={mockOnNavigateToLogin}
          onNavigateToRegister={mockOnNavigateToRegister}
        />
      )
      
      fireEvent.click(screen.getByTestId('login-link'))
      fireEvent.click(screen.getByTestId('register-link'))
      
      expect(mockOnNavigateToLogin).toHaveBeenCalledTimes(1)
      expect(mockOnNavigateToRegister).toHaveBeenCalledTimes(1)
    })
  })

  describe('边界条件测试', () => {
    it('多次点击登录链接应该多次触发回调', () => {
      render(<HomePage onNavigateToLogin={mockOnNavigateToLogin} />)
      
      const loginLink = screen.getByTestId('login-link')
      fireEvent.click(loginLink)
      fireEvent.click(loginLink)
      fireEvent.click(loginLink)
      
      expect(mockOnNavigateToLogin).toHaveBeenCalledTimes(3)
    })

    it('多次点击注册链接应该多次触发回调', () => {
      render(<HomePage onNavigateToRegister={mockOnNavigateToRegister} />)
      
      const registerLink = screen.getByTestId('register-link')
      fireEvent.click(registerLink)
      fireEvent.click(registerLink)
      
      expect(mockOnNavigateToRegister).toHaveBeenCalledTimes(2)
    })
  })
});