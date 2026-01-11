import api from './index'

export interface User {
  id: number
  username: string
  name: string
  email: string
  role: string
  status: string
  phone?: string
  department?: string
  position?: string
  lastLoginAt?: string
  createdAt: string
  updatedAt?: string
}

export interface UserParams {
  page?: number
  size?: number
  role?: string
  status?: string
  keyword?: string
}

export interface CreateUserRequest {
  username: string
  password: string
  name: string
  email: string
  role: string
  phone?: string
  department?: string
  position?: string
}

export interface UpdateUserRequest {
  name?: string
  email?: string
  role?: string
  status?: string
  phone?: string
  department?: string
  position?: string
}

export interface ChangePasswordRequest {
  currentPassword?: string
  newPassword: string
}

// 사용자 목록 조회
export const getUsers = (params?: UserParams) => {
  return api.get('/users', { params })
}

// 사용자 상세 조회
export const getUser = (id: number) => {
  return api.get(`/users/${id}`)
}

// 사용자 생성
export const createUser = (data: CreateUserRequest) => {
  return api.post('/users', data)
}

// 사용자 수정
export const updateUser = (id: number, data: UpdateUserRequest) => {
  return api.put(`/users/${id}`, data)
}

// 사용자 삭제
export const deleteUser = (id: number) => {
  return api.delete(`/users/${id}`)
}

// 사용자 상태 변경
export const updateUserStatus = (id: number, status: string) => {
  return api.patch(`/users/${id}/status`, { status })
}

// 비밀번호 변경
export const changePassword = (id: number, data: ChangePasswordRequest) => {
  return api.patch(`/users/${id}/password`, data)
}

// 비밀번호 초기화 (관리자용)
export const resetPassword = (id: number) => {
  return api.post(`/users/${id}/reset-password`)
}
