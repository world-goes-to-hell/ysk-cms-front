// 컨텐츠 상태
export type ContentsStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'

// 컨텐츠 목록 DTO
export interface ContentsListDto {
  id: number
  slug: string
  title: string
  status: ContentsStatus
  parentId: number | null
  parentTitle: string | null
  sortOrder: number
  childCount: number
  publishedAt: string | null
  createdAt: string
}

// 컨텐츠 상세 DTO
export interface ContentsDto {
  id: number
  siteCode: string
  slug: string
  title: string
  content: string | null
  metaDescription: string | null
  metaKeywords: string | null
  status: ContentsStatus
  publishedAt: string | null
  parentId: number | null
  parentTitle: string | null
  sortOrder: number
  children?: ContentsDto[]
  createdAt: string
  updatedAt: string
}

// 컨텐츠 생성 요청
export interface ContentsCreateRequest {
  slug: string
  title: string
  content?: string
  metaDescription?: string
  metaKeywords?: string
  status?: ContentsStatus
  parentId?: number | null
  sortOrder?: number
}

// 컨텐츠 수정 요청
export interface ContentsUpdateRequest {
  slug: string
  title: string
  content?: string
  metaDescription?: string
  metaKeywords?: string
  status?: ContentsStatus
  parentId?: number | null
  sortOrder?: number
}
