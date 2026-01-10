import { ref } from 'vue'
import { defineStore } from 'pinia'

export type ThemeMode = 'light' | 'dark' | 'system'
export type BlueLightLevel = 'off' | 'low' | 'medium' | 'high'

export const useThemeStore = defineStore('theme', () => {
  const mode = ref<ThemeMode>('light')
  const isDark = ref(false)
  const blueLight = ref<BlueLightLevel>('off')

  // 블루라이트 필터 강도
  const blueLightFilters: Record<BlueLightLevel, string> = {
    off: 'none',
    low: 'sepia(10%) saturate(95%)',
    medium: 'sepia(25%) saturate(90%)',
    high: 'sepia(40%) saturate(85%)',
  }

  // 시스템 다크모드 감지
  const systemPrefersDark = () => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  }

  // 실제 다크모드 여부 계산
  const updateIsDark = () => {
    if (mode.value === 'system') {
      isDark.value = systemPrefersDark()
    } else {
      isDark.value = mode.value === 'dark'
    }
    applyTheme()
  }

  // DOM에 테마 적용
  const applyTheme = () => {
    const root = document.documentElement
    if (isDark.value) {
      root.classList.add('dark')
      root.classList.remove('light')
    } else {
      root.classList.add('light')
      root.classList.remove('dark')
    }
    applyBlueLight()
  }

  // 블루라이트 필터 적용
  const applyBlueLight = () => {
    const root = document.documentElement
    root.style.filter = blueLightFilters[blueLight.value]
  }

  // 테마 모드 변경
  const setMode = (newMode: ThemeMode) => {
    mode.value = newMode
    localStorage.setItem('theme_mode', newMode)
    updateIsDark()
  }

  // 다크/라이트 토글
  const toggle = () => {
    if (mode.value === 'system') {
      setMode(isDark.value ? 'light' : 'dark')
    } else {
      setMode(isDark.value ? 'light' : 'dark')
    }
  }

  // 블루라이트 레벨 변경
  const setBlueLight = (level: BlueLightLevel) => {
    blueLight.value = level
    localStorage.setItem('blue_light', level)
    applyBlueLight()
  }

  // 블루라이트 토글 (off -> low -> medium -> high -> off)
  const toggleBlueLight = () => {
    const levels: BlueLightLevel[] = ['off', 'low', 'medium', 'high']
    const currentIndex = levels.indexOf(blueLight.value)
    const nextIndex = (currentIndex + 1) % levels.length
    setBlueLight(levels[nextIndex])
  }

  // 초기화
  const init = () => {
    // 테마 모드 복원
    const savedMode = localStorage.getItem('theme_mode') as ThemeMode | null
    if (savedMode && ['light', 'dark', 'system'].includes(savedMode)) {
      mode.value = savedMode
    }

    // 블루라이트 설정 복원
    const savedBlueLight = localStorage.getItem('blue_light') as BlueLightLevel | null
    if (savedBlueLight && ['off', 'low', 'medium', 'high'].includes(savedBlueLight)) {
      blueLight.value = savedBlueLight
    }

    updateIsDark()

    // 시스템 테마 변경 감지
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (mode.value === 'system') {
        updateIsDark()
      }
    })
  }

  return {
    mode,
    isDark,
    blueLight,
    setMode,
    toggle,
    setBlueLight,
    toggleBlueLight,
    init,
  }
})
