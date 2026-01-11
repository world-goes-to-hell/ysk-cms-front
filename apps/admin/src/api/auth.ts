import api from './index'
import type {
  LoginRequest,
  LoginResponse,
  TokenRefreshRequest,
  TokenRefreshResponse,
  UserInfo,
  ApiResponse,
  RegisterRequest,
  RegisterResponse,
  RoleDto,
} from '@/types/auth'

// 로그인
export const login = (data: LoginRequest) => {
  return api.post<ApiResponse<LoginResponse>>('/auth/login', data)
}

// 토큰 갱신
export const refreshToken = (data: TokenRefreshRequest) => {
  return api.post<ApiResponse<TokenRefreshResponse>>('/auth/refresh', data)
}

// 현재 사용자 정보 조회
export const getCurrentUser = () => {
  return api.get<ApiResponse<UserInfo>>('/auth/me')
}

// 로그아웃 (클라이언트 측 처리)
export const logout = () => {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('user')
}

// 회원가입
export const register = (data: RegisterRequest) => {
  return api.post<ApiResponse<RegisterResponse>>('/auth/register', data)
}

// 역할 목록 조회
export const getRoles = () => {
  return api.get<ApiResponse<RoleDto[]>>('/auth/roles')
}
