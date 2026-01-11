// 첨부파일 타입
export type AtchFileType = 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT' | 'ARCHIVE' | 'OTHER'

// 첨부파일 목록 DTO
export interface AtchFileListDto {
  id: number
  originalName: string
  url: string
  mimeType: string
  fileSize: number
  type: AtchFileType
  extension: string
  createdAt: string
}

// 첨부파일 상세 DTO
export interface AtchFileDto {
  id: number
  siteCode: string | null
  originalName: string
  storedName: string
  filePath: string
  url: string
  mimeType: string
  fileSize: number
  type: AtchFileType
  description: string | null
  altText: string | null
  width: number | null
  height: number | null
  extension: string
  createdAt: string
  updatedAt: string
}

// 첨부파일 업로드 요청
export interface AtchFileUploadRequest {
  type?: AtchFileType
  description?: string
  altText?: string
}

// 첨부파일 수정 요청
export interface AtchFileUpdateRequest {
  description?: string
  altText?: string
}

// 첨부파일 검색 파라미터
export interface AtchFileParams {
  page?: number
  size?: number
  fileType?: AtchFileType
  keyword?: string
}
