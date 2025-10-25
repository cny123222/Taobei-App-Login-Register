import React, { useState, useEffect } from 'react';
import CountryCodeSelector from './CountryCodeSelector';
import './RegisterForm.css';

interface RegisterFormProps {
  onSubmit: (phoneNumber: string, verificationCode: string, agreeToTerms: boolean) => void;
  onSendVerificationCode: (phoneNumber: string) => void;
  onSwitchToLogin: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({
  onSubmit,
  onSendVerificationCode,
  onSwitchToLogin
}) => {
  const [selectedCountry, setSelectedCountry] = useState({ code: '+86', name: '中国', flag: '🇨🇳' });
  const [isCountrySelectorOpen, setIsCountrySelectorOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

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
    setError('');
    
    if (!phoneNumber.trim()) {
      setError('请输入手机号');
      return;
    }
    
    if (!verificationCode.trim()) {
      setError('请输入验证码');
      return;
    }
    
    if (!agreeToTerms) {
      setError('请同意服务协议');
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit(selectedCountry.code + phoneNumber, verificationCode, agreeToTerms);
    } catch (err) {
      setError('注册失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendCode = async () => {
    if (!phoneNumber.trim()) {
      setError('请输入手机号');
      return;
    }
    
    setError('');
    setIsLoading(true);
    
    try {
      await onSendVerificationCode(selectedCountry.code + phoneNumber);
      setCountdown(60);
    } catch (err) {
      setError('发送验证码失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-form" data-testid="register-form">
      <h1>注册</h1>
      <form onSubmit={handleSubmit} className="form">
        {error && (
          <div className="error-message" data-testid="error-message">
            {error}
          </div>
        )}
        
        <div className="form-group">
          <label htmlFor="phone-input" className="form-label">手机号</label>
          <div className="phone-input-group">
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
              maxLength={11}
            />
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="verification-input" className="form-label">验证码</label>
          <div className="verification-input-group">
            <input
              id="verification-input"
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              placeholder="请输入验证码"
              className="verification-input"
              data-testid="verification-input"
              maxLength={6}
            />
            <button
              type="button"
              onClick={handleSendCode}
              disabled={countdown > 0 || isLoading}
              className="send-code-button"
              data-testid="send-code-button"
            >
              {countdown > 0 ? `${countdown}s` : '获取验证码'}
            </button>
          </div>
        </div>

        <button 
          type="submit" 
          className="submit-button"
          disabled={isLoading}
          data-testid="register-button"
        >
          {isLoading ? '注册中...' : '注册'}
        </button>
      </form>

      <div className="form-footer">
        <div className="terms-agreement">
          <label className="terms-label">
            <input
              type="checkbox"
              checked={agreeToTerms}
              onChange={(e) => setAgreeToTerms(e.target.checked)}
              className="terms-checkbox"
              data-testid="terms-checkbox"
            />
            <span className="terms-text">
              我已阅读并同意《淘贝平台服务协议》
            </span>
          </label>
        </div>
        
        <div className="footer-links">
          <button 
            type="button" 
            className="link-btn" 
            onClick={onSwitchToLogin}
            data-testid="login-link"
          >
            立即登录
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;