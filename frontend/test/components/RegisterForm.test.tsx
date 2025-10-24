import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import RegisterForm from '../../src/components/RegisterForm';

describe('UI-RegisterForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnNavigateToLogin = vi.fn();
  const mockOnSendVerificationCode = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('应该显示注册表单的所有必需元素', () => {
    render(
      <RegisterForm
        onSubmit={mockOnSubmit}
        onNavigateToLogin={mockOnNavigateToLogin}
        onSendVerificationCode={mockOnSendVerificationCode}
      />
    );

    // 验证表单标题
    expect(screen.getByRole('heading', { name: '注册' })).toBeInTheDocument();

    // 验证国家代码选择器
    expect(screen.getByLabelText('国家/地区')).toBeInTheDocument();

    // 验证手机号输入框
    expect(screen.getByLabelText('手机号')).toBeInTheDocument();

    // 验证验证码输入框
    expect(screen.getByLabelText('验证码')).toBeInTheDocument();

    // 验证服务条款复选框
    expect(screen.getByText('我已阅读并同意《服务条款》和《隐私政策》')).toBeInTheDocument();

    // 验证注册按钮
    expect(screen.getByRole('button', { name: '注册' })).toBeInTheDocument();

    // 验证登录链接
    expect(screen.getByText('已有账号？')).toBeInTheDocument();
    expect(screen.getByText('立即登录')).toBeInTheDocument();
  });

  test('应该能够输入手机号', async () => {
    const user = userEvent.setup();
    
    render(
      <RegisterForm
        onSubmit={mockOnSubmit}
        onNavigateToLogin={mockOnNavigateToLogin}
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
      <RegisterForm
        onSubmit={mockOnSubmit}
        onNavigateToLogin={mockOnNavigateToLogin}
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
      <RegisterForm
        onSubmit={mockOnSubmit}
        onNavigateToLogin={mockOnNavigateToLogin}
        onSendVerificationCode={mockOnSendVerificationCode}
      />
    );

    const codeInput = screen.getByLabelText('验证码');
    await user.type(codeInput, '123456');

    expect(codeInput).toHaveValue('123456');
  });

  test('应该能够同意服务条款', async () => {
    const user = userEvent.setup();
    
    render(
      <RegisterForm
        onSubmit={mockOnSubmit}
        onNavigateToLogin={mockOnNavigateToLogin}
        onSendVerificationCode={mockOnSendVerificationCode}
      />
    );

    const termsCheckbox = screen.getByRole('checkbox');
    await user.click(termsCheckbox);

    expect(termsCheckbox).toBeChecked();
  });

  test('注册按钮在未同意服务条款时应该被禁用', () => {
    render(
      <RegisterForm
        onSubmit={mockOnSubmit}
        onNavigateToLogin={mockOnNavigateToLogin}
        onSendVerificationCode={mockOnSendVerificationCode}
      />
    );

    const registerButton = screen.getByRole('button', { name: '注册' });
    expect(registerButton).toBeDisabled();
  });

  test('应该能够发送验证码', async () => {
    const user = userEvent.setup();
    
    render(
      <RegisterForm
        onSubmit={mockOnSubmit}
        onNavigateToLogin={mockOnNavigateToLogin}
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
  });

  test('应该能够提交注册表单', async () => {
    const user = userEvent.setup();
    
    render(
      <RegisterForm
        onSubmit={mockOnSubmit}
        onNavigateToLogin={mockOnNavigateToLogin}
        onSendVerificationCode={mockOnSendVerificationCode}
      />
    );

    // 填写表单
    await user.type(screen.getByLabelText('手机号'), '13812345678');
    await user.type(screen.getByLabelText('验证码'), '123456');
    await user.click(screen.getByRole('checkbox'));

    // 提交表单
    const registerButton = screen.getByRole('button', { name: '注册' });
    await user.click(registerButton);

    expect(mockOnSubmit).toHaveBeenCalledWith({
      phoneNumber: '13812345678',
      verificationCode: '123456',
      countryCode: '+86',
      agreeToTerms: true
    });
  });

  test('应该能够导航到登录页面', async () => {
    const user = userEvent.setup();
    
    render(
      <RegisterForm
        onSubmit={mockOnSubmit}
        onNavigateToLogin={mockOnNavigateToLogin}
        onSendVerificationCode={mockOnSendVerificationCode}
      />
    );

    const loginButton = screen.getByText('立即登录');
    await user.click(loginButton);

    expect(mockOnNavigateToLogin).toHaveBeenCalled();
  });

  test('应该在提交时显示加载状态', async () => {
    const user = userEvent.setup();
    
    render(
      <RegisterForm
        onSubmit={mockOnSubmit}
        onNavigateToLogin={mockOnNavigateToLogin}
        onSendVerificationCode={mockOnSendVerificationCode}
      />
    );

    // 填写表单
    await user.type(screen.getByLabelText('手机号'), '13812345678');
    await user.type(screen.getByLabelText('验证码'), '123456');
    await user.click(screen.getByRole('checkbox'));

    // 提交表单
    const registerButton = screen.getByRole('button', { name: '注册' });
    await user.click(registerButton);

    expect(screen.getByText('注册中...')).toBeInTheDocument();
  });

  test('应该验证所有必需字段都已填写', () => {
    render(
      <RegisterForm
        onSubmit={mockOnSubmit}
        onNavigateToLogin={mockOnNavigateToLogin}
        onSendVerificationCode={mockOnSendVerificationCode}
      />
    );

    const registerButton = screen.getByRole('button', { name: '注册' });
    
    // 在未填写任何字段时，注册按钮应该被禁用
    expect(registerButton).toBeDisabled();
  });
});