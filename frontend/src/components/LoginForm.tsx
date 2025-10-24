import React, { useState, useEffect } from 'react';

interface LoginFormProps {
  onLoginSuccess?: () => void;
  onNavigateToRegister?: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ 
  onLoginSuccess, 
  onNavigateToRegister 
}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [canSendCode, setCanSendCode] = useState(true);

  // 倒计时效果
  useEffect(() => {
    let timer: number;
    if (countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (countdown === 0 && !canSendCode) {
      setCanSendCode(true);
    }
    return () => clearTimeout(timer);
  }, [countdown, canSendCode]);

  // 手机号格式验证
  const isValidPhoneNumber = (phone: string) => {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
  };

  const handleSendCode = async () => {
    setError('');
    
    if (!phoneNumber.trim()) {
      setError('请输入手机号码');
      return;
    }
    
    if (!isValidPhoneNumber(phoneNumber)) {
      setError('请输入正确的手机号码');
      return;
    }

    try {
      setCanSendCode(false);
      setCountdown(60);
      
      const response = await fetch('/api/auth/send-verification-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '发送验证码失败');
      }
      
      // 验证码发送成功，不显示任何消息
    } catch (err) {
      setError(err instanceof Error ? err.message : '发送验证码失败');
      setCanSendCode(true);
      setCountdown(0);
    }
  };

  const handleLogin = async () => {
    setError('');
    
    if (!phoneNumber.trim() || !verificationCode.trim()) {
      setError('请输入手机号和验证码');
      return;
    }
    
    if (!isValidPhoneNumber(phoneNumber)) {
      setError('请输入正确的手机号码');
      return;
    }

    try {
      setIsLoading(true);
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          phoneNumber, 
          verificationCode 
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '登录失败');
      }
      
      // 保存用户信息到本地存储
      if (data.user && data.token) {
        const userData = {
          id: data.user.id || Date.now().toString(),
          phoneNumber: data.user.phoneNumber,
          token: data.token
        };
        localStorage.setItem('taobei_user', JSON.stringify(userData));
      }
      
      // 调用成功回调
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        maxWidth: '400px',
        width: '100%'
      }}>
        {/* 登录方式切换 */}
        <div style={{
          display: 'flex',
          marginBottom: '30px',
          borderBottom: '1px solid #eee'
        }}>
          <button style={{
            flex: 1,
            padding: '12px',
            border: 'none',
            background: 'none',
            color: '#999',
            fontSize: '16px',
            cursor: 'pointer'
          }}>
            密码登录
          </button>
          <button style={{
            flex: 1,
            padding: '12px',
            border: 'none',
            background: 'none',
            color: '#ff6600',
            fontSize: '16px',
            borderBottom: '2px solid #ff6600',
            cursor: 'pointer'
          }}>
            短信登录
          </button>
        </div>

        {/* 手机号输入 */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            border: '1px solid #ddd',
            borderRadius: '4px',
            backgroundColor: '#f8f8f8'
          }}>
            <span style={{
              padding: '12px 16px',
              color: '#666',
              borderRight: '1px solid #ddd',
              fontSize: '14px'
            }}>
              中国大陆 +86
            </span>
            <input
              type="tel"
              placeholder="请输入您的手机号码"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              data-testid="phone-input"
              style={{
                flex: 1,
                padding: '12px 16px',
                border: 'none',
                background: 'transparent',
                fontSize: '16px',
                outline: 'none'
              }}
            />
          </div>
        </div>

        {/* 验证码输入 */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <input
              type="text"
              placeholder="请输入验证码"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              data-testid="code-input"
              style={{
                flex: 1,
                padding: '12px 16px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '16px',
                outline: 'none',
                backgroundColor: '#f8f8f8'
              }}
            />
            <button
              type="button"
              onClick={handleSendCode}
              disabled={!canSendCode}
              data-testid="send-code-button"
              style={{
                padding: '12px 16px',
                border: 'none',
                background: canSendCode ? 'none' : 'none',
                color: canSendCode ? '#ff6600' : '#999',
                fontSize: '14px',
                cursor: canSendCode ? 'pointer' : 'not-allowed',
                whiteSpace: 'nowrap'
              }}
            >
              {countdown > 0 ? `${countdown}秒后重试` : '获取验证码'}
            </button>
          </div>
        </div>

        {/* 错误信息 */}
        {error && (
          <div style={{
            color: '#e74c3c',
            fontSize: '14px',
            marginBottom: '20px',
            textAlign: 'center'
          }} data-testid="error-message">
            {error}
          </div>
        )}

        {/* 登录按钮 */}
        <button
          type="button"
          onClick={handleLogin}
          disabled={isLoading}
          data-testid="login-button"
          style={{
            width: '100%',
            padding: '14px',
            backgroundColor: isLoading ? '#ffb380' : '#ff6600',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            marginBottom: '20px'
          }}
        >
          {isLoading ? '登录中...' : '登录'}
        </button>

        {/* 底部链接 */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '20px',
          fontSize: '14px'
        }}>
          <span style={{ color: '#666' }}>忘记账号</span>
          <span style={{ color: '#666' }}>忘记密码</span>
          <button
            type="button"
            onClick={onNavigateToRegister}
            data-testid="navigate-to-register"
            style={{
              border: 'none',
              background: 'none',
              color: '#ff6600',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            免费注册
          </button>
        </div>

        {/* 用户协议 */}
        <div style={{
          marginTop: '20px',
          fontSize: '12px',
          color: '#999',
          textAlign: 'center',
          lineHeight: '1.5'
        }}>
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <input type="checkbox" style={{ marginRight: '8px' }} />
            已阅读并同意以下协议
            <span style={{ color: '#ff6600', marginLeft: '4px' }}>
              淘宝平台服务协议、隐私权政策、法律声明、支付宝及客户端服务协议
            </span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;