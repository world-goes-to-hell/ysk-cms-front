import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export interface SiteInfo {
  id: number
  code: string
  name: string
}

export const useSiteStore = defineStore('site', () => {
  // State
  const currentSite = ref<SiteInfo | null>(null)

  // Getters
  const siteCode = computed(() => currentSite.value?.code || '')
  const siteName = computed(() => currentSite.value?.name || '')
  const hasSite = computed(() => !!currentSite.value)

  // 로컬 스토리지에서 사이트 정보 복원
  const initSite = () => {
    const storedSite = localStorage.getItem('currentSite')
    if (storedSite) {
      try {
        currentSite.value = JSON.parse(storedSite)
      } catch {
        localStorage.removeItem('currentSite')
      }
    }
  }

  // 사이트 설정
  const setSite = (site: SiteInfo) => {
    currentSite.value = site
    localStorage.setItem('currentSite', JSON.stringify(site))
  }

  // 사이트 정보 초기화 (로그아웃 시)
  const clearSite = () => {
    currentSite.value = null
    localStorage.removeItem('currentSite')
  }

  // 초기화
  initSite()

  return {
    // State
    currentSite,
    // Getters
    siteCode,
    siteName,
    hasSite,
    // Actions
    setSite,
    clearSite,
    initSite,
  }
})
