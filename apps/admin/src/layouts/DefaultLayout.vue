<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const isCollapse = ref(false)

const menuItems = [
  { index: '/', icon: 'HomeFilled', title: '대시보드' },
  { index: '/users', icon: 'User', title: '사용자 관리' },
  { index: '/contents', icon: 'Document', title: '콘텐츠 관리' },
  { index: '/settings', icon: 'Setting', title: '설정' },
]

const handleMenuSelect = (index: string) => {
  router.push(index)
}

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
        <div
          v-for="item in menuItems"
          :key="item.index"
          class="nav-item"
          :class="{ active: route.path === item.index }"
          @click="handleMenuSelect(item.index)"
        >
          <div class="nav-icon">
            <el-icon :size="20"><component :is="item.icon" /></el-icon>
          </div>
          <transition name="fade">
            <span v-if="!isCollapse" class="nav-title">{{ item.title }}</span>
          </transition>
          <div v-if="route.path === item.index" class="nav-indicator"></div>
        </div>
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
            <span class="breadcrumb-current">{{ menuItems.find(m => m.index === route.path)?.title || '페이지' }}</span>
          </div>
        </div>
        <div class="header-right">
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
import { ArrowDown, User, SwitchButton, Expand, Fold, Bell, HomeFilled, Document, Setting } from '@element-plus/icons-vue'

export default {
  components: {
    ArrowDown,
    User,
    SwitchButton,
    Expand,
    Fold,
    Bell,
    HomeFilled,
    Document,
    Setting,
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
  background: #f8fafc;
}

/* 헤더 */
.header {
  height: 72px;
  min-height: 72px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 28px;
  background: #fff;
  border-bottom: 1px solid #e2e8f0;
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
  border: 1px solid #e2e8f0;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #64748b;
  transition: all 0.2s ease;
}

.toggle-btn:hover {
  border-color: #6366f1;
  color: #6366f1;
  background: #f8fafc;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.breadcrumb-item {
  color: #94a3b8;
}

.breadcrumb-separator {
  color: #cbd5e1;
}

.breadcrumb-current {
  color: #1a1a2e;
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
  border: 1px solid #e2e8f0;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #64748b;
  transition: all 0.2s ease;
}

.header-icon-btn:hover {
  border-color: #6366f1;
  color: #6366f1;
}

.notification-dot {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 8px;
  height: 8px;
  background: #ef4444;
  border-radius: 50%;
  border: 2px solid #fff;
}

.user-dropdown {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.user-dropdown:hover {
  background: #f8fafc;
  border-color: #e2e8f0;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, #6366f1 0%, #818cf8 100%);
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
  color: #1a1a2e;
}

.user-role {
  font-size: 11px;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.dropdown-arrow {
  color: #94a3b8;
  font-size: 14px;
  margin-left: 4px;
}

/* 메인 콘텐츠 */
.main-content {
  flex: 1;
  padding: 28px;
  overflow-y: auto;
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
