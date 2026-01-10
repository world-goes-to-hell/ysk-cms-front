import api from './index'
import type { ApiResponse } from '@/types/auth'
import type {
  BoardDto,
  BoardCreateRequest,
  BoardUpdateRequest,
  PostDto,
  PostListDto,
  PostCreateRequest,
  PostUpdateRequest,
  PostAnswerRequest,
  PageResponse,
} from '@/types/board'

// ============================================
// 게시판 API
// ============================================

// 게시판 목록 조회
export const getBoards = (siteCode: string) => {
  return api.get<ApiResponse<BoardDto[]>>(`/sites/${siteCode}/boards`)
}

// 게시판 상세 조회
export const getBoard = (siteCode: string, boardCode: string) => {
  return api.get<ApiResponse<BoardDto>>(`/sites/${siteCode}/boards/${boardCode}`)
}

// 게시판 생성
export const createBoard = (siteCode: string, data: BoardCreateRequest) => {
  return api.post<ApiResponse<BoardDto>>(`/sites/${siteCode}/boards`, data)
}

// 게시판 수정
export const updateBoard = (siteCode: string, boardCode: string, data: BoardUpdateRequest) => {
  return api.put<ApiResponse<BoardDto>>(`/sites/${siteCode}/boards/${boardCode}`, data)
}

// 게시판 삭제
export const deleteBoard = (siteCode: string, boardCode: string) => {
  return api.delete<ApiResponse<void>>(`/sites/${siteCode}/boards/${boardCode}`)
}

// ============================================
// 게시글 API
// ============================================

// 게시글 목록 조회 (페이지네이션)
export const getPosts = (
  siteCode: string,
  boardCode: string,
  params?: {
    page?: number
    size?: number
    sort?: string
    keyword?: string
    status?: string
  },
) => {
  return api.get<ApiResponse<PageResponse<PostListDto>>>(
    `/sites/${siteCode}/boards/${boardCode}/posts`,
    { params },
  )
}

// 게시글 상세 조회
export const getPost = (siteCode: string, boardCode: string, postId: number) => {
  return api.get<ApiResponse<PostDto>>(`/sites/${siteCode}/boards/${boardCode}/posts/${postId}`)
}

// 게시글 생성
export const createPost = (siteCode: string, boardCode: string, data: PostCreateRequest) => {
  return api.post<ApiResponse<PostDto>>(`/sites/${siteCode}/boards/${boardCode}/posts`, data)
}

// 게시글 수정
export const updatePost = (
  siteCode: string,
  boardCode: string,
  postId: number,
  data: PostUpdateRequest,
) => {
  return api.put<ApiResponse<PostDto>>(
    `/sites/${siteCode}/boards/${boardCode}/posts/${postId}`,
    data,
  )
}

// 게시글 삭제
export const deletePost = (siteCode: string, boardCode: string, postId: number) => {
  return api.delete<ApiResponse<void>>(`/sites/${siteCode}/boards/${boardCode}/posts/${postId}`)
}

// 게시글 답변 등록/수정 (Q&A용)
export const answerPost = (
  siteCode: string,
  boardCode: string,
  postId: number,
  data: PostAnswerRequest,
) => {
  return api.put<ApiResponse<PostDto>>(
    `/sites/${siteCode}/boards/${boardCode}/posts/${postId}/answer`,
    data,
  )
}
