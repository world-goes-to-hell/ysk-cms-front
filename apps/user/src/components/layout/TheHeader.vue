<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

// Props
interface Props {
  transparent?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  transparent: false
})

const route = useRoute()

// State
const isScrolled = ref(false)
const isMobileMenuOpen = ref(false)
const isDark = ref(false)

// Navigation items
const navItems = [
  { path: '/', label: '홈' },
  { path: '/about', label: '소개' },
  { path: '/contents', label: '콘텐츠' },
  { path: '/board', label: '게시판' },
]

// Computed
const headerClass = computed(() => ({
  'header': true,
  'header--scrolled': isScrolled.value,
  'header--transparent': props.transparent && !isScrolled.value,
  'header--mobile-open': isMobileMenuOpen.value,
}))

// Methods
const handleScroll = () => {
  isScrolled.value = window.scrollY > 20
}

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
  if (isMobileMenuOpen.value) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
}

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false
  document.body.style.overflow = ''
}

const toggleTheme = () => {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark', isDark.value)
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
}

const isActive = (path: string) => {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

// Lifecycle
onMounted(() => {
  window.addEventListener('scroll', handleScroll)
  handleScroll()

  // Check saved theme
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    isDark.value = true
    document.documentElement.classList.add('dark')
  }
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<template>
  <header :class="headerClass">
    <div class="header__container">
      <!-- Logo -->
      <RouterLink to="/" class="header__logo" @click="closeMobileMenu">
        <div class="header__logo-icon">
          <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="2" width="12" height="12" rx="3" fill="currentColor" opacity="0.9" />
            <rect x="18" y="2" width="12" height="12" rx="3" fill="currentColor" opacity="0.6" />
            <rect x="2" y="18" width="12" height="12" rx="3" fill="currentColor" opacity="0.6" />
            <rect x="18" y="18" width="12" height="12" rx="3" fill="currentColor" opacity="0.3" />
          </svg>
        </div>
        <span class="header__logo-text">YSK<span class="header__logo-accent">CMS</span></span>
      </RouterLink>

      <!-- Desktop Navigation -->
      <nav class="header__nav">
        <RouterLink
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="header__nav-link"
          :class="{ 'header__nav-link--active': isActive(item.path) }"
        >
          {{ item.label }}
          <span class="header__nav-indicator"></span>
        </RouterLink>
      </nav>

      <!-- Actions -->
      <div class="header__actions">
        <!-- Theme Toggle -->
        <button class="header__action-btn" @click="toggleTheme" :title="isDark ? '라이트 모드' : '다크 모드'">
          <svg v-if="isDark" class="header__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="5"/>
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
          </svg>
          <svg v-else class="header__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        </button>

        <!-- Auth Buttons -->
        <div class="header__auth">
          <RouterLink to="/login" class="header__auth-link">로그인</RouterLink>
          <RouterLink to="/register" class="header__auth-btn">
            시작하기
            <svg class="header__auth-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </RouterLink>
        </div>

        <!-- Mobile Menu Toggle -->
        <button class="header__mobile-toggle" @click="toggleMobileMenu" :aria-expanded="isMobileMenuOpen">
          <span class="header__mobile-toggle-line"></span>
          <span class="header__mobile-toggle-line"></span>
          <span class="header__mobile-toggle-line"></span>
        </button>
      </div>
    </div>

    <!-- Mobile Menu -->
    <Transition name="mobile-menu">
      <div v-if="isMobileMenuOpen" class="header__mobile-menu">
        <nav class="header__mobile-nav">
          <RouterLink
            v-for="item in navItems"
            :key="item.path"
            :to="item.path"
            class="header__mobile-link"
            :class="{ 'header__mobile-link--active': isActive(item.path) }"
            @click="closeMobileMenu"
          >
            {{ item.label }}
          </RouterLink>
        </nav>
        <div class="header__mobile-auth">
          <RouterLink to="/login" class="header__mobile-auth-link" @click="closeMobileMenu">
            로그인
          </RouterLink>
          <RouterLink to="/register" class="header__mobile-auth-btn" @click="closeMobileMenu">
            시작하기
          </RouterLink>
        </div>
      </div>
    </Transition>
  </header>
</template>

<style scoped>
.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: var(--z-fixed);
  height: var(--header-height);
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-light);
  transition: all var(--transition-normal) var(--ease-default);
}

.header--transparent {
  background: transparent;
  border-bottom-color: transparent;
}

.header--transparent .header__logo-text,
.header--transparent .header__nav-link,
.header--transparent .header__action-btn,
.header--transparent .header__auth-link {
  color: white;
}

.header--transparent .header__auth-btn {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
  color: white;
  backdrop-filter: blur(10px);
}

.header--transparent .header__auth-btn:hover {
  background: rgba(255, 255, 255, 0.25);
  border-color: rgba(255, 255, 255, 0.5);
}

.header--scrolled {
  background: var(--bg-primary);
  border-bottom-color: var(--border-light);
  box-shadow: var(--shadow-sm);
}

.header--scrolled .header__logo-text,
.header--scrolled .header__nav-link,
.header--scrolled .header__action-btn,
.header--scrolled .header__auth-link {
  color: var(--text-primary);
}

.header__container {
  max-width: var(--container-xl);
  height: 100%;
  margin: 0 auto;
  padding: 0 var(--space-6);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-8);
}

/* Logo */
.header__logo {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  text-decoration: none;
  flex-shrink: 0;
}

.header__logo-icon {
  width: 36px;
  height: 36px;
  color: var(--color-primary-500);
}

.header__logo-text {
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
  color: var(--text-primary);
  letter-spacing: var(--tracking-tight);
  transition: color var(--transition-fast);
}

.header__logo-accent {
  color: var(--color-primary-500);
  margin-left: 2px;
}

/* Navigation */
.header__nav {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.header__nav-link {
  position: relative;
  padding: var(--space-2) var(--space-4);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-secondary);
  text-decoration: none;
  border-radius: var(--radius-lg);
  transition: all var(--transition-fast);
}

.header__nav-link:hover {
  color: var(--text-primary);
  background: var(--bg-tertiary);
}

.header__nav-link--active {
  color: var(--color-primary-600);
}

.header__nav-indicator {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%) scaleX(0);
  width: 20px;
  height: 2px;
  background: var(--color-primary-500);
  border-radius: var(--radius-full);
  transition: transform var(--transition-fast);
}

.header__nav-link--active .header__nav-indicator {
  transform: translateX(-50%) scaleX(1);
}

/* Actions */
.header__actions {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.header__action-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-lg);
  color: var(--text-secondary);
  transition: all var(--transition-fast);
}

.header__action-btn:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.header__icon {
  width: 20px;
  height: 20px;
}

/* Auth */
.header__auth {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.header__auth-link {
  padding: var(--space-2) var(--space-4);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-secondary);
  text-decoration: none;
  border-radius: var(--radius-lg);
  transition: all var(--transition-fast);
}

.header__auth-link:hover {
  color: var(--text-primary);
  background: var(--bg-tertiary);
}

.header__auth-btn {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-5);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: white;
  background: var(--gradient-primary);
  border: 1px solid transparent;
  border-radius: var(--radius-full);
  text-decoration: none;
  transition: all var(--transition-fast);
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
}

.header__auth-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.4);
}

.header__auth-btn-icon {
  width: 16px;
  height: 16px;
  transition: transform var(--transition-fast);
}

.header__auth-btn:hover .header__auth-btn-icon {
  transform: translateX(3px);
}

/* Mobile Toggle */
.header__mobile-toggle {
  display: none;
  width: 40px;
  height: 40px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  border-radius: var(--radius-lg);
  transition: background var(--transition-fast);
}

.header__mobile-toggle:hover {
  background: var(--bg-tertiary);
}

.header__mobile-toggle-line {
  width: 20px;
  height: 2px;
  background: var(--text-primary);
  border-radius: var(--radius-full);
  transition: all var(--transition-fast);
}

.header--mobile-open .header__mobile-toggle-line:nth-child(1) {
  transform: rotate(45deg) translate(5px, 5px);
}

.header--mobile-open .header__mobile-toggle-line:nth-child(2) {
  opacity: 0;
}

.header--mobile-open .header__mobile-toggle-line:nth-child(3) {
  transform: rotate(-45deg) translate(5px, -5px);
}

/* Mobile Menu */
.header__mobile-menu {
  position: fixed;
  top: var(--header-height);
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--bg-primary);
  padding: var(--space-6);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.header__mobile-nav {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  flex: 1;
}

.header__mobile-link {
  padding: var(--space-4);
  font-size: var(--text-lg);
  font-weight: var(--font-medium);
  color: var(--text-secondary);
  text-decoration: none;
  border-radius: var(--radius-xl);
  transition: all var(--transition-fast);
}

.header__mobile-link:hover,
.header__mobile-link--active {
  color: var(--color-primary-600);
  background: var(--color-primary-50);
}

.header__mobile-auth {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding-top: var(--space-6);
  border-top: 1px solid var(--border-light);
  margin-top: auto;
}

.header__mobile-auth-link {
  padding: var(--space-4);
  font-size: var(--text-base);
  font-weight: var(--font-medium);
  color: var(--text-secondary);
  text-align: center;
  text-decoration: none;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-xl);
  transition: all var(--transition-fast);
}

.header__mobile-auth-link:hover {
  border-color: var(--color-primary-500);
  color: var(--color-primary-600);
}

.header__mobile-auth-btn {
  padding: var(--space-4);
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: white;
  text-align: center;
  text-decoration: none;
  background: var(--gradient-primary);
  border-radius: var(--radius-xl);
  transition: all var(--transition-fast);
}

.header__mobile-auth-btn:hover {
  opacity: 0.9;
}

/* Mobile Menu Transition */
.mobile-menu-enter-active,
.mobile-menu-leave-active {
  transition: all var(--transition-normal) var(--ease-default);
}

.mobile-menu-enter-from,
.mobile-menu-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* Responsive */
@media (max-width: 1024px) {
  .header__nav {
    display: none;
  }

  .header__auth {
    display: none;
  }

  .header__mobile-toggle {
    display: flex;
  }
}

@media (max-width: 640px) {
  .header__container {
    padding: 0 var(--space-4);
  }

  .header__logo-text {
    font-size: var(--text-lg);
  }
}
</style>
