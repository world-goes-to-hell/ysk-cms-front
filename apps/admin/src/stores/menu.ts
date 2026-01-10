import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { getActiveMenuTree } from '@/api/menu'
import { useAuthStore } from './auth'
import type { MenuItem } from '@/types/menu'

export const useMenuStore = defineStore('menu', () => {
  // State
  const menuItems = ref<MenuItem[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const currentSiteCode = ref('main')
  const expandedMenus = ref<Set<number>>(new Set())

  // Auth store for role-based filtering
  const authStore = useAuthStore()

  // 권한 기반 메뉴 필터링
  const filterByRoles = (menus: MenuItem[], userRoles: string[]): MenuItem[] => {
    return menus
      .filter((menu) => {
        if (!menu.roles) return true
        const requiredRoles = menu.roles.split(',').map((r) => r.trim())
        // ROLE_ 접두사 처리
        return requiredRoles.some(
          (role) =>
            userRoles.includes(role) ||
            userRoles.includes(`ROLE_${role}`) ||
            userRoles.includes(role.replace('ROLE_', '')),
        )
      })
      .map((menu) => ({
        ...menu,
        children: filterByRoles(menu.children || [], userRoles),
      }))
  }

  // Getters
  const filteredMenus = computed(() => {
    const userRoles = authStore.user?.roles || []
    return filterByRoles(menuItems.value, userRoles)
  })

  // 평면화된 메뉴 목록 (검색/브레드크럼용)
  const flatMenus = computed(() => {
    const result: MenuItem[] = []
    const flatten = (items: MenuItem[]) => {
      items.forEach((item) => {
        result.push(item)
        if (item.children?.length) {
          flatten(item.children)
        }
      })
    }
    flatten(filteredMenus.value)
    return result
  })

  // URL로 메뉴 찾기
  const findMenuByUrl = (url: string): MenuItem | undefined => {
    return flatMenus.value.find((menu) => menu.url === url)
  }

  // 메뉴 펼침/접힘 토글
  const toggleExpand = (menuId: number) => {
    if (expandedMenus.value.has(menuId)) {
      expandedMenus.value.delete(menuId)
    } else {
      expandedMenus.value.add(menuId)
    }
  }

  // 메뉴가 펼쳐져 있는지 확인
  const isExpanded = (menuId: number): boolean => {
    return expandedMenus.value.has(menuId)
  }

  // 모든 메뉴 펼치기
  const expandAll = () => {
    const collectIds = (items: MenuItem[]) => {
      items.forEach((item) => {
        if (item.children?.length) {
          expandedMenus.value.add(item.id)
          collectIds(item.children)
        }
      })
    }
    collectIds(menuItems.value)
  }

  // 모든 메뉴 접기
  const collapseAll = () => {
    expandedMenus.value.clear()
  }

  // Actions
  const fetchMenus = async (siteCode?: string) => {
    const targetSiteCode = siteCode || currentSiteCode.value
    isLoading.value = true
    error.value = null

    try {
      const response = await getActiveMenuTree(targetSiteCode)
      menuItems.value = response.data.data
      currentSiteCode.value = targetSiteCode

      // 기본적으로 1레벨 메뉴는 펼쳐두기
      menuItems.value.forEach((menu) => {
        if (menu.children?.length) {
          expandedMenus.value.add(menu.id)
        }
      })

      return { success: true }
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } }
      error.value = axiosError.response?.data?.message ?? '메뉴를 불러오는데 실패했습니다.'
      return { success: false, message: error.value }
    } finally {
      isLoading.value = false
    }
  }

  // 사이트 코드 변경
  const setSiteCode = (siteCode: string) => {
    if (currentSiteCode.value !== siteCode) {
      currentSiteCode.value = siteCode
      fetchMenus(siteCode)
    }
  }

  // 메뉴 새로고침
  const refreshMenus = () => {
    return fetchMenus(currentSiteCode.value)
  }

  return {
    // State
    menuItems,
    isLoading,
    error,
    currentSiteCode,
    expandedMenus,
    // Getters
    filteredMenus,
    flatMenus,
    // Actions
    fetchMenus,
    setSiteCode,
    refreshMenus,
    findMenuByUrl,
    toggleExpand,
    isExpanded,
    expandAll,
    collapseAll,
  }
})
