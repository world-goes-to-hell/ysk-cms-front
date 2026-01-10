// Vite glob import로 모든 뷰 파일 수집
// 빌드 시점에 views 폴더 내 모든 .vue 파일의 동적 import 함수가 생성됨
const viewModules = import.meta.glob('/src/views/**/*.vue')

// 뷰 파일 경로 목록 (메뉴 등록 UI에서 선택용)
export const viewPaths = Object.keys(viewModules).map((path) => {
  // /src/views/... 형태를 @/views/... 형태로 변환
  return path.replace('/src/views/', '@/views/')
})

// 디버깅용 로그
console.log('[ViewModules] 발견된 뷰 파일:', viewPaths.length, '개', viewPaths)

// 경로로 컴포넌트 가져오기
export function getViewComponent(componentPath: string) {
  if (!componentPath) return null

  // @/views/... 형태를 /src/views/... 형태로 변환
  const modulePath = componentPath.replace('@/views/', '/src/views/')

  const moduleLoader = viewModules[modulePath]
  if (!moduleLoader) {
    console.warn(`[ViewModules] 컴포넌트를 찾을 수 없습니다: ${componentPath}`)
    return null
  }

  return moduleLoader
}

// 뷰 파일 목록을 그룹별로 정리 (UI 표시용)
export function getGroupedViewPaths() {
  const groups: Record<string, string[]> = {}

  viewPaths.forEach((path) => {
    // @/views/default/common/DashboardView.vue -> default/common
    const match = path.match(/@\/views\/(.+)\/[^/]+\.vue$/)
    if (match) {
      const group = match[1]
      if (!groups[group]) {
        groups[group] = []
      }
      groups[group].push(path)
    }
  })

  return groups
}

// 파일명만 추출 (표시용)
export function getViewFileName(path: string): string {
  const match = path.match(/\/([^/]+)\.vue$/)
  return match ? match[1] : path
}
