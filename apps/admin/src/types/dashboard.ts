// 통계 아이템
export interface StatItem {
  id: string
  title: string
  value: number
  icon: string
  trend: string
  trendUp: boolean
}

// 게시글 통계
export interface ArticleStats {
  today: number
  thisWeek: number
  thisMonth: number
}

// 최신 게시글
export interface RecentArticle {
  id: number
  title: string
  board: string
  author: string
  date: string
  views: number
  isNew: boolean
}

// 최근 활동
export interface RecentActivity {
  id: number
  user: string
  action: string
  time: string
  icon: string
  targetType: string
  targetName: string
}

// 대시보드 응답
export interface DashboardResponse {
  users: StatItem
  contents: StatItem
  visits: StatItem
  signups: StatItem
  articleStats: ArticleStats
  recentArticles: RecentArticle[]
  recentActivities: RecentActivity[]
}

// API 응답 래퍼
export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
  error?: {
    code: string
    message: string
  }
  timestamp: string
}
