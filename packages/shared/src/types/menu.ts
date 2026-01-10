// 메뉴 아이템
export interface MenuItem {
  id: number
  title: string
  path: string
  icon?: string
  parentId?: number | null
  order: number
  isVisible: boolean
  target?: '_self' | '_blank'
  children?: MenuItem[]
  createdAt?: string
  updatedAt?: string
}

// 메뉴 생성 요청
export interface CreateMenuRequest {
  title: string
  path: string
  icon?: string
  parentId?: number | null
  order?: number
  isVisible?: boolean
  target?: '_self' | '_blank'
}

// 메뉴 수정 요청
export interface UpdateMenuRequest {
  title?: string
  path?: string
  icon?: string
  parentId?: number | null
  order?: number
  isVisible?: boolean
  target?: '_self' | '_blank'
}

// 메뉴 트리 (계층 구조)
export interface MenuTree {
  menus: MenuItem[]
}
