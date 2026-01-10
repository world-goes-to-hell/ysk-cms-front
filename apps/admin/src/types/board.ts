// 게시판 타입
export type BoardType = 'NORMAL' | 'GALLERY' | 'FAQ' | 'QNA' | 'NOTICE'

// 게시판 상태
export type BoardStatus = 'ACTIVE' | 'INACTIVE'

// 게시글 상태
export type PostStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'

// 게시판 DTO
export interface BoardDto {
  id: number
  siteCode: string
  code: string
  name: string
  description: string | null
  type: BoardType
  useComment: boolean
  useAttachment: boolean
  attachmentLimit: number
  sortOrder: number
  status: BoardStatus
  createdAt?: string
  updatedAt?: string
}

// 게시판 생성 요청
export interface BoardCreateRequest {
  code: string
  name: string
  description?: string
  type?: BoardType
  useComment?: boolean
  useAttachment?: boolean
  attachmentLimit?: number
  sortOrder?: number
}

// 게시판 수정 요청
export interface BoardUpdateRequest {
  name: string
  description?: string
  type?: BoardType
  useComment?: boolean
  useAttachment?: boolean
  attachmentLimit?: number
  sortOrder?: number
  status?: BoardStatus
}

// 게시글 DTO
export interface PostDto {
  id: number
  siteCode: string
  boardCode: string
  boardName: string
  title: string
  content: string | null
  author: string | null
  viewCount: number
  isPinned: boolean
  isSecret: boolean
  status: PostStatus
  answer: string | null
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

// 게시글 목록 DTO
export interface PostListDto {
  id: number
  title: string
  author: string | null
  viewCount: number
  isPinned: boolean
  isSecret: boolean
  status: PostStatus
  hasAnswer: boolean
  publishedAt: string | null
  createdAt: string
}

// 게시글 생성 요청
export interface PostCreateRequest {
  title: string
  content?: string
  author?: string
  isPinned?: boolean
  isSecret?: boolean
  status?: PostStatus
}

// 게시글 수정 요청
export interface PostUpdateRequest {
  title: string
  content?: string
  author?: string
  isPinned?: boolean
  isSecret?: boolean
  status?: PostStatus
}

// 게시글 답변 요청 (Q&A용)
export interface PostAnswerRequest {
  answer: string
}

// 페이지네이션 응답
export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}
