import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginForm from '../../src/components/LoginForm';

// Mock fetch
global.fetch = vi.fn();

describe('LoginForm Component', () => {
  const mockOnLoginSuccess = vi.fn();
  const mockOnNavigateToRegister = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (fetch as any).mockClear();
  });

  it('应该渲染所有必需的表单元素', () => {
    render(
      <LoginForm 
        onLoginSuccess={mockOnLoginSuccess}
        onNavigateToRegister={mockOnNavigateToRegister}
      />
    );

    expect(screen.getByTestId('phone-input')).toBeInTheDocument();
    expect(screen.getByTestId('code-input')).toBeInTheDocument();
    expect(screen.getByTestId('send-code-button')).toBeInTheDocument();
    expect(screen.getByTestId('login-button')).toBeInTheDocument();
    expect(screen.getByTestId('navigate-to-register')).toBeInTheDocument();
  });

  it('应该验证手机号格式', async () => {
    render(<LoginForm />);
    
    const phoneInput = screen.getByTestId('phone-input');
    const sendCodeButton = screen.getByTestId('send-code-button');

    // 输入无效手机号
    fireEvent.change(phoneInput, { target: { value: '12345' } });
    fireEvent.click(sendCodeButton);

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toHaveTextContent('请输入正确的手机号码');
    });
  });

  it('应该成功发送验证码', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: '验证码发送成功', countdown: 60 })
    });

    render(<LoginForm />);
    
    const phoneInput = screen.getByTestId('phone-input');
    const sendCodeButton = screen.getByTestId('send-code-button');

    fireEvent.change(phoneInput, { target: { value: '13812345678' } });
    fireEvent.click(sendCodeButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/auth/send-verification-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: '13812345678' })
      });
    });

    await waitFor(() => {
      expect(sendCodeButton).toHaveTextContent(/\d+秒后重试/);
    });
  });

  it('应该处理发送验证码失败', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: '请输入正确的手机号码' })
    });

    render(<LoginForm />);
    
    const phoneInput = screen.getByTestId('phone-input');
    const sendCodeButton = screen.getByTestId('send-code-button');

    fireEvent.change(phoneInput, { target: { value: '13812345678' } });
    fireEvent.click(sendCodeButton);

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toHaveTextContent('请输入正确的手机号码');
    });
  });

  it('应该成功登录', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        message: '登录成功', 
        user: { phoneNumber: '13812345678' }
      })
    });

    render(<LoginForm onLoginSuccess={mockOnLoginSuccess} />);
    
    const phoneInput = screen.getByTestId('phone-input');
    const codeInput = screen.getByTestId('code-input');
    const loginButton = screen.getByTestId('login-button');

    fireEvent.change(phoneInput, { target: { value: '13812345678' } });
    fireEvent.change(codeInput, { target: { value: '123456' } });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phoneNumber: '13812345678', 
          verificationCode: '123456' 
        })
      });
    });

    await waitFor(() => {
      expect(mockOnLoginSuccess).toHaveBeenCalled();
    });
  });

  it('应该处理登录失败', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: '该手机号未注册，请先完成注册' })
    });

    render(<LoginForm />);
    
    const phoneInput = screen.getByTestId('phone-input');
    const codeInput = screen.getByTestId('code-input');
    const loginButton = screen.getByTestId('login-button');

    fireEvent.change(phoneInput, { target: { value: '13812345678' } });
    fireEvent.change(codeInput, { target: { value: '123456' } });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toHaveTextContent('该手机号未注册，请先完成注册');
    });
  });

  it('应该验证必填字段', async () => {
    render(<LoginForm />);
    
    const loginButton = screen.getByTestId('login-button');

    // 不填写任何信息直接点击登录
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toHaveTextContent('请输入手机号和验证码');
    });
  });

  it('应该导航到注册页面', () => {
    render(<LoginForm onNavigateToRegister={mockOnNavigateToRegister} />);
    
    const navigateButton = screen.getByTestId('navigate-to-register');
    fireEvent.click(navigateButton);

    expect(mockOnNavigateToRegister).toHaveBeenCalled();
  });

  it('应该在加载时禁用按钮', async () => {
    (fetch as any).mockImplementationOnce(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(<LoginForm />);
    
    const phoneInput = screen.getByTestId('phone-input');
    const codeInput = screen.getByTestId('code-input');
    const loginButton = screen.getByTestId('login-button');

    fireEvent.change(phoneInput, { target: { value: '13812345678' } });
    fireEvent.change(codeInput, { target: { value: '123456' } });
    fireEvent.click(loginButton);

    expect(loginButton).toBeDisabled();
    expect(loginButton).toHaveTextContent('登录中...');
  });
});