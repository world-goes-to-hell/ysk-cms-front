<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import { useMenuStore } from '@/stores/menu'
import type { MenuItem } from '@/types/menu'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const themeStore = useThemeStore()
const menuStore = useMenuStore()
const isCollapse = ref(false)

// 메뉴 불러오기
onMounted(() => {
  menuStore.fetchMenus('main')
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

// 현재 경로가 메뉴와 일치하는지 확인
const isMenuActive = (menu: MenuItem): boolean => {
  if (menu.url && route.path === menu.url) return true
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
      router.push(menu.url)
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
              <div
                v-for="child in menu.children"
                :key="child.id"
                class="nav-item nav-item-child"
                :class="{ active: route.path === child.url }"
                @click.stop="handleMenuClick(child)"
              >
                <div class="nav-icon nav-icon-child">
                  <i v-if="child.icon" :class="['mdi', child.icon]"></i>
                  <span v-else class="nav-dot"></span>
                </div>
                <span class="nav-title">{{ child.name }}</span>
                <div v-if="route.path === child.url" class="nav-indicator"></div>
              </div>
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
  </div>
</template>

<script lang="ts">
import { ArrowDown, ArrowRight, User, SwitchButton, Expand, Fold, Bell, HomeFilled, Document, Setting, Sunny, Moon, Monitor, View, Loading } from '@element-plus/icons-vue'

export default {
  components: {
    ArrowDown,
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

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Pretendard:wght@300;400;500;600;700&display=swap');

* {
  font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif;
}

.layout-wrapper {
  display: flex;
  min-height: 100vh;
  width: 100%;
}

/* ==================== 사이드바 ==================== */
.sidebar {
  width: 260px;
  min-width: 260px;
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
  display: flex;
  flex-direction: column;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.sidebar.collapsed {
  width: 80px;
  min-width: 80px;
}

/* 사이드바 배경 효과 */
.sidebar-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.grid-lines {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
  background-size: 30px 30px;
}

.gradient-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
}

.orb-1 {
  width: 200px;
  height: 200px;
  background: rgba(99, 102, 241, 0.15);
  top: -50px;
  left: -50px;
}

.orb-2 {
  width: 150px;
  height: 150px;
  background: rgba(6, 182, 212, 0.1);
  bottom: 100px;
  right: -50px;
}

/* 로고 */
.logo {
  position: relative;
  z-index: 1;
  height: 72px;
  display: flex;
  align-items: center;
  padding: 0 24px;
  gap: 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.sidebar.collapsed .logo {
  justify-content: center;
  padding: 0;
}

.logo-mark {
  width: 36px;
  height: 36px;
  color: #818cf8;
  flex-shrink: 0;
}

.logo-text {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.logo-title {
  font-size: 22px;
  font-weight: 700;
  color: #fff;
  letter-spacing: -0.5px;
}

.logo-subtitle {
  font-size: 11px;
  font-weight: 500;
  color: #818cf8;
  letter-spacing: 2px;
  text-transform: uppercase;
}

/* 네비게이션 */
.sidebar-nav {
  position: relative;
  z-index: 1;
  flex: 1;
  padding: 20px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  color: rgba(255, 255, 255, 0.6);
}

.sidebar.collapsed .nav-item {
  justify-content: center;
  padding: 14px;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.9);
}

.nav-item.active {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(99, 102, 241, 0.1) 100%);
  color: #fff;
}

.nav-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.nav-item:hover .nav-icon {
  background: rgba(255, 255, 255, 0.1);
}

.nav-item.active .nav-icon {
  background: linear-gradient(135deg, #6366f1 0%, #818cf8 100%);
  color: #fff;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
}

.nav-title {
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
}

.nav-indicator {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 24px;
  background: #818cf8;
  border-radius: 3px 0 0 3px;
}

.sidebar.collapsed .nav-indicator {
  display: none;
}

/* MDI 아이콘 */
.nav-icon .mdi {
  font-size: 20px;
  line-height: 1;
}

.nav-icon-child .mdi {
  font-size: 16px;
}

/* 로딩 상태 */
.nav-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  color: rgba(255, 255, 255, 0.5);
}

/* 펼침 화살표 */
.nav-arrow {
  margin-left: auto;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
  transition: transform 0.2s ease;
}

.nav-arrow.expanded {
  transform: rotate(90deg);
}

/* 서브메뉴 */
.nav-submenu {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-left: 20px;
  margin-bottom: 4px;
  overflow: hidden;
}

.nav-item-child {
  padding: 10px 16px;
}

.nav-icon-child {
  width: 32px;
  height: 32px;
  background: transparent;
}


.nav-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transition: all 0.2s ease;
}

.nav-item-child:hover .nav-dot {
  background: rgba(255, 255, 255, 0.6);
}

.nav-item-child.active .nav-dot {
  background: #818cf8;
  box-shadow: 0 0 8px rgba(129, 140, 248, 0.6);
}

.nav-item-child.active .nav-icon-child {
  background: transparent;
  box-shadow: none;
}

/* 서브메뉴 트랜지션 */
.submenu-enter-active,
.submenu-leave-active {
  transition: all 0.2s ease;
}

.submenu-enter-from,
.submenu-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* 사이드바 하단 */
.sidebar-footer {
  position: relative;
  z-index: 1;
  padding: 20px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.version-badge {
  display: inline-flex;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
  letter-spacing: 0.5px;
}

/* ==================== 메인 영역 ==================== */
.main-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: var(--bg-primary);
  transition: background-color 0.3s ease;
}

/* 헤더 */
.header {
  height: 72px;
  min-height: 72px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 28px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  transition: background-color 0.3s ease, border-color 0.3s ease;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.toggle-btn {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  border: 1px solid var(--border-color);
  background: var(--bg-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-secondary);
  transition: all 0.3s ease;
}

.toggle-btn:hover {
  border-color: var(--accent-primary);
  color: var(--accent-primary);
  background: var(--bg-tertiary);
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.breadcrumb-item {
  color: var(--text-tertiary);
}

.breadcrumb-separator {
  color: var(--text-tertiary);
}

.breadcrumb-current {
  color: var(--text-primary);
  font-weight: 600;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-icon-btn {
  position: relative;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  border: 1px solid var(--border-color);
  background: var(--bg-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-secondary);
  transition: all 0.3s ease;
}

.header-icon-btn:hover {
  border-color: var(--accent-primary);
  color: var(--accent-primary);
}

/* 테마 토글 버튼 특별 스타일 */
.header-icon-btn.theme-toggle:hover {
  background: var(--bg-tertiary);
}

/* 블루라이트 차단 버튼 */
.header-icon-btn.blue-light-toggle {
  position: relative;
}

.header-icon-btn.blue-light-toggle.active {
  border-color: #f59e0b;
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.1);
}

.header-icon-btn.blue-light-toggle:hover {
  background: var(--bg-tertiary);
}

.header-icon-btn.blue-light-toggle.active:hover {
  background: rgba(245, 158, 11, 0.15);
}

.blue-light-indicator {
  position: absolute;
  bottom: 2px;
  right: 2px;
  font-size: 9px;
  font-weight: 700;
  color: #f59e0b;
  background: var(--bg-secondary);
  padding: 1px 3px;
  border-radius: 4px;
  line-height: 1;
}

.notification-dot {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 8px;
  height: 8px;
  background: #ef4444;
  border-radius: 50%;
  border: 2px solid var(--bg-secondary);
}

.user-dropdown {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid transparent;
}

.user-dropdown:hover {
  background: var(--bg-tertiary);
  border-color: var(--border-color);
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.user-role {
  font-size: 11px;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.dropdown-arrow {
  color: var(--text-tertiary);
  font-size: 14px;
  margin-left: 4px;
}

/* 메인 콘텐츠 */
.main-content {
  flex: 1;
  padding: 24px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* 드롭다운 메뉴 스타일 */
:deep(.el-dropdown-menu__item) {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  font-size: 14px;
}

:deep(.el-dropdown-menu__item .el-icon) {
  font-size: 16px;
  color: #64748b;
}

/* 트랜지션 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 반응형 */
@media (max-width: 1024px) {
  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    z-index: 1000;
  }

  .sidebar.collapsed {
    transform: translateX(-100%);
  }

  .main-wrapper {
    margin-left: 0;
  }
}
</style>
