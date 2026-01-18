import api from './index'
import axios from 'axios'

// API 응답 래퍼 타입
interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

// 페이지 응답 타입
interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}

// 사이트 상태
export type SiteStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE'

// 사이트 간단 정보 (로그인 선택용)
export interface SiteSimple {
  id: number
  code: string
  name: string
}

// 사이트 상세 정보
export interface Site {
  id: number
  code: string
  name: string
  description: string
  domain: string
  status: SiteStatus
  settings: string
  createdAt: string
  updatedAt: string
  createdBy: string
}

// 사이트 생성 요청
export interface SiteCreateRequest {
  code: string
  name: string
  description?: string
  domain?: string
  status?: SiteStatus
  settings?: string
}

// 사이트 수정 요청
export interface SiteUpdateRequest {
  name: string
  description?: string
  domain?: string
  status?: SiteStatus
  settings?: string
}

// 활성 사이트 목록 조회 (공개 API - 인증 불필요)
export const getActiveSites = () => {
  const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'
  return axios.get<ApiResponse<SiteSimple[]>>(`${baseURL}/public/sites`)
}

// 사이트 목록 조회 (페이지네이션)
export const getSites = (params?: { page?: number; size?: number }) => {
  return api.get<ApiResponse<PageResponse<Site>>>('/sites', { params })
}

// 사이트 전체 목록 조회 (페이지네이션 없음)
export const getSiteList = () => {
  return api.get<ApiResponse<Site[]>>('/sites/list')
}

// 사이트 상세 조회
export const getSiteByCode = (code: string) => {
  return api.get<ApiResponse<Site>>(`/sites/${code}`)
}

// 사이트 생성
export const createSite = (data: SiteCreateRequest) => {
  return api.post<ApiResponse<Site>>('/sites', data)
}

// 사이트 수정
export const updateSite = (code: string, data: SiteUpdateRequest) => {
  return api.put<ApiResponse<Site>>(`/sites/${code}`, data)
}

// 사이트 삭제
export const deleteSite = (code: string) => {
  return api.delete<ApiResponse<void>>(`/sites/${code}`)
}
