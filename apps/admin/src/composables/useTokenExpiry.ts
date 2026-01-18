import { ref, onMounted, onUnmounted } from 'vue'
import { refreshToken } from '@/api/auth'
import { useAuthStore } from '@/stores/auth'

// JWT 토큰 디코딩 (base64)
function decodeJwt(token: string): { exp: number } | null {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch {
    return null
  }
}

// 토큰 만료까지 남은 시간 (초)
function getTimeUntilExpiry(token: string): number {
  const payload = decodeJwt(token)
  if (!payload?.exp) return 0
  return payload.exp - Math.floor(Date.now() / 1000)
}

export function useTokenExpiry(warningMinutes: number = 5) {
  const authStore = useAuthStore()

  const showDialog = ref(false)
  const remainingSeconds = ref(0)
  const isExtending = ref(false)

  let checkInterval: ReturnType<typeof setInterval> | null = null
  let countdownInterval: ReturnType<typeof setInterval> | null = null
  let lastCheckTime = Date.now()

  // 토큰 만료 체크
  const checkTokenExpiry = () => {
    const token = localStorage.getItem('accessToken')
    if (!token) return

    const timeLeft = getTimeUntilExpiry(token)
    const warningSeconds = warningMinutes * 60

    console.log(`[TokenExpiry] 토큰 만료까지 남은 시간: ${timeLeft}초`)

    // 이미 만료된 경우 즉시 로그아웃
    if (timeLeft <= 0) {
      console.log('[TokenExpiry] 토큰이 만료되었습니다. 로그아웃 처리.')
      showDialog.value = false
      stopCountdown()
      authStore.logout()
      return
    }

    // 경고 시간 내인 경우 다이얼로그 표시 (사용자가 직접 연장 선택)
    if (timeLeft <= warningSeconds && !showDialog.value) {
      showDialog.value = true
      remainingSeconds.value = timeLeft
      startCountdown()
    }

    // 마지막 체크 시간 갱신
    lastCheckTime = Date.now()
  }

  // 페이지 가시성 변경 핸들러 (브라우저 탭 활성화/비활성화)
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      console.log('[TokenExpiry] 페이지가 다시 활성화됨. 토큰 상태 확인...')

      // 비활성화 동안 경과한 시간 체크
      const elapsed = Date.now() - lastCheckTime
      console.log(`[TokenExpiry] 마지막 체크 이후 ${Math.floor(elapsed / 1000)}초 경과`)

      // 즉시 토큰 상태 확인
      checkTokenExpiry()
    }
  }

  // 창 포커스 핸들러
  const handleFocus = () => {
    console.log('[TokenExpiry] 창이 포커스됨. 토큰 상태 확인...')
    checkTokenExpiry()
  }

  // 카운트다운 시작
  const startCountdown = () => {
    if (countdownInterval) clearInterval(countdownInterval)

    countdownInterval = setInterval(() => {
      // 현재 토큰에서 실제 남은 시간 재계산 (타이머 드리프트 방지)
      const token = localStorage.getItem('accessToken')
      if (token) {
        const actualTimeLeft = getTimeUntilExpiry(token)
        if (actualTimeLeft <= 0) {
          showDialog.value = false
          authStore.logout()
          stopCountdown()
          return
        }
        remainingSeconds.value = actualTimeLeft
      } else {
        remainingSeconds.value--
      }

      if (remainingSeconds.value <= 0) {
        showDialog.value = false
        authStore.logout()
        stopCountdown()
      }
    }, 1000)
  }

  // 카운트다운 중지
  const stopCountdown = () => {
    if (countdownInterval) {
      clearInterval(countdownInterval)
      countdownInterval = null
    }
  }

  // 세션 연장 (사용자가 버튼 클릭 시)
  const extendSession = async () => {
    isExtending.value = true

    try {
      const currentRefreshToken = localStorage.getItem('refreshToken')
      if (!currentRefreshToken) {
        authStore.logout()
        return false
      }

      const response = await refreshToken({ refreshToken: currentRefreshToken })
      const { accessToken, refreshToken: newRefreshToken } = response.data.data

      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('refreshToken', newRefreshToken)

      showDialog.value = false
      stopCountdown()

      return true
    } catch {
      authStore.logout()
      return false
    } finally {
      isExtending.value = false
    }
  }

  // 로그아웃
  const handleLogout = () => {
    showDialog.value = false
    stopCountdown()
    authStore.logout()
  }

  // 남은 시간 포맷
  const formatRemainingTime = () => {
    const minutes = Math.floor(remainingSeconds.value / 60)
    const seconds = remainingSeconds.value % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  onMounted(() => {
    // 15초마다 토큰 만료 체크 (더 자주 체크)
    checkInterval = setInterval(checkTokenExpiry, 15000)

    // 초기 체크
    checkTokenExpiry()

    // 페이지 가시성 변경 이벤트 리스너 (핵심 수정사항)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // 창 포커스 이벤트 리스너
    window.addEventListener('focus', handleFocus)

    console.log('[TokenExpiry] 토큰 만료 감시 시작')
  })

  onUnmounted(() => {
    if (checkInterval) clearInterval(checkInterval)
    stopCountdown()

    // 이벤트 리스너 제거
    document.removeEventListener('visibilitychange', handleVisibilityChange)
    window.removeEventListener('focus', handleFocus)

    console.log('[TokenExpiry] 토큰 만료 감시 종료')
  })

  return {
    showDialog,
    remainingSeconds,
    isExtending,
    extendSession,
    handleLogout,
    formatRemainingTime
  }
}
