// API服务配置
const API_BASE_URL = 'http://localhost:3000/api/auth'

// API响应类型定义
export interface ApiResponse<T = any> {
  success: boolean
  message: string
  data?: T
}

// 发送验证码请求
export interface SendVerificationCodeRequest {
  phoneNumber: string
  countryCode: string
}

// 用户注册请求
export interface RegisterRequest {
  phoneNumber: string
  countryCode: string
  verificationCode: string
  password: string
}

// 用户登录请求
export interface LoginRequest {
  phoneNumber: string
  countryCode: string
  verificationCode: string
}

// 用户信息
export interface UserInfo {
  id: string
  phoneNumber: string
  countryCode: string
  createdAt: string
}

// HTTP请求封装
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`)
    }

    return data
  } catch (error) {
    console.error('API request failed:', error)
    throw error
  }
}

// API服务方法
export const apiService = {
  // 发送验证码
  async sendVerificationCode(request: SendVerificationCodeRequest): Promise<ApiResponse> {
    return apiRequest('/send-verification-code', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  },

  // 用户注册
  async register(request: RegisterRequest): Promise<ApiResponse<UserInfo>> {
    return apiRequest<UserInfo>('/register', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  },

  // 用户登录
  async login(request: LoginRequest): Promise<ApiResponse<UserInfo>> {
    return apiRequest<UserInfo>('/login', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  },
}

export default apiService