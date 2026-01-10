import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { useRouter } from 'vue-router'
import { login as loginApi, getCurrentUser, logout as logoutApi } from '@/api/auth'
import { getActiveMenuTree } from '@/api/menu'
import { registerDynamicRoutes } from '@/router'
import type { UserInfo, LoginRequest } from '@/types/auth'

export const useAuthStore = defineStore('auth', () => {
  const router = useRouter()

  // State
  const user = ref<UserInfo | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const isAuthenticated = computed(() => !!user.value)
  const isAdmin = computed(() => user.value?.roles.includes('ROLE_ADMIN') ?? false)
  const username = computed(() => user.value?.name ?? user.value?.username ?? '')

  // 로컬 스토리지에서 사용자 정보 복원
  const initAuth = () => {
    const storedUser = localStorage.getItem('user')
    const accessToken = localStorage.getItem('accessToken')

    if (storedUser && accessToken) {
      try {
        user.value = JSON.parse(storedUser)
      } catch {
        localStorage.removeItem('user')
      }
    }
  }

  // 로그인
  const login = async (credentials: LoginRequest) => {
    isLoading.value = true
    error.value = null

    try {
      const response = await loginApi(credentials)
      const { accessToken, refreshToken, user: userInfo } = response.data.data

      // 토큰 저장
      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('refreshToken', refreshToken)
      localStorage.setItem('user', JSON.stringify(userInfo))

      // 상태 업데이트
      user.value = userInfo

      // 메뉴 로드 및 동적 라우트 등록
      try {
        const menuResponse = await getActiveMenuTree('main')
        if (menuResponse.data.data) {
          registerDynamicRoutes(menuResponse.data.data)
        }
      } catch (menuError) {
        console.warn('[Auth] 메뉴 로드 실패:', menuError)
      }

      return { success: true }
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } }
      error.value = axiosError.response?.data?.message ?? '로그인에 실패했습니다.'
      return { success: false, message: error.value }
    } finally {
      isLoading.value = false
    }
  }

  // 로그아웃
  const logout = () => {
    logoutApi()
    user.value = null
    router.push('/adm/login')
  }

  // 사용자 정보 새로고침
  const fetchUser = async () => {
    try {
      const response = await getCurrentUser()
      user.value = response.data.data
      localStorage.setItem('user', JSON.stringify(user.value))
    } catch {
      logout()
    }
  }

  // 초기화
  initAuth()

  return {
    // State
    user,
    isLoading,
    error,
    // Getters
    isAuthenticated,
    isAdmin,
    username,
    // Actions
    login,
    logout,
    fetchUser,
    initAuth,
  }
})
