import api from './index'
import type { DashboardResponse, ApiResponse } from '@/types/dashboard'

// 대시보드 데이터 조회
export const getDashboard = () => {
  return api.get<ApiResponse<DashboardResponse>>('/dashboard')
}

// 사이트별 대시보드 데이터 조회
export const getDashboardBySite = (siteCode: string) => {
  return api.get<ApiResponse<DashboardResponse>>(`/dashboard/sites/${siteCode}`)
}
