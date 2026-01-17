<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as pageApi from '@/api/page'
import type { PageDto, PageListDto, PageCreateRequest, PageUpdateRequest, PageStatus } from '@/types/page'
import RichTextEditor from '@/components/editor/RichTextEditor.vue'

const route = useRoute()

// 현재 사이트 코드
const currentSiteCode = computed(() => {
  return (route.params.siteId as string) || 'main'
})

// 상태
const loading = ref(false)
const saving = ref(false)
const pages = ref<PageListDto[]>([])
const totalElements = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)

// 검색/필터
const searchKeyword = ref('')
const statusFilter = ref<PageStatus | ''>('')

// 모달 상태
const dialogVisible = ref(false)
const dialogMode = ref<'create' | 'edit'>('create')
const editingPage = ref<PageDto | null>(null)
const previewVisible = ref(false)
const previewContent = ref('')
const previewTitle = ref('')

// 폼 데이터
const formData = ref<PageCreateRequest>({
  slug: '',
  title: '',
  content: '',
  metaDescription: '',
  metaKeywords: '',
  status: 'DRAFT',
  sortOrder: 0
})

// 상태 옵션
const statusOptions = [
  { value: 'DRAFT', label: '임시저장', color: '#909399' },
  { value: 'PUBLISHED', label: '발행됨', color: '#67c23a' },
  { value: 'ARCHIVED', label: '보관됨', color: '#e6a23c' }
]

// 상태 라벨 가져오기
const getStatusLabel = (status: PageStatus) => {
  const option = statusOptions.find(opt => opt.value === status)
  return option?.label || status
}

// 상태 색상 가져오기
const getStatusColor = (status: PageStatus) => {
  const option = statusOptions.find(opt => opt.value === status)
  return option?.color || '#909399'
}

// 페이지 목록 조회
const fetchPages = async () => {
  loading.value = true
  try {
    const response = await pageApi.getPages(currentSiteCode.value, currentPage.value - 1, pageSize.value)
    if (response.data.success && response.data.data) {
      pages.value = response.data.data.content
      totalElements.value = response.data.data.totalElements
    }
  } catch (error) {
    console.error('페이지 목록 조회 실패:', error)
    ElMessage.error('페이지 목록을 불러오는데 실패했습니다.')
  } finally {
    loading.value = false
  }
}

// 필터링된 페이지 목록
const filteredPages = computed(() => {
  let result = pages.value

  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(page =>
      page.title.toLowerCase().includes(keyword) ||
      page.slug.toLowerCase().includes(keyword)
    )
  }

  if (statusFilter.value) {
    result = result.filter(page => page.status === statusFilter.value)
  }

  return result
})

// 페이지 변경
const handlePageChange = (page: number) => {
  currentPage.value = page
  fetchPages()
}

// 폼 초기화
const resetForm = () => {
  formData.value = {
    slug: '',
    title: '',
    content: '',
    metaDescription: '',
    metaKeywords: '',
    status: 'DRAFT',
    sortOrder: 0
  }
  editingPage.value = null
}

// 생성 다이얼로그 열기
const openCreateDialog = () => {
  dialogMode.value = 'create'
  resetForm()
  dialogVisible.value = true
}

// 수정 다이얼로그 열기
const openEditDialog = async (page: PageListDto) => {
  loading.value = true
  try {
    const response = await pageApi.getPage(currentSiteCode.value, page.id)
    if (response.data.success && response.data.data) {
      editingPage.value = response.data.data
      formData.value = {
        slug: response.data.data.slug,
        title: response.data.data.title,
        content: response.data.data.content || '',
        metaDescription: response.data.data.metaDescription || '',
        metaKeywords: response.data.data.metaKeywords || '',
        status: response.data.data.status,
        sortOrder: response.data.data.sortOrder
      }
      dialogMode.value = 'edit'
      dialogVisible.value = true
    }
  } catch (error) {
    console.error('페이지 상세 조회 실패:', error)
    ElMessage.error('페이지 정보를 불러오는데 실패했습니다.')
  } finally {
    loading.value = false
  }
}

// 저장 (생성/수정)
const handleSave = async () => {
  if (!formData.value.title.trim()) {
    ElMessage.warning('제목을 입력해주세요.')
    return
  }
  if (!formData.value.slug.trim()) {
    ElMessage.warning('슬러그를 입력해주세요.')
    return
  }

  saving.value = true
  try {
    if (dialogMode.value === 'create') {
      const response = await pageApi.createPage(currentSiteCode.value, formData.value)
      if (response.data.success) {
        ElMessage.success('페이지가 생성되었습니다.')
        dialogVisible.value = false
        fetchPages()
      }
    } else if (editingPage.value) {
      const updateData: PageUpdateRequest = {
        slug: formData.value.slug,
        title: formData.value.title,
        content: formData.value.content,
        metaDescription: formData.value.metaDescription,
        metaKeywords: formData.value.metaKeywords,
        status: formData.value.status,
        sortOrder: formData.value.sortOrder
      }
      const response = await pageApi.updatePage(currentSiteCode.value, editingPage.value.id, updateData)
      if (response.data.success) {
        ElMessage.success('페이지가 수정되었습니다.')
        dialogVisible.value = false
        fetchPages()
      }
    }
  } catch (error: any) {
    console.error('페이지 저장 실패:', error)
    const message = error.response?.data?.message || '페이지 저장에 실패했습니다.'
    ElMessage.error(message)
  } finally {
    saving.value = false
  }
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

    loading.value = true
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
    loading.value = false
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

    loading.value = true
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
    loading.value = false
  }
}

// 미리보기
const handlePreview = async (page: PageListDto) => {
  loading.value = true
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
    loading.value = false
  }
}

// 슬러그 자동 생성 (제목에서)
const generateSlug = () => {
  if (!formData.value.slug && formData.value.title) {
    // 한글/영문/숫자만 남기고, 공백은 하이픈으로
    const slug = formData.value.title
      .toLowerCase()
      .replace(/[^a-z0-9가-힣\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 100)
    formData.value.slug = slug
  }
}

// 날짜 포맷
const formatDate = (dateString: string | null) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(() => {
  fetchPages()
})
</script>

<template>
  <div class="contents-page" v-loading="loading">
    <!-- 페이지 헤더 -->
    <div class="page-header">
      <div class="header-left">
        <h1>
          <span class="mdi mdi-file-document-outline"></span>
          컨텐츠 관리
        </h1>
        <p>정적 페이지를 등록하고 관리합니다. 등록된 페이지는 사용자 화면에서 바로 확인할 수 있습니다.</p>
      </div>
      <button class="btn-create" @click="openCreateDialog">
        <span class="mdi mdi-plus"></span>
        새 페이지 추가
      </button>
    </div>

    <!-- 필터 영역 -->
    <div class="filter-section">
      <div class="search-box">
        <span class="mdi mdi-magnify"></span>
        <input
          v-model="searchKeyword"
          type="text"
          placeholder="제목 또는 슬러그로 검색..."
          @keyup.enter="fetchPages"
        />
      </div>
      <div class="filter-group">
        <select v-model="statusFilter" class="filter-select">
          <option value="">전체 상태</option>
          <option v-for="option in statusOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </div>
    </div>

    <!-- 테이블 카드 -->
    <div class="table-card">
      <!-- 테이블 헤더 -->
      <div class="table-header">
        <div class="col-title">제목</div>
        <div class="col-slug">슬러그</div>
        <div class="col-status">상태</div>
        <div class="col-date">발행일</div>
        <div class="col-date">작성일</div>
        <div class="col-actions">관리</div>
      </div>

      <!-- 테이블 바디 -->
      <div v-if="filteredPages.length > 0" class="table-body">
        <div
          v-for="page in filteredPages"
          :key="page.id"
          class="table-row"
        >
          <div class="col-title">
            <span class="page-title">{{ page.title }}</span>
          </div>
          <div class="col-slug">
            <code class="slug-code">/{{ page.slug }}</code>
          </div>
          <div class="col-status">
            <span class="status-badge" :style="{ backgroundColor: getStatusColor(page.status) + '20', color: getStatusColor(page.status) }">
              {{ getStatusLabel(page.status) }}
            </span>
          </div>
          <div class="col-date">{{ formatDate(page.publishedAt) }}</div>
          <div class="col-date">{{ formatDate(page.createdAt) }}</div>
          <div class="col-actions">
            <button class="btn-icon" title="미리보기" @click="handlePreview(page)">
              <span class="mdi mdi-eye-outline"></span>
            </button>
            <button class="btn-icon" title="수정" @click="openEditDialog(page)">
              <span class="mdi mdi-pencil-outline"></span>
            </button>
            <button
              v-if="page.status !== 'PUBLISHED'"
              class="btn-icon btn-publish"
              title="발행"
              @click="handlePublish(page)"
            >
              <span class="mdi mdi-publish"></span>
            </button>
            <button class="btn-icon btn-danger" title="삭제" @click="handleDelete(page)">
              <span class="mdi mdi-delete-outline"></span>
            </button>
          </div>
        </div>
      </div>

      <!-- 빈 데이터 -->
      <div v-else class="empty-state">
        <span class="mdi mdi-file-document-outline"></span>
        <p>등록된 페이지가 없습니다.</p>
        <button class="btn-create-empty" @click="openCreateDialog">
          <span class="mdi mdi-plus"></span>
          첫 페이지 만들기
        </button>
      </div>

      <!-- 페이지네이션 -->
      <div v-if="totalElements > pageSize" class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="pageSize"
          :total="totalElements"
          layout="prev, pager, next"
          @current-change="handlePageChange"
        />
      </div>
    </div>

    <!-- 생성/수정 다이얼로그 -->
    <Teleport to="body">
      <div v-if="dialogVisible" class="modal-overlay" @click.self="dialogVisible = false">
        <div class="modal-container page-modal">
          <div class="modal-header">
            <h3>{{ dialogMode === 'create' ? '새 페이지 추가' : '페이지 수정' }}</h3>
            <button class="btn-close" @click="dialogVisible = false">
              <span class="mdi mdi-close"></span>
            </button>
          </div>
          <div class="modal-body">
            <div class="form-row">
              <label class="form-label required">제목</label>
              <input
                v-model="formData.title"
                type="text"
                class="form-input"
                placeholder="페이지 제목을 입력하세요"
                @blur="generateSlug"
              />
            </div>
            <div class="form-row">
              <label class="form-label required">슬러그 (URL)</label>
              <div class="slug-input-wrapper">
                <span class="slug-prefix">/</span>
                <input
                  v-model="formData.slug"
                  type="text"
                  class="form-input slug-input"
                  placeholder="page-url-slug"
                />
              </div>
              <p class="form-hint">사용자가 접근할 URL 경로입니다. 영문, 숫자, 하이픈만 사용하세요.</p>
            </div>
            <div class="form-row">
              <label class="form-label">컨텐츠</label>
              <RichTextEditor
                v-model="formData.content"
                :site-code="currentSiteCode"
                min-height="400px"
                placeholder="페이지 내용을 입력하세요..."
              />
            </div>
            <div class="form-row-group">
              <div class="form-row">
                <label class="form-label">상태</label>
                <select v-model="formData.status" class="form-select">
                  <option v-for="option in statusOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </option>
                </select>
              </div>
              <div class="form-row">
                <label class="form-label">정렬 순서</label>
                <input
                  v-model.number="formData.sortOrder"
                  type="number"
                  class="form-input"
                  placeholder="0"
                />
              </div>
            </div>
            <div class="form-row">
              <label class="form-label">메타 설명 (SEO)</label>
              <textarea
                v-model="formData.metaDescription"
                class="form-textarea"
                placeholder="검색 엔진에 표시될 페이지 설명 (최대 300자)"
                maxlength="300"
                rows="2"
              ></textarea>
            </div>
            <div class="form-row">
              <label class="form-label">메타 키워드 (SEO)</label>
              <input
                v-model="formData.metaKeywords"
                type="text"
                class="form-input"
                placeholder="키워드1, 키워드2, 키워드3"
              />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" @click="dialogVisible = false">취소</button>
            <button class="btn-primary" :disabled="saving" @click="handleSave">
              <span v-if="saving" class="mdi mdi-loading mdi-spin"></span>
              {{ dialogMode === 'create' ? '생성' : '저장' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 미리보기 다이얼로그 -->
    <Teleport to="body">
      <div v-if="previewVisible" class="modal-overlay" @click.self="previewVisible = false">
        <div class="modal-container preview-modal">
          <div class="modal-header">
            <h3>{{ previewTitle }}</h3>
            <button class="btn-close" @click="previewVisible = false">
              <span class="mdi mdi-close"></span>
            </button>
          </div>
          <div class="modal-body preview-body">
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
.contents-page {
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
  transition: all 0.2s;
}

.btn-create:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
}

/* 필터 영역 */
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
  color: var(--text-tertiary);
  font-size: 20px;
}

.search-box input {
  width: 100%;
  padding: 12px 16px 12px 48px;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  font-size: 14px;
  background: var(--bg-primary);
  color: var(--text-primary);
  transition: all 0.2s;
}

.search-box input:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.filter-group {
  display: flex;
  gap: 12px;
}

.filter-select {
  padding: 12px 16px;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  font-size: 14px;
  background: var(--bg-primary);
  color: var(--text-primary);
  cursor: pointer;
  min-width: 140px;
}

/* 테이블 카드 */
.table-card {
  background: var(--bg-elevated);
  border-radius: 16px;
  border: 1px solid var(--border-color);
  overflow: hidden;
}

.table-header {
  display: grid;
  grid-template-columns: 1fr 180px 100px 140px 140px 140px;
  gap: 16px;
  padding: 16px 24px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.table-row {
  display: grid;
  grid-template-columns: 1fr 180px 100px 140px 140px 140px;
  gap: 16px;
  padding: 16px 24px;
  border-bottom: 1px solid var(--border-color);
  align-items: center;
  transition: background 0.15s;
}

.table-row:hover {
  background: var(--bg-hover);
}

.table-row:last-child {
  border-bottom: none;
}

.page-title {
  font-weight: 500;
  color: var(--text-primary);
}

.slug-code {
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 12px;
  padding: 4px 8px;
  background: var(--bg-secondary);
  border-radius: 6px;
  color: var(--text-secondary);
}

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.col-date {
  font-size: 13px;
  color: var(--text-secondary);
}

.col-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
  background: var(--bg-secondary);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s;
}

.btn-icon:hover {
  background: #6366f1;
  color: white;
}

.btn-icon.btn-danger:hover {
  background: #ef4444;
}

.btn-icon.btn-publish:hover {
  background: #10b981;
}

/* 빈 상태 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 24px;
  color: var(--text-tertiary);
}

.empty-state .mdi {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-state p {
  font-size: 16px;
  margin-bottom: 24px;
}

.btn-create-empty {
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
  transition: all 0.2s;
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

/* 모달 */
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
  background: var(--bg-elevated);
  border-radius: 20px;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.page-modal {
  max-width: 900px;
}

.preview-modal {
  max-width: 800px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h3 {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.btn-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 10px;
  background: var(--bg-secondary);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s;
}

.btn-close:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid var(--border-color);
  background: var(--bg-secondary);
}

/* 폼 스타일 */
.form-row {
  margin-bottom: 20px;
}

.form-row-group {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.form-label.required::after {
  content: '*';
  color: #ef4444;
  margin-left: 4px;
}

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid var(--border-color);
  border-radius: 10px;
  font-size: 14px;
  background: var(--bg-primary);
  color: var(--text-primary);
  transition: all 0.2s;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.form-hint {
  font-size: 12px;
  color: var(--text-tertiary);
  margin-top: 6px;
}

.slug-input-wrapper {
  display: flex;
  align-items: center;
}

.slug-prefix {
  padding: 12px 0 12px 16px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-right: none;
  border-radius: 10px 0 0 10px;
  color: var(--text-secondary);
  font-family: 'Monaco', 'Menlo', monospace;
}

.slug-input {
  border-radius: 0 10px 10px 0;
  font-family: 'Monaco', 'Menlo', monospace;
}

/* 버튼 */
.btn-primary {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: linear-gradient(135deg, #6366f1 0%, #818cf8 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: var(--bg-tertiary);
}

/* 미리보기 */
.preview-body {
  background: white;
  color: #333;
}

.preview-content {
  padding: 20px;
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

/* 반응형 */
@media (max-width: 1024px) {
  .table-header,
  .table-row {
    grid-template-columns: 1fr 120px 90px 120px 100px;
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

  .filter-section {
    flex-direction: column;
  }

  .search-box {
    max-width: none;
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

  .col-actions {
    width: 100%;
    justify-content: flex-end;
    padding-top: 12px;
    border-top: 1px solid var(--border-color);
  }

  .form-row-group {
    grid-template-columns: 1fr;
  }
}
</style>
