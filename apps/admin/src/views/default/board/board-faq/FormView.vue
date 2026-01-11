<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getBoards, getPost, createPost, updatePost } from '@/api/board'
import type { BoardDto, PostDto, PostCreateRequest, PostUpdateRequest, PostStatus } from '@/types/board'
import DOMPurify from 'dompurify'

const route = useRoute()
const router = useRouter()

// 라우트 메타에서 게시판 타입 코드 가져오기 (자동 설정)
const boardType = computed(() => {
  return (route.meta.boardType as string) || 'faq'
})

// 현재 사이트 코드
const currentSiteCode = computed(() => {
  const siteId = route.params.siteId as string
  return siteId || 'main'
})

// 게시글 ID (수정 모드일 경우)
const postId = computed(() => {
  const id = route.params.id as string
  return id ? parseInt(id, 10) : null
})

// 게시판 코드 (query에서 가져오기)
const boardCode = computed(() => {
  return (route.query.boardCode as string) || ''
})

// 수정 모드 여부
const isEditMode = computed(() => postId.value !== null)

// 상태
const boards = ref<BoardDto[]>([])
const selectedBoardCode = ref('')
const isLoading = ref(false)
const isSaving = ref(false)
const currentPost = ref<PostDto | null>(null)

// 폼 데이터
const formData = ref<PostCreateRequest & { status?: PostStatus }>({
  title: '',
  content: '',
  author: '',
  isPinned: false,
  isSecret: false,
  status: 'DRAFT',
})

// 상태 옵션
const statusOptions = [
  { value: 'DRAFT', label: '임시저장', color: '#909399' },
  { value: 'PUBLISHED', label: '발행됨', color: '#67C23A' },
  { value: 'ARCHIVED', label: '보관됨', color: '#E6A23C' },
]

// 선택된 게시판 정보
const selectedBoard = computed(() => {
  return boards.value.find((b) => b.code === selectedBoardCode.value)
})

// 페이지 제목
const pageTitle = computed(() => {
  return isEditMode.value ? 'FAQ 수정' : '새 FAQ 작성'
})

// 게시판 목록 조회 (해당 타입만)
const fetchBoards = async () => {
  try {
    const response = await getBoards(currentSiteCode.value)
    boards.value = response.data.data.filter((b) => b.status === 'ACTIVE' && b.typeCode === boardType.value)

    // query에서 전달받은 boardCode 사용
    if (boardCode.value && boards.value.some(b => b.code === boardCode.value)) {
      selectedBoardCode.value = boardCode.value
    } else if (boards.value.length > 0) {
      selectedBoardCode.value = boards.value[0].code
    }
  } catch (error) {
    ElMessage.error('게시판 목록을 불러오는데 실패했습니다.')
  }
}

// 게시글 정보 로드 (수정 모드)
const fetchPost = async () => {
  if (!postId.value || !selectedBoardCode.value) return

  isLoading.value = true
  try {
    const response = await getPost(currentSiteCode.value, selectedBoardCode.value, postId.value)
    currentPost.value = response.data.data

    // 폼 데이터에 반영
    formData.value = {
      title: currentPost.value.title,
      content: currentPost.value.content || '',
      author: currentPost.value.author || '',
      isPinned: currentPost.value.isPinned,
      isSecret: currentPost.value.isSecret,
      status: currentPost.value.status,
    }
  } catch (error) {
    ElMessage.error('FAQ 정보를 불러오는데 실패했습니다.')
    goBack()
  } finally {
    isLoading.value = false
  }
}

// FAQ 저장
const savePost = async () => {
  if (!formData.value.title?.trim()) {
    ElMessage.warning('질문은 필수입니다.')
    return
  }

  if (!selectedBoardCode.value) {
    ElMessage.warning('게시판을 선택해주세요.')
    return
  }

  isSaving.value = true
  try {
    // XSS 방지: content sanitize
    const sanitizedContent = DOMPurify.sanitize(formData.value.content || '', {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 's', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'pre', 'code', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'hr', 'span', 'div'],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'style', 'target', 'rel'],
      ALLOW_DATA_ATTR: false,
    })

    if (isEditMode.value && postId.value) {
      const updateData: PostUpdateRequest = {
        title: formData.value.title,
        content: sanitizedContent,
        author: formData.value.author,
        isPinned: formData.value.isPinned,
        isSecret: formData.value.isSecret,
        status: formData.value.status,
      }
      await updatePost(currentSiteCode.value, selectedBoardCode.value, postId.value, updateData)
      ElMessage.success('FAQ가 수정되었습니다.')
    } else {
      const createData: PostCreateRequest = {
        ...formData.value,
        content: sanitizedContent,
      }
      await createPost(currentSiteCode.value, selectedBoardCode.value, createData)
      ElMessage.success('FAQ가 생성되었습니다.')
    }
    goBack()
  } catch (error: unknown) {
    const axiosError = error as { response?: { data?: { message?: string } } }
    ElMessage.error(axiosError.response?.data?.message || '저장에 실패했습니다.')
  } finally {
    isSaving.value = false
  }
}

// 목록으로 돌아가기
const goBack = () => {
  // 현재 경로에서 /form 또는 /form/:id 부분 제거
  const currentPath = route.path
  const basePath = currentPath.replace(/\/form(\/\d+)?$/, '')
  router.push(basePath)
}

// 게시판 코드 변경 시 수정 모드에서 게시글 다시 로드
watch(selectedBoardCode, () => {
  if (isEditMode.value && selectedBoardCode.value) {
    fetchPost()
  }
})

onMounted(async () => {
  await fetchBoards()
  if (isEditMode.value) {
    await fetchPost()
  }
})
</script>

<template>
  <div class="post-form-page">
    <!-- 페이지 헤더 -->
    <div class="page-header">
      <div class="header-left">
        <button class="btn-back" @click="goBack">
          <i class="mdi mdi-arrow-left"></i>
        </button>
        <div class="header-info">
          <h1>
            <i class="mdi mdi-help-circle-outline"></i>
            {{ pageTitle }}
          </h1>
          <p v-if="selectedBoard">{{ selectedBoard.name }}</p>
        </div>
      </div>
      <div class="header-actions">
        <button class="btn-cancel" @click="goBack">
          취소
        </button>
        <button class="btn-save" :disabled="isSaving" @click="savePost">
          <i class="mdi" :class="isSaving ? 'mdi-loading mdi-spin' : (isEditMode ? 'mdi-content-save' : 'mdi-plus')"></i>
          {{ isEditMode ? '저장' : '작성' }}
        </button>
      </div>
    </div>

    <!-- 폼 컨텐츠 -->
    <div v-loading="isLoading" class="form-container">
      <!-- 게시판 선택 (수정 모드가 아닐 때만) -->
      <div v-if="!isEditMode && boards.length > 1" class="form-section">
        <h3 class="section-title">
          <i class="mdi mdi-view-dashboard-outline"></i>
          게시판 선택
        </h3>
        <div class="form-field">
          <select v-model="selectedBoardCode" class="field-select full">
            <option value="" disabled>게시판을 선택하세요</option>
            <option v-for="board in boards" :key="board.code" :value="board.code">
              {{ board.name }} ({{ board.code }})
            </option>
          </select>
        </div>
      </div>

      <!-- 기본 정보 -->
      <div class="form-section">
        <h3 class="section-title">
          <i class="mdi mdi-text-box-outline"></i>
          기본 정보
        </h3>

        <div class="form-field">
          <label class="field-label required">질문 (Question)</label>
          <input
            v-model="formData.title"
            type="text"
            class="field-input"
            placeholder="자주 묻는 질문을 입력하세요"
          />
        </div>

        <div class="form-field">
          <label class="field-label">답변 (Answer)</label>
          <textarea
            v-model="formData.content"
            class="field-textarea"
            placeholder="질문에 대한 답변을 입력하세요"
            rows="15"
          ></textarea>
        </div>
      </div>

      <!-- 작성자 및 상태 -->
      <div class="form-section">
        <h3 class="section-title">
          <i class="mdi mdi-account-cog-outline"></i>
          작성자 및 상태
        </h3>

        <div class="form-row">
          <div class="form-field">
            <label class="field-label">작성자</label>
            <input
              v-model="formData.author"
              type="text"
              class="field-input"
              placeholder="작성자명"
            />
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
      </div>

      <!-- 옵션 (게시판에서 활성화된 기능만 표시) -->
      <div v-if="selectedBoard?.usePinned || selectedBoard?.useSecret" class="form-section">
        <h3 class="section-title">
          <i class="mdi mdi-cog-outline"></i>
          옵션
        </h3>

        <div class="feature-options">
          <label v-if="selectedBoard?.usePinned" class="toggle-option">
            <input v-model="formData.isPinned" type="checkbox" class="toggle-checkbox" />
            <span class="toggle-switch"></span>
            <span class="toggle-label">
              <i class="mdi mdi-pin"></i>
              상단 고정
            </span>
            <span class="toggle-desc">이 FAQ를 목록 상단에 고정합니다.</span>
          </label>

          <label v-if="selectedBoard?.useSecret" class="toggle-option">
            <input v-model="formData.isSecret" type="checkbox" class="toggle-checkbox" />
            <span class="toggle-switch"></span>
            <span class="toggle-label">
              <i class="mdi mdi-lock-outline"></i>
              비밀글
            </span>
            <span class="toggle-desc">비밀글로 설정합니다.</span>
          </label>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.post-form-page {
  width: 100%;
  max-width: 900px;
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
  border-color: #f59e0b;
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
  color: #f59e0b;
}

.header-info p {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
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

.btn-save {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}

.btn-save:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(245, 158, 11, 0.4);
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
  color: #f59e0b;
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
  border-color: #f59e0b;
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
}

.field-input::placeholder,
.field-textarea::placeholder {
  color: var(--text-tertiary);
}

.field-textarea {
  resize: vertical;
  min-height: 300px;
  line-height: 1.6;
}

.field-select.full {
  max-width: 400px;
}

/* 옵션 토글 */
.feature-options {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.toggle-option {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  cursor: pointer;
  padding: 16px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  transition: all 0.2s ease;
}

.toggle-option:hover {
  border-color: #f59e0b;
}

.toggle-checkbox {
  display: none;
}

.toggle-switch {
  width: 48px;
  height: 26px;
  background: var(--bg-tertiary);
  border-radius: 13px;
  position: relative;
  transition: all 0.2s ease;
  flex-shrink: 0;
  margin-top: 2px;
}

.toggle-switch::after {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.toggle-checkbox:checked + .toggle-switch {
  background: #f59e0b;
}

.toggle-checkbox:checked + .toggle-switch::after {
  left: 25px;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.toggle-label .mdi {
  font-size: 20px;
  color: var(--text-secondary);
}

.toggle-desc {
  font-size: 13px;
  color: var(--text-tertiary);
  margin-left: auto;
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
  }

  .header-actions button {
    flex: 1;
    justify-content: center;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .toggle-option {
    flex-wrap: wrap;
  }

  .toggle-desc {
    width: 100%;
    margin-left: 62px;
    margin-top: 4px;
  }
}
</style>
