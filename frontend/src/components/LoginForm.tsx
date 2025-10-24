import React, { useState } from 'react';

interface LoginFormProps {
  onSubmit: (data: { phoneNumber: string; verificationCode: string; countryCode: string }) => void;
  onNavigateToRegister: () => void;
  onSendVerificationCode: (phoneNumber: string, countryCode: string) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({
  onSubmit,
  onNavigateToRegister,
  onSendVerificationCode
}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [countryCode, setCountryCode] = useState('+86');
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
    onSubmit({ phoneNumber, verificationCode, countryCode });
  };

  return (
    <form onSubmit={handleSubmit} className="login-form" data-testid="login-form">
      <h2>登录</h2>
      
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

      {/* 登录按钮 */}
      <button 
        type="submit" 
        disabled={isLoading || !phoneNumber || !verificationCode}
        className="submit-button"
        data-testid="login-button"
      >
        {isLoading ? '登录中...' : '登录'}
      </button>

      {/* 注册链接 */}
      <div className="register-link">
        <span>还没有账号？</span>
        <button 
          type="button" 
          onClick={onNavigateToRegister}
          data-testid="navigate-to-register"
        >
          立即注册
        </button>
      </div>
    </form>
  );
};

export default LoginForm;