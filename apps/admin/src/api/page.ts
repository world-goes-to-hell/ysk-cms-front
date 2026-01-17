import api from './index'
import type { PageDto, PageListDto, PageCreateRequest, PageUpdateRequest } from '@/types/page'

// 페이지 목록 조회 (페이징)
export const getPages = (siteCode: string, page = 0, size = 20) => {
  return api.get<{
    success: boolean
    data: {
      content: PageListDto[]
      totalElements: number
      totalPages: number
      number: number
      size: number
    }
  }>(`/sites/${siteCode}/pages`, {
    params: { page, size }
  })
}

// 페이지 트리 조회 (루트 페이지 + 자식들)
export const getPageTree = (siteCode: string) => {
  return api.get<{ success: boolean; data: PageDto[] }>(`/sites/${siteCode}/pages/tree`)
}

// 발행된 페이지 목록 조회
export const getPublishedPages = (siteCode: string) => {
  return api.get<{ success: boolean; data: PageListDto[] }>(`/sites/${siteCode}/pages/published`)
}

// 페이지 상세 조회
export const getPage = (siteCode: string, pageId: number) => {
  return api.get<{ success: boolean; data: PageDto }>(`/sites/${siteCode}/pages/${pageId}`)
}

// 슬러그로 페이지 조회
export const getPageBySlug = (siteCode: string, slug: string) => {
  return api.get<{ success: boolean; data: PageDto }>(`/sites/${siteCode}/pages/slug/${slug}`)
}

// 하위 페이지 목록 조회
export const getChildPages = (siteCode: string, parentId: number) => {
  return api.get<{ success: boolean; data: PageListDto[] }>(`/sites/${siteCode}/pages/${parentId}/children`)
}

// 페이지 생성
export const createPage = (siteCode: string, data: PageCreateRequest) => {
  return api.post<{ success: boolean; data: PageDto; message?: string }>(`/sites/${siteCode}/pages`, data)
}

// 페이지 수정
export const updatePage = (siteCode: string, pageId: number, data: PageUpdateRequest) => {
  return api.put<{ success: boolean; data: PageDto; message?: string }>(`/sites/${siteCode}/pages/${pageId}`, data)
}

// 페이지 삭제
export const deletePage = (siteCode: string, pageId: number) => {
  return api.delete<{ success: boolean; message?: string }>(`/sites/${siteCode}/pages/${pageId}`)
}

// 페이지 발행
export const publishPage = (siteCode: string, pageId: number) => {
  return api.patch<{ success: boolean; data: PageDto; message?: string }>(`/sites/${siteCode}/pages/${pageId}/publish`)
}
