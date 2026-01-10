// 로그인 요청
export interface LoginRequest {
  username: string
  password: string
}

// 사용자 정보
export interface UserInfo {
  id: number
  username: string
  name: string
  email: string
  roles: string[]
}

// 로그인 응답
export interface LoginResponse {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number
  user: UserInfo
}

// 토큰 갱신 요청
export interface TokenRefreshRequest {
  refreshToken: string
}

// 토큰 갱신 응답
export interface TokenRefreshResponse {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number
}

// API 공통 응답
export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}
