import axios from 'axios'
import type { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import router from '@/router'

// API 기본 설정
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 토큰 갱신 중 여부
let isRefreshing = false
// 토큰 갱신 대기 요청 큐
let refreshSubscribers: ((token: string) => void)[] = []

// 토큰 갱신 완료 시 대기 요청 처리
const onRefreshed = (token: string) => {
  refreshSubscribers.forEach((callback) => callback(token))
  refreshSubscribers = []
}

// 토큰 갱신 대기 요청 추가
const addRefreshSubscriber = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback)
}

// 요청 인터셉터
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // 현재 라우트의 menuId를 X-Menu-Id 헤더로 전송 (메뉴 기반 동적 권한 체크용)
    const currentRoute = router.currentRoute.value
    const menuId = currentRoute.meta?.menuId || currentRoute.meta?.parentMenuId
    if (menuId) {
      config.headers['X-Menu-Id'] = String(menuId)
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// 응답 인터셉터
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  async (error) => {
    const originalRequest = error.config

    // 401 에러이고, 재시도가 아닌 경우
    if (error.response?.status === 401 && !originalRequest._retry) {
      // 로그인/회원가입 요청인 경우 토큰 갱신 시도하지 않음
      if (originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/register')) {
        return Promise.reject(error)
      }

      if (isRefreshing) {
        // 토큰 갱신 중이면 대기
        return new Promise((resolve) => {
          addRefreshSubscriber((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            resolve(api(originalRequest))
          })
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      const refreshToken = localStorage.getItem('refreshToken')

      if (!refreshToken) {
        // 리프레시 토큰이 없으면 로그인 페이지로
        localStorage.removeItem('accessToken')
        localStorage.removeItem('user')
        window.location.href = '/adm/login'
        return Promise.reject(error)
      }

      try {
        // 토큰 갱신 요청
        const response = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'}/auth/refresh`,
          { refreshToken },
        )

        const { accessToken, refreshToken: newRefreshToken } = response.data.data

        // 새 토큰 저장
        localStorage.setItem('accessToken', accessToken)
        localStorage.setItem('refreshToken', newRefreshToken)

        // 대기 중인 요청 처리
        onRefreshed(accessToken)
        isRefreshing = false

        // 원래 요청 재시도
        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        return api(originalRequest)
      } catch (refreshError) {
        // 토큰 갱신 실패 시 로그아웃
        isRefreshing = false
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
        window.location.href = '/adm/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  },
)

// 파일 URL을 전체 URL로 변환
export const getFileUrl = (url: string | null | undefined): string => {
  if (!url) return ''

  // 이미 전체 URL인 경우 그대로 반환
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }

  // API base URL에서 도메인 추출 (예: http://localhost:8080/api -> http://localhost:8080)
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'
  const baseUrl = apiBaseUrl.replace('/api', '')

  return `${baseUrl}${url}`
}

export default api
