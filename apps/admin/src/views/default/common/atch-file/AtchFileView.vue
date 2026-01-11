<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import Pagination from '@/components/common/Pagination.vue'
import {
  getAtchFilesBySite,
  uploadAtchFile,
  deleteAtchFile,
  downloadAtchFile,
} from '@/api/atchFile'
import type { AtchFileListDto, AtchFileType } from '@/types/atchFile'

const route = useRoute()

// 현재 사이트 코드
const currentSiteCode = computed(() => {
  const siteId = route.params.siteId as string
  return siteId || 'main'
})

// 파일 목록
const files = ref<AtchFileListDto[]>([])
const loading = ref(false)
const uploading = ref(false)

// 뷰 모드 (grid/list)
const viewMode = ref<'grid' | 'list'>('grid')

// 필터
const filters = ref({
  fileType: '' as AtchFileType | '',
  keyword: '',
})

// 페이지네이션
const pagination = ref({
  page: 0,
  size: 20,
  totalElements: 0,
  totalPages: 0,
})

// 통계
const stats = ref({
  total: 0,
  images: 0,
  documents: 0,
  videos: 0,
  others: 0,
})

// 파일 타입 옵션
const fileTypeOptions = [
  { value: '', label: '전체' },
  { value: 'IMAGE', label: '이미지' },
  { value: 'VIDEO', label: '비디오' },
  { value: 'AUDIO', label: '오디오' },
  { value: 'DOCUMENT', label: '문서' },
  { value: 'ARCHIVE', label: '압축파일' },
  { value: 'OTHER', label: '기타' },
]

// 파일 타입별 아이콘
const getFileIcon = (type: AtchFileType) => {
  const icons: Record<AtchFileType, string> = {
    IMAGE: 'mdi-image-outline',
    VIDEO: 'mdi-video-outline',
    AUDIO: 'mdi-music-note-outline',
    DOCUMENT: 'mdi-file-document-outline',
    ARCHIVE: 'mdi-folder-zip-outline',
    OTHER: 'mdi-file-outline',
  }
  return icons[type] || 'mdi-file-outline'
}

// 파일 타입별 색상
const getFileColor = (type: AtchFileType) => {
  const colors: Record<AtchFileType, string> = {
    IMAGE: '#10b981',
    VIDEO: '#f59e0b',
    AUDIO: '#8b5cf6',
    DOCUMENT: '#3b82f6',
    ARCHIVE: '#ef4444',
    OTHER: '#6b7280',
  }
  return colors[type] || '#6b7280'
}

// 파일 사이즈 포맷
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 날짜 포맷
const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

// 이미지 여부 확인
const isImage = (mimeType: string) => {
  return mimeType.startsWith('image/')
}

// 데이터 조회
const fetchFiles = async () => {
  loading.value = true
  try {
    const params: Record<string, any> = {
      page: pagination.value.page,
      size: pagination.value.size,
    }

    if (filters.value.fileType) {
      params.fileType = filters.value.fileType
    }
    if (filters.value.keyword) {
      params.keyword = filters.value.keyword
    }

    const response = await getAtchFilesBySite(currentSiteCode.value, params)
    if (response.data.success) {
      files.value = response.data.data.content
      pagination.value.totalElements = response.data.data.totalElements
      pagination.value.totalPages = response.data.data.totalPages

      // 통계 계산
      calculateStats(files.value)
    }
  } catch (error) {
    console.error('첨부파일 조회 실패:', error)
    ElMessage.error('첨부파일을 불러오는데 실패했습니다.')
  } finally {
    loading.value = false
  }
}

// 통계 계산
const calculateStats = (fileList: AtchFileListDto[]) => {
  stats.value = {
    total: pagination.value.totalElements,
    images: 0,
    documents: 0,
    videos: 0,
    others: 0,
  }

  fileList.forEach((file) => {
    switch (file.type) {
      case 'IMAGE':
        stats.value.images++
        break
      case 'DOCUMENT':
        stats.value.documents++
        break
      case 'VIDEO':
        stats.value.videos++
        break
      default:
        stats.value.others++
    }
  })
}

// 검색
const handleSearch = () => {
  pagination.value.page = 0
  fetchFiles()
}

// 필터 초기화
const handleReset = () => {
  filters.value = {
    fileType: '',
    keyword: '',
  }
  pagination.value.page = 0
  fetchFiles()
}

// 파일 업로드
const fileInput = ref<HTMLInputElement | null>(null)

const handleUploadClick = () => {
  fileInput.value?.click()
}

const handleFileChange = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const fileList = target.files

  if (!fileList || fileList.length === 0) return

  uploading.value = true
  let successCount = 0
  let failCount = 0

  try {
    for (const file of Array.from(fileList)) {
      try {
        await uploadAtchFile(currentSiteCode.value, file)
        successCount++
      } catch (error) {
        failCount++
        console.error('파일 업로드 실패:', file.name, error)
      }
    }

    if (successCount > 0) {
      ElMessage.success(`${successCount}개 파일이 업로드되었습니다.`)
      fetchFiles()
    }
    if (failCount > 0) {
      ElMessage.error(`${failCount}개 파일 업로드에 실패했습니다.`)
    }
  } finally {
    uploading.value = false
    // 파일 인풋 초기화
    if (target) target.value = ''
  }
}

// 파일 삭제
const handleDelete = async (file: AtchFileListDto) => {
  try {
    await ElMessageBox.confirm(`'${file.originalName}' 파일을 삭제하시겠습니까?`, '파일 삭제', {
      confirmButtonText: '삭제',
      cancelButtonText: '취소',
      type: 'warning',
    })

    await deleteAtchFile(file.id)
    ElMessage.success('파일이 삭제되었습니다.')
    fetchFiles()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('파일 삭제 실패:', error)
      ElMessage.error('파일 삭제에 실패했습니다.')
    }
  }
}

// 파일 다운로드
const handleDownload = async (file: AtchFileListDto) => {
  try {
    await downloadAtchFile(file.id, file.originalName)
    ElMessage.success('다운로드가 시작되었습니다.')
  } catch (error) {
    console.error('파일 다운로드 실패:', error)
    ElMessage.error('파일 다운로드에 실패했습니다.')
  }
}

// 파일 미리보기 (새 탭)
const handlePreview = (file: AtchFileListDto) => {
  window.open(file.url, '_blank')
}

// URL 복사
const handleCopyUrl = async (file: AtchFileListDto) => {
  try {
    await navigator.clipboard.writeText(file.url)
    ElMessage.success('URL이 클립보드에 복사되었습니다.')
  } catch (error) {
    ElMessage.error('URL 복사에 실패했습니다.')
  }
}

// 현재 페이지 (1-based)
const currentPage = computed(() => pagination.value.page + 1)

// 페이지 변경
const handlePageChange = (page: number) => {
  pagination.value.page = page - 1
  fetchFiles()
}

// 페이지 사이즈 변경
const handleSizeChange = (size: number) => {
  pagination.value.size = size
  pagination.value.page = 0
  fetchFiles()
}

onMounted(() => {
  fetchFiles()
})
</script>

<template>
  <div class="atch-file-page" v-loading="loading || uploading">
    <!-- 숨겨진 파일 인풋 -->
    <input
      ref="fileInput"
      type="file"
      multiple
      style="display: none"
      @change="handleFileChange"
    />

    <!-- 페이지 헤더 -->
    <div class="page-header">
      <div class="header-left">
        <h1>
          <i class="mdi mdi-folder-multiple-image"></i>
          첨부파일 관리
        </h1>
        <p>업로드된 파일을 관리하고 조회할 수 있습니다</p>
      </div>
      <div class="header-right">
        <button class="btn-upload" @click="handleUploadClick" :disabled="uploading">
          <i class="mdi mdi-upload"></i>
          파일 업로드
        </button>
      </div>
    </div>

    <!-- 통계 카드 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon total">
          <i class="mdi mdi-folder-outline"></i>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ stats.total }}</span>
          <span class="stat-label">전체 파일</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon images">
          <i class="mdi mdi-image-outline"></i>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ stats.images }}</span>
          <span class="stat-label">이미지</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon documents">
          <i class="mdi mdi-file-document-outline"></i>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ stats.documents }}</span>
          <span class="stat-label">문서</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon videos">
          <i class="mdi mdi-video-outline"></i>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ stats.videos }}</span>
          <span class="stat-label">비디오</span>
        </div>
      </div>
    </div>

    <!-- 필터 영역 -->
    <div class="filter-section">
      <div class="filter-left">
        <select v-model="filters.fileType" class="filter-select">
          <option v-for="opt in fileTypeOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
        <div class="search-box">
          <i class="mdi mdi-magnify"></i>
          <input
            v-model="filters.keyword"
            type="text"
            placeholder="파일명 검색..."
            @keyup.enter="handleSearch"
          />
        </div>
        <div class="button-group">
          <button class="btn-search" @click="handleSearch">
            <i class="mdi mdi-magnify"></i>
            검색
          </button>
          <button class="btn-reset" @click="handleReset">
            <i class="mdi mdi-refresh"></i>
            초기화
          </button>
        </div>
      </div>
      <div class="view-toggle">
        <button
          class="toggle-btn"
          :class="{ active: viewMode === 'grid' }"
          @click="viewMode = 'grid'"
        >
          <i class="mdi mdi-view-grid-outline"></i>
        </button>
        <button
          class="toggle-btn"
          :class="{ active: viewMode === 'list' }"
          @click="viewMode = 'list'"
        >
          <i class="mdi mdi-format-list-bulleted"></i>
        </button>
      </div>
    </div>

    <!-- 파일 목록 -->
    <div class="files-container">
      <!-- 그리드 뷰 -->
      <div v-if="viewMode === 'grid' && files.length > 0" class="files-grid">
        <div v-for="file in files" :key="file.id" class="file-card">
          <!-- 이미지 미리보기 -->
          <div class="file-preview" @click="handlePreview(file)">
            <img
              v-if="isImage(file.mimeType)"
              :src="file.url"
              :alt="file.originalName"
              loading="lazy"
            />
            <div v-else class="file-icon-wrapper">
              <i class="mdi" :class="getFileIcon(file.type)" :style="{ color: getFileColor(file.type) }"></i>
            </div>
            <div class="file-overlay">
              <i class="mdi mdi-eye-outline"></i>
            </div>
          </div>

          <!-- 파일 정보 -->
          <div class="file-info">
            <h4 class="file-name" :title="file.originalName">{{ file.originalName }}</h4>
            <div class="file-meta">
              <span class="file-size">{{ formatFileSize(file.fileSize) }}</span>
              <span class="file-date">{{ formatDate(file.createdAt) }}</span>
            </div>
          </div>

          <!-- 액션 버튼 -->
          <div class="file-actions">
            <button class="action-btn" title="URL 복사" @click="handleCopyUrl(file)">
              <i class="mdi mdi-link"></i>
            </button>
            <button class="action-btn" title="다운로드" @click="handleDownload(file)">
              <i class="mdi mdi-download"></i>
            </button>
            <button class="action-btn delete" title="삭제" @click="handleDelete(file)">
              <i class="mdi mdi-trash-can-outline"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- 리스트 뷰 -->
      <div v-if="viewMode === 'list' && files.length > 0" class="files-table">
        <div class="table-header">
          <div class="col-preview">미리보기</div>
          <div class="col-name">파일명</div>
          <div class="col-type">유형</div>
          <div class="col-size">크기</div>
          <div class="col-date">등록일</div>
          <div class="col-actions">관리</div>
        </div>

        <div v-for="file in files" :key="file.id" class="table-row">
          <!-- 미리보기 -->
          <div class="col-preview">
            <div class="preview-thumb" @click="handlePreview(file)">
              <img v-if="isImage(file.mimeType)" :src="file.url" :alt="file.originalName" />
              <i v-else class="mdi" :class="getFileIcon(file.type)" :style="{ color: getFileColor(file.type) }"></i>
            </div>
          </div>

          <!-- 파일명 -->
          <div class="col-name">
            <span class="name-text" :title="file.originalName">{{ file.originalName }}</span>
            <span class="extension-badge">.{{ file.extension }}</span>
          </div>

          <!-- 유형 -->
          <div class="col-type">
            <span class="type-badge" :style="{ background: getFileColor(file.type) + '20', color: getFileColor(file.type) }">
              {{ file.type }}
            </span>
          </div>

          <!-- 크기 -->
          <div class="col-size">
            {{ formatFileSize(file.fileSize) }}
          </div>

          <!-- 등록일 -->
          <div class="col-date">
            {{ formatDate(file.createdAt) }}
          </div>

          <!-- 관리 -->
          <div class="col-actions">
            <button class="action-btn" title="URL 복사" @click="handleCopyUrl(file)">
              <i class="mdi mdi-link"></i>
            </button>
            <button class="action-btn" title="다운로드" @click="handleDownload(file)">
              <i class="mdi mdi-download"></i>
            </button>
            <button class="action-btn delete" title="삭제" @click="handleDelete(file)">
              <i class="mdi mdi-trash-can-outline"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- 빈 상태 -->
      <div v-if="files.length === 0 && !loading" class="empty-state">
        <div class="empty-icon">
          <i class="mdi mdi-folder-open-outline"></i>
        </div>
        <h3>첨부파일이 없습니다</h3>
        <p>파일을 업로드하여 관리를 시작하세요</p>
        <button class="btn-upload-empty" @click="handleUploadClick">
          <i class="mdi mdi-upload"></i>
          파일 업로드
        </button>
      </div>

      <!-- 페이지네이션 -->
      <div v-if="files.length > 0" class="pagination-wrapper">
        <Pagination
          :current-page="currentPage"
          :total-pages="pagination.totalPages"
          :total-elements="pagination.totalElements"
          :page-size="pagination.size"
          :show-total="true"
          :show-size-changer="true"
          @page-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.atch-file-page {
  width: 100%;
  max-width: 1400px;
}

/* 페이지 헤더 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;
}

.header-left h1 {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 8px 0;
}

.header-left h1 .mdi {
  font-size: 32px;
  color: #6366f1;
}

.header-left p {
  font-size: 15px;
  color: var(--text-secondary);
  margin: 0;
}

.btn-upload {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-upload:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(99, 102, 241, 0.3);
}

.btn-upload:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 통계 카드 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 16px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
}

.stat-icon .mdi {
  font-size: 24px;
  color: white;
}

.stat-icon.total {
  background: linear-gradient(135deg, #6366f1, #818cf8);
}

.stat-icon.images {
  background: linear-gradient(135deg, #10b981, #34d399);
}

.stat-icon.documents {
  background: linear-gradient(135deg, #3b82f6, #60a5fa);
}

.stat-icon.videos {
  background: linear-gradient(135deg, #f59e0b, #fbbf24);
}

.stat-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
}

.stat-label {
  font-size: 13px;
  color: var(--text-secondary);
}

/* 필터 영역 */
.filter-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.filter-left {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-select {
  padding: 12px 16px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  font-size: 14px;
  color: var(--text-primary);
  cursor: pointer;
  min-width: 120px;
}

.filter-select:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.search-box {
  position: relative;
  min-width: 250px;
}

.search-box .mdi {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 20px;
  color: var(--text-tertiary);
}

.search-box input {
  width: 100%;
  padding: 12px 16px 12px 48px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  font-size: 14px;
  color: var(--text-primary);
  transition: all 0.2s ease;
}

.search-box input:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.search-box input::placeholder {
  color: var(--text-tertiary);
}

.button-group {
  display: flex;
  gap: 8px;
}

.btn-search {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 20px;
  background: #6366f1;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-search:hover {
  background: #4f46e5;
}

.btn-reset {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 20px;
  background: var(--bg-secondary);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-reset:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

/* 뷰 토글 */
.view-toggle {
  display: flex;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  overflow: hidden;
}

.toggle-btn {
  padding: 10px 16px;
  background: transparent;
  border: none;
  color: var(--text-tertiary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.toggle-btn .mdi {
  font-size: 20px;
}

.toggle-btn:hover {
  color: var(--text-primary);
}

.toggle-btn.active {
  background: #6366f1;
  color: white;
}

/* 파일 목록 컨테이너 */
.files-container {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  overflow: hidden;
}

/* 그리드 뷰 */
.files-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 20px;
  padding: 24px;
}

.file-card {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.file-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
}

.file-preview {
  position: relative;
  width: 100%;
  height: 160px;
  background: var(--bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  overflow: hidden;
}

.file-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.file-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
}

.file-icon-wrapper .mdi {
  font-size: 56px;
}

.file-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.file-overlay .mdi {
  font-size: 32px;
  color: white;
}

.file-preview:hover .file-overlay {
  opacity: 1;
}

.file-info {
  padding: 16px;
}

.file-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 8px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--text-tertiary);
}

.file-actions {
  display: flex;
  justify-content: flex-end;
  gap: 4px;
  padding: 8px 12px 12px;
  border-top: 1px solid var(--border-color);
}

.action-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.action-btn.delete:hover {
  background: rgba(239, 68, 68, 0.1);
  border-color: #ef4444;
  color: #ef4444;
}

/* 리스트 뷰 */
.files-table {
  width: 100%;
}

.table-header {
  display: grid;
  grid-template-columns: 80px 1fr 100px 100px 120px 120px;
  gap: 16px;
  padding: 16px 24px;
  background: var(--bg-tertiary);
  border-bottom: 1px solid var(--border-color);
  font-size: 12px;
  font-weight: 600;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.table-row {
  display: grid;
  grid-template-columns: 80px 1fr 100px 100px 120px 120px;
  gap: 16px;
  padding: 16px 24px;
  align-items: center;
  border-bottom: 1px solid var(--border-color);
  transition: background 0.2s ease;
}

.table-row:last-child {
  border-bottom: none;
}

.table-row:hover {
  background: var(--bg-tertiary);
}

.preview-thumb {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  background: var(--bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  cursor: pointer;
}

.preview-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-thumb .mdi {
  font-size: 28px;
}

.col-name {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.name-text {
  font-weight: 500;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.extension-badge {
  padding: 2px 6px;
  background: var(--bg-tertiary);
  border-radius: 4px;
  font-size: 11px;
  color: var(--text-tertiary);
  text-transform: uppercase;
  flex-shrink: 0;
}

.type-badge {
  display: inline-flex;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
}

.col-size,
.col-date {
  font-size: 14px;
  color: var(--text-secondary);
}

.col-actions {
  display: flex;
  gap: 4px;
}

/* 빈 상태 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;
}

.empty-icon {
  width: 100px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(99, 102, 241, 0.1);
  border-radius: 24px;
  margin-bottom: 24px;
}

.empty-icon .mdi {
  font-size: 48px;
  color: #6366f1;
}

.empty-state h3 {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 8px 0;
}

.empty-state p {
  font-size: 14px;
  color: var(--text-tertiary);
  margin: 0 0 24px 0;
}

.btn-upload-empty {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: #6366f1;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-upload-empty:hover {
  background: #4f46e5;
}

/* 페이지네이션 */
.pagination-wrapper {
  display: flex;
  justify-content: center;
  padding: 24px;
  border-top: 1px solid var(--border-color);
}

/* 반응형 */
@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 16px;
  }

  .btn-upload {
    width: 100%;
    justify-content: center;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .stat-card {
    padding: 16px;
  }

  .filter-section {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-left {
    flex-direction: column;
  }

  .search-box {
    min-width: auto;
  }

  .button-group {
    width: 100%;
  }

  .btn-search,
  .btn-reset {
    flex: 1;
    justify-content: center;
  }

  .view-toggle {
    align-self: flex-end;
  }

  .files-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    padding: 16px;
  }

  .table-header {
    display: none;
  }

  .table-row {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    padding: 16px;
  }

  .col-preview {
    order: 1;
  }

  .col-name {
    order: 2;
    flex: 1;
    min-width: 0;
  }

  .col-type,
  .col-size,
  .col-date {
    display: none;
  }

  .col-actions {
    order: 3;
  }
}

@media (max-width: 480px) {
  .files-grid {
    grid-template-columns: 1fr;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
