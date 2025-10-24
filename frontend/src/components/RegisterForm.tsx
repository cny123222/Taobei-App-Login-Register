import React, { useState } from 'react';

interface RegisterFormProps {
  onSubmit: (data: { phoneNumber: string; verificationCode: string; countryCode: string; agreeToTerms: boolean }) => void;
  onNavigateToLogin: () => void;
  onSendVerificationCode: (phoneNumber: string, countryCode: string) => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({
  onSubmit,
  onNavigateToLogin,
  onSendVerificationCode
}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [countryCode, setCountryCode] = useState('+86');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);

  const handleSendCode = () => {
    // TODO: 实现发送验证码逻辑
    onSendVerificationCode(phoneNumber, countryCode);
    setCodeSent(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: 实现表单提交逻辑
    setIsLoading(true);
    onSubmit({ phoneNumber, verificationCode, countryCode, agreeToTerms });
  };

  return (
    <form onSubmit={handleSubmit} className="register-form" data-testid="register-form">
      <h2>注册</h2>
      
      {/* 国家代码选择器 */}
      <div className="form-group">
        <label htmlFor="country-code">国家/地区</label>
        <select 
          id="country-code"
          value={countryCode} 
          onChange={(e) => setCountryCode(e.target.value)}
          data-testid="country-code-select"
        >
          <option value="+86">中国 (+86)</option>
          <option value="+1">美国 (+1)</option>
          <option value="+44">英国 (+44)</option>
        </select>
      </div>

      {/* 手机号输入 */}
      <div className="form-group">
        <label htmlFor="phone-number">手机号</label>
        <input
          id="phone-number"
          type="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="请输入手机号"
          data-testid="phone-input"
          required
        />
      </div>

      {/* 验证码输入 */}
      <div className="form-group">
        <label htmlFor="verification-code">验证码</label>
        <div className="verification-input">
          <input
            id="verification-code"
            type="text"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            placeholder="请输入验证码"
            maxLength={6}
            data-testid="verification-code-input"
            required
          />
          <button
            type="button"
            onClick={handleSendCode}
            disabled={!phoneNumber || codeSent}
            data-testid="send-code-button"
          >
            {codeSent ? '已发送' : '发送验证码'}
          </button>
        </div>
      </div>

      {/* 服务条款同意 */}
      <div className="form-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={agreeToTerms}
            onChange={(e) => setAgreeToTerms(e.target.checked)}
            data-testid="terms-checkbox"
            required
          />
          我已阅读并同意《服务条款》和《隐私政策》
        </label>
      </div>

      {/* 注册按钮 */}
      <button 
        type="submit" 
        disabled={isLoading || !phoneNumber || !verificationCode || !agreeToTerms}
        className="submit-button"
        data-testid="register-button"
      >
        {isLoading ? '注册中...' : '注册'}
      </button>

      {/* 登录链接 */}
      <div className="login-link">
        <span>已有账号？</span>
        <button 
          type="button" 
          onClick={onNavigateToLogin}
          data-testid="navigate-to-login"
        >
          立即登录
        </button>
      </div>
    </form>
  );
};

export default RegisterForm;