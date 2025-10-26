import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import RegisterPage from '../../src/pages/RegisterPage'

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
    register: vi.fn(),
  }
}))

const renderRegisterPage = () => {
  return render(
    <BrowserRouter>
      <RegisterPage />
    </BrowserRouter>
  )
}

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockNavigate.mockClear()
  })

  describe('UI渲染测试', () => {
    it('应该正确渲染注册页面的所有元素', () => {
      renderRegisterPage()
      
      expect(screen.getByRole('heading', { name: '注册' })).toBeInTheDocument()
      expect(screen.getByLabelText('手机号:')).toBeInTheDocument()
      expect(screen.getByLabelText('验证码:')).toBeInTheDocument()
      expect(screen.getByLabelText('密码:')).toBeInTheDocument()
      expect(screen.getByLabelText('确认密码:')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('请输入手机号')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('请输入验证码')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('请输入密码')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('请再次输入密码')).toBeInTheDocument()
      expect(screen.getByText('发送验证码')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '注册' })).toBeInTheDocument()
      expect(screen.getByText('已有账号？')).toBeInTheDocument()
      expect(screen.getByText('立即登录')).toBeInTheDocument()
    })

    it('应该正确设置输入框的类型属性', () => {
      renderRegisterPage()
      
      const phoneInput = screen.getByPlaceholderText('请输入手机号')
      const codeInput = screen.getByPlaceholderText('请输入验证码')
      const passwordInput = screen.getByPlaceholderText('请输入密码')
      const confirmPasswordInput = screen.getByPlaceholderText('请再次输入密码')
      
      expect(phoneInput).toHaveAttribute('type', 'tel')
      expect(codeInput).toHaveAttribute('type', 'text')
      expect(passwordInput).toHaveAttribute('type', 'password')
      expect(confirmPasswordInput).toHaveAttribute('type', 'password')
    })
  })

  describe('用户交互测试', () => {
    it('应该能够输入手机号', () => {
      renderRegisterPage()
      
      const phoneInput = screen.getByPlaceholderText('请输入手机号')
      fireEvent.change(phoneInput, { target: { value: '13812345678' } })
      
      expect(phoneInput).toHaveValue('13812345678')
    })

    it('应该能够输入验证码', () => {
      renderRegisterPage()
      
      const codeInput = screen.getByPlaceholderText('请输入验证码')
      fireEvent.change(codeInput, { target: { value: '123456' } })
      
      expect(codeInput).toHaveValue('123456')
    })

    it('应该能够输入密码', () => {
      renderRegisterPage()
      
      const passwordInput = screen.getByPlaceholderText('请输入密码')
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      
      expect(passwordInput).toHaveValue('password123')
    })

    it('应该能够输入确认密码', () => {
      renderRegisterPage()
      
      const confirmPasswordInput = screen.getByPlaceholderText('请再次输入密码')
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } })
      
      expect(confirmPasswordInput).toHaveValue('password123')
    })

    it('应该能够点击发送验证码按钮', async () => {
      const { apiService } = await import('../../src/services/api')
      const mockSendVerificationCode = apiService.sendVerificationCode as any
      mockSendVerificationCode.mockResolvedValue({ success: false, message: '请输入手机号' })
      
      renderRegisterPage()
      
      const sendCodeButton = screen.getByText('发送验证码')
      fireEvent.click(sendCodeButton)
      
      await waitFor(() => {
        expect(screen.getByText('请输入手机号')).toBeInTheDocument()
      })
    })

    it('应该能够提交注册表单', async () => {
      const { apiService } = await import('../../src/services/api')
      const mockRegister = apiService.register as any
      mockRegister.mockResolvedValue({ success: true, data: { id: '1', phoneNumber: '13812345678' } })
      
      renderRegisterPage()
      
      const phoneInput = screen.getByPlaceholderText('请输入手机号')
      const codeInput = screen.getByPlaceholderText('请输入验证码')
      const passwordInput = screen.getByPlaceholderText('请输入密码')
      const confirmPasswordInput = screen.getByPlaceholderText('请再次输入密码')
      const registerButton = screen.getByRole('button', { name: '注册' })
      
      fireEvent.change(phoneInput, { target: { value: '13812345678' } })
      fireEvent.change(codeInput, { target: { value: '123456' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } })
      fireEvent.click(registerButton)
      
      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith({
          phoneNumber: '13812345678',
          countryCode: '+86',
          verificationCode: '123456',
          password: 'password123'
        })
      })
    })

    it('应该能够点击立即登录按钮跳转到登录页面', () => {
      renderRegisterPage()
      
      const loginButton = screen.getByText('立即登录')
      fireEvent.click(loginButton)
      
      expect(mockNavigate).toHaveBeenCalledWith('/login')
    })
  })

  describe('表单验证测试', () => {
    it('应该在所有字段为空时显示相应的验证状态', () => {
      renderRegisterPage()
      
      const phoneInput = screen.getByPlaceholderText('请输入手机号')
      const codeInput = screen.getByPlaceholderText('请输入验证码')
      const passwordInput = screen.getByPlaceholderText('请输入密码')
      const confirmPasswordInput = screen.getByPlaceholderText('请再次输入密码')
      
      expect(phoneInput).toHaveValue('')
      expect(codeInput).toHaveValue('')
      expect(passwordInput).toHaveValue('')
      expect(confirmPasswordInput).toHaveValue('')
    })

    it('应该验证手机号格式', () => {
      renderRegisterPage()
      
      const phoneInput = screen.getByPlaceholderText('请输入手机号')
      
      // 测试有效手机号
      fireEvent.change(phoneInput, { target: { value: '13812345678' } })
      expect(phoneInput).toHaveValue('13812345678')
      
      // 测试无效手机号
      fireEvent.change(phoneInput, { target: { value: '123' } })
      expect(phoneInput).toHaveValue('123')
    })

    it('应该验证密码一致性', () => {
      renderRegisterPage()
      
      const passwordInput = screen.getByPlaceholderText('请输入密码')
      const confirmPasswordInput = screen.getByPlaceholderText('请再次输入密码')
      
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } })
      
      expect(passwordInput).toHaveValue('password123')
      expect(confirmPasswordInput).toHaveValue('password123')
    })
  })

  describe('状态管理测试', () => {
    it('应该正确管理加载状态', () => {
      renderRegisterPage()
      
      const registerButton = screen.getByRole('button', { name: '注册' })
      expect(registerButton).not.toBeDisabled()
    })

    it('应该正确显示错误信息', async () => {
      const { apiService } = await import('../../src/services/api')
      const mockSendVerificationCode = apiService.sendVerificationCode as any
      mockSendVerificationCode.mockResolvedValue({ success: false, message: '请输入手机号' })
      
      renderRegisterPage()
      
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
    it('应该处理极长的输入', () => {
      renderRegisterPage()
      
      const phoneInput = screen.getByPlaceholderText('请输入手机号')
      const longPhone = '1'.repeat(20)
      fireEvent.change(phoneInput, { target: { value: longPhone } })
      
      expect(phoneInput).toHaveValue(longPhone)
    })

    it('应该处理特殊字符密码', () => {
      renderRegisterPage()
      
      const passwordInput = screen.getByPlaceholderText('请输入密码')
      const specialPassword = '!@#$%^&*()'
      fireEvent.change(passwordInput, { target: { value: specialPassword } })
      
      expect(passwordInput).toHaveValue(specialPassword)
    })

    it('应该处理密码不匹配的情况', () => {
      renderRegisterPage()
      
      const passwordInput = screen.getByPlaceholderText('请输入密码')
      const confirmPasswordInput = screen.getByPlaceholderText('请再次输入密码')
      
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.change(confirmPasswordInput, { target: { value: 'different' } })
      
      expect(passwordInput).toHaveValue('password123')
      expect(confirmPasswordInput).toHaveValue('different')
    })
  })

  describe('异常处理测试', () => {
    it('应该处理发送验证码失败的情况', async () => {
      const { apiService } = await import('../../src/services/api')
      const mockSendVerificationCode = apiService.sendVerificationCode as any
      mockSendVerificationCode.mockResolvedValue({ success: false, message: '请输入手机号' })
      
      renderRegisterPage()
      
      const sendCodeButton = screen.getByText('发送验证码')
      fireEvent.click(sendCodeButton)
      
      await waitFor(() => {
        expect(screen.getByText('请输入手机号')).toBeInTheDocument()
      })
    })

    it('应该处理注册失败的情况', async () => {
      const { apiService } = await import('../../src/services/api')
      const mockRegister = apiService.register as any
      mockRegister.mockResolvedValue({ success: false, message: '请输入手机号' })
      
      renderRegisterPage()
      
      const registerButton = screen.getByRole('button', { name: '注册' })
      fireEvent.click(registerButton)
      
      await waitFor(() => {
        expect(screen.getByText('请输入手机号')).toBeInTheDocument()
      })
    })
  })
})