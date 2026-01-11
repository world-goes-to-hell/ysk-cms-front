<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getPost, deletePost, publishPost } from '@/api/board'
import type { PostDto, PostStatus } from '@/types/board'

const route = useRoute()
const router = useRouter()

// 라우트 파라미터
const currentSiteCode = computed(() => {
  const siteId = route.params.siteId as string
  return siteId || 'main'
})
const boardCode = computed(() => route.params.boardCode as string)
const articleId = computed(() => Number(route.params.id))

// 상태
const article = ref<PostDto | null>(null)
const isLoading = ref(false)

// 상태 옵션
const statusOptions = [
  { value: 'DRAFT', label: '임시저장', color: '#909399' },
  { value: 'PUBLISHED', label: '발행됨', color: '#67C23A' },
  { value: 'ARCHIVED', label: '보관됨', color: '#E6A23C' },
]

// 게시글 상세 조회
const fetchArticle = async () => {
  if (!boardCode.value || !articleId.value) return

  isLoading.value = true
  try {
    const response = await getPost(
      currentSiteCode.value,
      boardCode.value,
      articleId.value,
      true, // 조회수 증가
    )
    article.value = response.data.data
  } catch (error) {
    ElMessage.error('게시글을 불러오는데 실패했습니다.')
    router.back()
  } finally {
    isLoading.value = false
  }
}

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

// 수정 페이지로 이동
const goToEdit = () => {
  router.push({
    path: `/boards/${boardCode.value}/${articleId.value}/edit`,
  })
}

// 목록으로 이동
const goToList = () => {
  router.push({
    path: `/boards/${boardCode.value}`,
  })
}

// 게시글 발행
const handlePublish = async () => {
  if (!article.value) return

  try {
    await ElMessageBox.confirm('게시글을 발행하시겠습니까?', '게시글 발행', {
      confirmButtonText: '발행',
      cancelButtonText: '취소',
      type: 'info',
    })

    await publishPost(currentSiteCode.value, boardCode.value, articleId.value)
    ElMessage.success('게시글이 발행되었습니다.')
    fetchArticle()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('발행에 실패했습니다.')
    }
  }
}

// 게시글 삭제
const handleDelete = async () => {
  if (!article.value) return

  try {
    await ElMessageBox.confirm(
      `'${article.value.title}' 게시글을 삭제하시겠습니까?`,
      '게시글 삭제',
      {
        confirmButtonText: '삭제',
        cancelButtonText: '취소',
        type: 'warning',
      },
    )

    await deletePost(currentSiteCode.value, boardCode.value, articleId.value)
    ElMessage.success('게시글이 삭제되었습니다.')
    goToList()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('삭제에 실패했습니다.')
    }
  }
}

onMounted(() => {
  fetchArticle()
})
</script>

<template>
  <div class="article-detail-page">
    <!-- 로딩 -->
    <div v-if="isLoading" v-loading="true" class="loading-container" />

    <!-- 게시글 상세 -->
    <template v-else-if="article">
      <!-- 페이지 헤더 -->
      <div class="page-header">
        <div class="header-left">
          <button class="btn-back" @click="goToList">
            <i class="mdi mdi-arrow-left"></i>
            목록으로
          </button>
          <div class="board-info">
            <span class="board-name">{{ article.boardName }}</span>
          </div>
        </div>
        <div class="header-actions">
          <button
            v-if="article.status === 'DRAFT'"
            class="btn-publish"
            @click="handlePublish"
          >
            <i class="mdi mdi-send-outline"></i>
            발행하기
          </button>
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

      <!-- 게시글 내용 -->
      <div class="article-container">
        <!-- 헤더 -->
        <div class="article-header">
          <div class="header-badges">
            <span v-if="article.isPinned" class="badge pinned">
              <i class="mdi mdi-pin"></i> 상단 고정
            </span>
            <span v-if="article.isSecret" class="badge secret">
              <i class="mdi mdi-lock-outline"></i> 비밀글
            </span>
            <span class="status-badge" :class="article.status.toLowerCase()">
              {{ getStatusInfo(article.status).label }}
            </span>
          </div>
          <h1 class="article-title">{{ article.title }}</h1>
          <div class="article-meta">
            <div class="meta-item">
              <i class="mdi mdi-account-outline"></i>
              <span>{{ article.author || '익명' }}</span>
            </div>
            <div class="meta-item">
              <i class="mdi mdi-calendar-outline"></i>
              <span>{{ formatDate(article.createdAt) }}</span>
            </div>
            <div class="meta-item">
              <i class="mdi mdi-eye-outline"></i>
              <span>조회 {{ article.viewCount }}</span>
            </div>
            <div v-if="article.updatedAt !== article.createdAt" class="meta-item">
              <i class="mdi mdi-pencil-outline"></i>
              <span>수정 {{ formatDate(article.updatedAt) }}</span>
            </div>
          </div>
        </div>

        <!-- 본문 -->
        <div class="article-content">
          <div v-if="article.content" v-html="article.content" class="content-body" />
          <div v-else class="content-empty">내용이 없습니다.</div>
        </div>

        <!-- 하단 버튼 -->
        <div class="article-footer">
          <button class="btn-list" @click="goToList">
            <i class="mdi mdi-format-list-bulleted"></i>
            목록
          </button>
          <div class="footer-right">
            <button class="btn-edit-lg" @click="goToEdit">
              <i class="mdi mdi-pencil-outline"></i>
              수정
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- 게시글 없음 -->
    <div v-else class="empty-state">
      <div class="empty-icon">
        <i class="mdi mdi-file-document-outline"></i>
      </div>
      <h3>게시글을 찾을 수 없습니다</h3>
      <button class="btn-back-lg" @click="goToList">
        <i class="mdi mdi-arrow-left"></i>
        목록으로 돌아가기
      </button>
    </div>
  </div>
</template>

<style scoped>
.article-detail-page {
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

.board-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.board-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
  padding: 6px 12px;
  background: rgba(99, 102, 241, 0.1);
  border-radius: 8px;
  color: #6366f1;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.btn-publish {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-publish:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.btn-edit {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  color: #6366f1;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-edit:hover {
  background: rgba(99, 102, 241, 0.1);
  border-color: #6366f1;
}

.btn-delete {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  color: #ef4444;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-delete:hover {
  background: rgba(239, 68, 68, 0.1);
  border-color: #ef4444;
}

/* 게시글 컨테이너 */
.article-container {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  overflow: hidden;
}

/* 게시글 헤더 */
.article-header {
  padding: 32px 32px 24px;
  border-bottom: 1px solid var(--border-color);
}

.header-badges {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
}

.badge .mdi {
  font-size: 14px;
}

.badge.pinned {
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
  padding: 4px 10px;
  border-radius: 6px;
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

.article-title {
  font-size: 26px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 20px 0;
  line-height: 1.4;
}

.article-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: var(--text-tertiary);
}

.meta-item .mdi {
  font-size: 18px;
}

/* 게시글 본문 */
.article-content {
  padding: 32px;
  min-height: 300px;
}

.content-body {
  font-size: 16px;
  line-height: 1.8;
  color: var(--text-primary);
  word-break: break-word;
}

.content-body :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  margin: 16px 0;
}

.content-body :deep(a) {
  color: #6366f1;
  text-decoration: underline;
}

.content-body :deep(pre) {
  background: var(--bg-tertiary);
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
}

.content-body :deep(code) {
  background: var(--bg-tertiary);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Monaco', 'Menlo', monospace;
}

.content-body :deep(blockquote) {
  border-left: 4px solid #6366f1;
  padding-left: 16px;
  margin: 16px 0;
  color: var(--text-secondary);
}

.content-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  color: var(--text-tertiary);
  font-size: 15px;
}

/* 게시글 하단 */
.article-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 32px;
  background: var(--bg-tertiary);
  border-top: 1px solid var(--border-color);
}

.btn-list {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-list:hover {
  background: var(--bg-primary);
  color: var(--text-primary);
}

.btn-list .mdi {
  font-size: 18px;
}

.footer-right {
  display: flex;
  gap: 8px;
}

.btn-edit-lg {
  display: flex;
  align-items: center;
  gap: 8px;
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

.btn-edit-lg:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.btn-edit-lg .mdi {
  font-size: 18px;
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
  margin: 0 0 24px 0;
}

.btn-back-lg {
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

.btn-back-lg:hover {
  background: #4f46e5;
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
  }

  .header-actions {
    flex-wrap: wrap;
  }

  .article-header {
    padding: 24px 20px 20px;
  }

  .article-title {
    font-size: 22px;
  }

  .article-meta {
    gap: 12px;
  }

  .article-content {
    padding: 24px 20px;
  }

  .article-footer {
    flex-direction: column;
    gap: 12px;
    padding: 16px 20px;
  }

  .btn-list,
  .btn-edit-lg {
    width: 100%;
    justify-content: center;
  }

  .footer-right {
    width: 100%;
  }
}
</style>
