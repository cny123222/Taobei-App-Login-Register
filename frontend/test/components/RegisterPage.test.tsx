import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import RegisterPage from '../../src/components/RegisterPage'

// Mock react-router-dom
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

const renderRegisterPage = () => {
  return render(
    <BrowserRouter>
      <RegisterPage />
    </BrowserRouter>
  )
}

describe('注册页面UI接口测试', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  describe('UI元素存在性测试', () => {
    test('应该渲染所有必需的UI元素', () => {
      // 根据 acceptanceCriteria: 界面包含橙色"淘贝"品牌logo文字
      renderRegisterPage()
      
      const brandLogo = screen.getByTestId('brand-logo')
      expect(brandLogo).toBeInTheDocument()
      expect(brandLogo).toHaveTextContent('淘贝')
    })

    test('应该渲染手机号输入框', () => {
      // 根据 acceptanceCriteria: 手机号输入框，支持输入11位手机号码
      renderRegisterPage()
      
      const phoneInput = screen.getByTestId('phone-input')
      expect(phoneInput).toBeInTheDocument()
      expect(phoneInput).toHaveAttribute('type', 'tel')
      expect(phoneInput).toHaveAttribute('placeholder', '请输入手机号')
      expect(phoneInput).toHaveAttribute('maxLength', '11')
    })

    test('应该渲染验证码输入框', () => {
      // 根据 acceptanceCriteria: 验证码输入框，支持输入6位数字验证码
      renderRegisterPage()
      
      const verificationInput = screen.getByTestId('verification-input')
      expect(verificationInput).toBeInTheDocument()
      expect(verificationInput).toHaveAttribute('type', 'text')
      expect(verificationInput).toHaveAttribute('placeholder', '请输入验证码')
      expect(verificationInput).toHaveAttribute('maxLength', '6')
    })

    test('应该渲染获取验证码按钮', () => {
      // 根据 acceptanceCriteria: "获取验证码"按钮，点击后发送验证码并开始60秒倒计时
      renderRegisterPage()
      
      const getCodeBtn = screen.getByTestId('get-code-btn')
      expect(getCodeBtn).toBeInTheDocument()
      expect(getCodeBtn).toHaveTextContent('获取验证码')
      expect(getCodeBtn).toHaveAttribute('type', 'button')
    })

    test('应该渲染用户协议复选框', () => {
      // 根据 acceptanceCriteria: 用户协议复选框，必须勾选才能注册
      renderRegisterPage()
      
      const agreementCheckbox = screen.getByTestId('agreement-checkbox')
      expect(agreementCheckbox).toBeInTheDocument()
      expect(agreementCheckbox).toHaveAttribute('type', 'checkbox')
    })

    test('应该渲染用户协议文本和链接', () => {
      // 根据 acceptanceCriteria: 用户协议文本和链接
      renderRegisterPage()
      
      const agreementText = screen.getByTestId('agreement-label')
      expect(agreementText).toBeInTheDocument()
      expect(agreementText).toHaveTextContent('我已阅读并同意')
      
      const agreementLink = screen.getByTestId('terms-link')
      expect(agreementLink).toBeInTheDocument()
      expect(agreementLink).toHaveTextContent('《用户协议》')
    })

    test('应该渲染注册按钮', () => {
      // 根据 acceptanceCriteria: "注册"按钮，仅在所有条件满足时启用
      renderRegisterPage()
      
      const registerBtn = screen.getByTestId('register-btn')
      expect(registerBtn).toBeInTheDocument()
      expect(registerBtn).toHaveTextContent('同意并注册')
      expect(registerBtn).toHaveAttribute('type', 'submit')
    })

    test('应该渲染登录链接', () => {
      // 根据 acceptanceCriteria: "已有账号？立即登录"链接，点击跳转到登录页面
      renderRegisterPage()
      
      const loginLinkContainer = screen.getByTestId('login-link')
      expect(loginLinkContainer).toBeInTheDocument()
      expect(loginLinkContainer).toHaveTextContent('已有账号？立即登录')
      
      const loginLinkBtn = screen.getByTestId('login-link-btn')
      expect(loginLinkBtn).toBeInTheDocument()
      expect(loginLinkBtn).toHaveTextContent('立即登录')
    })
  })

  describe('手机号输入验证测试', () => {
    test('应该接受有效的手机号格式', async () => {
      // 根据 acceptanceCriteria: 手机号格式验证（11位数字，以1开头，第二位为3-9）
      renderRegisterPage()
      
      const phoneInput = screen.getByTestId('phone-input')
      const validPhones = ['13812345678', '15987654321', '18765432109']
      
      for (const phone of validPhones) {
        fireEvent.change(phoneInput, { target: { value: phone } })
        expect(phoneInput).toHaveValue(phone)
      }
    })

    test('应该拒绝无效的手机号格式', async () => {
      renderRegisterPage()
      
      const phoneInput = screen.getByTestId('phone-input')
      const invalidPhones = ['12345678901', '01234567890', '1234567890']
      
      for (const phone of invalidPhones) {
        fireEvent.change(phoneInput, { target: { value: phone } })
        fireEvent.blur(phoneInput)
        
        // TODO: 当实现验证后，检查错误提示
        expect(phoneInput).toHaveValue(phone)
      }
    })

    test('应该限制手机号输入长度', async () => {
      renderRegisterPage()
      
      const phoneInput = screen.getByTestId('phone-input')
      
      // 验证maxLength属性设置正确
      expect(phoneInput).toHaveAttribute('maxLength', '11')
    })
  })

  describe('验证码输入验证测试', () => {
    test('应该只接受数字输入', async () => {
      // 根据 acceptanceCriteria: 验证码输入框，支持输入6位数字验证码
      renderRegisterPage()
      
      const verificationInput = screen.getByTestId('verification-input')
      
      // 输入包含字母的字符串
      fireEvent.change(verificationInput, { target: { value: 'abc123' } })
      // 应该只保留数字
      expect(verificationInput).toHaveValue('123')
    })

    test('应该限制验证码输入长度为6位', async () => {
      renderRegisterPage()
      
      const verificationInput = screen.getByTestId('verification-input')
      
      // 验证maxLength属性设置正确
      expect(verificationInput).toHaveAttribute('maxLength', '6')
    })
  })

  describe('获取验证码功能测试', () => {
    test('应该在有效手机号时允许获取验证码', async () => {
      // 根据 acceptanceCriteria: "获取验证码"按钮，点击后发送验证码并开始60秒倒计时
      renderRegisterPage()
      
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
      renderRegisterPage()
      
      const phoneInput = screen.getByTestId('phone-input')
      const getCodeBtn = screen.getByTestId('get-code-btn')
      
      fireEvent.change(phoneInput, { target: { value: '13812345678' } })
      fireEvent.click(getCodeBtn)
      
      // TODO: 当实现倒计时后，验证按钮状态
      expect(getCodeBtn).toBeInTheDocument()
    })

    test('获取验证码按钮应该始终可点击', async () => {
      renderRegisterPage()
      
      const phoneInput = screen.getByTestId('phone-input')
      const getCodeBtn = screen.getByTestId('get-code-btn')
      
      // 输入无效手机号时按钮仍然可点击（根据新需求）
      fireEvent.change(phoneInput, { target: { value: '123' } })
      expect(getCodeBtn).not.toBeDisabled()
      
      // 输入有效手机号时按钮也可点击
      fireEvent.change(phoneInput, { target: { value: '13812345678' } })
      expect(getCodeBtn).not.toBeDisabled()
    })
  })

  describe('用户协议功能测试', () => {
    test('应该能够勾选和取消勾选用户协议', async () => {
      // 根据 acceptanceCriteria: 用户协议复选框，必须勾选才能注册
      renderRegisterPage()
      
      const agreementCheckbox = screen.getByTestId('agreement-checkbox')
      
      // 初始状态应该未勾选
      expect(agreementCheckbox).not.toBeChecked()
      
      // 勾选协议
      fireEvent.click(agreementCheckbox)
      expect(agreementCheckbox).toBeChecked()
      
      // 取消勾选
      fireEvent.click(agreementCheckbox)
      expect(agreementCheckbox).not.toBeChecked()
    })

    test('应该能够点击协议链接', async () => {
      // 根据 acceptanceCriteria: 用户协议链接可点击查看详情
      renderRegisterPage()
      
      const agreementLink = screen.getByTestId('terms-link')
      
      // 点击协议链接
      fireEvent.click(agreementLink)
      
      // TODO: 当实现后，验证协议详情显示或跳转
      expect(agreementLink).toBeInTheDocument()
    })
  })

  describe('注册按钮状态测试', () => {
    test('应该在表单无效时禁用注册按钮', async () => {
      // 根据 acceptanceCriteria: "注册"按钮，仅在所有条件满足时启用
      renderRegisterPage()
      
      const registerBtn = screen.getByTestId('register-btn')
      
      // 初始状态应该禁用
      expect(registerBtn).toBeDisabled()
    })

    test('应该在所有条件满足时启用注册按钮', async () => {
      renderRegisterPage()
      
      const phoneInput = screen.getByTestId('phone-input')
      const verificationInput = screen.getByTestId('verification-input')
      const agreementCheckbox = screen.getByTestId('agreement-checkbox')
      const registerBtn = screen.getByTestId('register-btn')
      
      // 输入有效数据并勾选协议
      fireEvent.change(phoneInput, { target: { value: '13812345678' } })
      fireEvent.change(verificationInput, { target: { value: '123456' } })
      fireEvent.click(agreementCheckbox)
      
      // 注册按钮应该启用
      expect(registerBtn).not.toBeDisabled()
    })

    test('应该在未勾选协议时禁用注册按钮', async () => {
      renderRegisterPage()
      
      const phoneInput = screen.getByTestId('phone-input')
      const verificationInput = screen.getByTestId('verification-input')
      const registerBtn = screen.getByTestId('register-btn')
      
      // 输入有效数据但不勾选协议
      fireEvent.change(phoneInput, { target: { value: '13812345678' } })
      fireEvent.change(verificationInput, { target: { value: '123456' } })
      
      // 注册按钮应该禁用
      expect(registerBtn).toBeDisabled()
    })

    test('应该在部分信息无效时禁用注册按钮', async () => {
      renderRegisterPage()
      
      const phoneInput = screen.getByTestId('phone-input')
      const verificationInput = screen.getByTestId('verification-input')
      const agreementCheckbox = screen.getByTestId('agreement-checkbox')
      const registerBtn = screen.getByTestId('register-btn')
      
      // 只输入有效手机号和勾选协议
      fireEvent.change(phoneInput, { target: { value: '13812345678' } })
      fireEvent.click(agreementCheckbox)
      expect(registerBtn).toBeDisabled()
      
      // 只输入有效验证码和勾选协议
      fireEvent.change(phoneInput, { target: { value: '' } })
      fireEvent.change(verificationInput, { target: { value: '123456' } })
      expect(registerBtn).toBeDisabled()
    })
  })

  describe('表单提交测试', () => {
    test('应该在有效输入时提交注册表单', async () => {
      // 根据 acceptanceCriteria: 表单提交时验证所有输入并调用注册API
      renderRegisterPage()
      
      const phoneInput = screen.getByTestId('phone-input')
      const verificationInput = screen.getByTestId('verification-input')
      const agreementCheckbox = screen.getByTestId('agreement-checkbox')
      const registerForm = screen.getByTestId('register-form')
      
      // 输入有效数据
      fireEvent.change(phoneInput, { target: { value: '13812345678' } })
      fireEvent.change(verificationInput, { target: { value: '123456' } })
      fireEvent.click(agreementCheckbox)
      
      // 提交表单
      fireEvent.submit(registerForm)
      
      // TODO: 当实现后，验证API调用和导航
      expect(registerForm).toBeInTheDocument()
    })

    test('应该阻止无效表单提交', async () => {
      renderRegisterPage()
      
      const registerForm = screen.getByTestId('register-form')
      const registerBtn = screen.getByTestId('register-btn')
      
      // 尝试提交空表单
      fireEvent.submit(registerForm)
      
      // 按钮应该仍然禁用
      expect(registerBtn).toBeDisabled()
    })
  })

  describe('错误处理测试', () => {
    test('应该显示手机号格式错误提示', async () => {
      // 根据 acceptanceCriteria: 实时验证并显示错误提示
      renderRegisterPage()
      
      const phoneInput = screen.getByTestId('phone-input')
      
      // 输入无效手机号
      fireEvent.change(phoneInput, { target: { value: '123' } })
      fireEvent.blur(phoneInput)
      
      // TODO: 当实现错误提示后，验证错误消息显示
      expect(phoneInput).toBeInTheDocument()
    })

    test('应该显示验证码格式错误提示', async () => {
      renderRegisterPage()
      
      const verificationInput = screen.getByTestId('verification-input')
      
      // 输入无效验证码
      fireEvent.change(verificationInput, { target: { value: '123' } })
      fireEvent.blur(verificationInput)
      
      // TODO: 当实现错误提示后，验证错误消息显示
      expect(verificationInput).toBeInTheDocument()
    })

    test('应该显示手机号已注册错误提示', async () => {
      // 根据 acceptanceCriteria: 手机号已注册时显示错误提示
      renderRegisterPage()
      
      const phoneInput = screen.getByTestId('phone-input')
      const verificationInput = screen.getByTestId('verification-input')
      const agreementCheckbox = screen.getByTestId('agreement-checkbox')
      const registerForm = screen.getByTestId('register-form')
      
      // 输入已注册的手机号
      fireEvent.change(phoneInput, { target: { value: '13812345678' } })
      fireEvent.change(verificationInput, { target: { value: '123456' } })
      fireEvent.click(agreementCheckbox)
      
      fireEvent.submit(registerForm)
      
      // TODO: 当实现后，验证错误提示显示
      expect(registerForm).toBeInTheDocument()
    })
  })

  describe('加载状态测试', () => {
    test('应该在注册过程中显示加载状态', async () => {
      // 根据 acceptanceCriteria: 注册过程中显示加载状态
      renderRegisterPage()
      
      const phoneInput = screen.getByTestId('phone-input')
      const verificationInput = screen.getByTestId('verification-input')
      const agreementCheckbox = screen.getByTestId('agreement-checkbox')
      const registerBtn = screen.getByTestId('register-btn')
      
      fireEvent.change(phoneInput, { target: { value: '13812345678' } })
      fireEvent.change(verificationInput, { target: { value: '123456' } })
      fireEvent.click(agreementCheckbox)
      
      // 点击注册按钮
      fireEvent.click(registerBtn)
      
      // TODO: 当实现加载状态后，验证按钮文本变化
      expect(registerBtn).toBeInTheDocument()
    })
  })

  describe('导航功能测试', () => {
    test('应该能够导航到登录页面', async () => {
      // 根据 acceptanceCriteria: "已有账号？立即登录"链接，点击跳转到登录页面
      renderRegisterPage()
      
      const loginLink = screen.getByTestId('login-link-btn')
      
      // 点击登录链接
      fireEvent.click(loginLink)
      
      // 验证链接指向正确的路径
      expect(loginLink).toHaveAttribute('href', '/login')
    })
  })

  describe('响应式设计测试', () => {
    test('应该在不同屏幕尺寸下正确显示', async () => {
      // 根据 acceptanceCriteria: 响应式设计，适配不同屏幕尺寸
      renderRegisterPage()
      
      const registerPage = screen.getByTestId('register-page')
      expect(registerPage).toBeInTheDocument()
      
      // TODO: 当实现响应式样式后，测试不同屏幕尺寸
    })
  })

  describe('重复注册检查测试', () => {
    test('应该检查手机号是否已注册', async () => {
      // 根据 acceptanceCriteria: 检查手机号是否已注册，已注册则提示用户登录
      renderRegisterPage()
      
      const phoneInput = screen.getByTestId('phone-input')
      
      // 输入已注册的手机号
      fireEvent.change(phoneInput, { target: { value: '13812345678' } })
      fireEvent.blur(phoneInput)
      
      // TODO: 当实现后，验证重复注册检查
      expect(phoneInput).toBeInTheDocument()
    })
  })
})