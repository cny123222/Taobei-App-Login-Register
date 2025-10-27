import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../api';

const LoginPage: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  // 倒计时效果
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleGetVerificationCode = async () => {
    if (!isPhoneValid) {
      setError('请输入正确的手机号码');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await authAPI.getVerificationCode(phone);
      console.log(`验证码: ${response.data.code}`);
      setCountdown(60);
      setSuccess('验证码已发送');
    } catch (err: any) {
      setError(err.response?.data?.message || '获取验证码失败');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await authAPI.login(phone, verificationCode);
      
      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        setSuccess('登录成功');
        navigate('/');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message;
      if (errorMessage === '手机号未注册') {
        setError('手机号未注册，请先注册');
      } else if (errorMessage === '验证码错误') {
        setError('验证码错误');
      } else {
        setError('登录失败，请重试');
      }
    } finally {
      setLoading(false);
    }
  };

  const isPhoneValid = /^1[3-9]\d{9}$/.test(phone);
  const isFormValid = isPhoneValid && verificationCode.length === 6;

  return (
    <div className="login-page" data-testid="login-page">
      <div className="container">
        <h1 className="brand-logo" data-testid="brand-logo">淘贝</h1>
        
        <form onSubmit={handleLogin} className="login-form" data-testid="login-form">
          {/* 手机号输入区域 */}
          <div className="form-group">
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #d9d9d9', borderRadius: '8px', overflow: 'hidden' }}>
              <div style={{ 
                padding: '16px', 
                backgroundColor: '#f5f5f5', 
                borderRight: '1px solid #d9d9d9',
                fontSize: '14px',
                color: '#666'
              }}>
                +86
              </div>
              <input
                type="tel"
                placeholder="请输入手机号"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="form-input"
                style={{ border: 'none', borderRadius: '0', flex: 1 }}
                maxLength={11}
                data-testid="phone-input"
              />
            </div>
          </div>

          {/* 验证码输入区域 */}
          <div className="form-group">
            <div style={{ display: 'flex', gap: '12px', alignItems: 'stretch' }}>
              <input
                type="text"
                placeholder="请输入验证码"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                className="form-input"
                style={{ flex: 1 }}
                maxLength={6}
                data-testid="verification-input"
              />
              <button
                type="button"
                onClick={handleGetVerificationCode}
                disabled={!isPhoneValid || countdown > 0 || loading}
                className="btn btn-secondary"
                style={{ 
                  minWidth: '100px',
                  fontSize: '14px',
                  whiteSpace: 'nowrap'
                }}
                data-testid="get-code-btn"
              >
                {countdown > 0 ? `${countdown}s` : '获取验证码'}
              </button>
            </div>
          </div>

          {/* 错误和成功消息 */}
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          {/* 登录按钮 */}
          <div className="form-group" style={{ marginTop: '32px' }}>
            <button
              type="submit"
              disabled={!isFormValid || loading}
              className="btn btn-primary btn-full"
              style={{ 
                height: '48px',
                fontSize: '16px',
                fontWeight: '600'
              }}
              data-testid="login-btn"
            >
              {loading ? '登录中...' : '登录'}
            </button>
          </div>
        </form>

        {/* 底部链接 */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          gap: '24px',
          marginTop: '32px',
          fontSize: '14px'
        }}>
          <Link to="#" className="link link-secondary">
            忘记账号
          </Link>
          <Link to="/register" className="link" data-testid="register-link-btn">
            立即注册
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;