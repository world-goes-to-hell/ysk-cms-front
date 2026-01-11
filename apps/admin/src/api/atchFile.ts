import api from './index'
import type { ApiResponse } from '@/types/auth'
import type {
  AtchFileDto,
  AtchFileListDto,
  AtchFileType,
  AtchFileParams,
  AtchFileUpdateRequest,
} from '@/types/atchFile'
import type { PageResponse } from '@/types/board'

// ============================================
// 첨부파일 API
// ============================================

// 전체 첨부파일 목록 조회
export const getAtchFiles = (params?: AtchFileParams) => {
  return api.get<ApiResponse<PageResponse<AtchFileListDto>>>('/atch-files', { params })
}

// 사이트별 첨부파일 목록 조회
export const getAtchFilesBySite = (siteCode: string, params?: AtchFileParams) => {
  return api.get<ApiResponse<PageResponse<AtchFileListDto>>>(`/sites/${siteCode}/atch-files`, {
    params,
  })
}

// 첨부파일 검색
export const searchAtchFiles = (
  siteCode: string,
  params?: AtchFileParams & { keyword?: string },
) => {
  return api.get<ApiResponse<PageResponse<AtchFileListDto>>>(
    `/sites/${siteCode}/atch-files/search`,
    { params },
  )
}

// 첨부파일 상세 조회
export const getAtchFile = (id: number) => {
  return api.get<ApiResponse<AtchFileDto>>(`/atch-files/${id}`)
}

// 첨부파일 업로드
export const uploadAtchFile = (
  siteCode: string,
  file: File,
  options?: { type?: AtchFileType; description?: string; altText?: string },
) => {
  const formData = new FormData()
  formData.append('file', file)
  if (options?.type) formData.append('type', options.type)
  if (options?.description) formData.append('description', options.description)
  if (options?.altText) formData.append('altText', options.altText)

  return api.post<ApiResponse<AtchFileDto>>(`/sites/${siteCode}/atch-files/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

// 다중 첨부파일 업로드
export const uploadMultipleAtchFiles = (
  siteCode: string,
  files: File[],
  options?: { type?: AtchFileType; description?: string },
) => {
  const formData = new FormData()
  files.forEach((file) => formData.append('files', file))
  if (options?.type) formData.append('type', options.type)
  if (options?.description) formData.append('description', options.description)

  return api.post<ApiResponse<AtchFileDto[]>>(
    `/sites/${siteCode}/atch-files/upload-multiple`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  )
}

// 첨부파일 정보 수정
export const updateAtchFile = (id: number, data: AtchFileUpdateRequest) => {
  return api.put<ApiResponse<AtchFileDto>>(`/atch-files/${id}`, data)
}

// 첨부파일 삭제
export const deleteAtchFile = (id: number) => {
  return api.delete<ApiResponse<void>>(`/atch-files/${id}`)
}

// 첨부파일 다운로드 URL 조회
export const getDownloadUrl = (id: number) => {
  return api.get<ApiResponse<string>>(`/atch-files/${id}/download`)
}

// Presigned URL 조회 (직접 다운로드용)
export const getPresignedUrl = (id: number) => {
  return api.get<ApiResponse<string>>(`/atch-files/${id}/presigned-url`)
}

// 첨부파일 다운로드 (blob으로 받기)
export const downloadAtchFile = async (id: number, fileName: string) => {
  const response = await api.get(`/atch-files/${id}/download`, {
    responseType: 'blob',
  })

  // 브라우저에서 다운로드 트리거
  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', fileName)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)

  return response
}
