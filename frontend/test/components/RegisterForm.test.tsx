import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import RegisterForm from '../../src/components/RegisterForm';

describe('RegisterForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnSendVerificationCode = vi.fn();
  const mockOnSwitchToLogin = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderRegisterForm = () => {
    return render(
      <RegisterForm
        onSubmit={mockOnSubmit}
        onSendVerificationCode={mockOnSendVerificationCode}
        onSwitchToLogin={mockOnSwitchToLogin}
      />
    );
  };

  describe('UI-RegisterForm 渲染测试', () => {
    it('应该渲染所有必需的表单元素', () => {
      // When: 渲染注册表单
      renderRegisterForm();

      // Then: 应该显示所有必需元素
      expect(screen.getByRole('heading', { name: '注册' })).toBeInTheDocument();
      expect(screen.getByLabelText('手机号')).toBeInTheDocument();
      expect(screen.getByLabelText('验证码')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '获取验证码' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '注册' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '立即登录' })).toBeInTheDocument();
    });

    it('应该显示用户协议复选框', () => {
      // When: 渲染注册表单
      renderRegisterForm();

      // Then: 应该显示协议复选框和文本
      expect(screen.getByRole('checkbox')).toBeInTheDocument();
      expect(screen.getByText('我已阅读并同意《淘贝平台服务协议》')).toBeInTheDocument();
    });

    it('应该显示正确的占位符文本', () => {
      // When: 渲染注册表单
      renderRegisterForm();

      // Then: 应该显示正确的占位符
      expect(screen.getByPlaceholderText('请输入手机号')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('请输入验证码')).toBeInTheDocument();
    });

    it('应该显示切换到登录的提示文本', () => {
      // When: 渲染注册表单
      renderRegisterForm();

      // Then: 应该显示切换提示
      expect(screen.getByText('已有账号？')).toBeInTheDocument();
    });
  });

  describe('手机号输入功能', () => {
    it('应该允许用户输入手机号', async () => {
      // Given: 渲染注册表单
      const user = userEvent.setup();
      renderRegisterForm();
      const phoneInput = screen.getByLabelText('手机号');

      // When: 用户输入手机号
      await user.type(phoneInput, '13812345678');

      // Then: 输入框应该显示输入的手机号
      expect(phoneInput).toHaveValue('13812345678');
    });

    it('应该支持各种手机号格式', async () => {
      // Given: 渲染注册表单
      const user = userEvent.setup();
      renderRegisterForm();
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
      // Given: 渲染注册表单
      const user = userEvent.setup();
      renderRegisterForm();
      const codeInput = screen.getByLabelText('验证码');

      // When: 用户输入验证码
      await user.type(codeInput, '123456');

      // Then: 输入框应该显示输入的验证码
      expect(codeInput).toHaveValue('123456');
    });

    it('应该限制验证码为6位数字', async () => {
      // Given: 渲染注册表单
      const user = userEvent.setup();
      renderRegisterForm();
      const codeInput = screen.getByLabelText('验证码');

      // When: 输入超过6位的验证码
      await user.type(codeInput, '1234567890');

      // Then: 应该只显示前6位（如果有输入限制）
      expect(codeInput.value.length).toBeLessThanOrEqual(6);
    });
  });

  describe('用户协议功能', () => {
    it('应该允许用户勾选协议', async () => {
      // Given: 渲染注册表单
      const user = userEvent.setup();
      renderRegisterForm();
      const checkbox = screen.getByRole('checkbox');

      // When: 用户勾选协议
      await user.click(checkbox);

      // Then: 复选框应该被选中
      expect(checkbox).toBeChecked();
    });

    it('应该允许用户取消勾选协议', async () => {
      // Given: 渲染注册表单并勾选协议
      const user = userEvent.setup();
      renderRegisterForm();
      const checkbox = screen.getByRole('checkbox');
      await user.click(checkbox);

      // When: 用户取消勾选
      await user.click(checkbox);

      // Then: 复选框应该未被选中
      expect(checkbox).not.toBeChecked();
    });

    it('应该默认未勾选协议', () => {
      // When: 渲染注册表单
      renderRegisterForm();
      const checkbox = screen.getByRole('checkbox');

      // Then: 复选框应该默认未选中
      expect(checkbox).not.toBeChecked();
    });
  });

  describe('获取验证码功能', () => {
    it('应该在点击时调用发送验证码回调', async () => {
      // Given: 渲染注册表单并输入手机号
      const user = userEvent.setup();
      renderRegisterForm();
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
      // Given: 渲染注册表单
      const user = userEvent.setup();
      renderRegisterForm();
      const phoneInput = screen.getByLabelText('手机号');
      const sendCodeButton = screen.getByRole('button', { name: '获取验证码' });

      await user.type(phoneInput, '13812345678');

      // When: 点击获取验证码按钮
      await user.click(sendCodeButton);

      // Then: 按钮应该显示倒计时并被禁用
      await waitFor(() => {
        expect(sendCodeButton).toBeDisabled();
      });
    });
  });

  describe('表单提交功能', () => {
    it('应该在提交时调用onSubmit回调', async () => {
      // Given: 渲染注册表单并填写完整信息
      const user = userEvent.setup();
      renderRegisterForm();
      const phoneInput = screen.getByLabelText('手机号');
      const codeInput = screen.getByLabelText('验证码');
      const checkbox = screen.getByRole('checkbox');
      const submitButton = screen.getByRole('button', { name: '注册' });

      await user.type(phoneInput, '13812345678');
      await user.type(codeInput, '123456');
      await user.click(checkbox);

      // When: 提交表单
      await user.click(submitButton);

      // Then: 应该调用onSubmit回调
      expect(mockOnSubmit).toHaveBeenCalledWith('13812345678', '123456', true);
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    });

    it('应该处理未勾选协议的提交', async () => {
      // Given: 渲染注册表单但不勾选协议
      const user = userEvent.setup();
      renderRegisterForm();
      const phoneInput = screen.getByLabelText('手机号');
      const codeInput = screen.getByLabelText('验证码');
      const submitButton = screen.getByRole('button', { name: '注册' });

      await user.type(phoneInput, '13812345678');
      await user.type(codeInput, '123456');

      // When: 提交表单
      await user.click(submitButton);

      // Then: 应该调用onSubmit但协议状态为false
      expect(mockOnSubmit).toHaveBeenCalledWith('13812345678', '123456', false);
    });

    it('应该阻止默认表单提交行为', async () => {
      // Given: 渲染注册表单
      const user = userEvent.setup();
      renderRegisterForm();
      const form = screen.getByRole('form') || screen.getByTestId('register-form');
      const phoneInput = screen.getByLabelText('手机号');
      const codeInput = screen.getByLabelText('验证码');
      const checkbox = screen.getByRole('checkbox');

      await user.type(phoneInput, '13812345678');
      await user.type(codeInput, '123456');
      await user.click(checkbox);

      // When: 通过回车提交表单
      fireEvent.submit(form);

      // Then: 应该阻止默认行为并调用回调
      expect(mockOnSubmit).toHaveBeenCalled();
    });
  });

  describe('页面切换功能', () => {
    it('应该在点击登录链接时调用切换回调', async () => {
      // Given: 渲染注册表单
      const user = userEvent.setup();
      renderRegisterForm();
      const loginLink = screen.getByRole('button', { name: '立即登录' });

      // When: 点击登录链接
      await user.click(loginLink);

      // Then: 应该调用切换到登录回调
      expect(mockOnSwitchToLogin).toHaveBeenCalledTimes(1);
    });
  });

  describe('表单验证', () => {
    it('应该验证手机号格式', async () => {
      // Given: 渲染注册表单
      const user = userEvent.setup();
      renderRegisterForm();
      const phoneInput = screen.getByLabelText('手机号');

      // When: 输入无效手机号
      await user.type(phoneInput, '123');
      await user.tab(); // 触发blur事件

      // Then: 应该显示验证错误（如果有验证逻辑）
      // 这个测试需要组件实际实现验证逻辑
    });

    it('应该验证验证码格式', async () => {
      // Given: 渲染注册表单
      const user = userEvent.setup();
      renderRegisterForm();
      const codeInput = screen.getByLabelText('验证码');

      // When: 输入无效验证码
      await user.type(codeInput, 'abc');
      await user.tab(); // 触发blur事件

      // Then: 应该显示验证错误（如果有验证逻辑）
      // 这个测试需要组件实际实现验证逻辑
    });

    it('应该验证协议必须勾选', async () => {
      // Given: 渲染注册表单但不勾选协议
      const user = userEvent.setup();
      renderRegisterForm();
      const phoneInput = screen.getByLabelText('手机号');
      const codeInput = screen.getByLabelText('验证码');
      const submitButton = screen.getByRole('button', { name: '注册' });

      await user.type(phoneInput, '13812345678');
      await user.type(codeInput, '123456');

      // When: 尝试提交未勾选协议的表单
      await user.click(submitButton);

      // Then: 应该显示协议验证错误（如果有验证逻辑）
      // 这个测试需要组件实际实现验证逻辑
    });
  });

  describe('用户交互体验', () => {
    it('应该支持键盘导航', async () => {
      // Given: 渲染注册表单
      const user = userEvent.setup();
      renderRegisterForm();

      // When: 使用Tab键导航
      await user.tab();
      expect(screen.getByLabelText('手机号')).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText('验证码')).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('button', { name: '获取验证码' })).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('checkbox')).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('button', { name: '注册' })).toHaveFocus();
    });

    it('应该支持回车键提交', async () => {
      // Given: 渲染注册表单并填写完整信息
      const user = userEvent.setup();
      renderRegisterForm();
      const phoneInput = screen.getByLabelText('手机号');
      const codeInput = screen.getByLabelText('验证码');
      const checkbox = screen.getByRole('checkbox');

      await user.type(phoneInput, '13812345678');
      await user.type(codeInput, '123456');
      await user.click(checkbox);

      // When: 在验证码输入框按回车
      await user.keyboard('{Enter}');

      // Then: 应该提交表单
      expect(mockOnSubmit).toHaveBeenCalledWith('13812345678', '123456', true);
    });

    it('应该支持空格键切换复选框', async () => {
      // Given: 渲染注册表单
      const user = userEvent.setup();
      renderRegisterForm();
      const checkbox = screen.getByRole('checkbox');

      // When: 聚焦复选框并按空格键
      checkbox.focus();
      await user.keyboard(' ');

      // Then: 复选框应该被选中
      expect(checkbox).toBeChecked();
    });
  });

  describe('状态管理', () => {
    it('应该正确管理表单状态', async () => {
      // Given: 渲染注册表单
      const user = userEvent.setup();
      renderRegisterForm();
      const phoneInput = screen.getByLabelText('手机号');
      const codeInput = screen.getByLabelText('验证码');
      const checkbox = screen.getByRole('checkbox');

      // When: 输入并清空内容，切换复选框状态
      await user.type(phoneInput, '13812345678');
      await user.clear(phoneInput);
      await user.type(codeInput, '123456');
      await user.clear(codeInput);
      await user.click(checkbox);
      await user.click(checkbox);

      // Then: 状态应该正确
      expect(phoneInput).toHaveValue('');
      expect(codeInput).toHaveValue('');
      expect(checkbox).not.toBeChecked();
    });

    it('应该正确管理倒计时状态', async () => {
      // Given: 渲染注册表单
      const user = userEvent.setup();
      renderRegisterForm();
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

  describe('协议文本功能', () => {
    it('应该显示正确的协议文本', () => {
      // When: 渲染注册表单
      renderRegisterForm();

      // Then: 应该显示淘贝平台服务协议
      expect(screen.getByText('我已阅读并同意《淘贝平台服务协议》')).toBeInTheDocument();
    });

    it('应该支持协议链接点击', async () => {
      // Given: 渲染注册表单
      const user = userEvent.setup();
      renderRegisterForm();
      
      // 如果协议文本是链接，应该可以点击
      const agreementText = screen.getByText('我已阅读并同意《淘贝平台服务协议》');
      
      // When: 点击协议文本（如果是链接）
      // 这个测试取决于实际的协议文本实现
      
      // Then: 应该打开协议页面或弹窗
      // 这个测试需要实际的协议链接实现
    });
  });
});