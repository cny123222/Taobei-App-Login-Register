import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LoginForm from '../../src/components/LoginForm'
import RegisterForm from '../../src/components/RegisterForm'

// Mock fetch for API calls
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('End-to-End User Flow Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock successful responses by default
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        message: '操作成功',
        token: 'mock-jwt-token',
        user: { phone: '13800138001' },
        countdown: 60
      })
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('用户注册完整流程', () => {
    it('应该完成完整的用户注册流程', async () => {
      // Given: 用户在注册页面
      const user = userEvent.setup()
      const mockOnSubmit = vi.fn()
      const mockOnSendCode = vi.fn()
      
      render(
        <RegisterForm
          onSubmit={mockOnSubmit}
          onSendCode={mockOnSendCode}
        />
      )

      // Step 1: 用户输入手机号
      const phoneInput = screen.getByLabelText('手机号')
      await user.type(phoneInput, '13800138001')
      expect(phoneInput).toHaveValue('13800138001')

      // Step 2: 用户点击获取验证码
      const sendCodeBtn = screen.getByRole('button', { name: '获取验证码' })
      await user.click(sendCodeBtn)

      // Then: 应该调用发送验证码API
      expect(mockOnSendCode).toHaveBeenCalledWith('13800138001')

      // Step 3: 用户输入验证码
      const codeInput = screen.getByLabelText('验证码')
      await user.type(codeInput, '123456')
      expect(codeInput).toHaveValue('123456')

      // Step 3.5: 用户勾选同意条款
      const agreeCheckbox = screen.getByRole('checkbox')
      await user.click(agreeCheckbox)

      // Step 4: 用户点击注册按钮
      const registerBtn = screen.getByRole('button', { name: '同意并注册' })
      await user.click(registerBtn)

      // Then: 应该调用注册API
      expect(mockOnSubmit).toHaveBeenCalledWith({
        phone: '13800138001',
        code: '123456'
      })
    })

    it('应该处理注册过程中的验证错误', async () => {
      // Given: 用户在注册页面
      const user = userEvent.setup()
      const mockOnSubmit = vi.fn()
      
      render(<RegisterForm onSubmit={mockOnSubmit} />)

      // Mock alert
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})

      // When: 用户勾选同意条款但未填写信息就点击注册
      const agreeCheckbox = screen.getByRole('checkbox', { name: /已阅读并同意/ })
      await user.click(agreeCheckbox)
      
      const registerBtn = screen.getByRole('button', { name: '同意并注册' })
      await user.click(registerBtn)

      // Then: 应该显示错误提示
      expect(alertSpy).toHaveBeenCalledWith('请填写完整信息')
      expect(mockOnSubmit).not.toHaveBeenCalled()

      alertSpy.mockRestore()
    })

    it('应该处理手机号格式验证', async () => {
      // Given: 用户在注册页面
      const user = userEvent.setup()
      const mockOnSendCode = vi.fn()
      
      render(<RegisterForm onSendCode={mockOnSendCode} />)

      // Mock alert
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})

      // When: 用户输入无效手机号并获取验证码
      const phoneInput = screen.getByLabelText('手机号')
      await user.type(phoneInput, '123')
      
      const sendCodeBtn = screen.getByRole('button', { name: '获取验证码' })
      await user.click(sendCodeBtn)

      // Then: 应该显示格式错误提示
      expect(alertSpy).toHaveBeenCalledWith('请输入正确的手机号')
      expect(mockOnSendCode).not.toHaveBeenCalled()

      alertSpy.mockRestore()
    })

    it('应该处理验证码发送失败的情况', async () => {
      // Given: 用户在注册页面，API返回错误
      const user = userEvent.setup()
      const mockOnSendCode = vi.fn().mockRejectedValue(new Error('网络错误'))
      
      render(<RegisterForm onSendCode={mockOnSendCode} />)

      // Mock alert
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})

      // When: 用户尝试获取验证码但失败
      const phoneInput = screen.getByLabelText('手机号')
      await user.type(phoneInput, '13800138001')
      
      const sendCodeBtn = screen.getByRole('button', { name: '获取验证码' })
      await user.click(sendCodeBtn)

      // Then: 应该显示错误提示
      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('发送验证码失败')
      })

      alertSpy.mockRestore()
    })
  })

  describe('用户登录完整流程', () => {
    it('应该完成完整的用户登录流程', async () => {
      // Given: 用户在登录页面
      const user = userEvent.setup()
      const mockOnSubmit = vi.fn()
      const mockOnSendCode = vi.fn()
      
      render(
        <LoginForm
          onSubmit={mockOnSubmit}
          onSendCode={mockOnSendCode}
        />
      )

      // Step 1: 用户输入手机号
      const phoneInput = screen.getByLabelText('手机号')
      await user.type(phoneInput, '13800138002')
      expect(phoneInput).toHaveValue('13800138002')

      // Step 2: 用户点击获取验证码
      const sendCodeBtn = screen.getByRole('button', { name: '获取验证码' })
      await user.click(sendCodeBtn)

      // Then: 应该调用发送验证码API
      expect(mockOnSendCode).toHaveBeenCalledWith('13800138002')

      // Step 3: 用户输入验证码
      const codeInput = screen.getByLabelText('验证码')
      await user.type(codeInput, '654321')
      expect(codeInput).toHaveValue('654321')

      // Step 4: 用户点击登录按钮
      const loginBtn = screen.getByRole('button', { name: '登录' })
      await user.click(loginBtn)

      // Then: 应该调用登录API
      expect(mockOnSubmit).toHaveBeenCalledWith({
        phone: '13800138002',
        code: '654321'
      })
    })

    it('应该处理登录过程中的验证错误', async () => {
      // Given: 用户在登录页面
      const user = userEvent.setup()
      const mockOnSubmit = vi.fn()
      
      render(<LoginForm onSubmit={mockOnSubmit} />)

      // Mock alert
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})

      // When: 用户直接点击登录（未填写信息）
      const loginBtn = screen.getByRole('button', { name: '登录' })
      await user.click(loginBtn)

      // Then: 应该显示错误提示
      expect(alertSpy).toHaveBeenCalledWith('请填写完整信息')
      expect(mockOnSubmit).not.toHaveBeenCalled()

      alertSpy.mockRestore()
    })
  })

  describe('页面切换流程', () => {
    it('应该支持从登录页面切换到注册页面', async () => {
      // Given: 用户在登录页面
      const user = userEvent.setup()
      const mockOnSwitchToRegister = vi.fn()
      
      render(<LoginForm onSwitchToRegister={mockOnSwitchToRegister} />)

      // When: 用户点击注册链接
      const registerLink = screen.getByRole('button', { name: '立即注册' })
      await user.click(registerLink)

      // Then: 应该触发页面切换
      expect(mockOnSwitchToRegister).toHaveBeenCalled()
    })

    it('应该支持从注册页面切换到登录页面', async () => {
      // Given: 用户在注册页面
      const user = userEvent.setup()
      const mockOnSwitchToLogin = vi.fn()
      
      render(<RegisterForm onSwitchToLogin={mockOnSwitchToLogin} />)

      // When: 用户点击登录链接
      const loginLink = screen.getByRole('button', { name: '立即登录' })
      await user.click(loginLink)

      // Then: 应该触发页面切换
      expect(mockOnSwitchToLogin).toHaveBeenCalled()
    })
  })

  describe('验证码倒计时流程', () => {
    it('应该在发送验证码后正确显示倒计时', async () => {
      // Given: 用户在登录页面
      const user = userEvent.setup()
      const mockOnSendCode = vi.fn().mockResolvedValue(undefined)
      
      render(<LoginForm onSendCode={mockOnSendCode} />)

      // When: 用户发送验证码
      const phoneInput = screen.getByLabelText('手机号')
      await user.type(phoneInput, '13800138003')
      
      const sendCodeBtn = screen.getByRole('button', { name: '获取验证码' })
      await user.click(sendCodeBtn)

      // Then: 按钮应该显示倒计时并被禁用
      await waitFor(() => {
        expect(sendCodeBtn).toBeDisabled()
        expect(sendCodeBtn.textContent).toMatch(/\d+s/)
      })
    })

    it('应该在倒计时期间阻止重复发送', async () => {
      // Given: 用户已发送验证码并在倒计时中
      const user = userEvent.setup()
      const mockOnSendCode = vi.fn().mockResolvedValue(undefined)
      
      render(<LoginForm onSendCode={mockOnSendCode} />)

      const phoneInput = screen.getByLabelText('手机号')
      await user.type(phoneInput, '13800138004')
      
      const sendCodeBtn = screen.getByRole('button', { name: '获取验证码' })
      await user.click(sendCodeBtn)

      // When: 倒计时期间再次点击
      await waitFor(() => {
        expect(sendCodeBtn).toBeDisabled()
      })

      // 尝试再次点击
      await user.click(sendCodeBtn)

      // Then: 应该只调用一次发送验证码
      expect(mockOnSendCode).toHaveBeenCalledTimes(1)
    })
  })

  describe('表单状态管理流程', () => {
    it('应该正确管理登录表单的加载状态', async () => {
      // Given: 用户在登录页面
      const user = userEvent.setup()
      const mockOnSubmit = vi.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      )
      
      render(<LoginForm onSubmit={mockOnSubmit} />)

      // When: 用户提交表单
      const phoneInput = screen.getByLabelText('手机号')
      const codeInput = screen.getByLabelText('验证码')
      const loginBtn = screen.getByRole('button', { name: '登录' })

      await user.type(phoneInput, '13800138005')
      await user.type(codeInput, '123456')
      await user.click(loginBtn)

      // Then: 应该显示加载状态
      expect(screen.getByRole('button', { name: '登录中...' })).toBeInTheDocument()
      expect(loginBtn).toBeDisabled()
    })

    it('应该正确管理注册表单的加载状态', async () => {
      // Given: 用户在注册页面
      const user = userEvent.setup()
      const mockOnSubmit = vi.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      )
      
      render(<RegisterForm onSubmit={mockOnSubmit} />)

      // When: 用户填写表单、同意条款并提交
      const phoneInput = screen.getByLabelText('手机号')
      const codeInput = screen.getByLabelText('验证码')
      const registerBtn = screen.getByRole('button', { name: '同意并注册' })

      await user.type(phoneInput, '13800138006')
      await user.type(codeInput, '123456')
      
      const agreeCheckbox = screen.getByRole('checkbox', { name: /已阅读并同意/ })
      await user.click(agreeCheckbox)
      
      await user.click(registerBtn)

      // Then: 应该显示加载状态
      expect(screen.getByRole('button', { name: '注册中...' })).toBeInTheDocument()
      expect(registerBtn).toBeDisabled()
    })
  })

  describe('错误处理流程', () => {
    it('应该处理提交失败的情况', async () => {
      // Given: 用户在登录页面，API返回错误
      const user = userEvent.setup()
      const mockOnSubmit = vi.fn().mockRejectedValue(new Error('登录失败'))
      
      render(<LoginForm onSubmit={mockOnSubmit} />)

      // Mock alert
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})

      // When: 用户提交表单但失败
      const phoneInput = screen.getByLabelText('手机号')
      const codeInput = screen.getByLabelText('验证码')
      const loginBtn = screen.getByRole('button', { name: '登录' })

      await user.type(phoneInput, '13800138007')
      await user.type(codeInput, '123456')
      await user.click(loginBtn)

      // Then: 应该显示错误提示
      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('登录失败')
      })

      alertSpy.mockRestore()
    })

    it('应该在网络错误时显示适当的错误信息', async () => {
      // Given: 用户在注册页面，网络请求失败
      const user = userEvent.setup()
      const mockOnSubmit = vi.fn().mockRejectedValue(new Error('Network Error'))
      
      render(<RegisterForm onSubmit={mockOnSubmit} />)

      // Mock alert
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})

      // When: 用户填写表单、同意条款并提交但网络失败
      const phoneInput = screen.getByLabelText('手机号')
      const codeInput = screen.getByLabelText('验证码')
      const registerBtn = screen.getByRole('button', { name: '同意并注册' })

      await user.type(phoneInput, '13800138008')
      await user.type(codeInput, '123456')
      
      const agreeCheckbox = screen.getByRole('checkbox', { name: /已阅读并同意/ })
      await user.click(agreeCheckbox)
      
      await user.click(registerBtn)

      // Then: 应该显示错误提示
      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('注册失败')
      })

      alertSpy.mockRestore()
    })
  })

  describe('输入限制和格式化流程', () => {
    it('应该正确限制手机号输入长度', async () => {
      // Given: 用户在登录页面
      const user = userEvent.setup()
      render(<LoginForm />)

      // When: 用户输入超长手机号
      const phoneInput = screen.getByLabelText('手机号')
      await user.type(phoneInput, '138001380012345678')

      // Then: 应该只保留11位
      expect(phoneInput).toHaveValue('13800138001')
    })

    it('应该正确限制验证码输入长度', async () => {
      // Given: 用户在注册页面
      const user = userEvent.setup()
      render(<RegisterForm />)

      // When: 用户输入超长验证码
      const codeInput = screen.getByLabelText('验证码')
      await user.type(codeInput, '1234567890')

      // Then: 应该只保留6位
      expect(codeInput).toHaveValue('123456')
    })
  })
});