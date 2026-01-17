// 페이지 상태
export type PageStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'

// 페이지 목록 DTO
export interface PageListDto {
  id: number
  slug: string
  title: string
  status: PageStatus
  parentId: number | null
  parentTitle: string | null
  sortOrder: number
  childCount: number
  publishedAt: string | null
  createdAt: string
}

// 페이지 상세 DTO
export interface PageDto {
  id: number
  siteCode: string
  slug: string
  title: string
  content: string | null
  metaDescription: string | null
  metaKeywords: string | null
  status: PageStatus
  publishedAt: string | null
  parentId: number | null
  parentTitle: string | null
  sortOrder: number
  children?: PageDto[]
  createdAt: string
  updatedAt: string
}

// 페이지 생성 요청
export interface PageCreateRequest {
  slug: string
  title: string
  content?: string
  metaDescription?: string
  metaKeywords?: string
  status?: PageStatus
  parentId?: number | null
  sortOrder?: number
}

// 페이지 수정 요청
export interface PageUpdateRequest {
  slug: string
  title: string
  content?: string
  metaDescription?: string
  metaKeywords?: string
  status?: PageStatus
  parentId?: number | null
  sortOrder?: number
}
