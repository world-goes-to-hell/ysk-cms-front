import api from './index'

export interface ActivityLog {
  id: number
  userName: string
  userEmail: string | null
  siteCode: string | null
  siteName: string
  activityType: string
  targetType: string
  targetId: number | null
  targetName: string | null
  description: string | null
  ipAddress: string | null
  icon: string
  action: string
  timeAgo: string
  createdAt: string
}

export interface ActivityLogParams {
  page?: number
  size?: number
  activityType?: string
  targetType?: string
  keyword?: string
}

// 전체 활동 로그 조회
export const getActivityLogs = (params?: ActivityLogParams) => {
  return api.get('/activity-logs', { params })
}

// 사이트별 활동 로그 조회
export const getActivityLogsBySite = (siteCode: string, params?: ActivityLogParams) => {
  return api.get(`/activity-logs/sites/${siteCode}`, { params })
}

// 사용자별 활동 로그 조회
export const getActivityLogsByUser = (userId: number, params?: { page?: number; size?: number }) => {
  return api.get(`/activity-logs/users/${userId}`, { params })
}
