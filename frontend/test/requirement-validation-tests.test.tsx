import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LoginPage from '../../src/components/LoginPage';
import RegisterPage from '../../src/components/RegisterPage';
import HomePage from '../../src/components/HomePage';

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    BrowserRouter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  };
});

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('需求文档逐条验证测试', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });
  
  describe('REQ-1.1: 登录界面布局需求验证', () => {

    test('REQ-1.1.1: 登录界面布局从上到下包含所有必需元素', async () => {
      renderWithRouter(<LoginPage />);
      
      // 验证手机号输入区域
      const phoneInput = screen.getByPlaceholderText('请输入手机号');
      expect(phoneInput).toBeInTheDocument();
      
      // 验证+86显示
      const countryCode = screen.getByText('+86');
      expect(countryCode).toBeInTheDocument();
      
      // 验证验证码输入区域
      const codeInput = screen.getByPlaceholderText('请输入验证码');
      expect(codeInput).toBeInTheDocument();
      
      // 验证获取验证码按钮
      const getCodeButton = screen.getByText('获取验证码');
      expect(getCodeButton).toBeInTheDocument();
      
      // 验证登录按钮（全宽度，橙色）
      const loginButton = screen.getByText('登录');
      expect(loginButton).toBeInTheDocument();
      expect(loginButton).toHaveClass('w-full');
      expect(loginButton).toHaveClass('bg-orange-500');
      
      // 验证底部导航区域
      const forgotLink = screen.getByText('忘记账号');
      expect(forgotLink).toBeInTheDocument();
      
      const registerLink = screen.getByText('免费注册');
      expect(registerLink).toBeInTheDocument();
    });
  });

  describe('REQ-1.2: 用户发起获取验证码请求需求验证', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    test('REQ-1.2.1: 手机号格式无效时不发送验证码', async () => {
      renderWithRouter(<LoginPage />);
      
      const phoneInput = screen.getByPlaceholderText('请输入手机号');
      const getCodeButton = screen.getByText('获取验证码');
      
      // 输入无效手机号
      fireEvent.change(phoneInput, { target: { value: '123' } });
      fireEvent.click(getCodeButton);
      
      // 验证错误提示
      await waitFor(() => {
        expect(screen.getByText('请输入正确的手机号码')).toBeInTheDocument();
      });
    });

    test('REQ-1.2.2: 成功获取验证码的完整流程', async () => {
      // Mock console.log to verify verification code is printed
      const consoleSpy = vi.spyOn(console, 'log');
      
      renderWithRouter(<LoginPage />);
      
      const phoneInput = screen.getByPlaceholderText('请输入手机号');
      const getCodeButton = screen.getByText('获取验证码');
      
      // 输入有效手机号
      fireEvent.change(phoneInput, { target: { value: '13812345678' } });
      fireEvent.click(getCodeButton);
      
      await waitFor(() => {
        // 验证验证码打印到控制台
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringMatching(/验证码: \d{6}/));
        
        // 验证按钮进入倒计时状态
        expect(getCodeButton).toBeDisabled();
        expect(getCodeButton.textContent).toMatch(/\d+s/);
      });
      
      consoleSpy.mockRestore();
    });
  });

  describe('REQ-1.3: 用户提交登录信息需求验证', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    test('REQ-1.3.1: 使用未注册手机号登录的错误处理', async () => {
      renderWithRouter(<LoginPage />);
      
      const phoneInput = screen.getByPlaceholderText('请输入手机号');
      const codeInput = screen.getByPlaceholderText('请输入验证码');
      const loginButton = screen.getByText('登录');
      
      // 输入未注册的手机号和验证码
      fireEvent.change(phoneInput, { target: { value: '13999999999' } });
      fireEvent.change(codeInput, { target: { value: '123456' } });
      fireEvent.click(loginButton);
      
      await waitFor(() => {
        expect(screen.getByText('该手机号未注册，请先完成注册')).toBeInTheDocument();
      });
    });

    test('REQ-1.3.2: 使用错误验证码登录的错误处理', async () => {
      renderWithRouter(<LoginPage />);
      
      const phoneInput = screen.getByPlaceholderText('请输入手机号');
      const codeInput = screen.getByPlaceholderText('请输入验证码');
      const loginButton = screen.getByText('登录');
      
      // 输入已注册手机号和错误验证码
      fireEvent.change(phoneInput, { target: { value: '13812345678' } });
      fireEvent.change(codeInput, { target: { value: '000000' } });
      fireEvent.click(loginButton);
      
      await waitFor(() => {
        expect(screen.getByText('验证码错误')).toBeInTheDocument();
      });
    });

    test('REQ-1.3.3: 成功登录流程验证', async () => {
      const mockNavigate = vi.fn();
      vi.mocked(require('react-router-dom').useNavigate).mockReturnValue(mockNavigate);
      
      renderWithRouter(<LoginPage />);
      
      const phoneInput = screen.getByPlaceholderText('请输入手机号');
      const codeInput = screen.getByPlaceholderText('请输入验证码');
      const loginButton = screen.getByText('登录');
      
      // 输入正确的登录信息
      fireEvent.change(phoneInput, { target: { value: '13812345678' } });
      fireEvent.change(codeInput, { target: { value: '123456' } });
      fireEvent.click(loginButton);
      
      await waitFor(() => {
        expect(screen.getByText('登录成功')).toBeInTheDocument();
        expect(mockNavigate).toHaveBeenCalledWith('/');
      });
    });
  });

  describe('REQ-1.4: 页面导航功能需求验证', () => {
    test('REQ-1.4.1: 从登录页面跳转到注册页面', async () => {
      const mockNavigate = vi.fn();
      vi.mocked(require('react-router-dom').useNavigate).mockReturnValue(mockNavigate);
      
      renderWithRouter(<LoginPage />);
      
      const registerLink = screen.getByText('免费注册');
      fireEvent.click(registerLink);
      
      expect(mockNavigate).toHaveBeenCalledWith('/register');
    });
  });

  describe('REQ-2.1: 注册界面布局需求验证', () => {
    test('REQ-2.1.1: 注册界面布局从上到下包含所有必需元素', async () => {
      renderWithRouter(<RegisterPage />);
      
      // 验证手机号输入区域
      const phoneInput = screen.getByPlaceholderText('请输入你的手机号码');
      expect(phoneInput).toBeInTheDocument();
      
      // 验证中国大陆+86显示
      const countryCode = screen.getByText('中国大陆 +86');
      expect(countryCode).toBeInTheDocument();
      
      // 验证验证码输入区域
      const codeInput = screen.getByPlaceholderText('请输入校验码');
      expect(codeInput).toBeInTheDocument();
      
      // 验证获取验证码按钮
      const getCodeButton = screen.getByText('获取验证码');
      expect(getCodeButton).toBeInTheDocument();
      
      // 验证同意并注册按钮（全宽度，橙色）
      const registerButton = screen.getByText('同意并注册');
      expect(registerButton).toBeInTheDocument();
      expect(registerButton).toHaveClass('w-full');
      expect(registerButton).toHaveClass('bg-orange-500');
      
      // 验证已有账号链接
      const loginLink = screen.getByText('立即登录');
      expect(loginLink).toBeInTheDocument();
      expect(loginLink).toHaveClass('text-orange-500');
      
      // 验证协议同意区域
      const agreementCheckbox = screen.getByRole('checkbox');
      expect(agreementCheckbox).toBeInTheDocument();
      
      const agreementText = screen.getByText('同意《淘贝用户协议》');
      expect(agreementText).toBeInTheDocument();
    });
  });

  describe('REQ-2.2: 注册页面获取验证码需求验证', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    test('REQ-2.2.1: 注册页面手机号格式无效时不发送验证码', async () => {
      renderWithRouter(<RegisterPage />);
      
      const phoneInput = screen.getByPlaceholderText('请输入你的手机号码');
      const getCodeButton = screen.getByText('获取验证码');
      
      // 输入无效手机号
      fireEvent.change(phoneInput, { target: { value: '123' } });
      fireEvent.click(getCodeButton);
      
      // 验证错误提示
      await waitFor(() => {
        expect(screen.getByText('请输入正确的手机号码')).toBeInTheDocument();
      });
    });

    test('REQ-2.2.2: 注册页面成功获取验证码的完整流程', async () => {
      const consoleSpy = vi.spyOn(console, 'log');
      
      renderWithRouter(<RegisterPage />);
      
      const phoneInput = screen.getByPlaceholderText('请输入你的手机号码');
      const getCodeButton = screen.getByText('获取验证码');
      
      // 输入有效手机号
      fireEvent.change(phoneInput, { target: { value: '13812345678' } });
      fireEvent.click(getCodeButton);
      
      await waitFor(() => {
        // 验证验证码打印到控制台
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringMatching(/验证码: \d{6}/));
        
        // 验证按钮进入倒计时状态
        expect(getCodeButton).toBeDisabled();
        expect(getCodeButton.textContent).toMatch(/\d+s/);
      });
      
      consoleSpy.mockRestore();
    });
  });

  describe('REQ-2.3: 用户提交注册信息需求验证', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    test('REQ-2.3.1: 使用已注册手机号进行注册时直接登录', async () => {
      const mockNavigate = vi.fn();
      vi.mocked(require('react-router-dom').useNavigate).mockReturnValue(mockNavigate);
      
      renderWithRouter(<RegisterPage />);
      
      const phoneInput = screen.getByPlaceholderText('请输入你的手机号码');
      const codeInput = screen.getByPlaceholderText('请输入校验码');
      const agreementCheckbox = screen.getByRole('checkbox');
      const registerButton = screen.getByText('同意并注册');
      
      // 勾选协议
      fireEvent.click(agreementCheckbox);
      
      // 输入已注册的手机号和正确验证码
      fireEvent.change(phoneInput, { target: { value: '13812345678' } });
      fireEvent.change(codeInput, { target: { value: '123456' } });
      fireEvent.click(registerButton);
      
      await waitFor(() => {
        expect(screen.getByText('该手机号已注册，将直接为您登录')).toBeInTheDocument();
        expect(mockNavigate).toHaveBeenCalledWith('/');
      });
    });

    test('REQ-2.3.2: 未同意用户协议时注册按钮不可点击', async () => {
      renderWithRouter(<RegisterPage />);
      
      const registerButton = screen.getByText('同意并注册');
      
      // 验证按钮初始状态为不可点击
      expect(registerButton).toBeDisabled();
    });

    test('REQ-2.3.2: 同意用户协议时注册按钮变为可点击', async () => {
      renderWithRouter(<RegisterPage />);
      
      const agreementCheckbox = screen.getByRole('checkbox');
      const registerButton = screen.getByText('同意并注册');
      
      // 勾选协议
      fireEvent.click(agreementCheckbox);
      
      // 验证按钮变为可点击
      expect(registerButton).not.toBeDisabled();
    });

    test('REQ-2.3.3: 使用错误验证码注册的错误处理', async () => {
      renderWithRouter(<RegisterPage />);
      
      const phoneInput = screen.getByPlaceholderText('请输入你的手机号码');
      const codeInput = screen.getByPlaceholderText('请输入校验码');
      const agreementCheckbox = screen.getByRole('checkbox');
      const registerButton = screen.getByText('同意并注册');
      
      // 勾选协议
      fireEvent.click(agreementCheckbox);
      
      // 输入手机号和错误验证码
      fireEvent.change(phoneInput, { target: { value: '13999999999' } });
      fireEvent.change(codeInput, { target: { value: '000000' } });
      fireEvent.click(registerButton);
      
      await waitFor(() => {
        expect(screen.getByText('验证码错误')).toBeInTheDocument();
      });
    });

    test('REQ-2.3.3: 成功注册流程验证', async () => {
      const mockNavigate = vi.fn();
      vi.mocked(require('react-router-dom').useNavigate).mockReturnValue(mockNavigate);
      
      renderWithRouter(<RegisterPage />);
      
      const phoneInput = screen.getByPlaceholderText('请输入你的手机号码');
      const codeInput = screen.getByPlaceholderText('请输入校验码');
      const agreementCheckbox = screen.getByRole('checkbox');
      const registerButton = screen.getByText('同意并注册');
      
      // 勾选协议
      fireEvent.click(agreementCheckbox);
      
      // 输入未注册手机号和正确验证码
      fireEvent.change(phoneInput, { target: { value: '13999999999' } });
      fireEvent.change(codeInput, { target: { value: '123456' } });
      fireEvent.click(registerButton);
      
      await waitFor(() => {
        expect(screen.getByText('注册成功')).toBeInTheDocument();
        expect(mockNavigate).toHaveBeenCalledWith('/');
      });
    });
  });

  describe('REQ-2.4: 注册页面导航功能需求验证', () => {
    test('REQ-2.4.1: 从注册页面返回登录页面', async () => {
      const mockNavigate = vi.fn();
      vi.mocked(require('react-router-dom').useNavigate).mockReturnValue(mockNavigate);
      
      renderWithRouter(<RegisterPage />);
      
      const loginLink = screen.getByText('立即登录');
      fireEvent.click(loginLink);
      
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  describe('REQ-3.1: 首页布局需求验证', () => {
    test('REQ-3.1.1: 首页包含所有必需元素', async () => {
      renderWithRouter(<HomePage />);
      
      // 验证品牌logo（橙色"淘贝"文字）
      const logo = screen.getByText('淘贝');
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveClass('text-orange-500');
      
      // 验证登录链接
      const loginLink = screen.getByText('亲，请登录');
      expect(loginLink).toBeInTheDocument();
      
      // 验证注册链接
      const registerLink = screen.getByText('免费注册');
      expect(registerLink).toBeInTheDocument();
    });

    test('REQ-3.1.1: 首页登录链接跳转功能', async () => {
      const mockNavigate = vi.fn();
      vi.mocked(require('react-router-dom').useNavigate).mockReturnValue(mockNavigate);
      
      renderWithRouter(<HomePage />);
      
      const loginLink = screen.getByText('亲，请登录');
      fireEvent.click(loginLink);
      
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    test('REQ-3.1.1: 首页注册链接跳转功能', async () => {
      const mockNavigate = vi.fn();
      vi.mocked(require('react-router-dom').useNavigate).mockReturnValue(mockNavigate);
      
      renderWithRouter(<HomePage />);
      
      const registerLink = screen.getByText('免费注册');
      fireEvent.click(registerLink);
      
      expect(mockNavigate).toHaveBeenCalledWith('/register');
    });
  });
});