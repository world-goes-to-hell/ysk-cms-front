import { createRouter, createWebHistory } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: DefaultLayout,
      children: [
        {
          path: '',
          name: 'dashboard',
          component: () => import('@/views/DashboardView.vue'),
          meta: { title: '대시보드' },
        },
        {
          path: 'users',
          name: 'users',
          component: () => import('@/views/UsersView.vue'),
          meta: { title: '사용자 관리' },
        },
        {
          path: 'contents',
          name: 'contents',
          component: () => import('@/views/ContentsView.vue'),
          meta: { title: '콘텐츠 관리' },
        },
        {
          path: 'settings',
          name: 'settings',
          component: () => import('@/views/SettingsView.vue'),
          meta: { title: '설정' },
        },
      ],
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { title: '로그인' },
    },
  ],
})

// 페이지 타이틀 설정
router.beforeEach((to, _from, next) => {
  document.title = `${to.meta.title || 'YSK CMS'} - YSK CMS`
  next()
})

export default router
