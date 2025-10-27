import React, { useState, useEffect } from 'react';

interface LoginFormProps {
  onSubmit?: (data: { phone: string; code: string }) => Promise<void>;
  onSendCode?: (phone: string) => Promise<void>;
  onSwitchToRegister?: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({
  onSubmit,
  onSendCode,
  onSwitchToRegister
}) => {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [errors, setErrors] = useState<{
    phone?: string;
    code?: string;
    submit?: string;
    sendCode?: string;
  }>({});

  // 清理定时器
  useEffect(() => {
    let timer: number;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [countdown]);

  // 验证手机号格式
  const validatePhone = (phoneNumber: string): string | null => {
    if (!phoneNumber) {
      return '请输入手机号';
    }
    if (phoneNumber.length !== 11 || !/^1[3-9]\d{9}$/.test(phoneNumber)) {
      return '请输入正确的手机号';
    }
    return null;
  };

  // 验证验证码格式
  const validateCode = (verificationCode: string): string | null => {
    if (!verificationCode) {
      return '请输入验证码';
    }
    if (verificationCode.length !== 6) {
      return '验证码必须为6位数字';
    }
    if (!/^\d{6}$/.test(verificationCode)) {
      return '验证码只能包含数字';
    }
    return null;
  };

  // 处理手机号输入
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // 只允许数字
    if (value.length <= 11) {
      setPhone(value);
      // 清除手机号错误
      if (errors.phone) {
        setErrors(prev => ({ ...prev, phone: undefined }));
      }
    }
  };

  // 处理验证码输入
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // 只允许数字
    if (value.length <= 6) {
      setCode(value);
      // 清除验证码错误
      if (errors.code) {
        setErrors(prev => ({ ...prev, code: undefined }));
      }
    }
  };

  // 发送验证码
  const handleSendCode = async () => {
    // 验证手机号
    const phoneError = validatePhone(phone);
    if (phoneError) {
      alert(phoneError);
      setErrors(prev => ({ ...prev, phone: phoneError }));
      return;
    }

    setIsSendingCode(true);
    setErrors(prev => ({ ...prev, sendCode: undefined }));

    try {
      if (onSendCode) {
        await onSendCode(phone);
      }
      
      // 开始倒计时
      setCountdown(60);
    } catch (error) {
      console.error('发送验证码失败:', error);
      const errorMessage = error instanceof Error ? error.message : '发送验证码失败，请重试';
      setErrors(prev => ({ ...prev, sendCode: errorMessage }));
      alert('发送验证码失败');
    } finally {
      setIsSendingCode(false);
    }
  };

  // 提交登录
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 验证表单
    const phoneError = validatePhone(phone);
    const codeError = validateCode(code);
    
    if (phoneError || codeError) {
      alert('请填写完整信息');
      setErrors({
        phone: phoneError || undefined,
        code: codeError || undefined,
      });
      return;
    }

    setIsLoading(true);
    setErrors(prev => ({ ...prev, submit: undefined }));

    try {
      if (onSubmit) {
        await onSubmit({ phone, code });
      }
    } catch (error) {
      console.error('登录失败:', error);
      const errorMessage = error instanceof Error ? error.message : '登录失败，请重试';
      setErrors(prev => ({ ...prev, submit: errorMessage }));
      alert('登录失败');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-form" data-testid="login-form">
      <h2>用户登录</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="phone">手机号</label>
          <div className="phone-input-container">
            <span className="country-code">+86</span>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={handlePhoneChange}
              placeholder="请输入手机号"
              maxLength={11}
              className={errors.phone ? 'error' : ''}
              data-testid="phone-input"
            />
          </div>
          {errors.phone && <div className="error-message" data-testid="error-message">{errors.phone}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="code">验证码</label>
          <div className="code-input-group">
            <input
              id="code"
              type="text"
              value={code}
              onChange={handleCodeChange}
              placeholder="请输入验证码"
              maxLength={6}
              className={errors.code ? 'error' : ''}
              data-testid="code-input"
            />
            <button
              type="button"
              onClick={handleSendCode}
              disabled={countdown > 0 || isSendingCode || !phone}
              className="send-code-btn"
              data-testid="send-code-button"
            >
              {isSendingCode ? '发送中...' : countdown > 0 ? `${countdown}s` : '获取验证码'}
            </button>
          </div>
          {errors.code && <div className="error-message" data-testid="error-message">{errors.code}</div>}
          {errors.sendCode && <div className="error-message" data-testid="error-message">{errors.sendCode}</div>}
        </div>

        {errors.submit && <div className="error-message" data-testid="error-message">{errors.submit}</div>}

        <button
          type="submit"
          disabled={isLoading}
          className={`submit-btn ${isLoading ? 'loading' : ''}`}
          data-testid="login-button"
        >
          {isLoading ? '登录中...' : '登录'}
        </button>

        <div className="switch-page">
          <span>还没有账号？</span>
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="switch-btn"
            data-testid="switch-to-register"
          >
            立即注册
          </button>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;