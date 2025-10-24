import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import LoginForm from '../../src/components/LoginForm';

describe('UI-LoginForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnNavigateToRegister = vi.fn();
  const mockOnSendVerificationCode = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('应该显示登录表单的所有必需元素', () => {
    render(
      <LoginForm
        onSubmit={mockOnSubmit}
        onNavigateToRegister={mockOnNavigateToRegister}
        onSendVerificationCode={mockOnSendVerificationCode}
      />
    );

    // 验证表单标题
    expect(screen.getByRole('heading', { name: '登录' })).toBeInTheDocument();

    // 验证国家代码选择器
    expect(screen.getByLabelText('国家/地区')).toBeInTheDocument();
    expect(screen.getByDisplayValue('中国 (+86)')).toBeInTheDocument();

    // 验证手机号输入框
    expect(screen.getByLabelText('手机号')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('请输入手机号')).toBeInTheDocument();

    // 验证验证码输入框
    expect(screen.getByLabelText('验证码')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('请输入验证码')).toBeInTheDocument();

    // 验证发送验证码按钮
    expect(screen.getByText('发送验证码')).toBeInTheDocument();

    // 验证登录按钮
    expect(screen.getByRole('button', { name: '登录' })).toBeInTheDocument();

    // 验证注册链接
    expect(screen.getByText('还没有账号？')).toBeInTheDocument();
    expect(screen.getByText('立即注册')).toBeInTheDocument();
  });

  test('应该能够输入手机号', async () => {
    const user = userEvent.setup();
    
    render(
      <LoginForm
        onSubmit={mockOnSubmit}
        onNavigateToRegister={mockOnNavigateToRegister}
        onSendVerificationCode={mockOnSendVerificationCode}
      />
    );

    const phoneInput = screen.getByLabelText('手机号');
    await user.type(phoneInput, '13812345678');

    expect(phoneInput).toHaveValue('13812345678');
  });

  test('应该能够选择国家代码', async () => {
    const user = userEvent.setup();
    
    render(
      <LoginForm
        onSubmit={mockOnSubmit}
        onNavigateToRegister={mockOnNavigateToRegister}
        onSendVerificationCode={mockOnSendVerificationCode}
      />
    );

    const countrySelect = screen.getByLabelText('国家/地区');
    await user.selectOptions(countrySelect, '+1');

    expect(countrySelect).toHaveValue('+1');
  });

  test('应该能够输入验证码', async () => {
    const user = userEvent.setup();
    
    render(
      <LoginForm
        onSubmit={mockOnSubmit}
        onNavigateToRegister={mockOnNavigateToRegister}
        onSendVerificationCode={mockOnSendVerificationCode}
      />
    );

    const codeInput = screen.getByLabelText('验证码');
    await user.type(codeInput, '123456');

    expect(codeInput).toHaveValue('123456');
  });

  test('应该限制验证码输入长度为6位', async () => {
    const user = userEvent.setup();
    
    render(
      <LoginForm
        onSubmit={mockOnSubmit}
        onNavigateToRegister={mockOnNavigateToRegister}
        onSendVerificationCode={mockOnSendVerificationCode}
      />
    );

    const codeInput = screen.getByLabelText('验证码');
    await user.type(codeInput, '1234567890');

    expect(codeInput).toHaveValue('123456');
  });

  test('发送验证码按钮在手机号为空时应该被禁用', () => {
    render(
      <LoginForm
        onSubmit={mockOnSubmit}
        onNavigateToRegister={mockOnNavigateToRegister}
        onSendVerificationCode={mockOnSendVerificationCode}
      />
    );

    const sendCodeButton = screen.getByText('发送验证码');
    expect(sendCodeButton).toBeDisabled();
  });

  test('应该能够发送验证码', async () => {
    const user = userEvent.setup();
    
    render(
      <LoginForm
        onSubmit={mockOnSubmit}
        onNavigateToRegister={mockOnNavigateToRegister}
        onSendVerificationCode={mockOnSendVerificationCode}
      />
    );

    // 输入手机号
    const phoneInput = screen.getByLabelText('手机号');
    await user.type(phoneInput, '13812345678');

    // 点击发送验证码
    const sendCodeButton = screen.getByText('发送验证码');
    await user.click(sendCodeButton);

    expect(mockOnSendVerificationCode).toHaveBeenCalledWith('13812345678', '+86');
    expect(screen.getByText('已发送')).toBeInTheDocument();
  });

  test('登录按钮在表单未完整填写时应该被禁用', () => {
    render(
      <LoginForm
        onSubmit={mockOnSubmit}
        onNavigateToRegister={mockOnNavigateToRegister}
        onSendVerificationCode={mockOnSendVerificationCode}
      />
    );

    const loginButton = screen.getByRole('button', { name: '登录' });
    expect(loginButton).toBeDisabled();
  });

  test('应该能够提交登录表单', async () => {
    const user = userEvent.setup();
    
    render(
      <LoginForm
        onSubmit={mockOnSubmit}
        onNavigateToRegister={mockOnNavigateToRegister}
        onSendVerificationCode={mockOnSendVerificationCode}
      />
    );

    // 填写表单
    await user.type(screen.getByLabelText('手机号'), '13812345678');
    await user.type(screen.getByLabelText('验证码'), '123456');

    // 提交表单
    const loginButton = screen.getByRole('button', { name: '登录' });
    await user.click(loginButton);

    expect(mockOnSubmit).toHaveBeenCalledWith({
      phoneNumber: '13812345678',
      verificationCode: '123456',
      countryCode: '+86'
    });
  });

  test('应该能够导航到注册页面', async () => {
    const user = userEvent.setup();
    
    render(
      <LoginForm
        onSubmit={mockOnSubmit}
        onNavigateToRegister={mockOnNavigateToRegister}
        onSendVerificationCode={mockOnSendVerificationCode}
      />
    );

    const registerButton = screen.getByText('立即注册');
    await user.click(registerButton);

    expect(mockOnNavigateToRegister).toHaveBeenCalled();
  });

  test('应该在提交时显示加载状态', async () => {
    const user = userEvent.setup();
    
    render(
      <LoginForm
        onSubmit={mockOnSubmit}
        onNavigateToRegister={mockOnNavigateToRegister}
        onSendVerificationCode={mockOnSendVerificationCode}
      />
    );

    // 填写表单
    await user.type(screen.getByLabelText('手机号'), '13812345678');
    await user.type(screen.getByLabelText('验证码'), '123456');

    // 提交表单
    const loginButton = screen.getByRole('button', { name: '登录' });
    await user.click(loginButton);

    expect(screen.getByText('登录中...')).toBeInTheDocument();
  });
});