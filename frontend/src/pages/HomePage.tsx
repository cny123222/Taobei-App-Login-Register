import React from 'react';

interface HomePageProps {
  user?: {
    phoneNumber: string;
  };
  onNavigateToLogin?: () => void;
  onNavigateToRegister?: () => void;
  onLogout?: () => void;
}

const HomePage: React.FC<HomePageProps> = ({ 
  user, 
  onNavigateToLogin, 
  onNavigateToRegister, 
  onLogout 
}) => {
  return (
    <div className="home-page">
      <header className="header" role="banner">
        <h1>淘贝</h1>
        {user && (
          <div className="user-info">
            <span data-testid="user-phone">欢迎，{user.phoneNumber}</span>
            <button 
              onClick={onLogout}
              data-testid="logout-button"
            >
              退出登录
            </button>
          </div>
        )}
      </header>
      
      <main className="main-content" role="main">
        <div className="welcome-section">
          <h2>欢迎来到淘贝</h2>
          <p>您的购物之旅从这里开始</p>
          
          {/* 当用户未登录时显示登录注册按钮 */}
          {!user && (
            <div className="auth-buttons">
              {onNavigateToLogin && (
                <button 
                  onClick={onNavigateToLogin}
                  data-testid="login-button"
                  className="btn btn-primary"
                  style={{ marginRight: '16px' }}
                >
                  亲，请登录
                </button>
              )}
              {onNavigateToRegister && (
                <button 
                  onClick={onNavigateToRegister}
                  data-testid="register-button"
                  className="btn btn-secondary"
                >
                  免费注册
                </button>
              )}
            </div>
          )}
        </div>
        
        <div className="features-section">
          <div className="feature-card">
            <h3>商品浏览</h3>
            <p>发现精选商品</p>
          </div>
          <div className="feature-card">
            <h3>购物车</h3>
            <p>管理您的购物清单</p>
          </div>
          <div className="feature-card">
            <h3>订单管理</h3>
            <p>查看订单状态</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HomePage;