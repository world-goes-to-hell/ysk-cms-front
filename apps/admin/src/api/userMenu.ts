import api from './index'
import type { ApiResponse } from '@/types/auth'
import type {
  UserMenuItem,
  UserMenuCreateRequest,
  UserMenuUpdateRequest,
  UserMenuSortRequest,
} from '@/types/userMenu'

// 사용자 메뉴 전체 목록 조회
export const getUserMenus = (siteCode: string) => {
  return api.get<ApiResponse<UserMenuItem[]>>(`/sites/${siteCode}/user-menus`)
}

// 사용자 메뉴 트리 조회
export const getUserMenuTree = (siteCode: string) => {
  return api.get<ApiResponse<UserMenuItem[]>>(`/sites/${siteCode}/user-menus/tree`)
}

// 활성 사용자 메뉴 트리 조회
export const getActiveUserMenuTree = (siteCode: string) => {
  return api.get<ApiResponse<UserMenuItem[]>>(`/sites/${siteCode}/user-menus/tree/active`)
}

// 사용자 메뉴 상세 조회
export const getUserMenu = (siteCode: string, menuId: number) => {
  return api.get<ApiResponse<UserMenuItem>>(`/sites/${siteCode}/user-menus/${menuId}`)
}

// 하위 사용자 메뉴 조회
export const getChildUserMenus = (siteCode: string, parentId: number) => {
  return api.get<ApiResponse<UserMenuItem[]>>(`/sites/${siteCode}/user-menus/${parentId}/children`)
}

// 사용자 메뉴 생성
export const createUserMenu = (siteCode: string, data: UserMenuCreateRequest) => {
  return api.post<ApiResponse<UserMenuItem>>(`/sites/${siteCode}/user-menus`, data)
}

// 사용자 메뉴 수정
export const updateUserMenu = (siteCode: string, menuId: number, data: UserMenuUpdateRequest) => {
  return api.put<ApiResponse<UserMenuItem>>(`/sites/${siteCode}/user-menus/${menuId}`, data)
}

// 사용자 메뉴 삭제
export const deleteUserMenu = (siteCode: string, menuId: number) => {
  return api.delete<ApiResponse<void>>(`/sites/${siteCode}/user-menus/${menuId}`)
}

// 사용자 메뉴 정렬
export const sortUserMenus = (siteCode: string, data: UserMenuSortRequest) => {
  return api.put<ApiResponse<void>>(`/sites/${siteCode}/user-menus/sort`, data)
}
