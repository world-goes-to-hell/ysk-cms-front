import api from './index'

export interface Role {
  id: number
  name: string
  description: string
  createdAt: string
  updatedAt: string
}

export interface CreateRoleRequest {
  name: string
  description?: string
}

export interface UpdateRoleRequest {
  name?: string
  description?: string
}

// 역할 목록 조회
export const getRoles = () => {
  return api.get<{ success: boolean; data: Role[] }>('/roles')
}

// 역할 상세 조회
export const getRole = (id: number) => {
  return api.get<{ success: boolean; data: Role }>(`/roles/${id}`)
}

// 역할 생성
export const createRole = (data: CreateRoleRequest) => {
  return api.post<{ success: boolean; data: Role; message: string }>('/roles', data)
}

// 역할 수정
export const updateRole = (id: number, data: UpdateRoleRequest) => {
  return api.put<{ success: boolean; data: Role; message: string }>(`/roles/${id}`, data)
}

// 역할 삭제
export const deleteRole = (id: number) => {
  return api.delete<{ success: boolean; message: string }>(`/roles/${id}`)
}
