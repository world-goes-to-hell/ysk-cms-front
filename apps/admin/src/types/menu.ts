// 메뉴 타입
export type MenuType = 'DIRECTORY' | 'INTERNAL' | 'EXTERNAL' | 'BOARD' | 'PAGE'

// 메뉴 상태
export type MenuStatus = 'ACTIVE' | 'INACTIVE'

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
