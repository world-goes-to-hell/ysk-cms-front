import api from './index'
import type { ContentsDto, ContentsListDto, ContentsCreateRequest, ContentsUpdateRequest } from '@/types/contents'

// 컨텐츠 목록 조회 (페이징)
export const getContents = (siteCode: string, page = 0, size = 20) => {
  return api.get<{
    success: boolean
    data: {
      content: ContentsListDto[]
      totalElements: number
      totalPages: number
      number: number
      size: number
    }
  }>(`/sites/${siteCode}/contents`, {
    params: { page, size }
  })
}

// 컨텐츠 트리 조회 (루트 컨텐츠 + 자식들)
export const getContentsTree = (siteCode: string) => {
  return api.get<{ success: boolean; data: ContentsDto[] }>(`/sites/${siteCode}/contents/tree`)
}

// 발행된 컨텐츠 목록 조회
export const getPublishedContents = (siteCode: string) => {
  return api.get<{ success: boolean; data: ContentsListDto[] }>(`/sites/${siteCode}/contents/published`)
}

// 컨텐츠 상세 조회
export const getContentsById = (siteCode: string, contentsId: number) => {
  return api.get<{ success: boolean; data: ContentsDto }>(`/sites/${siteCode}/contents/${contentsId}`)
}

// 슬러그로 컨텐츠 조회
export const getContentsBySlug = (siteCode: string, slug: string) => {
  return api.get<{ success: boolean; data: ContentsDto }>(`/sites/${siteCode}/contents/slug/${slug}`)
}

// 하위 컨텐츠 목록 조회
export const getChildContents = (siteCode: string, parentId: number) => {
  return api.get<{ success: boolean; data: ContentsListDto[] }>(`/sites/${siteCode}/contents/${parentId}/children`)
}

// 컨텐츠 생성
export const createContents = (siteCode: string, data: ContentsCreateRequest) => {
  return api.post<{ success: boolean; data: ContentsDto; message?: string }>(`/sites/${siteCode}/contents`, data)
}

// 컨텐츠 수정
export const updateContents = (siteCode: string, contentsId: number, data: ContentsUpdateRequest) => {
  return api.put<{ success: boolean; data: ContentsDto; message?: string }>(`/sites/${siteCode}/contents/${contentsId}`, data)
}

// 컨텐츠 삭제
export const deleteContents = (siteCode: string, contentsId: number) => {
  return api.delete<{ success: boolean; message?: string }>(`/sites/${siteCode}/contents/${contentsId}`)
}

// 컨텐츠 발행
export const publishContents = (siteCode: string, contentsId: number) => {
  return api.patch<{ success: boolean; data: ContentsDto; message?: string }>(`/sites/${siteCode}/contents/${contentsId}/publish`)
}
