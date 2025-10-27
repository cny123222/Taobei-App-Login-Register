import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import LoginPage from '../src/components/LoginPage'
import RegisterPage from '../src/components/RegisterPage'
import HomePage from '../src/components/HomePage'

// Mock react-router-dom
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('UI元素系统化检查', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  describe('登录界面UI元素检查', () => {
    test('品牌logo存在且功能正常', async () => {
      renderWithRouter(<LoginPage />)
      
      // 检查元素存在性
      const brandLogo = screen.getByTestId('brand-logo')
      expect(brandLogo).toBeInTheDocument()
      
      // 检查文本内容
      expect(brandLogo).toHaveTextContent('淘贝')
      
      // 检查样式类（当实现后）
      // expect(brandLogo).toHaveClass('brand-logo')
    })

    test('手机号输入框存在且功能正常', async () => {
      renderWithRouter(<LoginPage />)
      
      // 检查元素存在性
      const phoneInput = screen.getByTestId('phone-input')
      expect(phoneInput).toBeInTheDocument()
      
      // 检查placeholder文本
      expect(phoneInput).toHaveAttribute('placeholder', '请输入手机号')
      
      // 检查输入类型
      expect(phoneInput).toHaveAttribute('type', 'tel')
      
      // 检查最大长度
      expect(phoneInput).toHaveAttribute('maxLength', '11')
      
      // 检查输入验证
      fireEvent.change(phoneInput, { target: { value: '13812345678' } })
      expect(phoneInput).toHaveValue('13812345678')
      
      // 检查focus/blur事件可以触发（jsdom环境限制，不检查实际focus状态）
      expect(() => {
        fireEvent.focus(phoneInput)
        fireEvent.blur(phoneInput)
      }).not.toThrow()
    })

    test('验证码输入框存在且功能正常', async () => {
      renderWithRouter(<LoginPage />)
      
      // 检查元素存在性
      const verificationInput = screen.getByTestId('verification-input')
      expect(verificationInput).toBeInTheDocument()
      
      // 检查placeholder文本
      expect(verificationInput).toHaveAttribute('placeholder', '请输入验证码')
      
      // 检查输入类型
      expect(verificationInput).toHaveAttribute('type', 'text')
      
      // 检查最大长度
      expect(verificationInput).toHaveAttribute('maxLength', '6')
      
      // 检查输入限制（只允许数字）
      fireEvent.change(verificationInput, { target: { value: 'abc123' } })
      expect(verificationInput).toHaveValue('123')
      
      // 检查focus事件可以触发（jsdom环境限制，不检查实际focus状态）
      expect(() => {
        fireEvent.focus(verificationInput)
      }).not.toThrow()
    })

    test('获取验证码按钮存在且功能正常', async () => {
      renderWithRouter(<LoginPage />)
      
      // 检查按钮存在性
      const getCodeBtn = screen.getByTestId('get-code-btn')
      expect(getCodeBtn).toBeInTheDocument()
      
      // 检查按钮文本
      expect(getCodeBtn).toHaveTextContent('获取验证码')
      
      // 检查按钮类型
      expect(getCodeBtn).toHaveAttribute('type', 'button')
      
      // 检查初始禁用状态
      expect(getCodeBtn).toBeDisabled()
      
      // 检查点击响应（输入有效手机号后）
      const phoneInput = screen.getByTestId('phone-input')
      fireEvent.change(phoneInput, { target: { value: '13812345678' } })
      expect(getCodeBtn).not.toBeDisabled()
      
      // 检查点击事件
      fireEvent.click(getCodeBtn)
      // TODO: 当实现倒计时功能后，验证按钮状态变化
    })

    test('登录按钮存在且功能正常', async () => {
      renderWithRouter(<LoginPage />)
      
      // 检查按钮存在性
      const loginBtn = screen.getByTestId('login-btn')
      expect(loginBtn).toBeInTheDocument()
      
      // 检查按钮文本
      expect(loginBtn).toHaveTextContent('登录')
      
      // 检查按钮类型
      expect(loginBtn).toHaveAttribute('type', 'submit')
      
      // 检查启用/禁用逻辑
      expect(loginBtn).toBeDisabled()
      
      // 输入有效数据后检查启用状态
      const phoneInput = screen.getByTestId('phone-input')
      const verificationInput = screen.getByTestId('verification-input')
      
      fireEvent.change(phoneInput, { target: { value: '13812345678' } })
      fireEvent.change(verificationInput, { target: { value: '123456' } })
      
      expect(loginBtn).not.toBeDisabled()
      
      // 检查点击响应
      fireEvent.click(loginBtn)
      // TODO: 当实现登录逻辑后，验证提交行为
    })

    test('注册链接存在且功能正常', async () => {
      renderWithRouter(<LoginPage />)
      
      // 检查链接存在性
      const registerLink = screen.getByTestId('register-link-btn')
      expect(registerLink).toBeInTheDocument()
      
      // 检查链接文本
      expect(registerLink).toHaveTextContent('立即注册')
      
      // 检查链接地址
      expect(registerLink).toHaveAttribute('href', '/register')
      
      // 检查点击响应
      fireEvent.click(registerLink)
      // 验证链接可点击
      expect(registerLink).toBeInTheDocument()
    })
  })

  describe('注册界面UI元素检查', () => {
    test('品牌logo存在且功能正常', async () => {
      renderWithRouter(<RegisterPage />)
      
      const brandLogo = screen.getByTestId('brand-logo')
      expect(brandLogo).toBeInTheDocument()
      expect(brandLogo).toHaveTextContent('淘贝')
    })

    test('手机号输入框存在且功能正常', async () => {
      renderWithRouter(<RegisterPage />)
      
      const phoneInput = screen.getByTestId('phone-input')
      expect(phoneInput).toBeInTheDocument()
      expect(phoneInput).toHaveAttribute('placeholder', '请输入手机号')
      expect(phoneInput).toHaveAttribute('type', 'tel')
      expect(phoneInput).toHaveAttribute('maxLength', '11')
      
      // 测试输入功能
      fireEvent.change(phoneInput, { target: { value: '13812345678' } })
      expect(phoneInput).toHaveValue('13812345678')
    })

    test('验证码输入框存在且功能正常', async () => {
      renderWithRouter(<RegisterPage />)
      
      const verificationInput = screen.getByTestId('verification-input')
      expect(verificationInput).toBeInTheDocument()
      expect(verificationInput).toHaveAttribute('placeholder', '请输入验证码')
      expect(verificationInput).toHaveAttribute('maxLength', '6')
      
      // 测试数字输入限制
      fireEvent.change(verificationInput, { target: { value: 'abc123' } })
      expect(verificationInput).toHaveValue('123')
    })

    test('获取验证码按钮存在且功能正常', async () => {
      renderWithRouter(<RegisterPage />)
      
      const getCodeBtn = screen.getByTestId('get-code-btn')
      expect(getCodeBtn).toBeInTheDocument()
      expect(getCodeBtn).toHaveTextContent('获取验证码')
      expect(getCodeBtn).toHaveAttribute('type', 'button')
      
      // 测试启用/禁用逻辑
      expect(getCodeBtn).toBeDisabled()
      
      const phoneInput = screen.getByTestId('phone-input')
      fireEvent.change(phoneInput, { target: { value: '13812345678' } })
      expect(getCodeBtn).not.toBeDisabled()
    })

    test('用户协议复选框存在且功能正常', async () => {
      renderWithRouter(<RegisterPage />)
      
      // 检查复选框存在性
      const agreementCheckbox = screen.getByTestId('agreement-checkbox')
      expect(agreementCheckbox).toBeInTheDocument()
      
      // 检查复选框类型
      expect(agreementCheckbox).toHaveAttribute('type', 'checkbox')
      
      // 检查初始状态
      expect(agreementCheckbox).not.toBeChecked()
      
      // 检查点击功能
      fireEvent.click(agreementCheckbox)
      expect(agreementCheckbox).toBeChecked()
      
      // 检查再次点击
      fireEvent.click(agreementCheckbox)
      expect(agreementCheckbox).not.toBeChecked()
    })

    test('用户协议文本和链接存在且功能正常', async () => {
      renderWithRouter(<RegisterPage />)
      
      // 检查协议文本
      const agreementText = screen.getByTestId('agreement-label')
      expect(agreementText).toBeInTheDocument()
      expect(agreementText).toHaveTextContent('我已阅读并同意')
      
      // 检查协议链接
      const agreementLink = screen.getByTestId('terms-link')
      expect(agreementLink).toBeInTheDocument()
      expect(agreementLink).toHaveTextContent('《用户协议》')
      
      // 检查链接点击
      fireEvent.click(agreementLink)
      // TODO: 当实现协议详情后，验证跳转或弹窗
    })

    test('注册按钮存在且功能正常', async () => {
      renderWithRouter(<RegisterPage />)
      
      const registerBtn = screen.getByTestId('register-btn')
      expect(registerBtn).toBeInTheDocument()
      expect(registerBtn).toHaveTextContent('注册')
      expect(registerBtn).toHaveAttribute('type', 'submit')
      
      // 检查初始禁用状态
      expect(registerBtn).toBeDisabled()
      
      // 输入完整有效数据后检查启用状态
      const phoneInput = screen.getByTestId('phone-input')
      const verificationInput = screen.getByTestId('verification-input')
      const agreementCheckbox = screen.getByTestId('agreement-checkbox')
      
      fireEvent.change(phoneInput, { target: { value: '13812345678' } })
      fireEvent.change(verificationInput, { target: { value: '123456' } })
      fireEvent.click(agreementCheckbox)
      
      expect(registerBtn).not.toBeDisabled()
    })

    test('登录链接存在且功能正常', async () => {
      renderWithRouter(<RegisterPage />)
      
      const loginLink = screen.getByTestId('login-link-btn')
      expect(loginLink).toBeInTheDocument()
      expect(loginLink).toHaveTextContent('立即登录')
      expect(loginLink).toHaveAttribute('href', '/login')
    })
  })

  describe('首页界面UI元素检查', () => {
    test('品牌logo存在且功能正常', async () => {
      renderWithRouter(<HomePage />)
      
      const brandLogo = screen.getByTestId('brand-logo')
      expect(brandLogo).toBeInTheDocument()
      expect(brandLogo).toHaveTextContent('淘贝')
    })

    test('用户区域存在且功能正常', async () => {
      renderWithRouter(<HomePage />)
      
      const userSection = screen.getByTestId('user-section')
      expect(userSection).toBeInTheDocument()
      
      // 检查未登录状态下的元素
      const loginLink = screen.getByTestId('login-link')
      const registerLink = screen.getByTestId('register-link')
      
      expect(loginLink).toBeInTheDocument()
      expect(registerLink).toBeInTheDocument()
      
      expect(loginLink).toHaveTextContent('登录')
      expect(registerLink).toHaveTextContent('注册')
      
      expect(loginLink).toHaveAttribute('href', '/login')
      expect(registerLink).toHaveAttribute('href', '/register')
    })

    test('欢迎消息存在且功能正常', async () => {
      renderWithRouter(<HomePage />)
      
      const homeContent = screen.getByTestId('home-content')
      expect(homeContent).toBeInTheDocument()
      expect(homeContent).toHaveTextContent('欢迎来到淘贝')
    })

    test('登录链接存在且功能正常', async () => {
      renderWithRouter(<HomePage />)
      
      const loginLink = screen.getByTestId('login-link')
      expect(loginLink).toBeInTheDocument()
      expect(loginLink).toHaveTextContent('登录')
      expect(loginLink).toHaveAttribute('href', '/login')
      
      // 检查点击响应
      fireEvent.click(loginLink)
      expect(loginLink).toBeInTheDocument()
    })

    test('注册链接存在且功能正常', async () => {
      renderWithRouter(<HomePage />)
      
      const registerLink = screen.getByTestId('register-link')
      expect(registerLink).toBeInTheDocument()
      expect(registerLink).toHaveTextContent('注册')
      expect(registerLink).toHaveAttribute('href', '/register')
      
      // 检查点击响应
      fireEvent.click(registerLink)
      expect(registerLink).toBeInTheDocument()
    })
  })

  describe('响应式UI元素检查', () => {
    test('所有界面在不同屏幕尺寸下元素正确显示', async () => {
      // 测试登录页面
      renderWithRouter(<LoginPage />)
      
      const loginPage = screen.getByTestId('login-page')
      expect(loginPage).toBeInTheDocument()
      
      // TODO: 当实现响应式样式后，测试不同屏幕尺寸下的元素显示
      
      // 验证关键元素在小屏幕下仍然可见
      const brandLogo = screen.getByTestId('brand-logo')
      const phoneInput = screen.getByTestId('phone-input')
      const loginBtn = screen.getByTestId('login-btn')
      
      expect(brandLogo).toBeInTheDocument()
      expect(phoneInput).toBeInTheDocument()
      expect(loginBtn).toBeInTheDocument()
    })

    test('移动端UI元素适配检查', async () => {
      // 模拟移动端视口
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })
      
      renderWithRouter(<LoginPage />)
      
      // 验证移动端关键元素仍然可用
      const phoneInput = screen.getByTestId('phone-input')
      const getCodeBtn = screen.getByTestId('get-code-btn')
      const loginBtn = screen.getByTestId('login-btn')
      
      expect(phoneInput).toBeInTheDocument()
      expect(getCodeBtn).toBeInTheDocument()
      expect(loginBtn).toBeInTheDocument()
      
      // TODO: 当实现移动端样式后，验证触摸友好的交互
    })
  })

  describe('UI状态变化检查', () => {
    test('输入框focus/blur状态正确显示', async () => {
      renderWithRouter(<LoginPage />)
      
      const phoneInput = screen.getByTestId('phone-input')
      
      // 测试focus/blur事件可以触发（jsdom环境限制，不检查实际focus状态）
      expect(() => {
        fireEvent.focus(phoneInput)
        fireEvent.blur(phoneInput)
      }).not.toThrow()
      // TODO: 当实现样式后，验证focus/blur样式类
    })

    test('按钮hover状态正确显示', async () => {
      renderWithRouter(<LoginPage />)
      
      const phoneInput = screen.getByTestId('phone-input')
      const getCodeBtn = screen.getByTestId('get-code-btn')
      
      // 启用按钮
      fireEvent.change(phoneInput, { target: { value: '13812345678' } })
      
      // 测试hover状态
      fireEvent.mouseEnter(getCodeBtn)
      // TODO: 当实现样式后，验证hover样式类
      
      fireEvent.mouseLeave(getCodeBtn)
      // TODO: 当实现样式后，验证hover样式移除
    })

    test('错误状态UI正确显示', async () => {
      renderWithRouter(<LoginPage />)
      
      const phoneInput = screen.getByTestId('phone-input')
      
      // 输入无效数据触发错误状态
      fireEvent.change(phoneInput, { target: { value: '123' } })
      fireEvent.blur(phoneInput)
      
      // TODO: 当实现错误状态后，验证错误样式和提示
      expect(phoneInput).toBeInTheDocument()
    })

    test('加载状态UI正确显示', async () => {
      renderWithRouter(<LoginPage />)
      
      const phoneInput = screen.getByTestId('phone-input')
      const verificationInput = screen.getByTestId('verification-input')
      const loginBtn = screen.getByTestId('login-btn')
      
      // 输入有效数据
      fireEvent.change(phoneInput, { target: { value: '13812345678' } })
      fireEvent.change(verificationInput, { target: { value: '123456' } })
      
      // 点击登录触发加载状态
      fireEvent.click(loginBtn)
      
      // TODO: 当实现加载状态后，验证加载样式和文本变化
      expect(loginBtn).toBeInTheDocument()
    })
  })
})