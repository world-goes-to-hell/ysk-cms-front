import axios from 'axios'
import type { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios'

export interface ApiClientConfig {
  baseURL: string
  timeout?: number
  onUnauthorized?: () => void
  getAccessToken?: () => string | null
  getRefreshToken?: () => string | null
  setTokens?: (accessToken: string, refreshToken: string) => void
  clearTokens?: () => void
}

export function createApiClient(config: ApiClientConfig): AxiosInstance {
  const {
    baseURL,
    timeout = 10000,
    onUnauthorized,
    getAccessToken,
    getRefreshToken,
    setTokens,
    clearTokens,
  } = config

  const api: AxiosInstance = axios.create({
    baseURL,
    timeout,
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
    (requestConfig: InternalAxiosRequestConfig) => {
      const token = getAccessToken?.()
      if (token) {
        requestConfig.headers.Authorization = `Bearer ${token}`
      }
      return requestConfig
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
        // 로그인 요청인 경우 토큰 갱신 시도하지 않음
        if (originalRequest.url?.includes('/auth/login')) {
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

        const refreshToken = getRefreshToken?.()

        if (!refreshToken) {
          clearTokens?.()
          onUnauthorized?.()
          return Promise.reject(error)
        }

        try {
          // 토큰 갱신 요청
          const response = await axios.post(`${baseURL}/auth/refresh`, { refreshToken })

          const { accessToken, refreshToken: newRefreshToken } = response.data.data

          // 새 토큰 저장
          setTokens?.(accessToken, newRefreshToken)

          // 대기 중인 요청 처리
          onRefreshed(accessToken)
          isRefreshing = false

          // 원래 요청 재시도
          originalRequest.headers.Authorization = `Bearer ${accessToken}`
          return api(originalRequest)
        } catch (refreshError) {
          // 토큰 갱신 실패 시 로그아웃
          isRefreshing = false
          clearTokens?.()
          onUnauthorized?.()
          return Promise.reject(refreshError)
        }
      }

      return Promise.reject(error)
    },
  )

  return api
}
