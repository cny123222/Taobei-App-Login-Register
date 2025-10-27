import axios from 'axios';

// 创建axios实例
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 添加token到请求头
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // 统一错误处理
    if (error.response?.status === 401) {
      // 检查是否是验证码相关的错误，如果是则不跳转
      const isVerificationCodeError = error.config?.url?.includes('/auth/login') || 
                                     error.config?.url?.includes('/auth/register');
      
      if (!isVerificationCodeError) {
        // 只有非验证码错误的401才跳转（如token过期）
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// API接口定义
export const authAPI = {
  // 获取验证码
  getVerificationCode: (phone: string) => 
    api.post('/auth/verification-code', { phoneNumber: phone }),
  
  // 用户登录
  login: (phone: string, verificationCode: string) => 
    api.post('/auth/login', { phoneNumber: phone, verificationCode }),
  
  // 用户注册
  register: (phone: string, verificationCode: string, agreeToTerms: boolean) => 
    api.post('/auth/register', { phoneNumber: phone, verificationCode, agreeToTerms }),
  
  // 获取用户信息
  getUserInfo: () => 
    api.get('/user/info'),
  
  // 登出
  logout: () => 
    api.post('/logout'),
};

export default api;