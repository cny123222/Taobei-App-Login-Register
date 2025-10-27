import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../api';

interface UserInfo {
  phone: string;
}

const HomePage: React.FC = () => {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 检查用户登录状态
    const checkUserStatus = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // 调用API获取用户信息
          const response = await authAPI.getUserInfo();
          if (response.data.success) {
            setUserInfo(response.data.user);
          } else {
            // 如果获取用户信息失败，清除token
            localStorage.removeItem('token');
            setUserInfo(null);
          }
        } catch (error) {
          // 如果token无效或API调用失败，清除它
          localStorage.removeItem('token');
          setUserInfo(null);
        }
      }
      setLoading(false);
    };

    checkUserStatus();
  }, []);

  const handleLogout = () => {
    // 实现登出逻辑
    localStorage.removeItem('token');
    setUserInfo(null);
    // 刷新页面
    window.location.reload();
  };

  // 手机号脱敏处理
  const maskPhoneNumber = (phone: string) => {
    if (phone.length === 11) {
      return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
    }
    return phone;
  };

  if (loading) {
    return (
      <div className="home-page" data-testid="home-page">
        <div className="container">
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <div>加载中...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="home-page" data-testid="home-page">
      <div className="container">
        {/* 头部区域 */}
        <header style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px 0',
          borderBottom: '1px solid #f0f0f0',
          marginBottom: '40px'
        }}>
          {/* 品牌Logo */}
          <h1 
            className="brand-logo" 
            data-testid="brand-logo"
            style={{
              fontSize: '32px',
              fontWeight: 'bold',
              color: 'var(--color-primary)',
              margin: 0,
              textShadow: '0 2px 4px rgba(255, 102, 0, 0.2)'
            }}
          >
            淘贝
          </h1>
          
          {/* 用户区域 */}
          <div className="user-section" data-testid="user-section">
            {userInfo ? (
              // 已登录状态
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
              }}>
                <div 
                  className="user-info" 
                  data-testid="user-info"
                  style={{
                    fontSize: '14px',
                    color: '#666'
                  }}
                >
                  欢迎，{maskPhoneNumber(userInfo.phone)}
                </div>
                <button 
                  onClick={handleLogout}
                  className="btn btn-secondary"
                  data-testid="logout-btn"
                  style={{
                    padding: '8px 16px',
                    fontSize: '14px',
                    border: '1px solid #d9d9d9',
                    borderRadius: '6px',
                    backgroundColor: '#fff',
                    color: '#666',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-primary)';
                    e.currentTarget.style.color = 'var(--color-primary)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = '#d9d9d9';
                    e.currentTarget.style.color = '#666';
                  }}
                >
                  退出登录
                </button>
              </div>
            ) : (
              // 未登录状态
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
              }}>
                <Link 
                  to="/login" 
                  className="link"
                  data-testid="login-link"
                  style={{
                    color: 'var(--color-primary)',
                    textDecoration: 'none',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  登录
                </Link>
                <span style={{ color: '#d9d9d9' }}>|</span>
                <Link 
                  to="/register" 
                  className="link"
                  data-testid="register-link"
                  style={{
                    color: 'var(--color-primary)',
                    textDecoration: 'none',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  注册
                </Link>
              </div>
            )}
          </div>
        </header>

        {/* 主要内容区域 */}
        <main className="home-content" data-testid="home-content">
          {/* 欢迎区域 */}
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: 'linear-gradient(135deg, #fff5f0 0%, #fff 100%)',
            borderRadius: '16px',
            marginBottom: '40px',
            boxShadow: '0 4px 20px rgba(255, 102, 0, 0.1)'
          }}>
            <h2 style={{
              fontSize: '36px',
              fontWeight: 'bold',
              color: '#333',
              marginBottom: '16px',
              background: 'linear-gradient(135deg, var(--color-primary) 0%, #ff8533 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              欢迎来到淘贝
            </h2>
            <p style={{
              fontSize: '18px',
              color: '#666',
              marginBottom: '32px',
              lineHeight: '1.6'
            }}>
              您的购物新体验，发现更多精彩商品
            </p>
            
            {!userInfo && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '16px',
                flexWrap: 'wrap'
              }}>
                <Link 
                  to="/login"
                  className="btn btn-primary"
                  style={{
                    padding: '12px 32px',
                    fontSize: '16px',
                    fontWeight: '600',
                    textDecoration: 'none',
                    borderRadius: '8px',
                    transition: 'all 0.3s'
                  }}
                >
                  立即登录
                </Link>
                <Link 
                  to="/register"
                  className="btn btn-secondary"
                  style={{
                    padding: '12px 32px',
                    fontSize: '16px',
                    fontWeight: '600',
                    textDecoration: 'none',
                    borderRadius: '8px',
                    border: '2px solid var(--color-primary)',
                    backgroundColor: 'transparent',
                    color: 'var(--color-primary)',
                    transition: 'all 0.3s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-primary)';
                    e.currentTarget.style.color = '#fff';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--color-primary)';
                  }}
                >
                  免费注册
                </Link>
              </div>
            )}
          </div>

          {/* 特色功能区域 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px',
            marginBottom: '40px'
          }}>
            <div style={{
              padding: '32px',
              backgroundColor: '#fff',
              borderRadius: '12px',
              boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
              textAlign: 'center',
              border: '1px solid #f0f0f0',
              transition: 'transform 0.3s, box-shadow 0.3s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(255, 102, 0, 0.15)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 12px rgba(0, 0, 0, 0.08)';
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                backgroundColor: 'var(--color-primary)',
                borderRadius: '50%',
                margin: '0 auto 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                color: '#fff'
              }}>
                🛍️
              </div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#333',
                marginBottom: '8px'
              }}>
                精选商品
              </h3>
              <p style={{
                fontSize: '14px',
                color: '#666',
                lineHeight: '1.5'
              }}>
                海量优质商品，满足您的购物需求
              </p>
            </div>

            <div style={{
              padding: '32px',
              backgroundColor: '#fff',
              borderRadius: '12px',
              boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
              textAlign: 'center',
              border: '1px solid #f0f0f0',
              transition: 'transform 0.3s, box-shadow 0.3s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(255, 102, 0, 0.15)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 12px rgba(0, 0, 0, 0.08)';
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                backgroundColor: 'var(--color-primary)',
                borderRadius: '50%',
                margin: '0 auto 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                color: '#fff'
              }}>
                🚚
              </div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#333',
                marginBottom: '8px'
              }}>
                快速配送
              </h3>
              <p style={{
                fontSize: '14px',
                color: '#666',
                lineHeight: '1.5'
              }}>
                专业物流团队，确保商品快速到达
              </p>
            </div>

            <div style={{
              padding: '32px',
              backgroundColor: '#fff',
              borderRadius: '12px',
              boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
              textAlign: 'center',
              border: '1px solid #f0f0f0',
              transition: 'transform 0.3s, box-shadow 0.3s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(255, 102, 0, 0.15)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 12px rgba(0, 0, 0, 0.08)';
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                backgroundColor: 'var(--color-primary)',
                borderRadius: '50%',
                margin: '0 auto 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                color: '#fff'
              }}>
                🔒
              </div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#333',
                marginBottom: '8px'
              }}>
                安全保障
              </h3>
              <p style={{
                fontSize: '14px',
                color: '#666',
                lineHeight: '1.5'
              }}>
                多重安全保护，让您购物更放心
              </p>
            </div>
          </div>
        </main>

        {/* 底部区域 */}
        <footer style={{
          textAlign: 'center',
          padding: '40px 0',
          borderTop: '1px solid #f0f0f0',
          color: '#999',
          fontSize: '14px'
        }}>
          <p>© 2024 淘贝 - 您的购物新体验</p>
        </footer>
      </div>
    </div>
  );
};

export default HomePage;