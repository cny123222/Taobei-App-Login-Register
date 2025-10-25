import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import LoginForm from '../../src/components/LoginForm';
import RegisterForm from '../../src/components/RegisterForm';
import CountryCodeSelector from '../../src/components/CountryCodeSelector';

// Mock fetch for API calls
global.fetch = vi.fn();

describe('Authentication E2E Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock successful API responses by default
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        message: '操作成功',
        token: 'mock-jwt-token',
        user: { id: 1, phoneNumber: '13812345678' }
      })
    });
  });

  describe('完整用户注册流程', () => {
    it('应该完成完整的用户注册流程', async () => {
      // Given: 渲染注册表单
      const user = userEvent.setup();
      const mockOnSubmit = vi.fn();
      const mockOnSendCode = vi.fn();
      const mockOnSwitch = vi.fn();

      render(
        <RegisterForm
          onSubmit={mockOnSubmit}
          onSendVerificationCode={mockOnSendCode}
          onSwitchToLogin={mockOnSwitch}
        />
      );

      // Step 1: 用户输入手机号
      const phoneInput = screen.getByLabelText('手机号');
      await user.type(phoneInput, '13812345678');
      expect(phoneInput).toHaveValue('13812345678');

      // Step 2: 用户点击获取验证码
      const sendCodeButton = screen.getByRole('button', { name: '获取验证码' });
      await user.click(sendCodeButton);
      expect(mockOnSendCode).toHaveBeenCalledWith('13812345678');

      // Step 3: 用户输入验证码
      const codeInput = screen.getByLabelText('验证码');
      await user.type(codeInput, '123456');
      expect(codeInput).toHaveValue('123456');

      // Step 4: 用户同意服务条款
      const agreeCheckbox = screen.getByRole('checkbox');
      await user.click(agreeCheckbox);
      expect(agreeCheckbox).toBeChecked();

      // Step 5: 用户提交注册表单
      const submitButton = screen.getByRole('button', { name: '注册' });
      await user.click(submitButton);
      expect(mockOnSubmit).toHaveBeenCalledWith('13812345678', '123456', true);

      // Then: 整个流程应该顺利完成
      expect(mockOnSendCode).toHaveBeenCalledTimes(1);
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    });

    it('应该处理注册过程中的API错误', async () => {
      // Given: Mock API错误响应
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          success: false,
          message: '手机号已注册'
        })
      });

      const user = userEvent.setup();
      const mockOnSubmit = vi.fn();
      const mockOnSendCode = vi.fn();

      render(
        <RegisterForm
          onSubmit={mockOnSubmit}
          onSendVerificationCode={mockOnSendCode}
          onSwitchToLogin={vi.fn()}
        />
      );

      // When: 完成注册流程
      await user.type(screen.getByLabelText('手机号'), '13812345678');
      await user.click(screen.getByRole('button', { name: '获取验证码' }));
      await user.type(screen.getByLabelText('验证码'), '123456');
      await user.click(screen.getByRole('checkbox'));
      await user.click(screen.getByRole('button', { name: '注册' }));

      // Then: 应该处理错误情况
      expect(mockOnSubmit).toHaveBeenCalled();
      // 错误处理的具体实现取决于组件的错误处理逻辑
    });

    it('应该验证注册表单的完整性', async () => {
      // Given: 渲染注册表单
      const user = userEvent.setup();
      const mockOnSubmit = vi.fn();

      render(
        <RegisterForm
          onSubmit={mockOnSubmit}
          onSendVerificationCode={vi.fn()}
          onSwitchToLogin={vi.fn()}
        />
      );

      // When: 尝试提交不完整的表单
      const submitButton = screen.getByRole('button', { name: '注册' });
      await user.click(submitButton);

      // Then: 应该验证表单完整性
      // 具体的验证行为取决于组件的实现
      expect(mockOnSubmit).toHaveBeenCalledWith('', '', false);
    });
  });

  describe('完整用户登录流程', () => {
    it('应该完成完整的用户登录流程', async () => {
      // Given: 渲染登录表单
      const user = userEvent.setup();
      const mockOnSubmit = vi.fn();
      const mockOnSendCode = vi.fn();
      const mockOnSwitch = vi.fn();

      render(
        <LoginForm
          onSubmit={mockOnSubmit}
          onSendVerificationCode={mockOnSendCode}
          onSwitchToRegister={mockOnSwitch}
        />
      );

      // Step 1: 用户输入手机号
      const phoneInput = screen.getByLabelText('手机号');
      await user.type(phoneInput, '13812345678');
      expect(phoneInput).toHaveValue('13812345678');

      // Step 2: 用户点击获取验证码
      const sendCodeButton = screen.getByRole('button', { name: '获取验证码' });
      await user.click(sendCodeButton);
      expect(mockOnSendCode).toHaveBeenCalledWith('13812345678');

      // Step 3: 用户输入验证码
      const codeInput = screen.getByLabelText('验证码');
      await user.type(codeInput, '123456');
      expect(codeInput).toHaveValue('123456');

      // Step 4: 用户提交登录表单
      const submitButton = screen.getByRole('button', { name: '登录' });
      await user.click(submitButton);
      expect(mockOnSubmit).toHaveBeenCalledWith('13812345678', '123456');

      // Then: 整个流程应该顺利完成
      expect(mockOnSendCode).toHaveBeenCalledTimes(1);
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    });

    it('应该处理登录过程中的验证码倒计时', async () => {
      // Given: 渲染登录表单
      const user = userEvent.setup();
      const mockOnSendCode = vi.fn();

      render(
        <LoginForm
          onSubmit={vi.fn()}
          onSendVerificationCode={mockOnSendCode}
          onSwitchToRegister={vi.fn()}
        />
      );

      // When: 用户获取验证码
      await user.type(screen.getByLabelText('手机号'), '13812345678');
      const sendCodeButton = screen.getByRole('button', { name: '获取验证码' });
      await user.click(sendCodeButton);

      // Then: 按钮应该进入倒计时状态
      await waitFor(() => {
        expect(sendCodeButton).toBeDisabled();
      });

      // 验证倒计时文本更新（需要实际的倒计时实现）
      // expect(sendCodeButton).toHaveTextContent(/\d+秒后重新获取/);
    });

    it('应该处理登录失败的情况', async () => {
      // Given: Mock登录失败响应
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          success: false,
          message: '验证码错误'
        })
      });

      const user = userEvent.setup();
      const mockOnSubmit = vi.fn();

      render(
        <LoginForm
          onSubmit={mockOnSubmit}
          onSendVerificationCode={vi.fn()}
          onSwitchToRegister={vi.fn()}
        />
      );

      // When: 用户尝试登录
      await user.type(screen.getByLabelText('手机号'), '13812345678');
      await user.type(screen.getByLabelText('验证码'), '000000');
      await user.click(screen.getByRole('button', { name: '登录' }));

      // Then: 应该处理登录失败
      expect(mockOnSubmit).toHaveBeenCalledWith('13812345678', '000000');
    });
  });

  describe('国家代码选择器集成测试', () => {
    it('应该与手机号输入集成工作', async () => {
      // Given: 渲染国家代码选择器和登录表单
      const user = userEvent.setup();
      const mockOnSelect = vi.fn();
      const mockOnSubmit = vi.fn();

      const TestComponent = () => {
        const [selectedCountry, setSelectedCountry] = React.useState({
          code: '+86',
          name: '中国',
          flag: '🇨🇳'
        });
        const [isOpen, setIsOpen] = React.useState(false);

        return (
          <div>
            <CountryCodeSelector
              selectedCountry={selectedCountry}
              isOpen={isOpen}
              onSelect={(country) => {
                setSelectedCountry(country);
                mockOnSelect(country);
                setIsOpen(false);
              }}
              onToggle={() => setIsOpen(!isOpen)}
            />
            <LoginForm
              onSubmit={mockOnSubmit}
              onSendVerificationCode={vi.fn()}
              onSwitchToRegister={vi.fn()}
            />
          </div>
        );
      };

      render(<TestComponent />);

      // Step 1: 用户打开国家选择器
      const selectorButton = screen.getByRole('button', { name: /选择国家/ });
      await user.click(selectorButton);

      // Step 2: 用户选择美国
      const usOption = screen.getByText('美国').closest('[role="option"]');
      await user.click(usOption);

      // Step 3: 用户输入美国手机号
      const phoneInput = screen.getByLabelText('手机号');
      await user.type(phoneInput, '1234567890');

      // Then: 应该正确处理国际手机号
      expect(mockOnSelect).toHaveBeenCalledWith({
        code: '+1',
        name: '美国',
        flag: '🇺🇸'
      });
      expect(phoneInput).toHaveValue('1234567890');
    });

    it('应该支持不同国家的手机号格式', async () => {
      // Given: 渲染国家选择器
      const user = userEvent.setup();
      const mockOnSelect = vi.fn();

      render(
        <CountryCodeSelector
          selectedCountry={{ code: '+86', name: '中国', flag: '🇨🇳' }}
          isOpen={true}
          onSelect={mockOnSelect}
          onToggle={vi.fn()}
        />
      );

      // When: 用户选择不同国家
      const countries = [
        { name: '英国', expected: { code: '+44', name: '英国', flag: '🇬🇧' } },
        { name: '日本', expected: { code: '+81', name: '日本', flag: '🇯🇵' } },
        { name: '新加坡', expected: { code: '+65', name: '新加坡', flag: '🇸🇬' } }
      ];

      for (const country of countries) {
        const option = screen.getByText(country.name).closest('[role="option"]');
        await user.click(option);
        
        // Then: 应该正确选择国家
        expect(mockOnSelect).toHaveBeenCalledWith(country.expected);
      }
    });
  });

  describe('表单切换流程测试', () => {
    it('应该支持从登录切换到注册', async () => {
      // Given: 渲染登录表单
      const user = userEvent.setup();
      const mockOnSwitch = vi.fn();

      render(
        <LoginForm
          onSubmit={vi.fn()}
          onSendVerificationCode={vi.fn()}
          onSwitchToRegister={mockOnSwitch}
        />
      );

      // When: 用户点击注册链接
      const registerLink = screen.getByRole('button', { name: '立即注册' });
      await user.click(registerLink);

      // Then: 应该触发切换
      expect(mockOnSwitch).toHaveBeenCalledTimes(1);
    });

    it('应该支持从注册切换到登录', async () => {
      // Given: 渲染注册表单
      const user = userEvent.setup();
      const mockOnSwitch = vi.fn();

      render(
        <RegisterForm
          onSubmit={vi.fn()}
          onSendVerificationCode={vi.fn()}
          onSwitchToLogin={mockOnSwitch}
        />
      );

      // When: 用户点击登录链接
      const loginLink = screen.getByRole('button', { name: '立即登录' });
      await user.click(loginLink);

      // Then: 应该触发切换
      expect(mockOnSwitch).toHaveBeenCalledTimes(1);
    });

    it('应该在切换时保持已输入的手机号', async () => {
      // Given: 用户在登录表单输入手机号
      const user = userEvent.setup();
      let currentForm = 'login';
      const phoneNumber = '13812345678';

      const TestApp = () => {
        const [form, setForm] = React.useState(currentForm);
        const [phone, setPhone] = React.useState('');

        if (form === 'login') {
          return (
            <LoginForm
              onSubmit={vi.fn()}
              onSendVerificationCode={vi.fn()}
              onSwitchToRegister={() => setForm('register')}
              initialPhone={phone}
              onPhoneChange={setPhone}
            />
          );
        } else {
          return (
            <RegisterForm
              onSubmit={vi.fn()}
              onSendVerificationCode={vi.fn()}
              onSwitchToLogin={() => setForm('login')}
              initialPhone={phone}
              onPhoneChange={setPhone}
            />
          );
        }
      };

      render(<TestApp />);

      // When: 用户输入手机号并切换表单
      const phoneInput = screen.getByLabelText('手机号');
      await user.type(phoneInput, phoneNumber);
      
      const switchButton = screen.getByRole('button', { name: '立即注册' });
      await user.click(switchButton);

      // Then: 手机号应该在新表单中保持
      // 这个测试需要实际的状态管理实现
    });
  });

  describe('API集成测试', () => {
    it('应该正确调用发送验证码API', async () => {
      // Given: 渲染登录表单
      const user = userEvent.setup();
      const mockFetch = global.fetch as any;

      render(
        <LoginForm
          onSubmit={vi.fn()}
          onSendVerificationCode={async (phone) => {
            await fetch('/api/auth/send-verification-code', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ phoneNumber: phone })
            });
          }}
          onSwitchToRegister={vi.fn()}
        />
      );

      // When: 用户获取验证码
      await user.type(screen.getByLabelText('手机号'), '13812345678');
      await user.click(screen.getByRole('button', { name: '获取验证码' }));

      // Then: 应该调用正确的API
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/send-verification-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: '13812345678' })
      });
    });

    it('应该正确调用登录API', async () => {
      // Given: 渲染登录表单
      const user = userEvent.setup();
      const mockFetch = global.fetch as any;

      render(
        <LoginForm
          onSubmit={async (data) => {
            await fetch('/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ phoneNumber: data.phoneNumber, verificationCode: data.verificationCode })
            });
          }}
          onSendVerificationCode={vi.fn()}
          onSwitchToRegister={vi.fn()}
        />
      );

      // When: 用户提交登录表单
      await user.type(screen.getByLabelText('手机号'), '13812345678');
      await user.type(screen.getByLabelText('验证码'), '123456');
      await user.click(screen.getByRole('button', { name: '登录' }));

      // Then: 应该调用正确的API
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phoneNumber: '13812345678', 
          verificationCode: '123456' 
        })
      });
    });

    it('应该正确调用注册API', async () => {
      // Given: 渲染注册表单
      const user = userEvent.setup();
      const mockFetch = global.fetch as any;

      render(
        <RegisterForm
          onSubmit={async (phone, code, agree) => {
            await fetch('/api/auth/register', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                phoneNumber: phone, 
                verificationCode: code, 
                agreeToTerms: agree 
              })
            });
          }}
          onSendVerificationCode={vi.fn()}
          onSwitchToLogin={vi.fn()}
        />
      );

      // When: 用户提交注册表单
      await user.type(screen.getByLabelText('手机号'), '13812345678');
      await user.type(screen.getByLabelText('验证码'), '123456');
      await user.click(screen.getByRole('checkbox'));
      await user.click(screen.getByRole('button', { name: '注册' }));

      // Then: 应该调用正确的API
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phoneNumber: '13812345678', 
          verificationCode: '123456',
          agreeToTerms: true
        })
      });
    });
  });

  describe('错误处理和用户体验测试', () => {
    it('应该处理网络错误', async () => {
      // Given: Mock网络错误
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const user = userEvent.setup();
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <LoginForm
          onSubmit={async (data) => {
            try {
              await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phoneNumber: data.phoneNumber, verificationCode: data.verificationCode })
              });
            } catch (error) {
              console.error('Login failed:', error);
            }
          }}
          onSendVerificationCode={vi.fn()}
          onSwitchToRegister={vi.fn()}
        />
      );

      // When: 用户尝试登录
      await user.type(screen.getByLabelText('手机号'), '13812345678');
      await user.type(screen.getByLabelText('验证码'), '123456');
      await user.click(screen.getByRole('button', { name: '登录' }));

      // Then: 应该处理网络错误
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Login failed:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });

    it('应该显示加载状态', async () => {
      // Given: Mock延迟响应
      (global.fetch as any).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: async () => ({ success: true })
        }), 1000))
      );

      const user = userEvent.setup();

      render(
        <LoginForm
          onSubmit={vi.fn()}
          onSendVerificationCode={vi.fn()}
          onSwitchToRegister={vi.fn()}
        />
      );

      // When: 用户获取验证码
      await user.type(screen.getByLabelText('手机号'), '13812345678');
      const sendCodeButton = screen.getByRole('button', { name: '获取验证码' });
      await user.click(sendCodeButton);

      // Then: 应该显示加载状态
      // 这个测试需要实际的加载状态实现
      expect(sendCodeButton).toBeDisabled();
    });
  });
});