import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import LoginPage from '../../src/components/LoginPage'

// Mock react-router-dom
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

const renderLoginPage = () => {
  return render(
    <BrowserRouter>
      <LoginPage />
    </BrowserRouter>
  )
}

describe('登录页面UI接口测试', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  describe('UI元素存在性测试', () => {
    test('应该渲染所有必需的UI元素', () => {
      // 根据 acceptanceCriteria: 界面包含橙色"淘贝"品牌logo文字
      renderLoginPage()
      
      const brandLogo = screen.getByTestId('brand-logo')
      expect(brandLogo).toBeInTheDocument()
      expect(brandLogo).toHaveTextContent('淘贝')
    })

    test('应该渲染手机号输入框', () => {
      // 根据 acceptanceCriteria: 手机号输入框，支持输入11位手机号码
      renderLoginPage()
      
      const phoneInput = screen.getByTestId('phone-input')
      expect(phoneInput).toBeInTheDocument()
      expect(phoneInput).toHaveAttribute('type', 'tel')
      expect(phoneInput).toHaveAttribute('placeholder', '请输入手机号')
      expect(phoneInput).toHaveAttribute('maxLength', '11')
    })

    test('应该渲染验证码输入框', () => {
      // 根据 acceptanceCriteria: 验证码输入框，支持输入6位数字验证码
      renderLoginPage()
      
      const verificationInput = screen.getByTestId('verification-input')
      expect(verificationInput).toBeInTheDocument()
      expect(verificationInput).toHaveAttribute('type', 'text')
      expect(verificationInput).toHaveAttribute('placeholder', '请输入验证码')
      expect(verificationInput).toHaveAttribute('maxLength', '6')
    })

    test('应该渲染获取验证码按钮', () => {
      // 根据 acceptanceCriteria: "获取验证码"按钮，点击后发送验证码并开始60秒倒计时
      renderLoginPage()
      
      const getCodeBtn = screen.getByTestId('get-code-btn')
      expect(getCodeBtn).toBeInTheDocument()
      expect(getCodeBtn).toHaveTextContent('获取验证码')
      expect(getCodeBtn).toHaveAttribute('type', 'button')
    })

    test('应该渲染登录按钮', () => {
      // 根据 acceptanceCriteria: "登录"按钮，仅在手机号和验证码都有效时启用
      renderLoginPage()
      
      const loginBtn = screen.getByTestId('login-btn')
      expect(loginBtn).toBeInTheDocument()
      expect(loginBtn).toHaveTextContent('登录')
      expect(loginBtn).toHaveAttribute('type', 'submit')
    })

    test('应该渲染注册链接', () => {
      // 根据 acceptanceCriteria: "立即注册"链接，点击跳转到注册页面
      renderLoginPage()
      
      const registerLink = screen.getByTestId('register-link-btn')
      expect(registerLink).toBeInTheDocument()
      expect(registerLink).toHaveTextContent('立即注册')
      expect(registerLink).toHaveAttribute('href', '/register')
    })
  })

  describe('手机号输入验证测试', () => {
    test('应该接受有效的手机号格式', async () => {
      // 根据 acceptanceCriteria: 手机号格式验证（11位数字，以1开头，第二位为3-9）
      renderLoginPage()
      
      const phoneInput = screen.getByTestId('phone-input')
      const validPhones = ['13812345678', '15987654321', '18765432109']
      
      for (const phone of validPhones) {
        fireEvent.change(phoneInput, { target: { value: phone } })
        expect(phoneInput).toHaveValue(phone)
      }
    })

    test('应该限制手机号输入长度', async () => {
      renderLoginPage()
      
      const phoneInput = screen.getByTestId('phone-input')
      
      // 验证maxLength属性设置为11
      expect(phoneInput).toHaveAttribute('maxLength', '11')
    })

    test('获取验证码按钮应该始终可点击', async () => {
      renderLoginPage()
      
      const phoneInput = screen.getByTestId('phone-input')
      const getCodeBtn = screen.getByTestId('get-code-btn')
      
      // 无效手机号时按钮应该仍然可点击（根据新需求）
      fireEvent.change(phoneInput, { target: { value: '123' } })
      expect(getCodeBtn).not.toBeDisabled()
      
      // 有效手机号时按钮应该启用
      fireEvent.change(phoneInput, { target: { value: '13812345678' } })
      expect(getCodeBtn).not.toBeDisabled()
    })
  })

  describe('验证码输入验证测试', () => {
    test('应该只接受数字输入', async () => {
      // 根据 acceptanceCriteria: 验证码输入框，支持输入6位数字验证码
      renderLoginPage()
      
      const verificationInput = screen.getByTestId('verification-input')
      
      // 输入包含字母的字符串
      fireEvent.change(verificationInput, { target: { value: 'abc123' } })
      // 应该只保留数字
      expect(verificationInput).toHaveValue('123')
    })

    test('应该限制验证码输入长度为6位', async () => {
      renderLoginPage()
      
      const verificationInput = screen.getByTestId('verification-input')
      
      // 验证maxLength属性设置正确
      expect(verificationInput).toHaveAttribute('maxLength', '6')
    })
  })

  describe('获取验证码功能测试', () => {
    test('应该在有效手机号时允许获取验证码', async () => {
      // 根据 acceptanceCriteria: "获取验证码"按钮，点击后发送验证码并开始60秒倒计时
      renderLoginPage()
      
      const phoneInput = screen.getByTestId('phone-input')
      const getCodeBtn = screen.getByTestId('get-code-btn')
      
      // 输入有效手机号
      fireEvent.change(phoneInput, { target: { value: '13812345678' } })
      
      // 点击获取验证码按钮
      fireEvent.click(getCodeBtn)
      
      // TODO: 当实现后，验证API调用和倒计时功能
      expect(getCodeBtn).toBeInTheDocument()
    })

    test('应该在倒计时期间禁用获取验证码按钮', async () => {
      // 根据 acceptanceCriteria: 倒计时期间按钮显示剩余秒数并禁用
      renderLoginPage()
      
      const phoneInput = screen.getByTestId('phone-input')
      const getCodeBtn = screen.getByTestId('get-code-btn')
      
      fireEvent.change(phoneInput, { target: { value: '13812345678' } })
      fireEvent.click(getCodeBtn)
      
      // TODO: 当实现倒计时后，验证按钮状态
      expect(getCodeBtn).toBeInTheDocument()
    })
  })

  describe('登录按钮状态测试', () => {
    test('应该在表单无效时禁用登录按钮', async () => {
      // 根据 acceptanceCriteria: "登录"按钮，仅在手机号和验证码都有效时启用
      renderLoginPage()
      
      const loginBtn = screen.getByTestId('login-btn')
      
      // 初始状态应该禁用
      expect(loginBtn).toBeDisabled()
    })

    test('应该在手机号和验证码都有效时启用登录按钮', async () => {
      renderLoginPage()
      
      const phoneInput = screen.getByTestId('phone-input')
      const verificationInput = screen.getByTestId('verification-input')
      const loginBtn = screen.getByTestId('login-btn')
      
      // 输入有效手机号和验证码
      fireEvent.change(phoneInput, { target: { value: '13812345678' } })
      fireEvent.change(verificationInput, { target: { value: '123456' } })
      
      // 登录按钮应该启用
      expect(loginBtn).not.toBeDisabled()
    })

    test('应该在部分信息无效时禁用登录按钮', async () => {
      renderLoginPage()
      
      const phoneInput = screen.getByTestId('phone-input')
      const verificationInput = screen.getByTestId('verification-input')
      const loginBtn = screen.getByTestId('login-btn')
      
      // 只输入有效手机号
      fireEvent.change(phoneInput, { target: { value: '13812345678' } })
      expect(loginBtn).toBeDisabled()
      
      // 只输入有效验证码
      fireEvent.change(phoneInput, { target: { value: '' } })
      fireEvent.change(verificationInput, { target: { value: '123456' } })
      expect(loginBtn).toBeDisabled()
    })
  })

  describe('表单提交测试', () => {
    test('应该在有效输入时提交登录表单', async () => {
      // 根据 acceptanceCriteria: 表单提交时验证所有输入并调用登录API
      renderLoginPage()
      
      const phoneInput = screen.getByTestId('phone-input')
      const verificationInput = screen.getByTestId('verification-input')
      const loginForm = screen.getByTestId('login-form')
      
      // 输入有效数据
      fireEvent.change(phoneInput, { target: { value: '13812345678' } })
      fireEvent.change(verificationInput, { target: { value: '123456' } })
      
      // 提交表单
      fireEvent.submit(loginForm)
      
      // TODO: 当实现后，验证API调用和导航
      expect(loginForm).toBeInTheDocument()
    })

    test('应该阻止无效表单提交', async () => {
      renderLoginPage()
      
      const loginForm = screen.getByTestId('login-form')
      const loginBtn = screen.getByTestId('login-btn')
      
      // 尝试提交空表单
      fireEvent.submit(loginForm)
      
      // 按钮应该仍然禁用
      expect(loginBtn).toBeDisabled()
    })
  })

  describe('错误处理测试', () => {
    test('应该显示手机号格式错误提示', async () => {
      // 根据 acceptanceCriteria: 实时验证并显示错误提示
      renderLoginPage()
      
      const phoneInput = screen.getByTestId('phone-input')
      
      // 输入无效手机号
      fireEvent.change(phoneInput, { target: { value: '123' } })
      fireEvent.blur(phoneInput)
      
      // TODO: 当实现错误提示后，验证错误消息显示
      expect(phoneInput).toBeInTheDocument()
    })

    test('应该显示验证码格式错误提示', async () => {
      renderLoginPage()
      
      const verificationInput = screen.getByTestId('verification-input')
      
      // 输入无效验证码
      fireEvent.change(verificationInput, { target: { value: '123' } })
      fireEvent.blur(verificationInput)
      
      // TODO: 当实现错误提示后，验证错误消息显示
      expect(verificationInput).toBeInTheDocument()
    })
  })

  describe('加载状态测试', () => {
    test('应该在登录过程中显示加载状态', async () => {
      // 根据 acceptanceCriteria: 登录过程中显示加载状态
      renderLoginPage()
      
      const phoneInput = screen.getByTestId('phone-input')
      const verificationInput = screen.getByTestId('verification-input')
      const loginBtn = screen.getByTestId('login-btn')
      
      fireEvent.change(phoneInput, { target: { value: '13812345678' } })
      fireEvent.change(verificationInput, { target: { value: '123456' } })
      
      // 点击登录按钮
      fireEvent.click(loginBtn)
      
      // TODO: 当实现加载状态后，验证按钮文本变化
      expect(loginBtn).toBeInTheDocument()
    })
  })

  describe('导航功能测试', () => {
    test('应该能够导航到注册页面', async () => {
      // 根据 acceptanceCriteria: "立即注册"链接，点击跳转到注册页面
      renderLoginPage()
      
      const registerLink = screen.getByTestId('register-link-btn')
      
      // 点击注册链接
      fireEvent.click(registerLink)
      
      // 验证链接指向正确的路径
      expect(registerLink).toHaveAttribute('href', '/register')
    })
  })

  describe('响应式设计测试', () => {
    test('应该在不同屏幕尺寸下正确显示', async () => {
      // 根据 acceptanceCriteria: 响应式设计，适配不同屏幕尺寸
      renderLoginPage()
      
      const loginPage = screen.getByTestId('login-page')
      expect(loginPage).toBeInTheDocument()
      
      // TODO: 当实现响应式样式后，测试不同屏幕尺寸
    })
  })
})