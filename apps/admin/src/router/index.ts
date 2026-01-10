import { createRouter, createWebHistory } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: DefaultLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'dashboard',
          component: () => import('@/views/DashboardView.vue'),
          meta: { title: '대시보드', requiresAuth: true },
        },
        {
          path: 'users',
          name: 'users',
          component: () => import('@/views/UsersView.vue'),
          meta: { title: '사용자 관리', requiresAuth: true },
        },
        {
          path: 'contents',
          name: 'contents',
          component: () => import('@/views/ContentsView.vue'),
          meta: { title: '콘텐츠 관리', requiresAuth: true },
        },
        {
          path: 'settings',
          name: 'settings',
          component: () => import('@/views/SettingsView.vue'),
          meta: { title: '설정', requiresAuth: true },
        },
      ],
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { title: '로그인', guest: true },
    },
  ],
})

// 네비게이션 가드
router.beforeEach((to, _from, next) => {
  // 페이지 타이틀 설정
  document.title = `${to.meta.title || 'YSK CMS'} - YSK CMS`

  const accessToken = localStorage.getItem('accessToken')
  const isAuthenticated = !!accessToken

  // 인증이 필요한 페이지
  if (to.meta.requiresAuth && !isAuthenticated) {
    next({ name: 'login', query: { redirect: to.fullPath } })
    return
  }

  // 이미 로그인한 사용자가 로그인 페이지 접근 시
  if (to.meta.guest && isAuthenticated) {
    next({ name: 'dashboard' })
    return
  }

  next()
})

export default router
