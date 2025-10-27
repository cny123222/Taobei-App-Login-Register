import React from 'react';

interface HomePageProps {
  onNavigateToLogin?: () => void;
  onNavigateToRegister?: () => void;
}

const HomePage: React.FC<HomePageProps> = ({
  onNavigateToLogin,
  onNavigateToRegister
}) => {
  // TODO: 实现品牌logo显示逻辑
  const handleLoginClick = () => {
    // TODO: 实现导航到登录页面的逻辑
    if (onNavigateToLogin) {
      onNavigateToLogin();
    }
  };

  // TODO: 实现注册链接点击逻辑
  const handleRegisterClick = () => {
    // TODO: 实现导航到注册页面的逻辑
    if (onNavigateToRegister) {
      onNavigateToRegister();
    }
  };

  return (
    <div className="home-page">
      {/* TODO: 实现品牌logo显示 */}
      <div className="brand-logo" data-testid="brand-logo">
        <h1>淘贝</h1>
      </div>
      
      {/* TODO: 实现登录链接 */}
      <div className="navigation-links">
        <button 
          className="login-link"
          onClick={handleLoginClick}
          data-testid="login-link"
        >
          登录
        </button>
        
        {/* TODO: 实现注册链接 */}
        <button 
          className="register-link"
          onClick={handleRegisterClick}
          data-testid="register-link"
        >
          注册
        </button>
      </div>
    </div>
  );
};

export default HomePage;