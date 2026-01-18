<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import { useMenuStore } from '@/stores/menu'
import { useChatStore } from '@/stores/chat'
import type { MenuItem } from '@/types/menu'
import ChatToggleButton from '@/components/chat/ChatToggleButton.vue'
import ChatPanel from '@/components/chat/ChatPanel.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const themeStore = useThemeStore()
const menuStore = useMenuStore()
const chatStore = useChatStore()
const isCollapse = ref(false)

// 메뉴 불러오기 및 WebSocket 연결
onMounted(async () => {
  menuStore.fetchMenus('main')

  // 인증된 상태면 WebSocket 연결
  if (authStore.isAuthenticated && authStore.token) {
    try {
      await chatStore.connectWebSocket()
      await chatStore.fetchRooms()
    } catch (error) {
      console.error('[DefaultLayout] 채팅 초기화 실패:', error)
    }
  }
})

// 로그아웃 시 WebSocket 연결 해제
watch(() => authStore.isAuthenticated, (isAuth) => {
  if (!isAuth) {
    chatStore.disconnectWebSocket()
  }
})

onUnmounted(() => {
  chatStore.disconnectWebSocket()
})

// 블루라이트 레벨 라벨
const blueLightLabels: Record<string, string> = {
  off: '',
  low: 'L',
  medium: 'M',
  high: 'H',
}

const blueLightLabel = computed(() => blueLightLabels[themeStore.blueLight])
const blueLightTitle = computed(() => {
  const titles: Record<string, string> = {
    off: '블루라이트 차단 (끔)',
    low: '블루라이트 차단 (낮음)',
    medium: '블루라이트 차단 (중간)',
    high: '블루라이트 차단 (높음)',
  }
  return titles[themeStore.blueLight]
})

// 메뉴가 모두 펼쳐져 있는지 확인
const isAllExpanded = computed(() => {
  const countExpandable = (items: MenuItem[]): number => {
    let count = 0
    items.forEach((item) => {
      if (item.children?.length) {
        count++
        count += countExpandable(item.children)
      }
    })
    return count
  }
  const expandableCount = countExpandable(menuStore.filteredMenus)
  return expandableCount > 0 && menuStore.expandedMenus.size >= expandableCount
})

// 전체 펼치기/접기 토글
const toggleExpandAll = () => {
  if (isAllExpanded.value) {
    menuStore.collapseAll()
  } else {
    menuStore.expandAll()
  }
}

// URL에서 /adm prefix 제거 (Vite base가 /adm/이므로 router.push 시 자동 적용됨)
const normalizeMenuUrl = (url: string): string => {
  if (url.startsWith('/adm/')) {
    return url.substring(4) // '/adm/dashboard' -> '/dashboard'
  }
  if (url.startsWith('/adm')) {
    return url.substring(4) || '/' // '/adm' -> '/'
  }
  return url
}

// 현재 경로가 메뉴와 일치하는지 확인
const isMenuActive = (menu: MenuItem): boolean => {
  if (menu.url) {
    const normalizedUrl = normalizeMenuUrl(menu.url)
    // /dashboard URL은 실제로 / 경로로 리다이렉트됨
    if (normalizedUrl === '/dashboard' && route.path === '/') return true
    if (route.path === normalizedUrl) return true
  }
  if (menu.children?.length) {
    return menu.children.some((child) => isMenuActive(child))
  }
  return false
}

// 메뉴 클릭 핸들러
const handleMenuClick = (menu: MenuItem) => {
  if (menu.type === 'DIRECTORY') {
    menuStore.toggleExpand(menu.id)
  } else if (menu.url) {
    if (menu.type === 'EXTERNAL') {
      window.open(menu.url, menu.target || '_blank')
    } else {
      router.push(normalizeMenuUrl(menu.url))
    }
  }
}

// 현재 페이지 제목
const currentPageTitle = computed(() => {
  const currentMenu = menuStore.findMenuByUrl(route.path)
  return currentMenu?.name || '페이지'
})

const toggleSidebar = () => {
  isCollapse.value = !isCollapse.value
}

const handleCommand = (command: string) => {
  if (command === 'logout') {
    authStore.logout()
  } else if (command === 'profile') {
    router.push('/settings')
  }
}
</script>

<template>
  <div class="layout-wrapper">
    <!-- 사이드바 -->
    <aside class="sidebar" :class="{ collapsed: isCollapse }">
      <!-- 배경 효과 -->
      <div class="sidebar-bg">
        <div class="grid-lines"></div>
        <div class="gradient-orb orb-1"></div>
        <div class="gradient-orb orb-2"></div>
      </div>

      <!-- 로고 -->
      <div class="logo">
        <div class="logo-mark">
          <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="2" width="12" height="12" rx="3" fill="currentColor" opacity="0.9" />
            <rect x="18" y="2" width="12" height="12" rx="3" fill="currentColor" opacity="0.6" />
            <rect x="2" y="18" width="12" height="12" rx="3" fill="currentColor" opacity="0.6" />
            <rect x="18" y="18" width="12" height="12" rx="3" fill="currentColor" opacity="0.3" />
          </svg>
        </div>
        <transition name="fade">
          <div v-if="!isCollapse" class="logo-text">
            <span class="logo-title">YSK</span>
            <span class="logo-subtitle">CMS</span>
          </div>
        </transition>
      </div>

      <!-- 메뉴 컨트롤 -->
      <div v-if="!isCollapse && !menuStore.isLoading" class="menu-controls">
        <button
          class="menu-control-btn toggle"
          :class="{ expanded: isAllExpanded }"
          @click="toggleExpandAll"
          :title="isAllExpanded ? '전체 접기' : '전체 펼치기'"
        >
          <el-icon :size="14">
            <ArrowUp v-if="isAllExpanded" />
            <ArrowDown v-else />
          </el-icon>
          <span>{{ isAllExpanded ? '전체 접기' : '전체 펼치기' }}</span>
        </button>
      </div>

      <!-- 메뉴 -->
      <nav class="sidebar-nav">
        <!-- 로딩 상태 -->
        <div v-if="menuStore.isLoading" class="nav-loading">
          <el-icon class="is-loading" :size="20"><Loading /></el-icon>
        </div>

        <!-- 메뉴 트리 -->
        <template v-else v-for="menu in menuStore.filteredMenus" :key="menu.id">
          <!-- 1레벨 메뉴 -->
          <div
            class="nav-item"
            :class="{ active: isMenuActive(menu), 'has-children': menu.children?.length }"
            @click="handleMenuClick(menu)"
          >
            <div class="nav-icon">
              <i v-if="menu.icon" :class="['mdi', menu.icon]"></i>
              <el-icon v-else :size="20"><Document /></el-icon>
            </div>
            <transition name="fade">
              <span v-if="!isCollapse" class="nav-title">{{ menu.name }}</span>
            </transition>
            <!-- 펼침 화살표 -->
            <transition name="fade">
              <el-icon
                v-if="!isCollapse && menu.children?.length"
                class="nav-arrow"
                :class="{ expanded: menuStore.isExpanded(menu.id) }"
              >
                <ArrowRight />
              </el-icon>
            </transition>
            <div v-if="isMenuActive(menu) && !menu.children?.length" class="nav-indicator"></div>
          </div>

          <!-- 2레벨 서브메뉴 -->
          <transition name="submenu">
            <div
              v-if="menu.children?.length && menuStore.isExpanded(menu.id) && !isCollapse"
              class="nav-submenu"
            >
              <template v-for="child in menu.children" :key="child.id">
                <!-- 2레벨 메뉴 아이템 -->
                <div
                  class="nav-item nav-item-child"
                  :class="{ active: isMenuActive(child) && !child.children?.length, 'has-children': child.children?.length }"
                  @click.stop="handleMenuClick(child)"
                >
                  <div class="nav-icon nav-icon-child">
                    <i v-if="child.icon" :class="['mdi', child.icon]"></i>
                    <span v-else class="nav-dot"></span>
                  </div>
                  <span class="nav-title">{{ child.name }}</span>
                  <!-- 3레벨 자식이 있으면 화살표 표시 -->
                  <el-icon
                    v-if="child.children?.length"
                    class="nav-arrow"
                    :class="{ expanded: menuStore.isExpanded(child.id) }"
                  >
                    <ArrowRight />
                  </el-icon>
                  <div v-if="isMenuActive(child) && !child.children?.length" class="nav-indicator"></div>
                </div>

                <!-- 3레벨 서브메뉴 -->
                <transition name="submenu">
                  <div
                    v-if="child.children?.length && menuStore.isExpanded(child.id)"
                    class="nav-submenu nav-submenu-level3"
                  >
                    <template v-for="grandChild in child.children" :key="grandChild.id">
                      <!-- 3레벨 메뉴 아이템 -->
                      <div
                        class="nav-item nav-item-grandchild"
                        :class="{ active: isMenuActive(grandChild) && !grandChild.children?.length, 'has-children': grandChild.children?.length }"
                        @click.stop="handleMenuClick(grandChild)"
                      >
                        <div class="nav-icon nav-icon-grandchild">
                          <i v-if="grandChild.icon" :class="['mdi', grandChild.icon]"></i>
                          <span v-else class="nav-dot nav-dot-small"></span>
                        </div>
                        <span class="nav-title">{{ grandChild.name }}</span>
                        <!-- 4레벨 자식이 있으면 화살표 표시 -->
                        <el-icon
                          v-if="grandChild.children?.length"
                          class="nav-arrow"
                          :class="{ expanded: menuStore.isExpanded(grandChild.id) }"
                        >
                          <ArrowRight />
                        </el-icon>
                        <div v-if="isMenuActive(grandChild) && !grandChild.children?.length" class="nav-indicator"></div>
                      </div>

                      <!-- 4레벨 서브메뉴 -->
                      <transition name="submenu">
                        <div
                          v-if="grandChild.children?.length && menuStore.isExpanded(grandChild.id)"
                          class="nav-submenu nav-submenu-level4"
                        >
                          <div
                            v-for="greatGrandChild in grandChild.children"
                            :key="greatGrandChild.id"
                            class="nav-item nav-item-great-grandchild"
                            :class="{ active: route.path === greatGrandChild.url }"
                            @click.stop="handleMenuClick(greatGrandChild)"
                          >
                            <div class="nav-icon nav-icon-great-grandchild">
                              <i v-if="greatGrandChild.icon" :class="['mdi', greatGrandChild.icon]"></i>
                              <span v-else class="nav-dot nav-dot-tiny"></span>
                            </div>
                            <span class="nav-title">{{ greatGrandChild.name }}</span>
                            <div v-if="route.path === greatGrandChild.url" class="nav-indicator"></div>
                          </div>
                        </div>
                      </transition>
                    </template>
                  </div>
                </transition>
              </template>
            </div>
          </transition>
        </template>
      </nav>

      <!-- 하단 영역 -->
      <div class="sidebar-footer">
        <div class="version-badge" v-if="!isCollapse">
          <span>v0.1.0</span>
        </div>
      </div>
    </aside>

    <!-- 메인 영역 -->
    <div class="main-wrapper">
      <!-- 헤더 -->
      <header class="header">
        <div class="header-left">
          <button class="toggle-btn" @click="toggleSidebar">
            <el-icon :size="20">
              <component :is="isCollapse ? 'Expand' : 'Fold'" />
            </el-icon>
          </button>
          <div class="breadcrumb">
            <span class="breadcrumb-item">홈</span>
            <span class="breadcrumb-separator">/</span>
            <span class="breadcrumb-current">{{ currentPageTitle }}</span>
          </div>
        </div>
        <div class="header-right">
          <button class="header-icon-btn theme-toggle" @click="themeStore.toggle" :title="themeStore.isDark ? '라이트 모드로 전환' : '다크 모드로 전환'">
            <el-icon :size="20">
              <component :is="themeStore.isDark ? 'Sunny' : 'Moon'" />
            </el-icon>
          </button>
          <button
            class="header-icon-btn blue-light-toggle"
            :class="{ active: themeStore.blueLight !== 'off' }"
            @click="themeStore.toggleBlueLight"
            :title="blueLightTitle"
          >
            <el-icon :size="20"><View /></el-icon>
            <span v-if="themeStore.blueLight !== 'off'" class="blue-light-indicator">
              {{ blueLightLabel }}
            </span>
          </button>
          <button class="header-icon-btn">
            <el-icon :size="20"><Bell /></el-icon>
            <span class="notification-dot"></span>
          </button>
          <el-dropdown @command="handleCommand" trigger="click">
            <div class="user-dropdown">
              <div class="user-avatar">
                <span>{{ (authStore.username || '관리자').charAt(0) }}</span>
              </div>
              <div class="user-info">
                <span class="user-name">{{ authStore.username || '관리자' }}</span>
                <span class="user-role">Administrator</span>
              </div>
              <el-icon class="dropdown-arrow"><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon>
                  프로필 설정
                </el-dropdown-item>
                <el-dropdown-item command="logout" divided>
                  <el-icon><SwitchButton /></el-icon>
                  로그아웃
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>

      <!-- 메인 콘텐츠 -->
      <main class="main-content">
        <router-view />
      </main>
    </div>

    <!-- 채팅 -->
    <ChatToggleButton />
    <ChatPanel />
  </div>
</template>

<script lang="ts">
import { ArrowDown, ArrowUp, ArrowRight, User, SwitchButton, Expand, Fold, Bell, HomeFilled, Document, Setting, Sunny, Moon, Monitor, View, Loading } from '@element-plus/icons-vue'

export default {
  components: {
    ArrowDown,
    ArrowUp,
    ArrowRight,
    User,
    SwitchButton,
    Expand,
    Fold,
    Bell,
    HomeFilled,
    Document,
    Setting,
    Sunny,
    Moon,
    Monitor,
    View,
    Loading,
  },
}
</script>

<!-- CSS: public/css/layouts/default-layout.css -->
