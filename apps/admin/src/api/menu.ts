import api from './index'
import type { ApiResponse } from '@/types/auth'
import type {
  MenuItem,
  MenuCreateRequest,
  MenuUpdateRequest,
  MenuSortRequest,
} from '@/types/menu'

// 메뉴 전체 목록 조회
export const getMenus = (siteCode: string) => {
  return api.get<ApiResponse<MenuItem[]>>(`/sites/${siteCode}/menus`)
}

// 메뉴 트리 조회
export const getMenuTree = (siteCode: string) => {
  return api.get<ApiResponse<MenuItem[]>>(`/sites/${siteCode}/menus/tree`)
}

// 활성 메뉴 트리 조회
export const getActiveMenuTree = (siteCode: string) => {
  return api.get<ApiResponse<MenuItem[]>>(`/sites/${siteCode}/menus/tree/active`)
}

// 메뉴 상세 조회
export const getMenu = (siteCode: string, menuId: number) => {
  return api.get<ApiResponse<MenuItem>>(`/sites/${siteCode}/menus/${menuId}`)
}

// 하위 메뉴 조회
export const getChildMenus = (siteCode: string, parentId: number) => {
  return api.get<ApiResponse<MenuItem[]>>(`/sites/${siteCode}/menus/${parentId}/children`)
}

// 메뉴 생성
export const createMenu = (siteCode: string, data: MenuCreateRequest) => {
  return api.post<ApiResponse<MenuItem>>(`/sites/${siteCode}/menus`, data)
}

// 메뉴 수정
export const updateMenu = (siteCode: string, menuId: number, data: MenuUpdateRequest) => {
  return api.put<ApiResponse<MenuItem>>(`/sites/${siteCode}/menus/${menuId}`, data)
}

// 메뉴 삭제
export const deleteMenu = (siteCode: string, menuId: number) => {
  return api.delete<ApiResponse<void>>(`/sites/${siteCode}/menus/${menuId}`)
}

// 메뉴 정렬
export const sortMenus = (siteCode: string, data: MenuSortRequest) => {
  return api.put<ApiResponse<void>>(`/sites/${siteCode}/menus/sort`, data)
}
