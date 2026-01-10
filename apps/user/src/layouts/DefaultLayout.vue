<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'

const menuItems = [
  { path: '/', label: '홈' },
  { path: '/about', label: '소개' },
]
</script>

<template>
  <div class="layout">
    <!-- 헤더 -->
    <header class="header">
      <div class="header-container">
        <RouterLink to="/" class="logo">YSK CMS</RouterLink>

        <nav class="nav">
          <RouterLink
            v-for="item in menuItems"
            :key="item.path"
            :to="item.path"
            class="nav-link"
          >
            {{ item.label }}
          </RouterLink>
        </nav>

        <div class="auth-buttons">
          <RouterLink to="/login" class="btn btn-outline">로그인</RouterLink>
          <RouterLink to="/register" class="btn btn-primary">회원가입</RouterLink>
        </div>
      </div>
    </header>

    <!-- 메인 콘텐츠 -->
    <main class="main">
      <RouterView />
    </main>

    <!-- 푸터 -->
    <footer class="footer">
      <div class="footer-container">
        <p>&copy; 2024 YSK CMS. All rights reserved.</p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  font-size: 20px;
  font-weight: 700;
  color: #6366f1;
  text-decoration: none;
}

.nav {
  display: flex;
  gap: 32px;
}

.nav-link {
  color: #4b5563;
  text-decoration: none;
  font-size: 15px;
  font-weight: 500;
  transition: color 0.2s;
}

.nav-link:hover,
.nav-link.router-link-active {
  color: #6366f1;
}

.auth-buttons {
  display: flex;
  gap: 12px;
}

.btn {
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.2s;
}

.btn-outline {
  color: #4b5563;
  border: 1px solid #e5e7eb;
}

.btn-outline:hover {
  border-color: #6366f1;
  color: #6366f1;
}

.btn-primary {
  background: #6366f1;
  color: #fff;
}

.btn-primary:hover {
  background: #4f46e5;
}

.main {
  flex: 1;
}

.footer {
  background: #1f2937;
  color: #9ca3af;
  padding: 24px 0;
}

.footer-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  text-align: center;
}

.footer p {
  margin: 0;
  font-size: 14px;
}
</style>
