<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getBoards } from '@/api/board'
import { getPosts, createPost, updatePost, deletePost, answerPost, getPost } from '@/api/board'
import type { BoardDto, PostDto, PostListDto, PostCreateRequest, PostUpdateRequest, PostStatus } from '@/types/board'

const route = useRoute()

// 현재 사이트 코드
const currentSiteCode = computed(() => {
  const siteId = route.params.siteId as string
  return siteId || 'main'
})

// 상태
const boards = ref<BoardDto[]>([])
const selectedBoardCode = ref('')
const posts = ref<PostListDto[]>([])
const isLoading = ref(false)
const isBoardsLoading = ref(false)

// 페이지네이션
const pagination = ref({
  page: 1,
  size: 10,
  total: 0,
})

// 검색/필터
const searchQuery = ref('')
const filterStatus = ref<PostStatus | ''>('')

// 다이얼로그
const showFormDialog = ref(false)
const showDetailDialog = ref(false)
const isEditing = ref(false)
const editingPost = ref<PostDto | null>(null)
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

// 답변 데이터 (Q&A용)
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

// 게시판 목록 조회
const fetchBoards = async () => {
  isBoardsLoading.value = true
  try {
    const response = await getBoards(currentSiteCode.value)
    boards.value = response.data.data.filter((b) => b.status === 'ACTIVE')
    if (boards.value.length > 0 && !selectedBoardCode.value) {
      selectedBoardCode.value = boards.value[0].code
    }
  } catch (error) {
    ElMessage.error('게시판 목록을 불러오는데 실패했습니다.')
  } finally {
    isBoardsLoading.value = false
  }
}

// 게시글 목록 조회
const fetchPosts = async () => {
  if (!selectedBoardCode.value) return

  isLoading.value = true
  try {
    const response = await getPosts(currentSiteCode.value, selectedBoardCode.value, {
      page: pagination.value.page - 1,
      size: pagination.value.size,
      keyword: searchQuery.value || undefined,
      status: filterStatus.value || undefined,
    })
    const data = response.data.data
    posts.value = data.content
    pagination.value.total = data.totalElements
  } catch (error) {
    ElMessage.error('게시글 목록을 불러오는데 실패했습니다.')
  } finally {
    isLoading.value = false
  }
}

// 게시판 선택 변경
const onBoardChange = () => {
  pagination.value.page = 1
  fetchPosts()
}

// 검색
const onSearch = () => {
  pagination.value.page = 1
  fetchPosts()
}

// 페이지 변경
const onPageChange = (page: number) => {
  pagination.value.page = page
  fetchPosts()
}

// 새 게시글 폼 열기
const openCreateDialog = () => {
  isEditing.value = false
  editingPost.value = null
  formData.value = {
    title: '',
    content: '',
    author: '',
    isPinned: false,
    isSecret: false,
    status: 'DRAFT',
  }
  showFormDialog.value = true
}

// 게시글 수정 폼 열기
const openEditDialog = async (post: PostListDto) => {
  try {
    const response = await getPost(currentSiteCode.value, selectedBoardCode.value, post.id)
    const postDetail = response.data.data
    isEditing.value = true
    editingPost.value = postDetail
    formData.value = {
      title: postDetail.title,
      content: postDetail.content || '',
      author: postDetail.author || '',
      isPinned: postDetail.isPinned,
      isSecret: postDetail.isSecret,
      status: postDetail.status,
    }
    showFormDialog.value = true
  } catch {
    ElMessage.error('게시글 정보를 불러오는데 실패했습니다.')
  }
}

// 게시글 상세 보기
const openDetailDialog = async (post: PostListDto) => {
  try {
    const response = await getPost(currentSiteCode.value, selectedBoardCode.value, post.id)
    currentPost.value = response.data.data
    answerData.value = currentPost.value.answer || ''
    showDetailDialog.value = true
  } catch {
    ElMessage.error('게시글 정보를 불러오는데 실패했습니다.')
  }
}

// 게시글 저장
const savePost = async () => {
  if (!formData.value.title) {
    ElMessage.warning('제목은 필수입니다.')
    return
  }

  try {
    if (isEditing.value && editingPost.value) {
      const updateData: PostUpdateRequest = {
        title: formData.value.title,
        content: formData.value.content,
        author: formData.value.author,
        isPinned: formData.value.isPinned,
        isSecret: formData.value.isSecret,
        status: formData.value.status,
      }
      await updatePost(currentSiteCode.value, selectedBoardCode.value, editingPost.value.id, updateData)
      ElMessage.success('게시글이 수정되었습니다.')
    } else {
      await createPost(currentSiteCode.value, selectedBoardCode.value, formData.value)
      ElMessage.success('게시글이 생성되었습니다.')
    }
    showFormDialog.value = false
    fetchPosts()
  } catch (error: unknown) {
    const axiosError = error as { response?: { data?: { message?: string } } }
    ElMessage.error(axiosError.response?.data?.message || '저장에 실패했습니다.')
  }
}

// 게시글 삭제
const handleDelete = async (post: PostListDto) => {
  try {
    await ElMessageBox.confirm(
      `'${post.title}' 게시글을 삭제하시겠습니까?`,
      '게시글 삭제',
      {
        confirmButtonText: '삭제',
        cancelButtonText: '취소',
        type: 'warning',
      },
    )

    await deletePost(currentSiteCode.value, selectedBoardCode.value, post.id)
    ElMessage.success('게시글이 삭제되었습니다.')
    fetchPosts()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('삭제에 실패했습니다.')
    }
  }
}

// 답변 저장 (Q&A용)
const saveAnswer = async () => {
  if (!currentPost.value) return

  try {
    await answerPost(currentSiteCode.value, selectedBoardCode.value, currentPost.value.id, {
      answer: answerData.value,
    })
    ElMessage.success('답변이 저장되었습니다.')
    showDetailDialog.value = false
    fetchPosts()
  } catch {
    ElMessage.error('답변 저장에 실패했습니다.')
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

// 사이트 코드 변경 감지
watch(currentSiteCode, () => {
  selectedBoardCode.value = ''
  fetchBoards()
})

onMounted(() => {
  fetchBoards()
})

// 게시판 선택 후 게시글 목록 자동 로드
watch(selectedBoardCode, (newVal) => {
  if (newVal) {
    fetchPosts()
  }
})
</script>

<template>
  <div class="post-management">
    <!-- 페이지 헤더 -->
    <div class="page-header">
      <div class="header-content">
        <h1>게시글 관리</h1>
        <p>게시판별 게시글을 관리하세요</p>
      </div>
      <div class="header-actions">
        <el-button
          type="primary"
          :icon="Plus"
          round
          :disabled="!selectedBoardCode"
          @click="openCreateDialog"
        >
          새 게시글 작성
        </el-button>
      </div>
    </div>

    <!-- 게시판 선택 -->
    <div class="board-selector">
      <el-select
        v-model="selectedBoardCode"
        placeholder="게시판 선택"
        :loading="isBoardsLoading"
        @change="onBoardChange"
        class="board-select"
      >
        <el-option
          v-for="board in boards"
          :key="board.code"
          :value="board.code"
          :label="board.name"
        >
          <span>{{ board.name }}</span>
          <span class="board-code-label">{{ board.code }}</span>
        </el-option>
      </el-select>
      <div v-if="selectedBoard" class="board-info">
        <span class="board-type-badge" :class="selectedBoard.type.toLowerCase()">
          {{ selectedBoard.type }}
        </span>
        <span class="board-desc">{{ selectedBoard.description }}</span>
      </div>
    </div>

    <!-- 검색 및 필터 -->
    <div v-if="selectedBoardCode" class="filter-bar">
      <el-input
        v-model="searchQuery"
        placeholder="제목, 작성자 검색..."
        :prefix-icon="Search"
        clearable
        class="search-input"
        @keyup.enter="onSearch"
      />
      <el-select v-model="filterStatus" placeholder="상태 전체" clearable class="filter-select" @change="onSearch">
        <el-option v-for="opt in statusOptions" :key="opt.value" :value="opt.value" :label="opt.label" />
      </el-select>
      <el-button type="primary" @click="onSearch">검색</el-button>
      <div class="post-count">
        총 <strong>{{ pagination.total }}</strong>개 게시글
      </div>
    </div>

    <!-- 게시글 목록 테이블 -->
    <div v-if="selectedBoardCode" v-loading="isLoading" class="posts-table-wrapper">
      <el-table :data="posts" stripe class="posts-table">
        <el-table-column type="index" width="50" label="#" />
        <el-table-column label="제목" min-width="300">
          <template #default="{ row }">
            <div class="post-title-cell">
              <el-icon v-if="row.isPinned" class="pin-icon"><Top /></el-icon>
              <el-icon v-if="row.isSecret" class="secret-icon"><Lock /></el-icon>
              <span class="post-title" @click="openDetailDialog(row)">{{ row.title }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="author" label="작성자" width="120" />
        <el-table-column prop="viewCount" label="조회수" width="80" align="center" />
        <el-table-column label="상태" width="100" align="center">
          <template #default="{ row }">
            <el-tag :color="getStatusInfo(row.status).color" effect="dark" size="small">
              {{ getStatusInfo(row.status).label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column v-if="selectedBoard?.type === 'QNA'" label="답변" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.hasAnswer ? 'success' : 'info'" size="small">
              {{ row.hasAnswer ? '완료' : '대기' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="작성일" width="170">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="관리" width="150" align="center">
          <template #default="{ row }">
            <el-button size="small" text type="primary" @click="openEditDialog(row)">
              <el-icon><Edit /></el-icon>
            </el-button>
            <el-button size="small" text type="danger" @click="handleDelete(row)">
              <el-icon><Delete /></el-icon>
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 페이지네이션 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          :page-size="pagination.size"
          :total="pagination.total"
          layout="prev, pager, next"
          @current-change="onPageChange"
        />
      </div>
    </div>

    <!-- 게시판 미선택 안내 -->
    <div v-if="!selectedBoardCode && !isBoardsLoading" class="empty-state">
      <el-icon :size="48"><Document /></el-icon>
      <p>게시판을 선택해주세요</p>
    </div>

    <!-- 게시글 생성/수정 다이얼로그 -->
    <el-dialog
      v-model="showFormDialog"
      :title="isEditing ? '게시글 수정' : '새 게시글 작성'"
      width="720px"
      destroy-on-close
    >
      <el-form :model="formData" label-position="top" class="post-form">
        <el-form-item label="제목" required>
          <el-input v-model="formData.title" placeholder="게시글 제목을 입력하세요" />
        </el-form-item>

        <el-form-item label="내용">
          <el-input
            v-model="formData.content"
            type="textarea"
            :rows="10"
            placeholder="게시글 내용을 입력하세요"
          />
        </el-form-item>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="작성자">
              <el-input v-model="formData.author" placeholder="작성자명" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="상태">
              <el-select v-model="formData.status" style="width: 100%">
                <el-option
                  v-for="opt in statusOptions"
                  :key="opt.value"
                  :value="opt.value"
                  :label="opt.label"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="옵션">
          <div class="option-switches">
            <el-switch v-model="formData.isPinned" active-text="상단 고정" />
            <el-switch v-model="formData.isSecret" active-text="비밀글" />
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showFormDialog = false">취소</el-button>
        <el-button type="primary" @click="savePost">
          {{ isEditing ? '저장' : '작성' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 게시글 상세 다이얼로그 -->
    <el-dialog
      v-model="showDetailDialog"
      title="게시글 상세"
      width="800px"
      destroy-on-close
    >
      <div v-if="currentPost" class="post-detail">
        <div class="post-detail-header">
          <h2>{{ currentPost.title }}</h2>
          <div class="post-meta">
            <span>작성자: {{ currentPost.author || '익명' }}</span>
            <span>조회수: {{ currentPost.viewCount }}</span>
            <span>작성일: {{ formatDate(currentPost.createdAt) }}</span>
          </div>
        </div>
        <div class="post-detail-content">
          <div v-html="currentPost.content || '내용이 없습니다.'" />
        </div>

        <!-- Q&A 답변 영역 -->
        <div v-if="selectedBoard?.type === 'QNA'" class="post-answer-section">
          <h3>답변</h3>
          <el-input
            v-model="answerData"
            type="textarea"
            :rows="5"
            placeholder="답변을 입력하세요"
          />
          <el-button type="primary" class="answer-save-btn" @click="saveAnswer">
            답변 저장
          </el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import {
  Plus,
  Search,
  Edit,
  Delete,
  Document,
  Top,
  Lock,
} from '@element-plus/icons-vue'

export default {
  components: {
    Plus,
    Search,
    Edit,
    Delete,
    Document,
    Top,
    Lock,
  },
}
</script>

<style scoped>
.post-management {
  width: 100%;
}

/* 페이지 헤더 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.header-content h1 {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 8px 0;
}

.header-content p {
  font-size: 15px;
  color: var(--text-secondary);
  margin: 0;
}

/* 게시판 선택 */
.board-selector {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  padding: 16px;
  background: var(--bg-secondary);
  border-radius: 12px;
  border: 1px solid var(--border-light);
}

.board-select {
  width: 240px;
}

.board-code-label {
  margin-left: 8px;
  font-size: 12px;
  color: var(--text-tertiary);
}

.board-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.board-type-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 4px;
  text-transform: uppercase;
}

.board-type-badge.normal { background: #409EFF20; color: #409EFF; }
.board-type-badge.gallery { background: #67C23A20; color: #67C23A; }
.board-type-badge.faq { background: #E6A23C20; color: #E6A23C; }
.board-type-badge.qna { background: #F56C6C20; color: #F56C6C; }
.board-type-badge.notice { background: #90939920; color: #909399; }

.board-desc {
  font-size: 14px;
  color: var(--text-secondary);
}

/* 필터 바 */
.filter-bar {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.search-input {
  width: 280px;
}

.filter-select {
  width: 140px;
}

.post-count {
  font-size: 14px;
  color: var(--text-secondary);
  margin-left: auto;
}

.post-count strong {
  color: var(--accent-primary);
}

/* 테이블 */
.posts-table-wrapper {
  background: var(--bg-secondary);
  border-radius: 12px;
  border: 1px solid var(--border-light);
  overflow: hidden;
}

.posts-table {
  width: 100%;
}

.post-title-cell {
  display: flex;
  align-items: center;
  gap: 6px;
}

.pin-icon {
  color: #E6A23C;
}

.secret-icon {
  color: #909399;
}

.post-title {
  cursor: pointer;
  color: var(--text-primary);
  transition: color 0.2s;
}

.post-title:hover {
  color: var(--accent-primary);
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  padding: 16px;
  background: var(--bg-primary);
}

/* 빈 상태 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  color: var(--text-tertiary);
  text-align: center;
}

.empty-state p {
  margin: 16px 0;
  font-size: 15px;
}

/* 폼 스타일 */
.post-form {
  padding: 0 8px;
}

.option-switches {
  display: flex;
  gap: 24px;
}

/* 상세 보기 */
.post-detail-header {
  border-bottom: 1px solid var(--border-light);
  padding-bottom: 16px;
  margin-bottom: 24px;
}

.post-detail-header h2 {
  font-size: 22px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 12px 0;
}

.post-meta {
  display: flex;
  gap: 16px;
  font-size: 14px;
  color: var(--text-secondary);
}

.post-detail-content {
  min-height: 200px;
  padding: 16px;
  background: var(--bg-tertiary);
  border-radius: 8px;
  line-height: 1.7;
  color: var(--text-primary);
}

.post-answer-section {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid var(--border-light);
}

.post-answer-section h3 {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 12px 0;
}

.answer-save-btn {
  margin-top: 12px;
}

/* 반응형 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 16px;
  }

  .board-selector {
    flex-direction: column;
    align-items: stretch;
  }

  .board-select {
    width: 100%;
  }

  .filter-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .search-input,
  .filter-select {
    width: 100%;
  }

  .post-count {
    margin-left: 0;
    text-align: center;
  }
}
</style>
