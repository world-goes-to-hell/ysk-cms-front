// 사용자 메뉴 타입
export type UserMenuType = 'DIRECTORY' | 'INTERNAL' | 'EXTERNAL' | 'BOARD' | 'PAGE'

// 사용자 메뉴 상태
export type UserMenuStatus = 'ACTIVE' | 'INACTIVE'

// 권한 정보 (간단 버전)
export interface RoleSimple {
  id: number
  name: string
  description: string | null
}

// 사용자 메뉴 아이템 (트리 구조)
export interface UserMenuItem {
  id: number
  name: string
  code: string
  type: UserMenuType
  url: string | null
  icon: string | null
  sortOrder: number
  status: UserMenuStatus
  target: string
  description: string | null
  depth: number
  roles: RoleSimple[]
  children: UserMenuItem[]
}

// 사용자 메뉴 생성 요청
export interface UserMenuCreateRequest {
  name: string
  code?: string
  type: UserMenuType
  url?: string
  icon?: string
  parentId?: number
  sortOrder?: number
  status?: UserMenuStatus
  target?: string
  description?: string
  roleIds?: number[]
}

// 사용자 메뉴 수정 요청
export interface UserMenuUpdateRequest {
  name: string
  code?: string
  type: UserMenuType
  url?: string
  icon?: string
  parentId?: number | null
  sortOrder?: number
  status?: UserMenuStatus
  target?: string
  description?: string
  roleIds?: number[]
}

// 사용자 메뉴 정렬 아이템
export interface UserMenuSortItem {
  id: number
  parentId: number | null
  sortOrder: number
}

// 사용자 메뉴 정렬 요청
export interface UserMenuSortRequest {
  items: UserMenuSortItem[]
}
