<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getBoards } from '@/api/board'
import { getPosts, createPost, updatePost, deletePost, getPost } from '@/api/board'
import type { BoardDto, PostDto, PostListDto, PostCreateRequest, PostUpdateRequest, PostStatus } from '@/types/board'

const route = useRoute()
const BOARD_TYPE = 'GALLERY'

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

// 뷰 모드 (grid / list)
const viewMode = ref<'grid' | 'list'>('grid')

// 페이지네이션
const pagination = ref({
  page: 1,
  size: 12,
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

// 게시판 목록 조회 (GALLERY 타입만)
const fetchBoards = async () => {
  isBoardsLoading.value = true
  try {
    const response = await getBoards(currentSiteCode.value)
    boards.value = response.data.data.filter((b) => b.status === 'ACTIVE' && b.typeCode === BOARD_TYPE)
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
      ElMessage.success('갤러리가 수정되었습니다.')
    } else {
      await createPost(currentSiteCode.value, selectedBoardCode.value, formData.value)
      ElMessage.success('갤러리가 생성되었습니다.')
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
      `'${post.title}' 갤러리를 삭제하시겠습니까?`,
      '갤러리 삭제',
      {
        confirmButtonText: '삭제',
        cancelButtonText: '취소',
        type: 'warning',
      },
    )

    await deletePost(currentSiteCode.value, selectedBoardCode.value, post.id)
    ElMessage.success('갤러리가 삭제되었습니다.')
    fetchPosts()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('삭제에 실패했습니다.')
    }
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
  <div class="article-management">
    <!-- 페이지 헤더 -->
    <div class="page-header">
      <div class="header-left">
        <h1>
          <i class="mdi mdi-image-multiple-outline"></i>
          갤러리 관리
        </h1>
        <p>갤러리 게시글을 관리하세요</p>
      </div>
      <div class="header-actions">
        <div class="view-toggle">
          <button
            class="toggle-btn"
            :class="{ active: viewMode === 'grid' }"
            @click="viewMode = 'grid'"
          >
            <i class="mdi mdi-view-grid-outline"></i>
          </button>
          <button
            class="toggle-btn"
            :class="{ active: viewMode === 'list' }"
            @click="viewMode = 'list'"
          >
            <i class="mdi mdi-view-list-outline"></i>
          </button>
        </div>
        <button class="btn-create" :disabled="!selectedBoardCode" @click="openCreateDialog">
          <i class="mdi mdi-plus"></i>
          새 갤러리 작성
        </button>
      </div>
    </div>

    <!-- 통계 카드 -->
    <div v-if="selectedBoardCode" class="stats-row">
      <div class="stat-card">
        <div class="stat-icon total">
          <i class="mdi mdi-image-multiple-outline"></i>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ pagination.total }}</span>
          <span class="stat-label">전체 갤러리</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon published">
          <i class="mdi mdi-check-circle-outline"></i>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ posts.filter(p => p.status === 'PUBLISHED').length }}</span>
          <span class="stat-label">발행됨</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon draft">
          <i class="mdi mdi-pencil-outline"></i>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ posts.filter(p => p.status === 'DRAFT').length }}</span>
          <span class="stat-label">임시저장</span>
        </div>
      </div>
    </div>

    <!-- 게시판 선택 -->
    <div v-if="boards.length > 1" class="board-selector">
      <div class="selector-label">
        <i class="mdi mdi-view-dashboard-outline"></i>
        게시판 선택
      </div>
      <div class="selector-content">
        <select v-model="selectedBoardCode" class="board-select" @change="onBoardChange">
          <option value="" disabled>게시판을 선택하세요</option>
          <option v-for="board in boards" :key="board.code" :value="board.code">
            {{ board.name }} ({{ board.code }})
          </option>
        </select>
        <div v-if="selectedBoard?.description" class="board-desc">{{ selectedBoard.description }}</div>
      </div>
    </div>

    <!-- 검색 및 필터 -->
    <div v-if="selectedBoardCode" class="filter-section">
      <div class="search-box">
        <i class="mdi mdi-magnify"></i>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="제목, 작성자 검색..."
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

    <!-- 갤러리 그리드 뷰 -->
    <div v-if="selectedBoardCode && viewMode === 'grid'" v-loading="isLoading" class="gallery-container">
      <div v-if="posts.length > 0" class="gallery-grid">
        <div
          v-for="post in posts"
          :key="post.id"
          class="gallery-card"
          @click="openDetailDialog(post)"
        >
          <div class="card-thumbnail">
            <i class="mdi mdi-image-outline"></i>
            <div class="card-overlay">
              <button class="overlay-btn" @click.stop="openEditDialog(post)">
                <i class="mdi mdi-pencil-outline"></i>
              </button>
              <button class="overlay-btn delete" @click.stop="handleDelete(post)">
                <i class="mdi mdi-trash-can-outline"></i>
              </button>
            </div>
          </div>
          <div class="card-content">
            <h3 class="card-title">{{ post.title }}</h3>
            <div class="card-meta">
              <span class="card-author">{{ post.author || '익명' }}</span>
              <span class="card-date">{{ formatDate(post.createdAt) }}</span>
            </div>
            <div class="card-footer">
              <span class="status-badge" :class="post.status.toLowerCase()">
                {{ getStatusInfo(post.status).label }}
              </span>
              <span class="view-count">
                <i class="mdi mdi-eye-outline"></i>
                {{ post.viewCount }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 빈 상태 -->
      <div v-else-if="!isLoading" class="empty-state">
        <div class="empty-icon">
          <i class="mdi mdi-image-multiple-outline"></i>
        </div>
        <h3>갤러리가 없습니다</h3>
        <p>새 갤러리를 작성해보세요</p>
        <button class="btn-create-empty" @click="openCreateDialog">
          <i class="mdi mdi-plus"></i>
          첫 갤러리 작성하기
        </button>
      </div>

      <!-- 페이지네이션 -->
      <div v-if="posts.length > 0" class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          :page-size="pagination.size"
          :total="pagination.total"
          layout="prev, pager, next"
          @current-change="onPageChange"
        />
      </div>
    </div>

    <!-- 갤러리 리스트 뷰 -->
    <div v-if="selectedBoardCode && viewMode === 'list'" v-loading="isLoading" class="posts-container">
      <div v-if="posts.length > 0" class="posts-table">
        <div class="table-header">
          <div class="col-info">갤러리 정보</div>
          <div class="col-author">작성자</div>
          <div class="col-views">조회수</div>
          <div class="col-status">상태</div>
          <div class="col-date">작성일</div>
          <div class="col-actions">관리</div>
        </div>

        <div
          v-for="post in posts"
          :key="post.id"
          class="table-row"
        >
          <div class="col-info">
            <div class="post-icon">
              <i class="mdi mdi-image-outline"></i>
            </div>
            <div class="post-details">
              <h3 class="post-title" @click="openDetailDialog(post)">
                {{ post.title }}
              </h3>
            </div>
          </div>

          <div class="col-author">
            <span class="author-name">{{ post.author || '익명' }}</span>
          </div>

          <div class="col-views">
            <span class="view-count">
              <i class="mdi mdi-eye-outline"></i>
              {{ post.viewCount }}
            </span>
          </div>

          <div class="col-status">
            <span class="status-badge" :class="post.status.toLowerCase()">
              {{ getStatusInfo(post.status).label }}
            </span>
          </div>

          <div class="col-date">
            <span class="date-text">{{ formatDate(post.createdAt) }}</span>
          </div>

          <div class="col-actions">
            <button class="action-btn edit" title="수정" @click="openEditDialog(post)">
              <i class="mdi mdi-pencil-outline"></i>
            </button>
            <button class="action-btn delete" title="삭제" @click="handleDelete(post)">
              <i class="mdi mdi-trash-can-outline"></i>
            </button>
          </div>
        </div>
      </div>

      <div v-else-if="!isLoading" class="empty-state">
        <div class="empty-icon">
          <i class="mdi mdi-image-multiple-outline"></i>
        </div>
        <h3>갤러리가 없습니다</h3>
        <p>새 갤러리를 작성해보세요</p>
        <button class="btn-create-empty" @click="openCreateDialog">
          <i class="mdi mdi-plus"></i>
          첫 갤러리 작성하기
        </button>
      </div>

      <div v-if="posts.length > 0" class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          :page-size="pagination.size"
          :total="pagination.total"
          layout="prev, pager, next"
          @current-change="onPageChange"
        />
      </div>
    </div>

    <!-- 게시판 없음 안내 -->
    <div v-if="boards.length === 0 && !isBoardsLoading" class="empty-state-wrapper">
      <div class="empty-state">
        <div class="empty-icon">
          <i class="mdi mdi-image-multiple-outline"></i>
        </div>
        <h3>갤러리 게시판이 없습니다</h3>
        <p>먼저 갤러리 타입의 게시판을 생성해주세요</p>
      </div>
    </div>

    <!-- 게시글 생성/수정 다이얼로그 -->
    <el-dialog
      v-model="showFormDialog"
      :title="isEditing ? '갤러리 수정' : '새 갤러리 작성'"
      width="720px"
      destroy-on-close
      class="article-dialog"
    >
      <div class="dialog-form">
        <div class="form-section">
          <div class="form-field full">
            <label class="field-label required">제목</label>
            <input
              v-model="formData.title"
              type="text"
              class="field-input"
              placeholder="갤러리 제목을 입력하세요"
            />
          </div>
        </div>

        <div class="form-section">
          <div class="form-field full">
            <label class="field-label">내용</label>
            <textarea
              v-model="formData.content"
              class="field-textarea"
              placeholder="갤러리 내용을 입력하세요"
              rows="8"
            ></textarea>
          </div>
        </div>

        <div class="form-section">
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
      </div>

      <template #footer>
        <div class="dialog-footer">
          <button class="btn-cancel" @click="showFormDialog = false">취소</button>
          <button class="btn-save" @click="savePost">
            <i class="mdi" :class="isEditing ? 'mdi-content-save' : 'mdi-plus'"></i>
            {{ isEditing ? '저장' : '작성' }}
          </button>
        </div>
      </template>
    </el-dialog>

    <!-- 게시글 상세 다이얼로그 -->
    <el-dialog
      v-model="showDetailDialog"
      title="갤러리 상세"
      width="800px"
      destroy-on-close
    >
      <div v-if="currentPost" class="post-detail">
        <div class="post-detail-header">
          <div class="detail-badges">
            <span class="status-badge" :class="currentPost.status.toLowerCase()">
              {{ getStatusInfo(currentPost.status).label }}
            </span>
          </div>
          <h2>{{ currentPost.title }}</h2>
          <div class="post-meta">
            <span><i class="mdi mdi-account-outline"></i> {{ currentPost.author || '익명' }}</span>
            <span><i class="mdi mdi-eye-outline"></i> {{ currentPost.viewCount }}</span>
            <span><i class="mdi mdi-calendar-outline"></i> {{ formatDate(currentPost.createdAt) }}</span>
          </div>
        </div>
        <div class="post-detail-content">
          <div v-html="currentPost.content || '내용이 없습니다.'" />
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<style scoped>
.article-management {
  width: 100%;
  max-width: 1400px;
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
  color: #10b981;
}

.header-left p {
  font-size: 15px;
  color: var(--text-secondary);
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.view-toggle {
  display: flex;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  overflow: hidden;
}

.toggle-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--text-tertiary);
  transition: all 0.2s ease;
}

.toggle-btn:hover {
  color: var(--text-primary);
}

.toggle-btn.active {
  background: #10b981;
  color: white;
}

.toggle-btn .mdi {
  font-size: 20px;
}

.btn-create {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.btn-create:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
}

.btn-create:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.stat-icon.published {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.stat-icon.draft {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
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

/* 게시판 선택 */
.board-selector {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 24px;
  padding: 20px 24px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 16px;
}

.selector-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
  white-space: nowrap;
}

.selector-label .mdi {
  font-size: 20px;
  color: #10b981;
}

.selector-content {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
}

.board-select {
  padding: 12px 16px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  font-size: 14px;
  color: var(--text-primary);
  cursor: pointer;
  min-width: 240px;
}

.board-select:focus {
  outline: none;
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}

.board-desc {
  font-size: 14px;
  color: var(--text-tertiary);
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
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
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
  border-color: #10b981;
}

.btn-search {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 20px;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-search:hover {
  background: #059669;
}

.btn-search .mdi {
  font-size: 18px;
}

/* 갤러리 그리드 */
.gallery-container {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 24px;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.gallery-card {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s ease;
}

.gallery-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.card-thumbnail {
  position: relative;
  height: 160px;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(52, 211, 153, 0.1) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-thumbnail > .mdi {
  font-size: 48px;
  color: #10b981;
  opacity: 0.5;
}

.card-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.gallery-card:hover .card-overlay {
  opacity: 1;
}

.overlay-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  color: #10b981;
  transition: all 0.2s ease;
}

.overlay-btn:hover {
  transform: scale(1.1);
}

.overlay-btn.delete {
  color: #ef4444;
}

.overlay-btn .mdi {
  font-size: 20px;
}

.card-content {
  padding: 16px;
}

.card-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 8px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--text-tertiary);
  margin-bottom: 12px;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 리스트 뷰 */
.posts-container {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  overflow: hidden;
}

.posts-table {
  width: 100%;
}

.table-header {
  display: grid;
  grid-template-columns: 1fr 100px 80px 90px 120px 100px;
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
  grid-template-columns: 1fr 100px 80px 90px 120px 100px;
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

.col-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.post-icon {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(16, 185, 129, 0.1);
  border-radius: 12px;
  flex-shrink: 0;
}

.post-icon .mdi {
  font-size: 22px;
  color: #10b981;
}

.post-details {
  min-width: 0;
}

.post-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  cursor: pointer;
  transition: color 0.2s;
}

.post-title:hover {
  color: #10b981;
}

.author-name {
  font-size: 14px;
  color: var(--text-secondary);
}

.view-count {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: var(--text-tertiary);
}

.view-count .mdi {
  font-size: 16px;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px;
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

.date-text {
  font-size: 13px;
  color: var(--text-tertiary);
}

.col-actions {
  display: flex;
  gap: 8px;
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

.action-btn.edit {
  color: #10b981;
}

.action-btn.edit:hover {
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
.empty-state-wrapper {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 16px;
}

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
  background: rgba(16, 185, 129, 0.1);
  border-radius: 20px;
  margin-bottom: 24px;
}

.empty-icon .mdi {
  font-size: 40px;
  color: #10b981;
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
  background: #10b981;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-create-empty:hover {
  background: #059669;
}

/* 페이지네이션 */
.pagination-wrapper {
  display: flex;
  justify-content: center;
  padding: 20px;
  margin-top: 20px;
}

.posts-container .pagination-wrapper {
  margin-top: 0;
  background: var(--bg-primary);
  border-top: 1px solid var(--border-color);
}

/* 다이얼로그 폼 */
.dialog-form {
  padding: 8px 0;
}

.form-section {
  margin-bottom: 24px;
}

.form-section:last-child {
  margin-bottom: 0;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-field.full {
  grid-column: 1 / -1;
}

.field-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
}

.field-label.required::after {
  content: ' *';
  color: #ef4444;
}

.field-input,
.field-textarea,
.field-select {
  padding: 10px 14px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  font-size: 14px;
  color: var(--text-primary);
  transition: all 0.2s ease;
}

.field-input:focus,
.field-textarea:focus,
.field-select:focus {
  outline: none;
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}

.field-textarea {
  resize: vertical;
  min-height: 160px;
}

/* 다이얼로그 푸터 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn-cancel {
  padding: 10px 20px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 10px;
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
  padding: 10px 24px;
  background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-save:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.btn-save .mdi {
  font-size: 18px;
}

/* 상세 보기 */
.post-detail-header {
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 16px;
  margin-bottom: 24px;
}

.detail-badges {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
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

.post-meta span {
  display: flex;
  align-items: center;
  gap: 6px;
}

.post-meta .mdi {
  font-size: 16px;
}

.post-detail-content {
  min-height: 200px;
  padding: 20px;
  background: var(--bg-tertiary);
  border-radius: 12px;
  line-height: 1.8;
  color: var(--text-primary);
}

/* 반응형 */
@media (max-width: 1200px) {
  .gallery-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 1024px) {
  .stats-row {
    grid-template-columns: repeat(3, 1fr);
  }

  .gallery-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .table-header,
  .table-row {
    grid-template-columns: 1fr 90px 70px 80px 100px 90px;
  }
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 16px;
  }

  .header-actions {
    width: 100%;
    justify-content: space-between;
  }

  .btn-create {
    flex: 1;
    justify-content: center;
  }

  .stats-row {
    grid-template-columns: 1fr;
  }

  .gallery-grid {
    grid-template-columns: 1fr;
  }

  .board-selector {
    flex-direction: column;
    align-items: stretch;
  }

  .selector-content {
    flex-direction: column;
    align-items: stretch;
  }

  .board-select {
    min-width: auto;
    width: 100%;
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

  .col-author,
  .col-views,
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

  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
