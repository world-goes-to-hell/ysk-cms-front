<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getPost, createPost, updatePost, getBoard } from '@/api/board'
import type { PostDto, PostCreateRequest, PostUpdateRequest, PostStatus, BoardDto } from '@/types/board'

const route = useRoute()
const router = useRouter()

// 라우트 파라미터
const currentSiteCode = computed(() => {
  const siteId = route.params.siteId as string
  return siteId || 'main'
})
const boardCode = computed(() => route.params.boardCode as string)
const articleId = computed(() => {
  const id = route.params.id as string
  return id ? Number(id) : null
})

// 수정 모드 여부
const isEditing = computed(() => articleId.value !== null)

// 상태
const board = ref<BoardDto | null>(null)
const article = ref<PostDto | null>(null)
const isLoading = ref(false)
const isSaving = ref(false)

// 폼 데이터
const formData = ref<PostCreateRequest & { status: PostStatus }>({
  title: '',
  content: '',
  author: '',
  isPinned: false,
  isSecret: false,
  status: 'DRAFT',
})

// 상태 옵션
const statusOptions = [
  { value: 'DRAFT', label: '임시저장', description: '작성 중인 게시글입니다.' },
  { value: 'PUBLISHED', label: '발행', description: '즉시 공개됩니다.' },
  { value: 'ARCHIVED', label: '보관', description: '목록에서 숨김 처리됩니다.' },
]

// 게시판 정보 조회
const fetchBoard = async () => {
  if (!boardCode.value) return

  try {
    const response = await getBoard(currentSiteCode.value, boardCode.value)
    board.value = response.data.data
  } catch (error) {
    ElMessage.error('게시판 정보를 불러오는데 실패했습니다.')
  }
}

// 게시글 상세 조회 (수정 모드)
const fetchArticle = async () => {
  if (!boardCode.value || !articleId.value) return

  isLoading.value = true
  try {
    const response = await getPost(
      currentSiteCode.value,
      boardCode.value,
      articleId.value,
    )
    article.value = response.data.data

    // 폼 데이터에 기존 값 설정
    formData.value = {
      title: article.value.title,
      content: article.value.content || '',
      author: article.value.author || '',
      isPinned: article.value.isPinned,
      isSecret: article.value.isSecret,
      status: article.value.status,
    }
  } catch (error) {
    ElMessage.error('게시글을 불러오는데 실패했습니다.')
    router.back()
  } finally {
    isLoading.value = false
  }
}

// 저장
const handleSave = async (saveStatus?: PostStatus) => {
  if (!formData.value.title.trim()) {
    ElMessage.warning('제목을 입력해주세요.')
    return
  }

  isSaving.value = true

  try {
    const submitData = {
      ...formData.value,
      status: saveStatus || formData.value.status,
    }

    if (isEditing.value && articleId.value) {
      // 수정
      const updateData: PostUpdateRequest = submitData
      await updatePost(currentSiteCode.value, boardCode.value, articleId.value, updateData)
      ElMessage.success('게시글이 수정되었습니다.')
    } else {
      // 생성
      await createPost(currentSiteCode.value, boardCode.value, submitData)
      ElMessage.success('게시글이 작성되었습니다.')
    }

    // 목록으로 이동
    goToList()
  } catch (error: unknown) {
    const axiosError = error as { response?: { data?: { message?: string } } }
    ElMessage.error(axiosError.response?.data?.message || '저장에 실패했습니다.')
  } finally {
    isSaving.value = false
  }
}

// 임시저장
const handleSaveDraft = () => {
  handleSave('DRAFT')
}

// 발행
const handlePublish = () => {
  handleSave('PUBLISHED')
}

// 목록으로 이동
const goToList = () => {
  router.push({
    path: `/boards/${boardCode.value}`,
  })
}

// 취소
const handleCancel = () => {
  if (isEditing.value && articleId.value) {
    router.push({
      path: `/boards/${boardCode.value}/${articleId.value}`,
    })
  } else {
    goToList()
  }
}

// 초기화
onMounted(async () => {
  await fetchBoard()
  if (isEditing.value) {
    await fetchArticle()
  }
})

// boardCode 변경 감지
watch(boardCode, () => {
  fetchBoard()
})
</script>

<template>
  <div class="article-form-page">
    <!-- 로딩 -->
    <div v-if="isLoading" v-loading="true" class="loading-container" />

    <template v-else>
      <!-- 페이지 헤더 -->
      <div class="page-header">
        <div class="header-left">
          <button class="btn-back" @click="handleCancel">
            <i class="mdi mdi-arrow-left"></i>
            뒤로
          </button>
          <div class="page-title">
            <h1>{{ isEditing ? '게시글 수정' : '새 게시글 작성' }}</h1>
            <span v-if="board" class="board-name">{{ board.name }}</span>
          </div>
        </div>
        <div class="header-actions">
          <button class="btn-draft" :disabled="isSaving" @click="handleSaveDraft">
            <i class="mdi mdi-content-save-outline"></i>
            임시저장
          </button>
          <button class="btn-publish" :disabled="isSaving" @click="handlePublish">
            <i class="mdi mdi-send-outline"></i>
            {{ isEditing ? '저장 및 발행' : '발행하기' }}
          </button>
        </div>
      </div>

      <!-- 폼 컨테이너 -->
      <div class="form-container">
        <!-- 제목 -->
        <div class="form-section title-section">
          <input
            v-model="formData.title"
            type="text"
            class="title-input"
            placeholder="제목을 입력하세요"
            maxlength="300"
          />
          <span class="title-count">{{ formData.title.length }}/300</span>
        </div>

        <!-- 본문 -->
        <div class="form-section content-section">
          <textarea
            v-model="formData.content"
            class="content-textarea"
            placeholder="내용을 입력하세요..."
          ></textarea>
        </div>

        <!-- 옵션 패널 -->
        <div class="options-panel">
          <div class="options-header">
            <i class="mdi mdi-cog-outline"></i>
            게시 옵션
          </div>

          <div class="options-content">
            <!-- 작성자 -->
            <div class="option-item">
              <label class="option-label">
                <i class="mdi mdi-account-outline"></i>
                작성자
              </label>
              <input
                v-model="formData.author"
                type="text"
                class="option-input"
                placeholder="작성자명 (선택)"
                maxlength="50"
              />
            </div>

            <!-- 상태 -->
            <div class="option-item">
              <label class="option-label">
                <i class="mdi mdi-tag-outline"></i>
                상태
              </label>
              <div class="status-options">
                <label
                  v-for="opt in statusOptions"
                  :key="opt.value"
                  class="status-option"
                  :class="{ selected: formData.status === opt.value }"
                >
                  <input
                    v-model="formData.status"
                    type="radio"
                    :value="opt.value"
                    class="status-radio"
                  />
                  <span class="status-label">{{ opt.label }}</span>
                </label>
              </div>
            </div>

            <!-- 토글 옵션들 -->
            <div class="option-item toggles">
              <label class="toggle-option">
                <input
                  v-model="formData.isPinned"
                  type="checkbox"
                  class="toggle-checkbox"
                />
                <span class="toggle-switch"></span>
                <span class="toggle-label">
                  <i class="mdi mdi-pin"></i>
                  상단 고정
                </span>
              </label>

              <label class="toggle-option">
                <input
                  v-model="formData.isSecret"
                  type="checkbox"
                  class="toggle-checkbox"
                />
                <span class="toggle-switch"></span>
                <span class="toggle-label">
                  <i class="mdi mdi-lock-outline"></i>
                  비밀글
                </span>
              </label>
            </div>
          </div>
        </div>

        <!-- 하단 버튼 -->
        <div class="form-footer">
          <button class="btn-cancel" :disabled="isSaving" @click="handleCancel">
            취소
          </button>
          <div class="footer-right">
            <button class="btn-save-draft" :disabled="isSaving" @click="handleSaveDraft">
              <i class="mdi mdi-content-save-outline"></i>
              임시저장
            </button>
            <button class="btn-save-publish" :disabled="isSaving" @click="handlePublish">
              <i class="mdi mdi-send-outline"></i>
              {{ isEditing ? '저장' : '발행' }}
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.article-form-page {
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
}

.loading-container {
  min-height: 400px;
}

/* 페이지 헤더 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.btn-back {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  font-size: 14px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-back:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.btn-back .mdi {
  font-size: 18px;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-title h1 {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.board-name {
  font-size: 13px;
  font-weight: 600;
  padding: 4px 10px;
  background: rgba(99, 102, 241, 0.1);
  border-radius: 6px;
  color: #6366f1;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.btn-draft {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-draft:hover:not(:disabled) {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.btn-draft:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-publish {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-publish:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.btn-publish:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 폼 컨테이너 */
.form-container {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  overflow: hidden;
}

/* 제목 섹션 */
.title-section {
  padding: 24px 32px;
  border-bottom: 1px solid var(--border-color);
  position: relative;
}

.title-input {
  width: 100%;
  padding: 0;
  border: none;
  background: transparent;
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  outline: none;
}

.title-input::placeholder {
  color: var(--text-tertiary);
}

.title-count {
  position: absolute;
  right: 32px;
  bottom: 8px;
  font-size: 12px;
  color: var(--text-tertiary);
}

/* 본문 섹션 */
.content-section {
  padding: 0;
}

.content-textarea {
  width: 100%;
  min-height: 400px;
  padding: 24px 32px;
  border: none;
  background: transparent;
  font-size: 16px;
  line-height: 1.8;
  color: var(--text-primary);
  resize: vertical;
  outline: none;
}

.content-textarea::placeholder {
  color: var(--text-tertiary);
}

/* 옵션 패널 */
.options-panel {
  border-top: 1px solid var(--border-color);
  background: var(--bg-tertiary);
}

.options-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 32px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-color);
}

.options-header .mdi {
  font-size: 18px;
  color: #6366f1;
}

.options-content {
  padding: 20px 32px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.option-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.option-label {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 100px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  padding-top: 8px;
}

.option-label .mdi {
  font-size: 18px;
}

.option-input {
  flex: 1;
  max-width: 300px;
  padding: 10px 14px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  font-size: 14px;
  color: var(--text-primary);
  transition: all 0.2s ease;
}

.option-input:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

/* 상태 옵션 */
.status-options {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.status-option {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.status-option:hover {
  border-color: #6366f1;
}

.status-option.selected {
  background: rgba(99, 102, 241, 0.1);
  border-color: #6366f1;
}

.status-radio {
  display: none;
}

.status-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.status-option.selected .status-label {
  color: #6366f1;
}

/* 토글 옵션 */
.option-item.toggles {
  flex-wrap: wrap;
  gap: 24px;
  padding-top: 8px;
}

.toggle-option {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.toggle-checkbox {
  display: none;
}

.toggle-switch {
  width: 44px;
  height: 24px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  position: relative;
  transition: all 0.2s ease;
}

.toggle-switch::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 18px;
  height: 18px;
  background: white;
  border-radius: 50%;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.toggle-checkbox:checked + .toggle-switch {
  background: #6366f1;
  border-color: #6366f1;
}

.toggle-checkbox:checked + .toggle-switch::after {
  left: 22px;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: var(--text-primary);
}

.toggle-label .mdi {
  font-size: 18px;
  color: var(--text-secondary);
}

/* 폼 하단 */
.form-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 32px;
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-color);
}

.btn-cancel {
  padding: 12px 24px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-cancel:hover:not(:disabled) {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.btn-cancel:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.footer-right {
  display: flex;
  gap: 8px;
}

.btn-save-draft {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 24px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-save-draft:hover:not(:disabled) {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.btn-save-draft:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-save-draft .mdi {
  font-size: 18px;
}

.btn-save-publish {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 24px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-save-publish:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.btn-save-publish:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-save-publish .mdi {
  font-size: 18px;
}

/* 반응형 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .header-left {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .page-title {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .header-actions {
    flex-wrap: wrap;
  }

  .title-section {
    padding: 20px;
  }

  .title-input {
    font-size: 20px;
  }

  .content-textarea {
    padding: 20px;
    min-height: 300px;
  }

  .options-header {
    padding: 16px 20px;
  }

  .options-content {
    padding: 16px 20px;
  }

  .option-item {
    flex-direction: column;
    gap: 8px;
  }

  .option-label {
    padding-top: 0;
  }

  .option-input {
    max-width: none;
    width: 100%;
  }

  .form-footer {
    flex-direction: column;
    gap: 12px;
    padding: 16px 20px;
  }

  .btn-cancel {
    width: 100%;
    justify-content: center;
  }

  .footer-right {
    width: 100%;
    flex-direction: column;
  }

  .btn-save-draft,
  .btn-save-publish {
    width: 100%;
    justify-content: center;
  }
}
</style>
