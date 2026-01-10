import './assets/main.css'
import '@mdi/font/css/materialdesignicons.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

import App from './App.vue'
import router, { registerDynamicRoutes } from './router'
import { useThemeStore } from './stores/theme'
import { getActiveMenuTree } from './api/menu'

const app = createApp(App)
const pinia = createPinia()

// Element Plus 아이콘 전역 등록
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(pinia)
app.use(router)
app.use(ElementPlus)

// 테마 초기화
const themeStore = useThemeStore()
themeStore.init()

// 앱 초기화 함수
async function initApp() {
  const accessToken = localStorage.getItem('accessToken')

  if (accessToken) {
    try {
      console.log('[App] 인증된 사용자, 메뉴 로드 시작...')
      // 로그인 상태면 메뉴를 먼저 로드하고 라우트 등록
      const response = await getActiveMenuTree('main')
      if (response.data.data && response.data.data.length > 0) {
        console.log('[App] 메뉴 데이터 로드 성공:', response.data.data.length, '개')
        registerDynamicRoutes(response.data.data)
      } else {
        console.warn('[App] 메뉴 데이터가 비어있습니다.')
      }
    } catch (error) {
      console.warn('[App] 메뉴 로드 실패:', error)
      // 토큰이 만료되었거나 유효하지 않은 경우
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
    }
  }

  // 앱 마운트
  console.log('[App] 앱 마운트')
  app.mount('#app')
}

// 앱 시작
initApp()
