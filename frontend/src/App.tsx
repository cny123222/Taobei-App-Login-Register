import React, { useState } from 'react';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import './App.css';

type AuthMode = 'login' | 'register';

function App() {
  const [authMode, setAuthMode] = useState<AuthMode>('login');

  return (
    <div className="app">
      <div className="auth-container">
        <div className="auth-header">
          <h1 className="app-title">淘贝</h1>
          <p className="app-subtitle">手机验证登录</p>
        </div>
        
        <div className="auth-tabs">
          <button
            className={`auth-tab ${authMode === 'login' ? 'active' : ''}`}
            onClick={() => setAuthMode('login')}
            data-testid="login-tab"
          >
            登录
          </button>
          <button
            className={`auth-tab ${authMode === 'register' ? 'active' : ''}`}
            onClick={() => setAuthMode('register')}
            data-testid="register-tab"
          >
            注册
          </button>
        </div>

        <div className="auth-content">
          {authMode === 'login' ? (
            <LoginForm onSwitchToRegister={() => setAuthMode('register')} />
          ) : (
            <RegisterForm onSwitchToLogin={() => setAuthMode('login')} />
          )}
        </div>
      </div>
    </div>
  )
}

export default App;