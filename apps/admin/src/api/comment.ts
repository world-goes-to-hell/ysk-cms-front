import api from './index'
import type { ApiResponse } from '@/types/auth'
import type { CommentDto, CommentCreateRequest, CommentUpdateRequest } from '@/types/comment'
import type { PageResponse } from '@/types/board'

// ============================================
// 댓글 API
// ============================================

// 댓글 목록 조회 (트리 구조)
export const getComments = (siteCode: string, boardCode: string, articleId: number) => {
  return api.get<ApiResponse<CommentDto[]>>(
    `/sites/${siteCode}/boards/${boardCode}/articles/${articleId}/replies`
  )
}

// 댓글 목록 조회 (페이징)
export const getCommentsPaged = (
  siteCode: string,
  boardCode: string,
  articleId: number,
  params?: {
    page?: number
    size?: number
    sort?: string
  }
) => {
  return api.get<ApiResponse<PageResponse<CommentDto>>>(
    `/sites/${siteCode}/boards/${boardCode}/articles/${articleId}/replies/paged`,
    { params }
  )
}

// 댓글 상세 조회
export const getComment = (
  siteCode: string,
  boardCode: string,
  articleId: number,
  replyId: number
) => {
  return api.get<ApiResponse<CommentDto>>(
    `/sites/${siteCode}/boards/${boardCode}/articles/${articleId}/replies/${replyId}`
  )
}

// 댓글 생성
export const createComment = (
  siteCode: string,
  boardCode: string,
  articleId: number,
  data: CommentCreateRequest
) => {
  return api.post<ApiResponse<CommentDto>>(
    `/sites/${siteCode}/boards/${boardCode}/articles/${articleId}/replies`,
    data
  )
}

// 댓글 수정
export const updateComment = (
  siteCode: string,
  boardCode: string,
  articleId: number,
  replyId: number,
  data: CommentUpdateRequest
) => {
  return api.put<ApiResponse<CommentDto>>(
    `/sites/${siteCode}/boards/${boardCode}/articles/${articleId}/replies/${replyId}`,
    data
  )
}

// 댓글 삭제
export const deleteComment = (
  siteCode: string,
  boardCode: string,
  articleId: number,
  replyId: number
) => {
  return api.delete<ApiResponse<void>>(
    `/sites/${siteCode}/boards/${boardCode}/articles/${articleId}/replies/${replyId}`
  )
}

// 댓글 수 조회
export const getCommentCount = (
  siteCode: string,
  boardCode: string,
  articleId: number
) => {
  return api.get<ApiResponse<number>>(
    `/sites/${siteCode}/boards/${boardCode}/articles/${articleId}/replies/count`
  )
}
