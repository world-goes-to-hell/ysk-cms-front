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

// componentPath에서 게시판 타입 코드 추출
// 예: "board/board-normal/ListView" → "normal"
// 예: "board/board-faq/ListView" → "faq"
function extractBoardType(componentPath: string | null): string | null {
  if (!componentPath) return null
  const match = componentPath.match(/board\/board-([^/]+)\//)
  return match ? match[1] : null
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
  menuId: number,
  parentBoardType: string | null,
  parentBoardCode: string | null
): RouteRecordRaw | null {
  const component = getViewComponent(related.componentPath)
  if (!component) {
    console.warn(`[Router] 관련 라우트 컴포넌트를 찾을 수 없음: ${related.componentPath}`)
    return null
  }

  let fullPath: string

  // related.path가 이미 절대 경로인 경우 (/ 또는 /adm으로 시작)
  if (related.path.startsWith('/')) {
    fullPath = normalizePath(related.path)
  } else {
    // 상대 경로인 경우 부모 URL과 합침
    const basePath = normalizePath(parentUrl)
    fullPath = basePath ? `${basePath}/${related.path}` : related.path
  }

  // 관련 라우트 자체에서도 boardType 추출 시도
  const relatedBoardType = extractBoardType(related.componentPath) || parentBoardType

  return {
    path: fullPath,
    name: `${menuId}-${related.path.replace(/[/:]/g, '-')}`,
    component,
    meta: {
      title: related.name,
      requiresAuth: true,
      parentMenuId: menuId,
      ...(relatedBoardType && { boardType: relatedBoardType }),
      ...(parentBoardCode && { boardCode: parentBoardCode }),
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

  // 게시판 타입 추출 (board/board-xxx/ 패턴에서)
  const boardType = extractBoardType(menu.componentPath)

  // BOARD 타입 메뉴일 경우 code를 boardCode로 사용
  const boardCode = menu.type === 'BOARD' ? menu.code : null

  // roles 파싱 (빈 문자열 처리)
  const roles = menu.roles?.trim()
    ? menu.roles.split(',').map((r) => r.trim()).filter((r) => r)
    : null

  return {
    path,
    name: menu.code || `menu-${menu.id}`,
    component,
    meta: {
      title: menu.name,
      requiresAuth: true,
      menuId: menu.id,
      roles,
      ...(boardType && { boardType }), // 게시판 타입이 있으면 추가
      ...(boardCode && { boardCode }), // 게시판 코드가 있으면 추가
    },
  }
}

// 메뉴에서 관련 라우트들 생성
function generateRelatedRoutes(menu: MenuItem): RouteRecordRaw[] {
  if (!menu.relatedRoutes || !menu.url) return []

  const relatedRoutes = parseRelatedRoutes(menu.relatedRoutes)
  const routes: RouteRecordRaw[] = []

  // 부모 메뉴에서 boardType과 boardCode 추출
  const parentBoardType = extractBoardType(menu.componentPath)
  const parentBoardCode = menu.type === 'BOARD' ? menu.code : null

  for (const related of relatedRoutes) {
    const route = relatedRouteToRoute(menu.url, related, menu.id, parentBoardType, parentBoardCode)
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
