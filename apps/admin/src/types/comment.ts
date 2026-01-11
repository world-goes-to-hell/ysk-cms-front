// 댓글 DTO
export interface CommentDto {
  id: number
  articleId: number
  parentId: number | null
  content: string
  author: string | null
  isSecret: boolean
  deleted: boolean
  depth: number
  createdAt: string
  updatedAt: string
  createdBy: string | null
  children: CommentDto[] | null
}

// 댓글 생성 요청
export interface CommentCreateRequest {
  parentId?: number | null
  content: string
  author?: string
  isSecret?: boolean
}

// 댓글 수정 요청
export interface CommentUpdateRequest {
  content: string
  isSecret?: boolean
}
