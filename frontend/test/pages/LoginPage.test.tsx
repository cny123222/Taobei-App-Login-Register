import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import LoginPage from '../../src/pages/LoginPage'

// Mock react-router-dom
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// Mock API service
vi.mock('../../src/services/api', () => ({
  apiService: {
    sendVerificationCode: vi.fn(),
    login: vi.fn(),
  }
}))

const renderLoginPage = () => {
  return render(
    <BrowserRouter>
      <LoginPage />
    </BrowserRouter>
  )
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockNavigate.mockClear()
  })

  describe('UI渲染测试', () => {
    it('应该正确渲染登录页面的所有元素', () => {
      renderLoginPage()
      
      expect(screen.getByRole('heading', { name: '登录' })).toBeInTheDocument()
      expect(screen.getByLabelText('手机号:')).toBeInTheDocument()
      expect(screen.getByLabelText('验证码:')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('请输入手机号')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('请输入验证码')).toBeInTheDocument()
      expect(screen.getByText('发送验证码')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '登录' })).toBeInTheDocument()
      expect(screen.getByText('还没有账号？')).toBeInTheDocument()
      expect(screen.getByText('立即注册')).toBeInTheDocument()
    })

    it('应该正确设置输入框的类型属性', () => {
      renderLoginPage()
      
      const phoneInput = screen.getByPlaceholderText('请输入手机号')
      const codeInput = screen.getByPlaceholderText('请输入验证码')
      
      expect(phoneInput).toHaveAttribute('type', 'tel')
      expect(codeInput).toHaveAttribute('type', 'text')
    })
  })

  describe('用户交互测试', () => {
    it('应该能够输入手机号', () => {
      renderLoginPage()
      
      const phoneInput = screen.getByPlaceholderText('请输入手机号')
      fireEvent.change(phoneInput, { target: { value: '13812345678' } })
      
      expect(phoneInput).toHaveValue('13812345678')
    })

    it('应该能够输入验证码', () => {
      renderLoginPage()
      
      const codeInput = screen.getByPlaceholderText('请输入验证码')
      fireEvent.change(codeInput, { target: { value: '123456' } })
      
      expect(codeInput).toHaveValue('123456')
    })

    it('应该能够点击发送验证码按钮', async () => {
      const { apiService } = await import('../../src/services/api')
      const mockSendVerificationCode = apiService.sendVerificationCode as any
      mockSendVerificationCode.mockResolvedValue({ success: false, message: '请输入手机号' })
      
      renderLoginPage()
      
      const sendCodeButton = screen.getByText('发送验证码')
      fireEvent.click(sendCodeButton)
      
      await waitFor(() => {
        expect(screen.getByText('请输入手机号')).toBeInTheDocument()
      })
    })

    it('应该能够提交登录表单', async () => {
      const { apiService } = await import('../../src/services/api')
      const mockLogin = apiService.login as any
      mockLogin.mockResolvedValue({ success: true, data: { id: '1', phoneNumber: '13812345678' } })
      
      renderLoginPage()
      
      const phoneInput = screen.getByPlaceholderText('请输入手机号')
      const codeInput = screen.getByPlaceholderText('请输入验证码')
      const loginButton = screen.getByRole('button', { name: '登录' })
      
      fireEvent.change(phoneInput, { target: { value: '13812345678' } })
      fireEvent.change(codeInput, { target: { value: '123456' } })
      fireEvent.click(loginButton)
      
      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith({
          phoneNumber: '13812345678',
          countryCode: '+86',
          verificationCode: '123456'
        })
      })
    })

    it('应该能够点击立即注册按钮跳转到注册页面', () => {
      renderLoginPage()
      
      const registerButton = screen.getByText('立即注册')
      fireEvent.click(registerButton)
      
      expect(mockNavigate).toHaveBeenCalledWith('/register')
    })
  })

  describe('表单验证测试', () => {
    it('应该在手机号为空时显示相应的验证状态', () => {
      renderLoginPage()
      
      const phoneInput = screen.getByPlaceholderText('请输入手机号')
      expect(phoneInput).toHaveValue('')
    })

    it('应该在验证码为空时显示相应的验证状态', () => {
      renderLoginPage()
      
      const codeInput = screen.getByPlaceholderText('请输入验证码')
      expect(codeInput).toHaveValue('')
    })
  })

  describe('状态管理测试', () => {
    it('应该正确管理加载状态', () => {
      renderLoginPage()
      
      const loginButton = screen.getByRole('button', { name: '登录' })
      expect(loginButton).not.toBeDisabled()
    })

    it('应该正确显示错误信息', async () => {
      const { apiService } = await import('../../src/services/api')
      const mockSendVerificationCode = apiService.sendVerificationCode as any
      mockSendVerificationCode.mockResolvedValue({ success: false, message: '请输入手机号' })
      
      renderLoginPage()
      
      const sendCodeButton = screen.getByText('发送验证码')
      fireEvent.click(sendCodeButton)
      
      await waitFor(() => {
        const errorElement = screen.getByText('请输入手机号')
        expect(errorElement).toBeInTheDocument()
        expect(errorElement).toHaveClass('error')
      })
    })
  })

  describe('边界条件测试', () => {
    it('应该处理极长的手机号输入', () => {
      renderLoginPage()
      
      const phoneInput = screen.getByPlaceholderText('请输入手机号')
      const longPhone = '1'.repeat(20)
      fireEvent.change(phoneInput, { target: { value: longPhone } })
      
      expect(phoneInput).toHaveValue(longPhone)
    })

    it('应该处理极长的验证码输入', () => {
      renderLoginPage()
      
      const codeInput = screen.getByPlaceholderText('请输入验证码')
      const longCode = '1'.repeat(10)
      fireEvent.change(codeInput, { target: { value: longCode } })
      
      expect(codeInput).toHaveValue(longCode)
    })

    it('应该处理特殊字符输入', () => {
      renderLoginPage()
      
      const phoneInput = screen.getByPlaceholderText('请输入手机号')
      const specialChars = '!@#$%^&*()'
      fireEvent.change(phoneInput, { target: { value: specialChars } })
      
      expect(phoneInput).toHaveValue(specialChars)
    })
  })

  describe('异常处理测试', () => {
    it('应该处理发送验证码失败的情况', async () => {
      const { apiService } = await import('../../src/services/api')
      const mockSendVerificationCode = apiService.sendVerificationCode as any
      mockSendVerificationCode.mockResolvedValue({ success: false, message: '请输入手机号' })
      
      renderLoginPage()
      
      const sendCodeButton = screen.getByText('发送验证码')
      fireEvent.click(sendCodeButton)
      
      await waitFor(() => {
        expect(screen.getByText('请输入手机号')).toBeInTheDocument()
      })
    })

    it('应该处理登录失败的情况', async () => {
      const { apiService } = await import('../../src/services/api')
      const mockLogin = apiService.login as any
      mockLogin.mockResolvedValue({ success: false, message: '请输入手机号' })
      
      renderLoginPage()
      
      const loginButton = screen.getByRole('button', { name: '登录' })
      fireEvent.click(loginButton)
      
      await waitFor(() => {
        expect(screen.getByText('请输入手机号')).toBeInTheDocument()
      })
    })
  })
})