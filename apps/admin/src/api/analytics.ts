import api from './index'

// API 응답 래퍼 타입
interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

export interface AnalyticsSummary {
  totalPageViews: number
  uniqueVisitors: number
  totalSessions: number
  newVisitors: number
  returningVisitors: number
  avgSessionDuration: number
  avgSessionDurationStr: string
  bounceRate: number
  avgPageViews: number
  pageViewsChange: number
  visitorsChange: number
  sessionsChange: number
  bounceRateChange: number
  activeUsers: number
}

export interface TrendData {
  labels: string[]
  pageViews: number[]
  visitors: number[]
  sessions?: number[]
}

export interface PageStats {
  pagePath: string
  pageTitle: string
  pageViews: number
  uniquePageViews: number
  avgTimeOnPage?: number
  avgTimeOnPageStr?: string
  entrances?: number
  exits?: number
  bounceRate?: number
}

export interface DeviceData {
  deviceType: string
  count: number
  percentage: number
}

export interface BrowserData {
  browser: string
  count: number
  percentage: number
}

export interface DeviceStats {
  devices: DeviceData[]
  browsers: BrowserData[]
}

export interface ReferrerData {
  type: string
  typeName: string
  count: number
  percentage: number
}

export interface ReferrerStats {
  referrers: ReferrerData[]
}

export interface ActivePage {
  pagePath: string
  activeUsers: number
}

export interface RealtimeStats {
  activeUsers: number
  activePages: ActivePage[]
}

// 요약 통계 조회
export const getSummary = (siteCode: string, startDate: string, endDate: string) =>
  api.get<ApiResponse<AnalyticsSummary>>(`/sites/${siteCode}/analytics/summary`, {
    params: { startDate, endDate }
  })

// 일별 추이 데이터
export const getTrend = (siteCode: string, startDate: string, endDate: string) =>
  api.get<ApiResponse<TrendData>>(`/sites/${siteCode}/analytics/trend`, {
    params: { startDate, endDate }
  })

// 인기 페이지 목록
export const getTopPages = (siteCode: string, startDate: string, endDate: string, limit = 10) =>
  api.get<ApiResponse<PageStats[]>>(`/sites/${siteCode}/analytics/pages`, {
    params: { startDate, endDate, limit }
  })

// 디바이스 통계
export const getDeviceStats = (siteCode: string, startDate: string, endDate: string) =>
  api.get<ApiResponse<DeviceStats>>(`/sites/${siteCode}/analytics/devices`, {
    params: { startDate, endDate }
  })

// 유입 경로 통계
export const getReferrerStats = (siteCode: string, startDate: string, endDate: string) =>
  api.get<ApiResponse<ReferrerStats>>(`/sites/${siteCode}/analytics/referrers`, {
    params: { startDate, endDate }
  })

// 실시간 통계
export const getRealtimeStats = (siteCode: string) =>
  api.get<ApiResponse<RealtimeStats>>(`/sites/${siteCode}/analytics/realtime`)
