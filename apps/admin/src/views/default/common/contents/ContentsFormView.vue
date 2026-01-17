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
const isLoading = ref(false)
const isSaving = ref(false)
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
  { value: 'PUBLISHED', label: '발행됨', color: '#67C23A' },
  { value: 'ARCHIVED', label: '보관됨', color: '#E6A23C' }
]

// 페이지 제목
const pageTitle = computed(() => {
  return isEditMode.value ? '페이지 수정' : '새 페이지 작성'
})

// 페이지 상세 조회 (수정 모드)
const fetchPage = async () => {
  if (!pageId.value) return

  isLoading.value = true
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
    isLoading.value = false
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

  isSaving.value = true
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
    isSaving.value = false
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
  // 현재 경로에서 /form 또는 /form/:id 부분 제거
  const currentPath = route.path
  const basePath = currentPath.replace(/\/form(\/\d+)?$/, '')
  router.push(basePath)
}

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
  <div class="page-form-page">
    <!-- 페이지 헤더 -->
    <div class="page-header">
      <div class="header-left">
        <button class="btn-back" @click="goBack">
          <i class="mdi mdi-arrow-left"></i>
        </button>
        <div class="header-info">
          <h1>
            <i class="mdi mdi-file-document-edit-outline"></i>
            {{ pageTitle }}
          </h1>
          <p v-if="isEditMode && currentPage">
            슬러그: <code>/{{ currentPage.slug }}</code>
          </p>
          <p v-else>새로운 정적 페이지를 작성합니다</p>
        </div>
      </div>
      <div class="header-actions">
        <button class="btn-cancel" @click="goBack">
          취소
        </button>
        <button
          class="btn-draft"
          :disabled="isSaving"
          @click="handleSave(false)"
        >
          <i class="mdi" :class="isSaving ? 'mdi-loading mdi-spin' : 'mdi-content-save-outline'"></i>
          임시저장
        </button>
        <button
          class="btn-save"
          :disabled="isSaving"
          @click="handleSave(true)"
        >
          <i class="mdi" :class="isSaving ? 'mdi-loading mdi-spin' : 'mdi-publish'"></i>
          발행하기
        </button>
      </div>
    </div>

    <!-- 폼 컨텐츠 -->
    <div v-loading="isLoading" class="form-container">
      <!-- 기본 정보 -->
      <div class="form-section">
        <h3 class="section-title">
          <i class="mdi mdi-text-box-outline"></i>
          기본 정보
        </h3>

        <div class="form-field">
          <label class="field-label required">제목</label>
          <input
            v-model="formData.title"
            type="text"
            class="field-input"
            placeholder="페이지 제목을 입력하세요"
            @blur="generateSlug"
          />
        </div>

        <div class="form-field">
          <label class="field-label">내용</label>
          <RichTextEditor
            v-model="formData.content"
            :site-code="currentSiteCode"
            placeholder="페이지 내용을 입력하세요"
            min-height="500px"
          />
        </div>
      </div>

      <!-- URL 및 상태 설정 -->
      <div class="form-section">
        <h3 class="section-title">
          <i class="mdi mdi-cog-outline"></i>
          URL 및 상태 설정
        </h3>

        <div class="form-row">
          <div class="form-field">
            <label class="field-label required">슬러그 (URL 경로)</label>
            <div class="slug-input-wrapper">
              <span class="slug-prefix">/</span>
              <input
                v-model="formData.slug"
                type="text"
                class="field-input slug-input"
                placeholder="page-url-slug"
              />
            </div>
            <p class="field-hint">사용자가 접근할 URL 경로입니다.</p>
          </div>
          <div class="form-field">
            <label class="field-label">상태</label>
            <select v-model="formData.status" class="field-select">
              <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </div>
        </div>

        <div class="form-field">
          <label class="field-label">정렬 순서</label>
          <input
            v-model.number="formData.sortOrder"
            type="number"
            class="field-input sort-input"
            placeholder="0"
          />
          <p class="field-hint">숫자가 낮을수록 먼저 표시됩니다.</p>
        </div>
      </div>

      <!-- SEO 설정 -->
      <div class="form-section">
        <h3 class="section-title">
          <i class="mdi mdi-search-web"></i>
          SEO 설정
        </h3>

        <div class="form-field">
          <label class="field-label">메타 설명</label>
          <textarea
            v-model="formData.metaDescription"
            class="field-textarea"
            placeholder="검색 엔진에 표시될 설명 (최대 300자)"
            maxlength="300"
            rows="3"
          ></textarea>
          <p class="field-hint">{{ formData.metaDescription?.length || 0 }} / 300</p>
        </div>

        <div class="form-field">
          <label class="field-label">메타 키워드</label>
          <input
            v-model="formData.metaKeywords"
            type="text"
            class="field-input"
            placeholder="키워드1, 키워드2, 키워드3"
          />
          <p class="field-hint">쉼표로 구분하여 입력하세요.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-form-page {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
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
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-back:hover {
  background: var(--bg-tertiary);
  border-color: #6366f1;
}

.btn-back .mdi {
  font-size: 22px;
  color: var(--text-secondary);
}

.header-info h1 {
  display: flex;
  align-items: center;
  gap: 10px;
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
  padding: 2px 8px;
  background: var(--bg-tertiary);
  border-radius: 4px;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 13px;
  color: #6366f1;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.btn-cancel {
  padding: 12px 24px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-cancel:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.btn-draft {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-draft:hover:not(:disabled) {
  background: var(--bg-tertiary);
  border-color: #6366f1;
}

.btn-draft:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-draft .mdi {
  font-size: 18px;
}

.btn-save {
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

.btn-save:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
}

.btn-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-save .mdi {
  font-size: 18px;
}

/* 폼 컨테이너 */
.form-container {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

/* 폼 섹션 */
.form-section {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 24px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 20px 0;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-color);
}

.section-title .mdi {
  font-size: 20px;
  color: #6366f1;
}

/* 폼 필드 */
.form-field {
  margin-bottom: 20px;
}

.form-field:last-child {
  margin-bottom: 0;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.form-row .form-field {
  margin-bottom: 0;
}

.field-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.field-label.required::after {
  content: ' *';
  color: #ef4444;
}

.field-input,
.field-textarea,
.field-select {
  width: 100%;
  padding: 12px 16px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  font-size: 14px;
  color: var(--text-primary);
  transition: all 0.2s ease;
}

.field-input:focus,
.field-textarea:focus,
.field-select:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.field-input::placeholder,
.field-textarea::placeholder {
  color: var(--text-tertiary);
}

.field-textarea {
  resize: vertical;
  min-height: 100px;
  line-height: 1.6;
}

.field-hint {
  font-size: 12px;
  color: var(--text-tertiary);
  margin-top: 6px;
}

.sort-input {
  max-width: 200px;
}

/* 슬러그 입력 */
.slug-input-wrapper {
  display: flex;
  align-items: center;
}

.slug-prefix {
  padding: 12px 0 12px 16px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-right: none;
  border-radius: 12px 0 0 12px;
  color: var(--text-secondary);
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 14px;
}

.slug-input {
  border-radius: 0 12px 12px 0;
  font-family: 'Monaco', 'Menlo', monospace;
}

/* 반응형 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .header-actions {
    justify-content: stretch;
    flex-wrap: wrap;
  }

  .header-actions button {
    flex: 1;
    justify-content: center;
    min-width: 100px;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .slug-input-wrapper {
    flex-direction: column;
    align-items: stretch;
  }

  .slug-prefix {
    border-radius: 12px 12px 0 0;
    border-right: 1px solid var(--border-color);
    border-bottom: none;
    text-align: center;
  }

  .slug-input {
    border-radius: 0 0 12px 12px;
  }
}
</style>
