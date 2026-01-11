<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getBoards, getPost, deletePost, answerPost } from '@/api/board'
import type { BoardDto, PostDto, PostStatus } from '@/types/board'
import DOMPurify from 'dompurify'
import CommentSection from '@/components/comment/CommentSection.vue'

const route = useRoute()
const router = useRouter()

// 라우트 메타에서 게시판 타입 코드 가져오기 (자동 설정)
const boardType = computed(() => {
  return (route.meta.boardType as string) || 'qna'
})

// 현재 사이트 코드
const currentSiteCode = computed(() => {
  const siteId = route.params.siteId as string
  return siteId || 'main'
})

// 게시글 ID
const postId = computed(() => {
  const id = route.params.id as string
  return id ? parseInt(id, 10) : null
})

// 게시판 코드 (query에서 가져오기)
const boardCode = computed(() => {
  return (route.query.boardCode as string) || ''
})

// 상태
const boards = ref<BoardDto[]>([])
const selectedBoardCode = ref('')
const post = ref<PostDto | null>(null)
const isLoading = ref(false)
const isSavingAnswer = ref(false)

// 답변 데이터
const answerData = ref('')

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

// 상태 정보 가져오기
const getStatusInfo = (status: PostStatus) => {
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

// HTML 콘텐츠 sanitize (XSS 방지)
const sanitizeHtml = (html: string | null | undefined): string => {
  if (!html) return '내용이 없습니다.'
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 's', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'pre', 'code', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'hr', 'span', 'div'],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'style', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
  })
}

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

// 게시글 정보 로드
const fetchPost = async () => {
  if (!postId.value || !selectedBoardCode.value) return

  isLoading.value = true
  try {
    const response = await getPost(currentSiteCode.value, selectedBoardCode.value, postId.value)
    post.value = response.data.data
    answerData.value = post.value.answer || ''
  } catch (error) {
    ElMessage.error('Q&A 정보를 불러오는데 실패했습니다.')
    goBack()
  } finally {
    isLoading.value = false
  }
}

// 답변 저장
const saveAnswer = async () => {
  if (!post.value) return

  isSavingAnswer.value = true
  try {
    await answerPost(currentSiteCode.value, selectedBoardCode.value, post.value.id, {
      answer: answerData.value,
    })
    ElMessage.success('답변이 저장되었습니다.')
    // 게시글 다시 로드하여 hasAnswer 상태 업데이트
    await fetchPost()
  } catch (error) {
    ElMessage.error('답변 저장에 실패했습니다.')
  } finally {
    isSavingAnswer.value = false
  }
}

// 목록으로 돌아가기
const goBack = () => {
  // 현재 경로에서 /:id 부분 제거
  const currentPath = route.path
  const basePath = currentPath.replace(/\/\d+$/, '')
  router.push(basePath)
}

// 수정 페이지로 이동
const goToEdit = () => {
  if (!postId.value) return
  const currentPath = route.path
  const basePath = currentPath.replace(/\/\d+$/, '')
  router.push({
    path: `${basePath}/form/${postId.value}`,
    query: { boardCode: selectedBoardCode.value }
  })
}

// 게시글 삭제
const handleDelete = async () => {
  if (!post.value) return

  try {
    await ElMessageBox.confirm(
      `'${post.value.title}' Q&A를 삭제하시겠습니까?`,
      'Q&A 삭제',
      {
        confirmButtonText: '삭제',
        cancelButtonText: '취소',
        type: 'warning',
      },
    )

    await deletePost(currentSiteCode.value, selectedBoardCode.value, post.value.id)
    ElMessage.success('Q&A가 삭제되었습니다.')
    goBack()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('삭제에 실패했습니다.')
    }
  }
}

onMounted(async () => {
  await fetchBoards()
  await fetchPost()
})
</script>

<template>
  <div class="post-detail-page">
    <!-- 페이지 헤더 -->
    <div class="page-header">
      <div class="header-left">
        <button class="btn-back" @click="goBack">
          <i class="mdi mdi-arrow-left"></i>
        </button>
        <div class="header-info">
          <h1>
            <i class="mdi mdi-message-question-outline"></i>
            Q&A 상세
          </h1>
          <p v-if="selectedBoard">{{ selectedBoard.name }}</p>
        </div>
      </div>
      <div class="header-actions">
        <button class="btn-edit" @click="goToEdit">
          <i class="mdi mdi-pencil-outline"></i>
          수정
        </button>
        <button class="btn-delete" @click="handleDelete">
          <i class="mdi mdi-trash-can-outline"></i>
          삭제
        </button>
      </div>
    </div>

    <!-- 게시글 상세 -->
    <div v-loading="isLoading" class="detail-container">
      <template v-if="post">
        <!-- 게시글 정보 헤더 -->
        <div class="post-header">
          <div class="post-badges">
            <span v-if="post.hasAnswer" class="badge answered">
              <i class="mdi mdi-check-circle"></i> 답변 완료
            </span>
            <span v-else class="badge waiting">
              <i class="mdi mdi-clock-outline"></i> 답변 대기
            </span>
            <span v-if="post.isSecret" class="badge secret">
              <i class="mdi mdi-lock"></i> 비밀글
            </span>
            <span class="status-badge" :class="post.status.toLowerCase()">
              {{ getStatusInfo(post.status).label }}
            </span>
          </div>

          <h2 class="post-title">{{ post.title }}</h2>

          <div class="post-meta">
            <div class="meta-item">
              <i class="mdi mdi-account-outline"></i>
              <span>{{ post.author || '익명' }}</span>
            </div>
            <div class="meta-item">
              <i class="mdi mdi-eye-outline"></i>
              <span>조회수 {{ post.viewCount }}</span>
            </div>
            <div class="meta-item">
              <i class="mdi mdi-calendar-outline"></i>
              <span>{{ formatDate(post.createdAt) }}</span>
            </div>
            <div v-if="post.updatedAt && post.updatedAt !== post.createdAt" class="meta-item">
              <i class="mdi mdi-update"></i>
              <span>수정일 {{ formatDate(post.updatedAt) }}</span>
            </div>
          </div>
        </div>

        <!-- 질문 내용 -->
        <div class="question-section">
          <div class="section-header">
            <span class="section-label question">Q</span>
            <span class="section-title">질문</span>
          </div>
          <div class="content-body" v-html="sanitizeHtml(post.content)" />
        </div>

        <!-- 답변 영역 -->
        <div class="answer-section">
          <div class="section-header">
            <span class="section-label answer">A</span>
            <span class="section-title">답변</span>
            <span v-if="post.hasAnswer" class="answered-badge">
              <i class="mdi mdi-check"></i> 답변 완료
            </span>
            <span v-else class="waiting-badge">
              <i class="mdi mdi-clock-outline"></i> 답변 대기
            </span>
          </div>
          <textarea
            v-model="answerData"
            class="answer-textarea"
            placeholder="답변을 입력하세요..."
            rows="8"
          ></textarea>
          <div class="answer-actions">
            <button class="btn-save-answer" :disabled="isSavingAnswer" @click="saveAnswer">
              <i class="mdi" :class="isSavingAnswer ? 'mdi-loading mdi-spin' : 'mdi-send'"></i>
              답변 저장
            </button>
          </div>
        </div>

        <!-- 하단 액션 -->
        <div class="post-actions">
          <button class="btn-list" @click="goBack">
            <i class="mdi mdi-format-list-bulleted"></i>
            목록으로
          </button>
          <div class="action-right">
            <button class="btn-edit-secondary" @click="goToEdit">
              <i class="mdi mdi-pencil-outline"></i>
              수정
            </button>
            <button class="btn-delete-secondary" @click="handleDelete">
              <i class="mdi mdi-trash-can-outline"></i>
              삭제
            </button>
          </div>
        </div>
      </template>
    </div>

    <!-- 댓글 섹션 (게시판에서 댓글 기능이 활성화된 경우에만 표시) -->
    <div v-if="postId && selectedBoardCode && selectedBoard?.useComment" class="comment-section-wrapper">
      <div class="section-divider">
        <span class="divider-text">댓글 영역</span>
      </div>
      <CommentSection
        :site-code="currentSiteCode"
        :board-code="selectedBoardCode"
        :article-id="postId"
      />
    </div>
  </div>
</template>

<style scoped>
.post-detail-page {
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
  border-color: #06b6d4;
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
  color: #06b6d4;
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

.btn-edit {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  color: #06b6d4;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-edit:hover {
  background: rgba(6, 182, 212, 0.1);
  border-color: #06b6d4;
}

.btn-edit .mdi {
  font-size: 18px;
}

.btn-delete {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  color: #ef4444;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-delete:hover {
  background: rgba(239, 68, 68, 0.1);
  border-color: #ef4444;
}

.btn-delete .mdi {
  font-size: 18px;
}

/* 상세 컨테이너 */
.detail-container {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  overflow: hidden;
}

/* 게시글 헤더 */
.post-header {
  padding: 32px;
  border-bottom: 1px solid var(--border-color);
}

.post-badges {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
}

.badge .mdi {
  font-size: 16px;
}

.badge.answered {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.badge.waiting {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}

.badge.secret {
  background: rgba(107, 114, 128, 0.1);
  color: #6b7280;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 13px;
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

.post-title {
  font-size: 26px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 20px 0;
  line-height: 1.4;
}

.post-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: var(--text-secondary);
}

.meta-item .mdi {
  font-size: 18px;
  color: var(--text-tertiary);
}

/* 질문 섹션 */
.question-section {
  padding: 32px;
  border-bottom: 1px solid var(--border-color);
}

.section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.section-label {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 700;
}

.section-label.question {
  background: linear-gradient(135deg, #06b6d4 0%, #22d3ee 100%);
  color: white;
}

.section-label.answer {
  background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
  color: white;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.content-body {
  min-height: 100px;
  line-height: 1.8;
  font-size: 15px;
  color: var(--text-primary);
}

.content-body :deep(p) {
  margin: 0 0 16px 0;
}

.content-body :deep(h1),
.content-body :deep(h2),
.content-body :deep(h3),
.content-body :deep(h4),
.content-body :deep(h5),
.content-body :deep(h6) {
  margin: 24px 0 12px 0;
  color: var(--text-primary);
}

.content-body :deep(ul),
.content-body :deep(ol) {
  margin: 16px 0;
  padding-left: 24px;
}

.content-body :deep(li) {
  margin: 8px 0;
}

.content-body :deep(blockquote) {
  margin: 16px 0;
  padding: 16px 20px;
  background: var(--bg-tertiary);
  border-left: 4px solid #06b6d4;
  border-radius: 8px;
}

.content-body :deep(pre) {
  margin: 16px 0;
  padding: 16px;
  background: var(--bg-tertiary);
  border-radius: 8px;
  overflow-x: auto;
}

.content-body :deep(code) {
  padding: 2px 6px;
  background: var(--bg-tertiary);
  border-radius: 4px;
  font-family: monospace;
  font-size: 14px;
}

.content-body :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
}

.content-body :deep(a) {
  color: #06b6d4;
  text-decoration: none;
}

.content-body :deep(a:hover) {
  text-decoration: underline;
}

.content-body :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 16px 0;
}

.content-body :deep(th),
.content-body :deep(td) {
  padding: 12px;
  border: 1px solid var(--border-color);
  text-align: left;
}

.content-body :deep(th) {
  background: var(--bg-tertiary);
  font-weight: 600;
}

/* 답변 섹션 */
.answer-section {
  padding: 32px;
  background: var(--bg-primary);
}

.answered-badge,
.waiting-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  margin-left: auto;
}

.answered-badge {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.waiting-badge {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}

.answer-textarea {
  width: 100%;
  padding: 16px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  font-size: 14px;
  color: var(--text-primary);
  resize: vertical;
  min-height: 200px;
  line-height: 1.6;
  transition: all 0.2s ease;
}

.answer-textarea:focus {
  outline: none;
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}

.answer-textarea::placeholder {
  color: var(--text-tertiary);
}

.answer-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.btn-save-answer {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.btn-save-answer:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
}

.btn-save-answer:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-save-answer .mdi {
  font-size: 18px;
}

/* 하단 액션 */
.post-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 32px;
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-color);
}

.action-right {
  display: flex;
  gap: 12px;
}

.btn-list {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-list:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.btn-list .mdi {
  font-size: 18px;
}

.btn-edit-secondary {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  background: transparent;
  border: 1px solid #06b6d4;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  color: #06b6d4;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-edit-secondary:hover {
  background: rgba(6, 182, 212, 0.1);
}

.btn-edit-secondary .mdi {
  font-size: 16px;
}

.btn-delete-secondary {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  background: transparent;
  border: 1px solid #ef4444;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  color: #ef4444;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-delete-secondary:hover {
  background: rgba(239, 68, 68, 0.1);
}

.btn-delete-secondary .mdi {
  font-size: 16px;
}

/* 댓글 섹션 래퍼 */
.comment-section-wrapper {
  margin-top: 32px;
}

.section-divider {
  display: flex;
  align-items: center;
  margin-bottom: 24px;
}

.section-divider::before,
.section-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: linear-gradient(to right, transparent, var(--border-color), transparent);
}

.divider-text {
  padding: 0 20px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 1px;
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

  .post-header {
    padding: 24px;
  }

  .post-title {
    font-size: 22px;
  }

  .post-meta {
    gap: 12px;
  }

  .question-section,
  .answer-section {
    padding: 24px;
  }

  .post-actions {
    flex-direction: column;
    gap: 16px;
    padding: 20px 24px;
  }

  .btn-list {
    width: 100%;
    justify-content: center;
  }

  .action-right {
    width: 100%;
  }

  .action-right button {
    flex: 1;
    justify-content: center;
  }
}
</style>
