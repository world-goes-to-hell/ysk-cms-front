import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import { generateRoutesFromMenus } from './dynamicRoutes'
import type { MenuItem } from '@/types/menu'

// 기본 라우트 (동적 라우트 등록 전에 필요한 최소한의 라우트)
const baseRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/adm/login',
  },
  {
    path: '/adm',
    name: 'layout', // 동적 라우트 등록을 위한 이름
    component: DefaultLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: '/adm/dashboard',
      },
    ],
  },
  {
    path: '/adm/login',
    name: 'login',
    component: () => import('@/views/default/common/login/LoginView.vue'),
    meta: { title: '로그인', guest: true },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: baseRoutes,
})

// 동적 라우트 등록 상태
let dynamicRoutesRegistered = false

// 동적 라우트 등록 여부 확인
export function isDynamicRoutesRegistered(): boolean {
  return dynamicRoutesRegistered
}

// 메뉴 데이터로 동적 라우트 등록
export function registerDynamicRoutes(menus: MenuItem[]) {
  if (dynamicRoutesRegistered) {
    console.log('[Router] 동적 라우트가 이미 등록되어 있습니다.')
    return
  }

  const dynamicRoutes = generateRoutesFromMenus(menus)
  console.log('[Router] 동적 라우트 생성:', dynamicRoutes.length, '개')

  // 각 동적 라우트를 DefaultLayout의 children으로 추가
  dynamicRoutes.forEach((route) => {
    router.addRoute('layout', route)
  })

  // 등록되지 않은 페이지 처리 (맨 마지막에)
  router.addRoute('layout', {
    path: ':pathMatch(.*)*',
    name: 'not-registered',
    component: () => import('@/views/NotRegisteredView.vue'),
    meta: { title: '페이지 없음' },
  })

  dynamicRoutesRegistered = true
  console.log('[Router] 동적 라우트 등록 완료')
  console.log('[Router] 등록된 라우트:', router.getRoutes().map(r => r.path))

  // 현재 경로를 다시 로드하여 새 라우트 매칭
  const currentPath = router.currentRoute.value.fullPath
  if (currentPath && currentPath !== '/') {
    console.log('[Router] 현재 경로 재로드:', currentPath)
    router.replace(currentPath)
  }
}

// 동적 라우트 초기화 (메뉴 새로고침 시 사용)
export function resetDynamicRoutes() {
  dynamicRoutesRegistered = false
  // 기존 동적 라우트 제거는 복잡하므로, 보통 페이지 새로고침으로 처리
}

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
    next({ path: '/adm/dashboard' })
    return
  }

  // 동적 라우트가 등록되지 않았고, 인증된 사용자가 /adm 하위 페이지에 접근 시
  // 라우트가 not-registered(catch-all)로 매칭된 경우 경고 로그
  if (isAuthenticated && to.path.startsWith('/adm') && to.name === 'not-registered') {
    console.warn('[Router] 동적 라우트가 등록되지 않아 페이지를 찾을 수 없습니다:', to.path)
    console.warn('[Router] 동적 라우트 등록 상태:', dynamicRoutesRegistered)
  }

  next()
})

// 네비게이션 완료 후 디버깅 로그
router.afterEach((to) => {
  console.log('[Router] ========== 네비게이션 완료 ==========')
  console.log('[Router] 현재 경로:', to.path)
  console.log('[Router] 현재 라우트 이름:', to.name)
  console.log('[Router] 매칭된 라우트 수:', to.matched.length)
  to.matched.forEach((route, index) => {
    console.log(`[Router] 매칭[${index}] path:`, route.path)
    console.log(`[Router] 매칭[${index}] components:`, route.components)
    console.log(`[Router] 매칭[${index}] components.default:`, route.components?.default)
  })
})

export default router
