import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RegisterForm from '../../src/components/RegisterForm';

// Mock fetch
global.fetch = vi.fn();

describe('RegisterForm Component', () => {
  const mockOnRegisterSuccess = vi.fn();
  const mockOnNavigateToLogin = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (fetch as any).mockClear();
  });

  it('应该渲染所有必需的表单元素', () => {
    render(
      <RegisterForm 
        onRegisterSuccess={mockOnRegisterSuccess}
        onNavigateToLogin={mockOnNavigateToLogin}
      />
    );

    expect(screen.getByTestId('phone-input')).toBeInTheDocument();
    expect(screen.getByTestId('code-input')).toBeInTheDocument();
    expect(screen.getByTestId('send-code-button')).toBeInTheDocument();
    expect(screen.getByTestId('terms-checkbox')).toBeInTheDocument();
    expect(screen.getByTestId('register-button')).toBeInTheDocument();
    expect(screen.getByTestId('navigate-to-login')).toBeInTheDocument();
  });

  it('应该验证手机号格式', async () => {
    render(<RegisterForm />);
    
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

    render(<RegisterForm />);
    
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

  it('应该成功注册新用户', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        message: '注册成功', 
        user: { phoneNumber: '13812345678' }
      })
    });

    render(<RegisterForm onRegisterSuccess={mockOnRegisterSuccess} />);
    
    const phoneInput = screen.getByTestId('phone-input');
    const codeInput = screen.getByTestId('code-input');
    const termsCheckbox = screen.getByTestId('terms-checkbox');
    const registerButton = screen.getByTestId('register-button');

    fireEvent.change(phoneInput, { target: { value: '13812345678' } });
    fireEvent.change(codeInput, { target: { value: '123456' } });
    fireEvent.click(termsCheckbox);
    fireEvent.click(registerButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phoneNumber: '13812345678', 
          verificationCode: '123456',
          agreeToTerms: true
        })
      });
    });

    await waitFor(() => {
      expect(mockOnRegisterSuccess).toHaveBeenCalled();
    });
  });

  it('应该要求同意用户协议', async () => {
    render(<RegisterForm />);
    
    const phoneInput = screen.getByTestId('phone-input');
    const codeInput = screen.getByTestId('code-input');
    const registerButton = screen.getByTestId('register-button');

    fireEvent.change(phoneInput, { target: { value: '13812345678' } });
    fireEvent.change(codeInput, { target: { value: '123456' } });
    // 不勾选用户协议
    fireEvent.click(registerButton);

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toHaveTextContent('请同意用户协议');
    });
  });

  it('应该处理注册失败', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: '该手机号已注册，请直接登录' })
    });

    render(<RegisterForm />);
    
    const phoneInput = screen.getByTestId('phone-input');
    const codeInput = screen.getByTestId('code-input');
    const termsCheckbox = screen.getByTestId('terms-checkbox');
    const registerButton = screen.getByTestId('register-button');

    fireEvent.change(phoneInput, { target: { value: '13812345678' } });
    fireEvent.change(codeInput, { target: { value: '123456' } });
    fireEvent.click(termsCheckbox);
    fireEvent.click(registerButton);

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toHaveTextContent('该手机号已注册，请直接登录');
    });
  });

  it('应该验证必填字段', async () => {
    render(<RegisterForm />);
    
    const registerButton = screen.getByTestId('register-button');

    // 不填写任何信息直接点击注册
    fireEvent.click(registerButton);

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toHaveTextContent('请输入手机号和验证码');
    });
  });

  it('应该导航到登录页面', () => {
    render(<RegisterForm onNavigateToLogin={mockOnNavigateToLogin} />);
    
    const navigateButton = screen.getByTestId('navigate-to-login');
    fireEvent.click(navigateButton);

    expect(mockOnNavigateToLogin).toHaveBeenCalled();
  });

  it('应该在加载时禁用按钮', async () => {
    (fetch as any).mockImplementationOnce(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(<RegisterForm />);
    
    const phoneInput = screen.getByTestId('phone-input');
    const codeInput = screen.getByTestId('code-input');
    const termsCheckbox = screen.getByTestId('terms-checkbox');
    const registerButton = screen.getByTestId('register-button');

    fireEvent.change(phoneInput, { target: { value: '13812345678' } });
    fireEvent.change(codeInput, { target: { value: '123456' } });
    fireEvent.click(termsCheckbox);
    fireEvent.click(registerButton);

    expect(registerButton).toBeDisabled();
    expect(registerButton).toHaveTextContent('注册中...');
  });

  it('应该处理验证码错误', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: '验证码错误或已过期' })
    });

    render(<RegisterForm />);
    
    const phoneInput = screen.getByTestId('phone-input');
    const codeInput = screen.getByTestId('code-input');
    const termsCheckbox = screen.getByTestId('terms-checkbox');
    const registerButton = screen.getByTestId('register-button');

    fireEvent.change(phoneInput, { target: { value: '13812345678' } });
    fireEvent.change(codeInput, { target: { value: '654321' } });
    fireEvent.click(termsCheckbox);
    fireEvent.click(registerButton);

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toHaveTextContent('验证码错误或已过期');
    });
  });
});