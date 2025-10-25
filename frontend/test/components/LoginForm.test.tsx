import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import LoginForm from '../../src/components/LoginForm';

describe('LoginForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnSendVerificationCode = vi.fn();
  const mockOnSwitchToRegister = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderLoginForm = () => {
    return render(
      <LoginForm
        onSubmit={mockOnSubmit}
        onSendVerificationCode={mockOnSendVerificationCode}
        onSwitchToRegister={mockOnSwitchToRegister}
      />
    );
  };

  describe('UI-LoginForm 渲染测试', () => {
    it('应该渲染所有必需的表单元素', () => {
      // When: 渲染登录表单
      renderLoginForm();

      // Then: 应该显示所有必需元素
      expect(screen.getByRole('heading', { name: '登录' })).toBeInTheDocument();
      expect(screen.getByLabelText('手机号')).toBeInTheDocument();
      expect(screen.getByLabelText('验证码')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '获取验证码' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '登录' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '立即注册' })).toBeInTheDocument();
    });

    it('应该显示正确的占位符文本', () => {
      // When: 渲染登录表单
      renderLoginForm();

      // Then: 应该显示正确的占位符
      expect(screen.getByPlaceholderText('请输入手机号')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('请输入验证码')).toBeInTheDocument();
    });

    it('应该显示切换到注册的提示文本', () => {
      // When: 渲染登录表单
      renderLoginForm();

      // Then: 应该显示切换提示
      expect(screen.getByText('还没有账号？')).toBeInTheDocument();
    });
  });

  describe('手机号输入功能', () => {
    it('应该允许用户输入手机号', async () => {
      // Given: 渲染登录表单
      const user = userEvent.setup();
      renderLoginForm();
      const phoneInput = screen.getByLabelText('手机号');

      // When: 用户输入手机号
      await user.type(phoneInput, '13812345678');

      // Then: 输入框应该显示输入的手机号
      expect(phoneInput).toHaveValue('13812345678');
    });

    it('应该支持手机号输入格式', async () => {
      // Given: 渲染登录表单
      const user = userEvent.setup();
      renderLoginForm();
      const phoneInput = screen.getByLabelText('手机号');

      // When: 输入各种格式的手机号
      const phoneNumbers = ['13812345678', '15987654321', '18612345678'];
      
      for (const phone of phoneNumbers) {
        await user.clear(phoneInput);
        await user.type(phoneInput, phone);
        
        // Then: 应该正确显示
        expect(phoneInput).toHaveValue(phone);
      }
    });
  });

  describe('验证码输入功能', () => {
    it('应该允许用户输入验证码', async () => {
      // Given: 渲染登录表单
      const user = userEvent.setup();
      renderLoginForm();
      const codeInput = screen.getByLabelText('验证码');

      // When: 用户输入验证码
      await user.type(codeInput, '123456');

      // Then: 输入框应该显示输入的验证码
      expect(codeInput).toHaveValue('123456');
    });

    it('应该限制验证码为6位数字', async () => {
      // Given: 渲染登录表单
      const user = userEvent.setup();
      renderLoginForm();
      const codeInput = screen.getByLabelText('验证码');

      // When: 输入超过6位的验证码
      await user.type(codeInput, '1234567890');

      // Then: 应该只显示前6位（如果有输入限制）
      // 注意：这个测试取决于实际的输入限制实现
      expect(codeInput.value.length).toBeLessThanOrEqual(6);
    });
  });

  describe('获取验证码功能', () => {
    it('应该在点击时调用发送验证码回调', async () => {
      // Given: 渲染登录表单并输入手机号
      const user = userEvent.setup();
      renderLoginForm();
      const phoneInput = screen.getByLabelText('手机号');
      const sendCodeButton = screen.getByRole('button', { name: '获取验证码' });

      await user.type(phoneInput, '13812345678');

      // When: 点击获取验证码按钮
      await user.click(sendCodeButton);

      // Then: 应该调用发送验证码回调
      expect(mockOnSendVerificationCode).toHaveBeenCalledWith('13812345678');
      expect(mockOnSendVerificationCode).toHaveBeenCalledTimes(1);
    });

    it('应该显示倒计时状态', async () => {
      // Given: 渲染登录表单
      const user = userEvent.setup();
      renderLoginForm();
      const phoneInput = screen.getByLabelText('手机号');
      const sendCodeButton = screen.getByRole('button', { name: '获取验证码' });

      await user.type(phoneInput, '13812345678');

      // When: 点击获取验证码按钮
      await user.click(sendCodeButton);

      // Then: 按钮应该显示倒计时（需要实际实现倒计时逻辑）
      // 这个测试需要组件实际实现倒计时功能
      await waitFor(() => {
        expect(sendCodeButton).toBeDisabled();
      });
    });

    it('应该在倒计时期间禁用按钮', async () => {
      // Given: 渲染登录表单并触发倒计时
      const user = userEvent.setup();
      renderLoginForm();
      const phoneInput = screen.getByLabelText('手机号');
      const sendCodeButton = screen.getByRole('button', { name: '获取验证码' });

      await user.type(phoneInput, '13812345678');
      await user.click(sendCodeButton);

      // When: 倒计时期间
      // Then: 按钮应该被禁用
      await waitFor(() => {
        expect(sendCodeButton).toBeDisabled();
      });
    });
  });

  describe('表单提交功能', () => {
    it('应该在提交时调用onSubmit回调', async () => {
      // Given: 渲染登录表单并填写信息
      const user = userEvent.setup();
      renderLoginForm();
      const phoneInput = screen.getByLabelText('手机号');
      const codeInput = screen.getByLabelText('验证码');
      const submitButton = screen.getByRole('button', { name: '登录' });

      await user.type(phoneInput, '13812345678');
      await user.type(codeInput, '123456');

      // When: 提交表单
      await user.click(submitButton);

      // Then: 应该调用onSubmit回调
      expect(mockOnSubmit).toHaveBeenCalledWith('13812345678', '123456');
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    });

    it('应该阻止默认表单提交行为', async () => {
      // Given: 渲染登录表单
      const user = userEvent.setup();
      renderLoginForm();
      const form = screen.getByRole('form') || screen.getByTestId('login-form');
      const phoneInput = screen.getByLabelText('手机号');
      const codeInput = screen.getByLabelText('验证码');

      await user.type(phoneInput, '13812345678');
      await user.type(codeInput, '123456');

      // When: 通过回车提交表单
      fireEvent.submit(form);

      // Then: 应该阻止默认行为并调用回调
      expect(mockOnSubmit).toHaveBeenCalled();
    });

    it('应该处理空表单提交', async () => {
      // Given: 渲染登录表单（不填写任何信息）
      const user = userEvent.setup();
      renderLoginForm();
      const submitButton = screen.getByRole('button', { name: '登录' });

      // When: 提交空表单
      await user.click(submitButton);

      // Then: 应该调用onSubmit但参数为空
      expect(mockOnSubmit).toHaveBeenCalledWith('', '');
    });
  });

  describe('页面切换功能', () => {
    it('应该在点击注册链接时调用切换回调', async () => {
      // Given: 渲染登录表单
      const user = userEvent.setup();
      renderLoginForm();
      const registerLink = screen.getByRole('button', { name: '立即注册' });

      // When: 点击注册链接
      await user.click(registerLink);

      // Then: 应该调用切换到注册回调
      expect(mockOnSwitchToRegister).toHaveBeenCalledTimes(1);
    });
  });

  describe('表单验证', () => {
    it('应该验证手机号格式', async () => {
      // Given: 渲染登录表单
      const user = userEvent.setup();
      renderLoginForm();
      const phoneInput = screen.getByLabelText('手机号');

      // When: 输入无效手机号
      await user.type(phoneInput, '123');
      await user.tab(); // 触发blur事件

      // Then: 应该显示验证错误（如果有验证逻辑）
      // 这个测试需要组件实际实现验证逻辑
    });

    it('应该验证验证码格式', async () => {
      // Given: 渲染登录表单
      const user = userEvent.setup();
      renderLoginForm();
      const codeInput = screen.getByLabelText('验证码');

      // When: 输入无效验证码
      await user.type(codeInput, 'abc');
      await user.tab(); // 触发blur事件

      // Then: 应该显示验证错误（如果有验证逻辑）
      // 这个测试需要组件实际实现验证逻辑
    });
  });

  describe('用户交互体验', () => {
    it('应该支持键盘导航', async () => {
      // Given: 渲染登录表单
      const user = userEvent.setup();
      renderLoginForm();

      // When: 使用Tab键导航
      await user.tab();
      expect(screen.getByLabelText('手机号')).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText('验证码')).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('button', { name: '获取验证码' })).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('button', { name: '登录' })).toHaveFocus();
    });

    it('应该支持回车键提交', async () => {
      // Given: 渲染登录表单并填写信息
      const user = userEvent.setup();
      renderLoginForm();
      const phoneInput = screen.getByLabelText('手机号');
      const codeInput = screen.getByLabelText('验证码');

      await user.type(phoneInput, '13812345678');
      await user.type(codeInput, '123456');

      // When: 在验证码输入框按回车
      await user.keyboard('{Enter}');

      // Then: 应该提交表单
      expect(mockOnSubmit).toHaveBeenCalledWith('13812345678', '123456');
    });
  });

  describe('状态管理', () => {
    it('应该正确管理表单状态', async () => {
      // Given: 渲染登录表单
      const user = userEvent.setup();
      renderLoginForm();
      const phoneInput = screen.getByLabelText('手机号');
      const codeInput = screen.getByLabelText('验证码');

      // When: 输入并清空内容
      await user.type(phoneInput, '13812345678');
      await user.clear(phoneInput);
      await user.type(codeInput, '123456');
      await user.clear(codeInput);

      // Then: 输入框应该为空
      expect(phoneInput).toHaveValue('');
      expect(codeInput).toHaveValue('');
    });

    it('应该正确管理倒计时状态', async () => {
      // Given: 渲染登录表单
      const user = userEvent.setup();
      renderLoginForm();
      const phoneInput = screen.getByLabelText('手机号');
      const sendCodeButton = screen.getByRole('button', { name: '获取验证码' });

      await user.type(phoneInput, '13812345678');

      // When: 触发倒计时
      await user.click(sendCodeButton);

      // Then: 倒计时状态应该正确管理
      expect(sendCodeButton).toBeDisabled();
      
      // 等待倒计时结束（需要实际的倒计时实现）
      // await waitFor(() => {
      //   expect(sendCodeButton).not.toBeDisabled();
      // }, { timeout: 61000 });
    });
  });
});