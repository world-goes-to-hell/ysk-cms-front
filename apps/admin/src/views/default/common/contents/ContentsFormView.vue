<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import * as pageApi from '@/api/page'
import type { PageDto, PageCreateRequest, PageUpdateRequest, PageStatus } from '@/types/page'
import RichTextEditor from '@/components/editor/RichTextEditor.vue'

const route = useRoute()
const router = useRouter()

// 현재 사이트 코드
const currentSiteCode = computed(() => {
  return (route.params.siteId as string) || 'main'
})

// 페이지 ID (수정 모드일 경우)
const pageId = computed(() => {
  const id = route.params.id as string
  return id ? parseInt(id, 10) : null
})

// 수정 모드 여부
const isEditMode = computed(() => pageId.value !== null)

// 상태
const loading = ref(false)
const saving = ref(false)
const currentPage = ref<PageDto | null>(null)

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

// 페이지 상세 조회 (수정 모드)
const fetchPage = async () => {
  if (!pageId.value) return

  loading.value = true
  try {
    const response = await pageApi.getPage(currentSiteCode.value, pageId.value)
    if (response.data.success && response.data.data) {
      currentPage.value = response.data.data
      formData.value = {
        slug: response.data.data.slug,
        title: response.data.data.title,
        content: response.data.data.content || '',
        metaDescription: response.data.data.metaDescription || '',
        metaKeywords: response.data.data.metaKeywords || '',
        status: response.data.data.status,
        sortOrder: response.data.data.sortOrder
      }
    }
  } catch (error) {
    console.error('페이지 상세 조회 실패:', error)
    ElMessage.error('페이지 정보를 불러오는데 실패했습니다.')
    goBack()
  } finally {
    loading.value = false
  }
}

// 저장 (생성/수정)
const handleSave = async (publish = false) => {
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
    const dataToSave = {
      ...formData.value,
      status: publish ? 'PUBLISHED' as PageStatus : formData.value.status
    }

    if (isEditMode.value && currentPage.value) {
      const updateData: PageUpdateRequest = dataToSave
      const response = await pageApi.updatePage(currentSiteCode.value, currentPage.value.id, updateData)
      if (response.data.success) {
        ElMessage.success(publish ? '페이지가 발행되었습니다.' : '페이지가 수정되었습니다.')
        goBack()
      }
    } else {
      const response = await pageApi.createPage(currentSiteCode.value, dataToSave)
      if (response.data.success) {
        ElMessage.success(publish ? '페이지가 생성 및 발행되었습니다.' : '페이지가 생성되었습니다.')
        goBack()
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

// 슬러그 자동 생성 (제목에서)
const generateSlug = () => {
  if (!formData.value.slug && formData.value.title) {
    const slug = formData.value.title
      .toLowerCase()
      .replace(/[^a-z0-9가-힣\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 100)
    formData.value.slug = slug
  }
}

// 목록으로 돌아가기
const goBack = () => {
  router.back()
}

// 페이지 제목
const pageTitle = computed(() => {
  return isEditMode.value ? '페이지 수정' : '새 페이지 추가'
})

onMounted(() => {
  if (isEditMode.value) {
    fetchPage()
  }
})

// 라우트 파라미터 변경 감지
watch(() => route.params.id, () => {
  if (isEditMode.value) {
    fetchPage()
  }
})
</script>

<template>
  <div class="contents-form-page" v-loading="loading">
    <!-- 페이지 헤더 -->
    <div class="page-header">
      <div class="header-left">
        <button class="btn-back" @click="goBack">
          <span class="mdi mdi-arrow-left"></span>
        </button>
        <div class="header-info">
          <h1>
            <span class="mdi mdi-file-document-edit-outline"></span>
            {{ pageTitle }}
          </h1>
          <p v-if="isEditMode && currentPage">
            슬러그: <code>/{{ currentPage.slug }}</code>
          </p>
          <p v-else>새로운 정적 페이지를 작성합니다.</p>
        </div>
      </div>
      <div class="header-actions">
        <button class="btn-secondary" @click="goBack" :disabled="saving">
          취소
        </button>
        <button
          class="btn-secondary"
          @click="handleSave(false)"
          :disabled="saving"
        >
          <span v-if="saving" class="mdi mdi-loading mdi-spin"></span>
          임시저장
        </button>
        <button
          class="btn-primary"
          @click="handleSave(true)"
          :disabled="saving"
        >
          <span v-if="saving" class="mdi mdi-loading mdi-spin"></span>
          <span class="mdi mdi-publish" v-else></span>
          발행하기
        </button>
      </div>
    </div>

    <!-- 폼 영역 -->
    <div class="form-container">
      <div class="form-main">
        <!-- 제목 -->
        <div class="form-section">
          <div class="form-row">
            <label class="form-label required">제목</label>
            <input
              v-model="formData.title"
              type="text"
              class="form-input title-input"
              placeholder="페이지 제목을 입력하세요"
              @blur="generateSlug"
            />
          </div>
        </div>

        <!-- 컨텐츠 에디터 -->
        <div class="form-section editor-section">
          <label class="form-label">컨텐츠</label>
          <div class="editor-wrapper">
            <RichTextEditor
              v-model="formData.content"
              :site-code="currentSiteCode"
              min-height="500px"
              placeholder="페이지 내용을 입력하세요..."
            />
          </div>
        </div>
      </div>

      <!-- 사이드바 -->
      <div class="form-sidebar">
        <!-- 발행 설정 -->
        <div class="sidebar-card">
          <h4>발행 설정</h4>
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

        <!-- URL 설정 -->
        <div class="sidebar-card">
          <h4>URL 설정</h4>
          <div class="form-row">
            <label class="form-label required">슬러그</label>
            <div class="slug-input-wrapper">
              <span class="slug-prefix">/</span>
              <input
                v-model="formData.slug"
                type="text"
                class="form-input slug-input"
                placeholder="page-url-slug"
              />
            </div>
            <p class="form-hint">사용자가 접근할 URL 경로입니다.</p>
          </div>
        </div>

        <!-- SEO 설정 -->
        <div class="sidebar-card">
          <h4>SEO 설정</h4>
          <div class="form-row">
            <label class="form-label">메타 설명</label>
            <textarea
              v-model="formData.metaDescription"
              class="form-textarea"
              placeholder="검색 엔진에 표시될 설명 (최대 300자)"
              maxlength="300"
              rows="3"
            ></textarea>
            <p class="form-hint">{{ formData.metaDescription?.length || 0 }} / 300</p>
          </div>
          <div class="form-row">
            <label class="form-label">메타 키워드</label>
            <input
              v-model="formData.metaKeywords"
              type="text"
              class="form-input"
              placeholder="키워드1, 키워드2"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.contents-form-page {
  width: 100%;
  max-width: 1600px;
}

/* 페이지 헤더 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--border-color);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.btn-back {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  background: var(--bg-elevated);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.btn-back:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.btn-back .mdi {
  font-size: 24px;
}

.header-info h1 {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 4px 0;
}

.header-info h1 .mdi {
  font-size: 28px;
  color: #6366f1;
}

.header-info p {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
}

.header-info code {
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 13px;
  padding: 2px 6px;
  background: var(--bg-secondary);
  border-radius: 4px;
  color: #6366f1;
}

.header-actions {
  display: flex;
  gap: 12px;
}

/* 폼 컨테이너 */
.form-container {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 24px;
}

.form-main {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-section {
  background: var(--bg-elevated);
  border-radius: 16px;
  border: 1px solid var(--border-color);
  padding: 24px;
}

.editor-section {
  flex: 1;
}

.editor-wrapper {
  margin-top: 12px;
}

/* 사이드바 */
.form-sidebar {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.sidebar-card {
  background: var(--bg-elevated);
  border-radius: 16px;
  border: 1px solid var(--border-color);
  padding: 20px;
}

.sidebar-card h4 {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 16px 0;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-color);
}

/* 폼 요소 */
.form-row {
  margin-bottom: 16px;
}

.form-row:last-child {
  margin-bottom: 0;
}

.form-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
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

.title-input {
  font-size: 18px;
  font-weight: 500;
  padding: 16px 20px;
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
  line-height: 1.5;
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
  font-size: 14px;
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
  border-radius: 12px;
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
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: var(--bg-elevated);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover:not(:disabled) {
  background: var(--bg-hover);
}

.btn-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 반응형 */
@media (max-width: 1200px) {
  .form-container {
    grid-template-columns: 1fr;
  }

  .form-sidebar {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
  }
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 20px;
  }

  .header-actions {
    width: 100%;
    flex-wrap: wrap;
  }

  .header-actions button {
    flex: 1;
    justify-content: center;
  }

  .form-sidebar {
    grid-template-columns: 1fr;
  }
}
</style>
