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
        // 메인 사이트 대시보드
        {
          path: '',
          name: 'dashboard',
          component: () => import('@/views/default/common/DashboardView.vue'),
          meta: { title: '대시보드', requiresAuth: true },
        },
        // 메인 사이트 전용 - 사이트 관리
        {
          path: 'sites',
          name: 'site-management',
          component: () => import('@/views/default/SiteManagementView.vue'),
          meta: { title: '사이트 관리', requiresAuth: true },
        },
        // 공통 페이지
        {
          path: 'users',
          name: 'users',
          component: () => import('@/views/default/common/UsersView.vue'),
          meta: { title: '사용자 관리', requiresAuth: true },
        },
        {
          path: 'contents',
          name: 'contents',
          component: () => import('@/views/default/common/ContentsView.vue'),
          meta: { title: '콘텐츠 관리', requiresAuth: true },
        },
        {
          path: 'settings',
          name: 'settings',
          component: () => import('@/views/default/common/SettingsView.vue'),
          meta: { title: '설정', requiresAuth: true },
        },
        // 서브사이트 라우트
        {
          path: 'sites/:siteId',
          children: [
            {
              path: 'dashboard',
              name: 'site-dashboard',
              component: () => import('@/views/default/common/DashboardView.vue'),
              meta: { title: '대시보드', requiresAuth: true },
            },
            {
              path: 'users',
              name: 'site-users',
              component: () => import('@/views/default/common/UsersView.vue'),
              meta: { title: '사용자 관리', requiresAuth: true },
            },
            {
              path: 'contents',
              name: 'site-contents',
              component: () => import('@/views/default/common/ContentsView.vue'),
              meta: { title: '콘텐츠 관리', requiresAuth: true },
            },
            {
              path: 'settings',
              name: 'site-settings',
              component: () => import('@/views/default/common/SettingsView.vue'),
              meta: { title: '설정', requiresAuth: true },
            },
          ],
        },
      ],
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/default/common/LoginView.vue'),
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
