// 메뉴 타입
export type MenuType = 'DIRECTORY' | 'INTERNAL' | 'EXTERNAL' | 'BOARD' | 'PAGE'

// 메뉴 상태
export type MenuStatus = 'ACTIVE' | 'INACTIVE'

// 관련 라우트 (메뉴에 속하지 않는 하위 페이지들)
export interface RelatedRoute {
  path: string // 상대 경로 (예: "create", ":id", ":id/edit")
  name: string // 라우트 이름 (예: "사용자 등록")
  componentPath: string // 컴포넌트 경로 (예: "@/views/users/UserCreateView.vue")
}

// 메뉴 아이템 (트리 구조)
export interface MenuItem {
  id: number
  name: string
  code: string
  type: MenuType
  url: string | null
  icon: string | null
  sortOrder: number
  status: MenuStatus
  target: string
  roles: string | null
  componentPath: string | null
  relatedRoutes: string | null // JSON 문자열
  depth: number
  children: MenuItem[]
}

// 메뉴 생성 요청
export interface MenuCreateRequest {
  name: string
  code?: string
  type: MenuType
  url?: string
  icon?: string
  parentId?: number
  sortOrder?: number
  status?: MenuStatus
  target?: string
  roles?: string
  description?: string
  componentPath?: string
  relatedRoutes?: string
}

// 메뉴 수정 요청
export interface MenuUpdateRequest {
  name: string
  code?: string
  type: MenuType
  url?: string
  icon?: string
  parentId?: number | null
  sortOrder?: number
  status?: MenuStatus
  target?: string
  roles?: string
  description?: string
  componentPath?: string
  relatedRoutes?: string
}

// 메뉴 정렬 아이템
export interface MenuSortItem {
  id: number
  parentId: number | null
  sortOrder: number
}

// 메뉴 정렬 요청
export interface MenuSortRequest {
  items: MenuSortItem[]
}
