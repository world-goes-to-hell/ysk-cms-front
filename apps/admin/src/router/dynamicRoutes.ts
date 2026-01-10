import type { RouteRecordRaw } from 'vue-router'
import type { MenuItem, RelatedRoute } from '@/types/menu'
import { getViewComponent } from '@/utils/viewModules'

// 관련 라우트 JSON 파싱
function parseRelatedRoutes(json: string | null): RelatedRoute[] {
  if (!json) return []
  try {
    return JSON.parse(json) as RelatedRoute[]
  } catch (e) {
    console.warn('[Router] 관련 라우트 파싱 실패:', e)
    return []
  }
}

// URL 경로 정규화 (앞의 /, /adm/, adm/ 제거)
function normalizePath(url: string): string {
  let path = url
  // 앞의 / 제거
  if (path.startsWith('/')) {
    path = path.substring(1)
  }
  // adm/ 접두사 제거 (레이아웃이 /adm이므로)
  if (path.startsWith('adm/')) {
    path = path.substring(4)
  }
  return path
}

// 관련 라우트를 RouteRecordRaw로 변환
function relatedRouteToRoute(
  parentUrl: string,
  related: RelatedRoute,
  menuId: number
): RouteRecordRaw | null {
  const component = getViewComponent(related.componentPath)
  if (!component) {
    console.warn(`[Router] 관련 라우트 컴포넌트를 찾을 수 없음: ${related.componentPath}`)
    return null
  }

  // 부모 URL 정규화
  const basePath = normalizePath(parentUrl)

  // 전체 경로 생성 (예: users + create = users/create)
  const fullPath = basePath ? `${basePath}/${related.path}` : related.path

  return {
    path: fullPath,
    name: `${menuId}-${related.path.replace(/[/:]/g, '-')}`,
    component,
    meta: {
      title: related.name,
      requiresAuth: true,
      parentMenuId: menuId,
    },
  }
}

// 메뉴 아이템을 라우트로 변환
function menuToRoute(menu: MenuItem): RouteRecordRaw | null {
  console.log(`[Router] 메뉴 처리: ${menu.name} | URL: ${menu.url} | componentPath: ${menu.componentPath} | type: ${menu.type}`)
  
  // DIRECTORY 타입은 URL이 없으므로 라우트 생성 안함
  if (menu.type === 'DIRECTORY' || !menu.url) {
    console.log(`[Router] -> 스킵 (DIRECTORY 또는 URL 없음)`)
    return null
  }

  // EXTERNAL 타입은 외부 링크이므로 라우트 생성 안함
  if (menu.type === 'EXTERNAL') {
    console.log(`[Router] -> 스킵 (EXTERNAL)`)
    return null
  }

  // componentPath가 없으면 라우트 생성 안함
  if (!menu.componentPath) {
    console.warn(`[Router] 컴포넌트 경로 없음: ${menu.name} (${menu.url})`)
    return null
  }

  // 컴포넌트 가져오기
  const component = getViewComponent(menu.componentPath)
  if (!component) {
    console.warn(`[Router] 컴포넌트를 찾을 수 없음: ${menu.componentPath}`)
    return null
  }

  // URL 정규화
  const path = normalizePath(menu.url)
  console.log(`[Router] -> 라우트 생성: path=${path}, component=OK`)

  return {
    path,
    name: menu.code || `menu-${menu.id}`,
    component,
    meta: {
      title: menu.name,
      requiresAuth: true,
      menuId: menu.id,
      roles: menu.roles?.split(',').map((r) => r.trim()) || null,
    },
  }
}

// 메뉴에서 관련 라우트들 생성
function generateRelatedRoutes(menu: MenuItem): RouteRecordRaw[] {
  if (!menu.relatedRoutes || !menu.url) return []

  const relatedRoutes = parseRelatedRoutes(menu.relatedRoutes)
  const routes: RouteRecordRaw[] = []

  for (const related of relatedRoutes) {
    const route = relatedRouteToRoute(menu.url, related, menu.id)
    if (route) {
      routes.push(route)
    }
  }

  return routes
}

// 메뉴 트리에서 모든 라우트 생성
export function generateRoutesFromMenus(menus: MenuItem[]): RouteRecordRaw[] {
  console.log('[Router] ========== 라우트 생성 시작 ==========')
  console.log('[Router] 메뉴 데이터:', JSON.stringify(menus, null, 2))
  
  const routes: RouteRecordRaw[] = []

  function traverse(items: MenuItem[]) {
    for (const menu of items) {
      // 비활성 메뉴는 스킵
      if (menu.status !== 'ACTIVE') {
        console.log(`[Router] 메뉴 스킵 (비활성): ${menu.name}`)
        continue
      }

      const route = menuToRoute(menu)
      if (route) {
        // 중복 체크 (같은 path가 이미 있으면 스킵)
        const exists = routes.some((r) => r.path === route.path)
        if (!exists) {
          routes.push(route)
          console.log(`[Router] 라우트 추가됨: ${route.path}`)
        }
      }

      // 관련 라우트 추가 (등록/수정/상세 등)
      const relatedRoutes = generateRelatedRoutes(menu)
      for (const relatedRoute of relatedRoutes) {
        const exists = routes.some((r) => r.path === relatedRoute.path)
        if (!exists) {
          routes.push(relatedRoute)
        }
      }

      // 자식 메뉴 순회
      if (menu.children?.length) {
        traverse(menu.children)
      }
    }
  }

  traverse(menus)

  console.log('[Router] ========== 라우트 생성 완료 ==========')
  console.log('[Router] 생성된 라우트:', routes.map(r => r.path))

  return routes
}
