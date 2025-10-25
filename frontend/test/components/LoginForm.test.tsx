import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LoginForm from '../../src/components/LoginForm'

describe('LoginForm Component Tests', () => {
  const mockOnSubmit = vi.fn()
  const mockOnSendCode = vi.fn()
  const mockOnSwitchToRegister = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('UI-LoginForm 界面渲染', () => {
    it('应该渲染所有必需的界面元素', () => {
      // When: 渲染登录表单
      render(
        <LoginForm
          onSubmit={mockOnSubmit}
          onSendCode={mockOnSendCode}
          onSwitchToRegister={mockOnSwitchToRegister}
        />
      )

      // Then: 应该显示所有必需元素
      expect(screen.getByText('用户登录')).toBeInTheDocument()
      expect(screen.getByLabelText('手机号')).toBeInTheDocument()
      expect(screen.getByLabelText('验证码')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '获取验证码' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '登录' })).toBeInTheDocument()
      expect(screen.getByText('还没有账号？')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '立即注册' })).toBeInTheDocument()
    })

    it('应该显示正确的输入框占位符', () => {
      // When: 渲染登录表单
      render(<LoginForm />)

      // Then: 应该显示正确的占位符文本
      expect(screen.getByPlaceholderText('请输入手机号')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('请输入验证码')).toBeInTheDocument()
    })

    it('应该设置正确的输入框属性', () => {
      // When: 渲染登录表单
      render(<LoginForm />)

      // Then: 手机号输入框应该有正确属性
      const phoneInput = screen.getByLabelText('手机号')
      expect(phoneInput).toHaveAttribute('type', 'tel')
      expect(phoneInput).toHaveAttribute('maxLength', '11')

      // And: 验证码输入框应该有正确属性
      const codeInput = screen.getByLabelText('验证码')
      expect(codeInput).toHaveAttribute('type', 'text')
      expect(codeInput).toHaveAttribute('maxLength', '6')
    })
  })

  describe('UI-LoginForm 手机号输入验证', () => {
    it('应该允许输入有效的手机号', async () => {
      // Given: 渲染登录表单
      const user = userEvent.setup()
      render(<LoginForm />)
      const phoneInput = screen.getByLabelText('手机号')

      // When: 输入有效手机号
      await user.type(phoneInput, '13800138001')

      // Then: 输入值应该被正确设置
      expect(phoneInput).toHaveValue('13800138001')
    })

    it('应该限制手机号输入长度为11位', async () => {
      // Given: 渲染登录表单
      const user = userEvent.setup()
      render(<LoginForm />)
      const phoneInput = screen.getByLabelText('手机号')

      // When: 输入超过11位的号码
      await user.type(phoneInput, '138001380012345')

      // Then: 应该只保留前11位
      expect(phoneInput).toHaveValue('13800138001')
    })

    it('应该在手机号格式错误时显示错误提示', async () => {
      // Given: 渲染登录表单
      const user = userEvent.setup()
      render(<LoginForm onSendCode={mockOnSendCode} />)
      const phoneInput = screen.getByLabelText('手机号')
      const sendCodeBtn = screen.getByRole('button', { name: '获取验证码' })

      // Mock alert
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})

      // When: 输入无效手机号并点击获取验证码
      await user.type(phoneInput, '123')
      await user.click(sendCodeBtn)

      // Then: 应该显示错误提示
      expect(alertSpy).toHaveBeenCalledWith('请输入正确的手机号')
      expect(mockOnSendCode).not.toHaveBeenCalled()

      alertSpy.mockRestore()
    })
  })

  describe('UI-LoginForm 验证码输入验证', () => {
    it('应该允许输入6位验证码', async () => {
      // Given: 渲染登录表单
      const user = userEvent.setup()
      render(<LoginForm />)
      const codeInput = screen.getByLabelText('验证码')

      // When: 输入6位验证码
      await user.type(codeInput, '123456')

      // Then: 输入值应该被正确设置
      expect(codeInput).toHaveValue('123456')
    })

    it('应该限制验证码输入长度为6位', async () => {
      // Given: 渲染登录表单
      const user = userEvent.setup()
      render(<LoginForm />)
      const codeInput = screen.getByLabelText('验证码')

      // When: 输入超过6位的验证码
      await user.type(codeInput, '1234567890')

      // Then: 应该只保留前6位
      expect(codeInput).toHaveValue('123456')
    })
  })

  describe('UI-LoginForm 获取验证码功能', () => {
    it('应该在手机号有效时调用发送验证码回调', async () => {
      // Given: 渲染登录表单
      const user = userEvent.setup()
      render(<LoginForm onSendCode={mockOnSendCode} />)
      const phoneInput = screen.getByLabelText('手机号')
      const sendCodeBtn = screen.getByRole('button', { name: '获取验证码' })

      // When: 输入有效手机号并点击获取验证码
      await user.type(phoneInput, '13800138001')
      await user.click(sendCodeBtn)

      // Then: 应该调用发送验证码回调
      expect(mockOnSendCode).toHaveBeenCalledWith('13800138001')
    })

    it('应该在发送验证码后开始倒计时', async () => {
      // Given: 渲染登录表单
      const user = userEvent.setup()
      mockOnSendCode.mockResolvedValue(undefined)
      render(<LoginForm onSendCode={mockOnSendCode} />)
      const phoneInput = screen.getByLabelText('手机号')
      const sendCodeBtn = screen.getByRole('button', { name: '获取验证码' })

      // When: 发送验证码
      await user.type(phoneInput, '13800138001')
      await user.click(sendCodeBtn)

      // Then: 按钮应该显示倒计时并被禁用
      await waitFor(() => {
        expect(sendCodeBtn).toBeDisabled()
        expect(sendCodeBtn.textContent).toMatch(/\d+s/)
      })
    })

    it('应该在倒计时期间禁用发送验证码按钮', async () => {
      // Given: 渲染登录表单并发送验证码
      const user = userEvent.setup()
      mockOnSendCode.mockResolvedValue(undefined)
      render(<LoginForm onSendCode={mockOnSendCode} />)
      const phoneInput = screen.getByLabelText('手机号')
      const sendCodeBtn = screen.getByRole('button', { name: '获取验证码' })

      await user.type(phoneInput, '13800138001')
      await user.click(sendCodeBtn)

      // When: 倒计时期间再次点击
      await waitFor(() => {
        expect(sendCodeBtn).toBeDisabled()
      })

      // Then: 按钮应该保持禁用状态
      expect(sendCodeBtn).toBeDisabled()
    })

    it('应该在发送验证码失败时显示错误提示', async () => {
      // Given: 渲染登录表单
      const user = userEvent.setup()
      const error = new Error('网络错误')
      mockOnSendCode.mockRejectedValue(error)
      render(<LoginForm onSendCode={mockOnSendCode} />)
      const phoneInput = screen.getByLabelText('手机号')
      const sendCodeBtn = screen.getByRole('button', { name: '获取验证码' })

      // Mock alert
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})

      // When: 发送验证码失败
      await user.type(phoneInput, '13800138001')
      await user.click(sendCodeBtn)

      // Then: 应该显示错误提示
      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('发送验证码失败')
      })

      alertSpy.mockRestore()
    })
  })

  describe('UI-LoginForm 登录提交功能', () => {
    it('应该在信息完整时调用提交回调', async () => {
      // Given: 渲染登录表单
      const user = userEvent.setup()
      render(<LoginForm onSubmit={mockOnSubmit} />)
      const phoneInput = screen.getByLabelText('手机号')
      const codeInput = screen.getByLabelText('验证码')
      const submitBtn = screen.getByRole('button', { name: '登录' })

      // When: 填写完整信息并提交
      await user.type(phoneInput, '13800138001')
      await user.type(codeInput, '123456')
      await user.click(submitBtn)

      // Then: 应该调用提交回调
      expect(mockOnSubmit).toHaveBeenCalledWith({
        phone: '13800138001',
        code: '123456'
      })
    })

    it('应该在信息不完整时显示错误提示', async () => {
      // Given: 渲染登录表单
      const user = userEvent.setup()
      render(<LoginForm onSubmit={mockOnSubmit} />)
      const submitBtn = screen.getByRole('button', { name: '登录' })

      // Mock alert
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})

      // When: 不填写信息直接提交
      await user.click(submitBtn)

      // Then: 应该显示错误提示
      expect(alertSpy).toHaveBeenCalledWith('请填写完整信息')
      expect(mockOnSubmit).not.toHaveBeenCalled()

      alertSpy.mockRestore()
    })

    it('应该在提交期间显示加载状态', async () => {
      // Given: 渲染登录表单
      const user = userEvent.setup()
      mockOnSubmit.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
      render(<LoginForm onSubmit={mockOnSubmit} />)
      const phoneInput = screen.getByLabelText('手机号')
      const codeInput = screen.getByLabelText('验证码')
      const submitBtn = screen.getByRole('button', { name: '登录' })

      // When: 提交表单
      await user.type(phoneInput, '13800138001')
      await user.type(codeInput, '123456')
      await user.click(submitBtn)

      // Then: 应该显示加载状态
      expect(screen.getByRole('button', { name: '登录中...' })).toBeInTheDocument()
      expect(submitBtn).toBeDisabled()
    })

    it('应该在提交失败时显示错误提示', async () => {
      // Given: 渲染登录表单
      const user = userEvent.setup()
      const error = new Error('登录失败')
      mockOnSubmit.mockRejectedValue(error)
      render(<LoginForm onSubmit={mockOnSubmit} />)
      const phoneInput = screen.getByLabelText('手机号')
      const codeInput = screen.getByLabelText('验证码')
      const submitBtn = screen.getByRole('button', { name: '登录' })

      // Mock alert
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})

      // When: 提交失败
      await user.type(phoneInput, '13800138001')
      await user.type(codeInput, '123456')
      await user.click(submitBtn)

      // Then: 应该显示错误提示
      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('登录失败')
      })

      alertSpy.mockRestore()
    })
  })

  describe('UI-LoginForm 页面跳转功能', () => {
    it('应该在点击注册链接时调用切换回调', async () => {
      // Given: 渲染登录表单
      const user = userEvent.setup()
      render(<LoginForm onSwitchToRegister={mockOnSwitchToRegister} />)
      const registerLink = screen.getByRole('button', { name: '立即注册' })

      // When: 点击注册链接
      await user.click(registerLink)

      // Then: 应该调用切换回调
      expect(mockOnSwitchToRegister).toHaveBeenCalled()
    })
  })

  describe('UI-LoginForm 状态管理', () => {
    it('应该正确管理表单状态', async () => {
      // Given: 渲染登录表单
      const user = userEvent.setup()
      render(<LoginForm />)
      const phoneInput = screen.getByLabelText('手机号')
      const codeInput = screen.getByLabelText('验证码')

      // When: 输入数据
      await user.type(phoneInput, '13800138001')
      await user.type(codeInput, '123456')

      // Then: 状态应该被正确更新
      expect(phoneInput).toHaveValue('13800138001')
      expect(codeInput).toHaveValue('123456')
    })

    it('应该在组件重新渲染时保持状态', () => {
      // Given: 渲染登录表单
      const { rerender } = render(<LoginForm />)
      const phoneInput = screen.getByLabelText('手机号')

      // When: 输入数据后重新渲染
      fireEvent.change(phoneInput, { target: { value: '13800138001' } })
      rerender(<LoginForm />)

      // Then: 状态应该被保持
      expect(screen.getByLabelText('手机号')).toHaveValue('13800138001')
    })
  })
})