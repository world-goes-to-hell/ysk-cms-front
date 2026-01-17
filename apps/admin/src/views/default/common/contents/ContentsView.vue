<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as pageApi from '@/api/page'
import type { PageListDto, PageDto, PageStatus } from '@/types/page'
import Pagination from '@/components/common/Pagination.vue'

const route = useRoute()
const router = useRouter()

// 현재 사이트 코드
const currentSiteCode = computed(() => {
  return (route.params.siteId as string) || 'main'
})

// 상태
const isLoading = ref(false)
const pages = ref<PageListDto[]>([])

// 페이지네이션
const pagination = ref({
  page: 1,
  size: 10,
  total: 0,
  totalPages: 0,
})

// 검색/필터
const searchQuery = ref('')
const filterStatus = ref<PageStatus | ''>('')

// 미리보기 모달 상태
const previewVisible = ref(false)
const previewContent = ref('')
const previewTitle = ref('')

// 상태 옵션
const statusOptions = [
  { value: 'DRAFT', label: '임시저장', color: '#909399' },
  { value: 'PUBLISHED', label: '발행됨', color: '#67C23A' },
  { value: 'ARCHIVED', label: '보관됨', color: '#E6A23C' },
]

// 페이지 목록 조회
const fetchPages = async () => {
  isLoading.value = true
  try {
    const response = await pageApi.getPages(currentSiteCode.value, pagination.value.page - 1, pagination.value.size)
    if (response.data.success && response.data.data) {
      pages.value = response.data.data.content
      pagination.value.total = response.data.data.totalElements
      pagination.value.totalPages = response.data.data.totalPages
    }
  } catch (error) {
    console.error('페이지 목록 조회 실패:', error)
    ElMessage.error('페이지 목록을 불러오는데 실패했습니다.')
  } finally {
    isLoading.value = false
  }
}

// 필터링된 페이지 목록
const filteredPages = computed(() => {
  let result = pages.value

  if (searchQuery.value) {
    const keyword = searchQuery.value.toLowerCase()
    result = result.filter(page =>
      page.title.toLowerCase().includes(keyword) ||
      page.slug.toLowerCase().includes(keyword)
    )
  }

  if (filterStatus.value) {
    result = result.filter(page => page.status === filterStatus.value)
  }

  return result
})

// 검색
const onSearch = () => {
  pagination.value.page = 1
  fetchPages()
}

// 페이지 변경
const onPageChange = (page: number) => {
  pagination.value.page = page
  fetchPages()
}

// 페이지 사이즈 변경
const onSizeChange = (size: number) => {
  pagination.value.size = size
  pagination.value.page = 1
  fetchPages()
}

// 생성 페이지로 이동
const goToCreatePage = () => {
  const basePath = route.path.replace(/\/$/, '')
  router.push(`${basePath}/form`)
}

// 수정 페이지로 이동
const goToEditPage = (page: PageListDto) => {
  const basePath = route.path.replace(/\/$/, '')
  router.push(`${basePath}/form/${page.id}`)
}

// 삭제
const handleDelete = async (page: PageListDto) => {
  try {
    await ElMessageBox.confirm(
      `"${page.title}" 페이지를 삭제하시겠습니까?`,
      '페이지 삭제',
      {
        confirmButtonText: '삭제',
        cancelButtonText: '취소',
        type: 'warning'
      }
    )

    isLoading.value = true
    const response = await pageApi.deletePage(currentSiteCode.value, page.id)
    if (response.data.success) {
      ElMessage.success('페이지가 삭제되었습니다.')
      fetchPages()
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('페이지 삭제 실패:', error)
      ElMessage.error('페이지 삭제에 실패했습니다.')
    }
  } finally {
    isLoading.value = false
  }
}

// 발행
const handlePublish = async (page: PageListDto) => {
  try {
    await ElMessageBox.confirm(
      `"${page.title}" 페이지를 발행하시겠습니까?`,
      '페이지 발행',
      {
        confirmButtonText: '발행',
        cancelButtonText: '취소',
        type: 'info'
      }
    )

    isLoading.value = true
    const response = await pageApi.publishPage(currentSiteCode.value, page.id)
    if (response.data.success) {
      ElMessage.success('페이지가 발행되었습니다.')
      fetchPages()
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('페이지 발행 실패:', error)
      ElMessage.error('페이지 발행에 실패했습니다.')
    }
  } finally {
    isLoading.value = false
  }
}

// 미리보기
const handlePreview = async (page: PageListDto) => {
  isLoading.value = true
  try {
    const response = await pageApi.getPage(currentSiteCode.value, page.id)
    if (response.data.success && response.data.data) {
      previewTitle.value = response.data.data.title
      previewContent.value = response.data.data.content || ''
      previewVisible.value = true
    }
  } catch (error) {
    console.error('미리보기 조회 실패:', error)
    ElMessage.error('미리보기를 불러오는데 실패했습니다.')
  } finally {
    isLoading.value = false
  }
}

// 상태 정보 가져오기
const getStatusInfo = (status: PageStatus) => {
  return statusOptions.find((opt) => opt.value === status) || statusOptions[0]
}

// 날짜 포맷
const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

onMounted(() => {
  fetchPages()
})
</script>

<template>
  <div class="contents-management">
    <!-- 페이지 헤더 -->
    <div class="page-header">
      <div class="header-left">
        <h1>
          <i class="mdi mdi-file-document-outline"></i>
          컨텐츠 관리
        </h1>
        <p>정적 페이지를 등록하고 관리합니다</p>
      </div>
      <button class="btn-create" @click="goToCreatePage">
        <i class="mdi mdi-plus"></i>
        새 페이지 추가
      </button>
    </div>

    <!-- 통계 카드 -->
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-icon total">
          <i class="mdi mdi-file-document-outline"></i>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ pagination.total }}</span>
          <span class="stat-label">전체 페이지</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon published">
          <i class="mdi mdi-check-circle-outline"></i>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ pages.filter(p => p.status === 'PUBLISHED').length }}</span>
          <span class="stat-label">발행됨</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon draft">
          <i class="mdi mdi-file-edit-outline"></i>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ pages.filter(p => p.status === 'DRAFT').length }}</span>
          <span class="stat-label">임시저장</span>
        </div>
      </div>
    </div>

    <!-- 검색 및 필터 -->
    <div class="filter-section">
      <div class="search-box">
        <i class="mdi mdi-magnify"></i>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="제목, 슬러그로 검색..."
          @keyup.enter="onSearch"
        />
      </div>
      <div class="filter-group">
        <select v-model="filterStatus" class="filter-select" @change="onSearch">
          <option value="">상태 전체</option>
          <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
        <button class="btn-search" @click="onSearch">
          <i class="mdi mdi-magnify"></i>
          검색
        </button>
      </div>
    </div>

    <!-- 페이지 목록 테이블 -->
    <div v-loading="isLoading" class="pages-container">
      <div v-if="filteredPages.length > 0" class="pages-table">
        <div class="table-header">
          <div class="col-info">페이지 정보</div>
          <div class="col-slug">슬러그</div>
          <div class="col-status">상태</div>
          <div class="col-date">발행일</div>
          <div class="col-date">작성일</div>
          <div class="col-actions">관리</div>
        </div>

        <div
          v-for="page in filteredPages"
          :key="page.id"
          class="table-row"
        >
          <!-- 페이지 정보 -->
          <div class="col-info">
            <div class="page-icon">
              <i class="mdi mdi-file-document-outline"></i>
            </div>
            <div class="page-details">
              <h3 class="page-title" @click="handlePreview(page)">
                {{ page.title }}
              </h3>
              <div v-if="page.childCount > 0" class="page-badges">
                <span class="badge children">
                  <i class="mdi mdi-file-tree"></i> 하위 {{ page.childCount }}개
                </span>
              </div>
            </div>
          </div>

          <!-- 슬러그 -->
          <div class="col-slug">
            <code class="slug-code">/{{ page.slug }}</code>
          </div>

          <!-- 상태 -->
          <div class="col-status">
            <span
              class="status-badge"
              :class="page.status.toLowerCase()"
            >
              {{ getStatusInfo(page.status).label }}
            </span>
          </div>

          <!-- 발행일 -->
          <div class="col-date">
            <span class="date-text">{{ formatDate(page.publishedAt) }}</span>
          </div>

          <!-- 작성일 -->
          <div class="col-date">
            <span class="date-text">{{ formatDate(page.createdAt) }}</span>
          </div>

          <!-- 관리 버튼 -->
          <div class="col-actions">
            <button class="action-btn preview" title="미리보기" @click="handlePreview(page)">
              <i class="mdi mdi-eye-outline"></i>
            </button>
            <button class="action-btn edit" title="수정" @click="goToEditPage(page)">
              <i class="mdi mdi-pencil-outline"></i>
            </button>
            <button
              v-if="page.status !== 'PUBLISHED'"
              class="action-btn publish"
              title="발행"
              @click="handlePublish(page)"
            >
              <i class="mdi mdi-publish"></i>
            </button>
            <button class="action-btn delete" title="삭제" @click="handleDelete(page)">
              <i class="mdi mdi-trash-can-outline"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- 빈 상태 -->
      <div v-else-if="!isLoading" class="empty-state">
        <div class="empty-icon">
          <i class="mdi mdi-file-document-outline"></i>
        </div>
        <h3>등록된 페이지가 없습니다</h3>
        <p>새 페이지를 추가해보세요</p>
        <button class="btn-create-empty" @click="goToCreatePage">
          <i class="mdi mdi-plus"></i>
          첫 페이지 만들기
        </button>
      </div>

      <!-- 페이지네이션 -->
      <div v-if="filteredPages.length > 0" class="pagination-wrapper">
        <Pagination
          :current-page="pagination.page"
          :total-pages="pagination.totalPages"
          :total-elements="pagination.total"
          :page-size="pagination.size"
          :show-total="true"
          :show-size-changer="true"
          @page-change="onPageChange"
          @size-change="onSizeChange"
        />
      </div>
    </div>

    <!-- 미리보기 다이얼로그 -->
    <Teleport to="body">
      <div v-if="previewVisible" class="modal-overlay" @click.self="previewVisible = false">
        <div class="modal-container">
          <div class="modal-header">
            <h3>
              <i class="mdi mdi-eye-outline"></i>
              {{ previewTitle }}
            </h3>
            <button class="btn-close" @click="previewVisible = false">
              <i class="mdi mdi-close"></i>
            </button>
          </div>
          <div class="modal-body">
            <div class="preview-content" v-html="previewContent"></div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" @click="previewVisible = false">닫기</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.contents-management {
  width: 100%;
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

.btn-create {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: linear-gradient(135deg, #6366f1 0%, #818cf8 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.btn-create:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
}

.btn-create .mdi {
  font-size: 20px;
}

/* 통계 카드 */
.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 32px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 16px;
}

.stat-icon {
  width: 52px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
}

.stat-icon .mdi {
  font-size: 26px;
}

.stat-icon.total {
  background: rgba(99, 102, 241, 0.1);
  color: #6366f1;
}

.stat-icon.published {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.stat-icon.draft {
  background: rgba(107, 114, 128, 0.1);
  color: #6b7280;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1;
}

.stat-label {
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: 4px;
}

/* 검색 및 필터 */
.filter-section {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}

.search-box {
  flex: 1;
  max-width: 400px;
  position: relative;
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

.filter-group {
  display: flex;
  gap: 12px;
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

.btn-search .mdi {
  font-size: 18px;
}

/* 페이지 테이블 */
.pages-container {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  overflow: hidden;
}

.pages-table {
  width: 100%;
}

.table-header {
  display: grid;
  grid-template-columns: 1fr 160px 90px 130px 130px 140px;
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
  grid-template-columns: 1fr 160px 90px 130px 130px 140px;
  gap: 16px;
  padding: 20px 24px;
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

/* 페이지 정보 */
.col-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.page-icon {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(99, 102, 241, 0.1);
  border-radius: 12px;
  flex-shrink: 0;
}

.page-icon .mdi {
  font-size: 22px;
  color: #6366f1;
}

.page-details {
  min-width: 0;
}

.page-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  cursor: pointer;
  transition: color 0.2s;
}

.page-title:hover {
  color: #6366f1;
}

.page-badges {
  display: flex;
  gap: 6px;
  margin-top: 6px;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}

.badge .mdi {
  font-size: 12px;
}

.badge.children {
  background: rgba(99, 102, 241, 0.1);
  color: #6366f1;
}

/* 슬러그 */
.col-slug {
  min-width: 0;
}

.slug-code {
  display: inline-block;
  max-width: 100%;
  padding: 6px 10px;
  background: var(--bg-tertiary);
  border-radius: 6px;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 12px;
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 상태 배지 */
.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
}

.status-badge.published {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.status-badge.draft {
  background: rgba(107, 114, 128, 0.1);
  color: #6b7280;
}

.status-badge.archived {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}

/* 날짜 */
.date-text {
  font-size: 13px;
  color: var(--text-tertiary);
}

/* 액션 버튼 */
.col-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.action-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border-color);
  border-radius: 10px;
  background: var(--bg-primary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn .mdi {
  font-size: 18px;
}

.action-btn.preview {
  color: #8b5cf6;
}

.action-btn.preview:hover {
  background: rgba(139, 92, 246, 0.1);
  border-color: #8b5cf6;
}

.action-btn.edit {
  color: #6366f1;
}

.action-btn.edit:hover {
  background: rgba(99, 102, 241, 0.1);
  border-color: #6366f1;
}

.action-btn.publish {
  color: #10b981;
}

.action-btn.publish:hover {
  background: rgba(16, 185, 129, 0.1);
  border-color: #10b981;
}

.action-btn.delete {
  color: #ef4444;
}

.action-btn.delete:hover {
  background: rgba(239, 68, 68, 0.1);
  border-color: #ef4444;
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
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(99, 102, 241, 0.1);
  border-radius: 20px;
  margin-bottom: 24px;
}

.empty-icon .mdi {
  font-size: 40px;
  color: #6366f1;
}

.empty-state h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 8px 0;
}

.empty-state p {
  font-size: 14px;
  color: var(--text-tertiary);
  margin: 0 0 24px 0;
}

.btn-create-empty {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: #6366f1;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-create-empty:hover {
  background: #4f46e5;
}

/* 페이지네이션 */
.pagination-wrapper {
  display: flex;
  justify-content: center;
  padding: 24px;
  border-top: 1px solid var(--border-color);
}

/* 미리보기 모달 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
}

.modal-container {
  background: var(--bg-elevated, var(--bg-secondary));
  border-radius: 20px;
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h3 {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.modal-header h3 .mdi {
  font-size: 22px;
  color: #6366f1;
}

.btn-close {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 10px;
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-close:hover {
  background: var(--bg-primary);
  color: var(--text-primary);
}

.btn-close .mdi {
  font-size: 22px;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  background: white;
}

.preview-content {
  color: #333;
  line-height: 1.8;
}

.preview-content :deep(img) {
  max-width: 100%;
  height: auto;
}

.preview-content :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 16px 0;
}

.preview-content :deep(th),
.preview-content :deep(td) {
  border: 1px solid #ddd;
  padding: 12px;
  text-align: left;
}

.preview-content :deep(th) {
  background: #f5f5f5;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid var(--border-color);
  background: var(--bg-tertiary);
}

.btn-secondary {
  padding: 12px 24px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background: var(--bg-primary);
}

/* 반응형 */
@media (max-width: 1024px) {
  .stats-row {
    grid-template-columns: repeat(3, 1fr);
  }

  .table-header,
  .table-row {
    grid-template-columns: 1fr 120px 80px 110px 100px;
  }

  .col-date:first-of-type {
    display: none;
  }
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 16px;
  }

  .btn-create {
    width: 100%;
    justify-content: center;
  }

  .stats-row {
    grid-template-columns: 1fr;
  }

  .filter-section {
    flex-direction: column;
  }

  .search-box {
    max-width: none;
  }

  .filter-group {
    width: 100%;
  }

  .filter-select {
    flex: 1;
  }

  .table-header {
    display: none;
  }

  .table-row {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 20px;
  }

  .col-info {
    width: 100%;
  }

  .col-slug,
  .col-status,
  .col-date {
    align-self: flex-start;
  }

  .col-actions {
    width: 100%;
    justify-content: flex-end;
    padding-top: 12px;
    border-top: 1px solid var(--border-color);
  }
}
</style>
