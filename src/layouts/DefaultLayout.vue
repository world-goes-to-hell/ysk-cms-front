<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
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
</script>

<template>
  <el-container class="layout-container">
    <!-- 사이드바 -->
    <el-aside :width="isCollapse ? '64px' : '200px'" class="aside">
      <div class="logo">
        <span v-if="!isCollapse">YSK CMS</span>
        <span v-else>Y</span>
      </div>
      <el-menu
        :default-active="$route.path"
        :collapse="isCollapse"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409eff"
        @select="handleMenuSelect"
      >
        <el-menu-item v-for="item in menuItems" :key="item.index" :index="item.index">
          <el-icon><component :is="item.icon" /></el-icon>
          <template #title>{{ item.title }}</template>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <!-- 헤더 -->
      <el-header class="header">
        <div class="header-left">
          <el-button :icon="isCollapse ? 'Expand' : 'Fold'" @click="toggleSidebar" text />
        </div>
        <div class="header-right">
          <el-dropdown>
            <span class="el-dropdown-link">
              <el-avatar :size="32" icon="UserFilled" />
              <span class="username">관리자</span>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item>프로필</el-dropdown-item>
                <el-dropdown-item divided>로그아웃</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <!-- 메인 콘텐츠 -->
      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped>
.layout-container {
  height: 100vh;
}

.aside {
  background-color: #304156;
  transition: width 0.3s;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 20px;
  font-weight: bold;
  background-color: #263445;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #fff;
  border-bottom: 1px solid #e6e6e6;
  padding: 0 20px;
}

.header-left {
  display: flex;
  align-items: center;
}

.header-right {
  display: flex;
  align-items: center;
}

.el-dropdown-link {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.username {
  margin-left: 8px;
  font-size: 14px;
}

.main {
  background-color: #f0f2f5;
  padding: 20px;
}
</style>
