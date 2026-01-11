<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getCommentsPaged, createComment, updateComment, deleteComment } from '@/api/comment'
import type { CommentDto, CommentCreateRequest, CommentUpdateRequest } from '@/types/comment'
import CommentItem from './CommentItem.vue'

const props = defineProps<{
  siteCode: string
  boardCode: string
  articleId: number
  maxDepth?: number
  pageSize?: number
}>()

// 상태
const comments = ref<CommentDto[]>([])
const isLoading = ref(false)
const newComment = ref('')

// 페이징 상태
const currentPage = ref(1)
const totalElements = ref(0)
const totalPages = ref(0)
const pageSizeValue = props.pageSize ?? 10

// 최대 깊이 (기본값 10)
const maxDepthValue = props.maxDepth ?? 10

// 댓글 목록 조회 (페이징)
const fetchComments = async () => {
  isLoading.value = true
  try {
    const response = await getCommentsPaged(
      props.siteCode,
      props.boardCode,
      props.articleId,
      {
        page: currentPage.value - 1, // 백엔드는 0부터 시작
        size: pageSizeValue
      }
    )
    const pageData = response.data.data
    comments.value = pageData.content
    totalElements.value = pageData.totalElements
    totalPages.value = pageData.totalPages
  } catch {
    ElMessage.error('댓글을 불러오는데 실패했습니다.')
  } finally {
    isLoading.value = false
  }
}

// 페이지 변경
const handlePageChange = (page: number) => {
  currentPage.value = page
  fetchComments()
}

// 새 댓글 작성
const handleSubmit = async () => {
  if (!newComment.value.trim()) {
    ElMessage.warning('댓글 내용을 입력해주세요.')
    return
  }

  try {
    const request: CommentCreateRequest = {
      content: newComment.value.trim(),
    }
    await createComment(props.siteCode, props.boardCode, props.articleId, request)
    ElMessage.success('댓글이 등록되었습니다.')
    newComment.value = ''
    // 새 댓글 등록 후 첫 페이지로 이동
    currentPage.value = 1
    await fetchComments()
  } catch {
    ElMessage.error('댓글 등록에 실패했습니다.')
  }
}

// 답글 작성 (자식 컴포넌트에서 emit)
const handleReply = async (parentId: number, content: string) => {
  try {
    const request: CommentCreateRequest = {
      parentId,
      content,
    }
    await createComment(props.siteCode, props.boardCode, props.articleId, request)
    ElMessage.success('답글이 등록되었습니다.')
    await fetchComments()
  } catch {
    ElMessage.error('답글 등록에 실패했습니다.')
  }
}

// 댓글 수정 (자식 컴포넌트에서 emit)
const handleUpdate = async (commentId: number, content: string) => {
  try {
    const request: CommentUpdateRequest = {
      content,
    }
    await updateComment(props.siteCode, props.boardCode, props.articleId, commentId, request)
    ElMessage.success('댓글이 수정되었습니다.')
    await fetchComments()
  } catch {
    ElMessage.error('댓글 수정에 실패했습니다.')
  }
}

// 댓글 삭제 (자식 컴포넌트에서 emit)
const handleDelete = async (commentId: number) => {
  try {
    await ElMessageBox.confirm(
      '이 댓글을 삭제하시겠습니까?',
      '댓글 삭제',
      {
        confirmButtonText: '삭제',
        cancelButtonText: '취소',
        type: 'warning',
      }
    )

    await deleteComment(props.siteCode, props.boardCode, props.articleId, commentId)
    ElMessage.success('댓글이 삭제되었습니다.')
    await fetchComments()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('댓글 삭제에 실패했습니다.')
    }
  }
}

// 페이지 번호 배열 생성
const pageNumbers = computed(() => {
  const pages: number[] = []
  const maxVisible = 5
  let start = Math.max(1, currentPage.value - Math.floor(maxVisible / 2))
  let end = Math.min(totalPages.value, start + maxVisible - 1)

  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1)
  }

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  return pages
})

onMounted(() => {
  fetchComments()
})
</script>

<template>
  <div class="comment-section">
    <!-- 헤더 -->
    <div class="section-header">
      <div class="header-title">
        <i class="mdi mdi-comment-text-multiple-outline"></i>
        <span>댓글</span>
        <span class="count-badge">{{ totalElements }}</span>
      </div>
    </div>

    <!-- 댓글 작성 폼 -->
    <div class="compose-area">
      <div class="compose-avatar">
        <i class="mdi mdi-account"></i>
      </div>
      <div class="compose-input-wrapper">
        <textarea
          v-model="newComment"
          placeholder="댓글을 남겨보세요..."
          rows="2"
          class="compose-textarea"
          @keydown.ctrl.enter="handleSubmit"
        ></textarea>
        <div class="compose-footer">
          <span class="compose-hint">Ctrl + Enter로 등록</span>
          <button class="btn-compose" :disabled="!newComment.trim()" @click="handleSubmit">
            <i class="mdi mdi-send"></i>
            등록
          </button>
        </div>
      </div>
    </div>

    <!-- 댓글 목록 -->
    <div v-loading="isLoading" class="comments-list">
      <template v-if="comments.length > 0">
        <CommentItem
          v-for="comment in comments"
          :key="comment.id"
          :comment="comment"
          :max-depth="maxDepthValue"
          @reply="handleReply"
          @update="handleUpdate"
          @delete="handleDelete"
        />
      </template>

      <!-- 댓글 없음 -->
      <div v-else-if="!isLoading" class="empty-state">
        <div class="empty-icon">
          <i class="mdi mdi-comment-outline"></i>
        </div>
        <p class="empty-text">아직 댓글이 없습니다</p>
        <p class="empty-subtext">첫 번째 댓글을 남겨보세요!</p>
      </div>
    </div>

    <!-- 페이징 -->
    <div v-if="totalPages > 1" class="pagination-bar">
      <div class="pagination-info">
        <span>{{ totalElements }}개 중 {{ (currentPage - 1) * pageSizeValue + 1 }}-{{ Math.min(currentPage * pageSizeValue, totalElements) }}</span>
      </div>
      <div class="pagination-controls">
        <button
          class="page-btn nav"
          :disabled="currentPage === 1"
          @click="handlePageChange(1)"
          title="처음"
        >
          <i class="mdi mdi-chevron-double-left"></i>
        </button>
        <button
          class="page-btn nav"
          :disabled="currentPage === 1"
          @click="handlePageChange(currentPage - 1)"
          title="이전"
        >
          <i class="mdi mdi-chevron-left"></i>
        </button>

        <button
          v-for="page in pageNumbers"
          :key="page"
          class="page-btn"
          :class="{ active: page === currentPage }"
          @click="handlePageChange(page)"
        >
          {{ page }}
        </button>

        <button
          class="page-btn nav"
          :disabled="currentPage === totalPages"
          @click="handlePageChange(currentPage + 1)"
          title="다음"
        >
          <i class="mdi mdi-chevron-right"></i>
        </button>
        <button
          class="page-btn nav"
          :disabled="currentPage === totalPages"
          @click="handlePageChange(totalPages)"
          title="마지막"
        >
          <i class="mdi mdi-chevron-double-right"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.comment-section {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  overflow: hidden;
}

/* 헤더 */
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-primary);
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.header-title .mdi {
  font-size: 20px;
  color: #f59e0b;
}

.count-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  background: #f59e0b;
  border-radius: 11px;
  font-size: 12px;
  font-weight: 600;
  color: white;
}

/* 댓글 작성 영역 */
.compose-area {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-primary);
}

.compose-avatar {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  background: #f59e0b;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.compose-avatar .mdi {
  font-size: 18px;
}

.compose-input-wrapper {
  flex: 1;
}

.compose-textarea {
  width: 100%;
  padding: 12px 14px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  font-size: 14px;
  font-family: inherit;
  color: var(--text-primary);
  resize: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.compose-textarea:focus {
  outline: none;
  border-color: #f59e0b;
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
}

.compose-textarea::placeholder {
  color: var(--text-tertiary);
}

.compose-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 10px;
}

.compose-hint {
  font-size: 11px;
  color: var(--text-tertiary);
}

.btn-compose {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: #f59e0b;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: white;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-compose:hover:not(:disabled) {
  background: #d97706;
}

.btn-compose:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-compose .mdi {
  font-size: 16px;
}

/* 댓글 목록 */
.comments-list {
  min-height: 100px;
}

/* 댓글 없음 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 20px;
  text-align: center;
}

.empty-icon {
  width: 64px;
  height: 64px;
  background: var(--bg-tertiary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.empty-icon .mdi {
  font-size: 28px;
  color: var(--text-tertiary);
}

.empty-text {
  margin: 0 0 4px 0;
  font-size: 15px;
  font-weight: 500;
  color: var(--text-secondary);
}

.empty-subtext {
  margin: 0;
  font-size: 13px;
  color: var(--text-tertiary);
}

/* 페이징 */
.pagination-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  border-top: 1px solid var(--border-color);
  background: var(--bg-primary);
}

.pagination-info {
  font-size: 12px;
  color: var(--text-tertiary);
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 4px;
}

.page-btn {
  min-width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 8px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s;
}

.page-btn:hover:not(:disabled) {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.page-btn.active {
  background: #f59e0b;
  color: white;
}

.page-btn.nav {
  color: var(--text-tertiary);
}

.page-btn.nav:hover:not(:disabled) {
  background: var(--bg-tertiary);
  color: #f59e0b;
}

.page-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.page-btn .mdi {
  font-size: 18px;
}

/* 반응형 */
@media (max-width: 768px) {
  .section-header {
    padding: 14px 16px;
  }

  .compose-area {
    padding: 14px 16px;
  }

  .pagination-bar {
    flex-direction: column;
    gap: 12px;
    padding: 12px 16px;
  }

  .pagination-info {
    order: 2;
  }

  .page-btn {
    min-width: 28px;
    height: 28px;
    font-size: 12px;
  }
}
</style>
