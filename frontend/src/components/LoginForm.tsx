import React, { useState, useEffect } from 'react';
import CountryCodeSelector from './CountryCodeSelector';
import './LoginForm.css';

interface LoginFormProps {
  onSubmit?: (data: { phoneNumber: string; verificationCode: string }) => void;
  onSendVerificationCode?: (phoneNumber: string) => void;
  onSwitchToRegister?: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ 
  onSubmit, 
  onSendVerificationCode, 
  onSwitchToRegister 
}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [selectedCountry, setSelectedCountry] = useState({ code: '+86', name: '中国', flag: '🇨🇳' });
  const [isCountrySelectorOpen, setIsCountrySelectorOpen] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  // 倒计时效果
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber || !verificationCode) {
      alert('请填写完整信息');
      return;
    }

    if (onSubmit) {
      onSubmit({
        phoneNumber: selectedCountry.code + phoneNumber,
        verificationCode,
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: selectedCountry.code + phoneNumber,
          verificationCode,
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert('登录成功！');
        // 这里可以处理登录成功后的逻辑
      } else {
        alert(data.message || '登录失败');
      }
    } catch (error) {
      alert('网络错误，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendCode = async () => {
    if (!phoneNumber) {
      alert('请输入手机号');
      return;
    }

    if (onSendVerificationCode) {
      onSendVerificationCode(selectedCountry.code + phoneNumber);
      setCountdown(60);
      return;
    }

    try {
      const response = await fetch('/api/auth/send-verification-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: selectedCountry.code + phoneNumber,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setCountdown(60);
        alert('验证码发送成功');
      } else {
        alert(data.message || '发送失败');
      }
    } catch (error) {
      alert('网络错误，请重试');
    }
  };

  return (
    <div className="login-form" data-testid="login-form">
      <h1>登录</h1>
      <form onSubmit={handleSubmit} className="auth-form">
        {/* 手机号输入区域 */}
        <div className="phone-input-group">
          <label htmlFor="phone-input">手机号</label>
          <CountryCodeSelector
            selectedCountry={selectedCountry}
            isOpen={isCountrySelectorOpen}
            onSelect={(country) => setSelectedCountry(country)}
          />
          <input
            id="phone-input"
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="请输入手机号"
            className="phone-input"
            data-testid="phone-input"
          />
        </div>

        {/* 验证码输入区域 */}
        <div className="verification-group">
          <label htmlFor="verification-input">验证码</label>
          <input
            id="verification-input"
            type="text"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            placeholder="请输入验证码"
            className="verification-input"
            data-testid="verification-input"
          />
          <button
            type="button"
            onClick={handleSendCode}
            disabled={countdown > 0 || !phoneNumber}
            className="send-code-btn"
            data-testid="send-code-button"
          >
            {countdown > 0 ? `${countdown}s` : '获取验证码'}
          </button>
        </div>

        {/* 登录按钮 */}
        <button
          type="submit"
          disabled={isLoading || !phoneNumber || !verificationCode}
          className="submit-btn"
          data-testid="login-button"
        >
          {isLoading ? '登录中...' : '登录'}
        </button>

        {/* 底部链接 */}
        <div className="form-footer">
          <div className="footer-links">
            <button type="button" className="link-btn" data-testid="forgot-password">
              忘记账号
            </button>
            <button type="button" className="link-btn" onClick={onSwitchToRegister} data-testid="free-register">
              立即注册
            </button>
          </div>
          
          {/* 用户协议 */}
          <div className="terms-agreement">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={agreeToTerms}
                onChange={(e) => setAgreeToTerms(e.target.checked)}
                data-testid="terms-checkbox"
              />
              <span className="checkbox-text">
                已阅读并同意下述协议
                <a href="#" className="terms-link">淘宝平台服务协议</a>、
                <a href="#" className="terms-link">隐私权政策</a>、
                <a href="#" className="terms-link">法律声明</a>、
                <a href="#" className="terms-link">支付宝及客户端服务协议</a>
              </span>
            </label>
          </div>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;