<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getBoards } from '@/api/board'
import { getPosts, createPost, updatePost, deletePost, getPost } from '@/api/board'
import type { BoardDto, PostDto, PostListDto, PostCreateRequest, PostUpdateRequest, PostStatus } from '@/types/board'

const route = useRoute()
const BOARD_TYPE = 'FAQ'

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

// 펼쳐진 FAQ 항목
const expandedItems = ref<Set<number>>(new Set())

// 페이지네이션
const pagination = ref({
  page: 1,
  size: 20,
  total: 0,
})

// 검색/필터
const searchQuery = ref('')
const filterStatus = ref<PostStatus | ''>('')

// 다이얼로그
const showFormDialog = ref(false)
const isEditing = ref(false)
const editingPost = ref<PostDto | null>(null)

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

// 게시판 목록 조회 (FAQ 타입만)
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
    ElMessage.error('FAQ 목록을 불러오는데 실패했습니다.')
  } finally {
    isLoading.value = false
  }
}

// 게시판 선택 변경
const onBoardChange = () => {
  pagination.value.page = 1
  expandedItems.value.clear()
  fetchPosts()
}

// 검색
const onSearch = () => {
  pagination.value.page = 1
  expandedItems.value.clear()
  fetchPosts()
}

// 페이지 변경
const onPageChange = (page: number) => {
  pagination.value.page = page
  expandedItems.value.clear()
  fetchPosts()
}

// FAQ 항목 토글
const toggleItem = (postId: number) => {
  if (expandedItems.value.has(postId)) {
    expandedItems.value.delete(postId)
  } else {
    expandedItems.value.add(postId)
  }
}

// 모두 펼치기/접기
const expandAll = () => {
  posts.value.forEach((post) => expandedItems.value.add(post.id))
}

const collapseAll = () => {
  expandedItems.value.clear()
}

// 새 FAQ 폼 열기
const openCreateDialog = () => {
  isEditing.value = false
  editingPost.value = null
  formData.value = {
    title: '',
    content: '',
    author: '',
    isPinned: false,
    isSecret: false,
    status: 'PUBLISHED',
  }
  showFormDialog.value = true
}

// FAQ 수정 폼 열기
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
    ElMessage.error('FAQ 정보를 불러오는데 실패했습니다.')
  }
}

// FAQ 저장
const savePost = async () => {
  if (!formData.value.title) {
    ElMessage.warning('질문은 필수입니다.')
    return
  }
  if (!formData.value.content) {
    ElMessage.warning('답변은 필수입니다.')
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
      ElMessage.success('FAQ가 수정되었습니다.')
    } else {
      await createPost(currentSiteCode.value, selectedBoardCode.value, formData.value)
      ElMessage.success('FAQ가 생성되었습니다.')
    }
    showFormDialog.value = false
    fetchPosts()
  } catch (error: unknown) {
    const axiosError = error as { response?: { data?: { message?: string } } }
    ElMessage.error(axiosError.response?.data?.message || '저장에 실패했습니다.')
  }
}

// FAQ 삭제
const handleDelete = async (post: PostListDto) => {
  try {
    await ElMessageBox.confirm(
      `이 FAQ를 삭제하시겠습니까?`,
      'FAQ 삭제',
      {
        confirmButtonText: '삭제',
        cancelButtonText: '취소',
        type: 'warning',
      },
    )

    await deletePost(currentSiteCode.value, selectedBoardCode.value, post.id)
    ElMessage.success('FAQ가 삭제되었습니다.')
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
          <i class="mdi mdi-frequently-asked-questions"></i>
          FAQ 관리
        </h1>
        <p>자주 묻는 질문을 관리하세요</p>
      </div>
      <button class="btn-create" :disabled="!selectedBoardCode" @click="openCreateDialog">
        <i class="mdi mdi-plus"></i>
        새 FAQ 작성
      </button>
    </div>

    <!-- 통계 카드 -->
    <div v-if="selectedBoardCode" class="stats-row">
      <div class="stat-card">
        <div class="stat-icon total">
          <i class="mdi mdi-frequently-asked-questions"></i>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ pagination.total }}</span>
          <span class="stat-label">전체 FAQ</span>
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
          placeholder="질문 검색..."
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
      <div class="expand-controls">
        <button class="expand-btn" @click="expandAll">
          <i class="mdi mdi-unfold-more-horizontal"></i>
          모두 펼치기
        </button>
        <button class="expand-btn" @click="collapseAll">
          <i class="mdi mdi-unfold-less-horizontal"></i>
          모두 접기
        </button>
      </div>
    </div>

    <!-- FAQ 목록 -->
    <div v-if="selectedBoardCode" v-loading="isLoading" class="faq-container">
      <div v-if="posts.length > 0" class="faq-list">
        <div
          v-for="(post, index) in posts"
          :key="post.id"
          class="faq-item"
          :class="{ expanded: expandedItems.has(post.id) }"
        >
          <div class="faq-question" @click="toggleItem(post.id)">
            <div class="question-left">
              <span class="question-number">Q{{ index + 1 }}</span>
              <span class="question-text">{{ post.title }}</span>
              <span v-if="post.status !== 'PUBLISHED'" class="status-badge" :class="post.status.toLowerCase()">
                {{ getStatusInfo(post.status).label }}
              </span>
            </div>
            <div class="question-right">
              <div class="faq-actions" @click.stop>
                <button class="action-btn edit" title="수정" @click="openEditDialog(post)">
                  <i class="mdi mdi-pencil-outline"></i>
                </button>
                <button class="action-btn delete" title="삭제" @click="handleDelete(post)">
                  <i class="mdi mdi-trash-can-outline"></i>
                </button>
              </div>
              <i class="mdi expand-icon" :class="expandedItems.has(post.id) ? 'mdi-chevron-up' : 'mdi-chevron-down'"></i>
            </div>
          </div>
          <div v-show="expandedItems.has(post.id)" class="faq-answer">
            <span class="answer-label">A</span>
            <div class="answer-content" v-html="post.content || '답변이 없습니다.'"></div>
          </div>
        </div>
      </div>

      <!-- 빈 상태 -->
      <div v-else-if="!isLoading" class="empty-state">
        <div class="empty-icon">
          <i class="mdi mdi-frequently-asked-questions"></i>
        </div>
        <h3>FAQ가 없습니다</h3>
        <p>새 FAQ를 작성해보세요</p>
        <button class="btn-create-empty" @click="openCreateDialog">
          <i class="mdi mdi-plus"></i>
          첫 FAQ 작성하기
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

    <!-- 게시판 없음 안내 -->
    <div v-if="boards.length === 0 && !isBoardsLoading" class="empty-state-wrapper">
      <div class="empty-state">
        <div class="empty-icon">
          <i class="mdi mdi-frequently-asked-questions"></i>
        </div>
        <h3>FAQ 게시판이 없습니다</h3>
        <p>먼저 FAQ 타입의 게시판을 생성해주세요</p>
      </div>
    </div>

    <!-- FAQ 생성/수정 다이얼로그 -->
    <el-dialog
      v-model="showFormDialog"
      :title="isEditing ? 'FAQ 수정' : '새 FAQ 작성'"
      width="720px"
      destroy-on-close
      class="article-dialog"
    >
      <div class="dialog-form">
        <div class="form-section">
          <div class="form-field full">
            <label class="field-label required">
              <i class="mdi mdi-help-circle-outline"></i>
              질문 (Question)
            </label>
            <input
              v-model="formData.title"
              type="text"
              class="field-input"
              placeholder="자주 묻는 질문을 입력하세요"
            />
          </div>
        </div>

        <div class="form-section">
          <div class="form-field full">
            <label class="field-label required">
              <i class="mdi mdi-message-reply-text-outline"></i>
              답변 (Answer)
            </label>
            <textarea
              v-model="formData.content"
              class="field-textarea"
              placeholder="질문에 대한 답변을 입력하세요"
              rows="8"
            ></textarea>
          </div>
        </div>

        <div class="form-section">
          <div class="form-row">
            <div class="form-field">
              <label class="field-label">상태</label>
              <select v-model="formData.status" class="field-select">
                <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>
            </div>
            <div class="form-field">
              <label class="field-label">옵션</label>
              <label class="toggle-option inline">
                <input v-model="formData.isPinned" type="checkbox" class="toggle-checkbox" />
                <span class="toggle-switch"></span>
                <span class="toggle-label">
                  <i class="mdi mdi-pin"></i>
                  상단 고정
                </span>
              </label>
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
  color: #f59e0b;
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

.btn-create:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(245, 158, 11, 0.4);
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
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}

.stat-icon.published {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.stat-icon.draft {
  background: rgba(107, 114, 128, 0.1);
  color: #6b7280;
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
  color: #f59e0b;
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
  border-color: #f59e0b;
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
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
  flex-wrap: wrap;
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
  border-color: #f59e0b;
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
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
  border-color: #f59e0b;
}

.btn-search {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 20px;
  background: #f59e0b;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-search:hover {
  background: #d97706;
}

.btn-search .mdi {
  font-size: 18px;
}

.expand-controls {
  display: flex;
  gap: 8px;
  margin-left: auto;
}

.expand-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  font-size: 13px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.expand-btn:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.expand-btn .mdi {
  font-size: 18px;
}

/* FAQ 컨테이너 */
.faq-container {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  overflow: hidden;
}

.faq-list {
  padding: 8px;
}

.faq-item {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  margin-bottom: 8px;
  overflow: hidden;
  transition: all 0.2s ease;
}

.faq-item:last-child {
  margin-bottom: 0;
}

.faq-item:hover {
  border-color: #f59e0b;
}

.faq-item.expanded {
  border-color: #f59e0b;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.1);
}

.faq-question {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.faq-question:hover {
  background: var(--bg-tertiary);
}

.question-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
  min-width: 0;
}

.question-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);
  color: white;
  font-size: 13px;
  font-weight: 700;
  border-radius: 10px;
  flex-shrink: 0;
}

.question-text {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  flex: 1;
  min-width: 0;
}

.question-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.faq-actions {
  display: flex;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.faq-item:hover .faq-actions {
  opacity: 1;
}

.expand-icon {
  font-size: 24px;
  color: var(--text-tertiary);
  transition: transform 0.2s ease;
}

.faq-item.expanded .expand-icon {
  color: #f59e0b;
}

.faq-answer {
  display: flex;
  gap: 16px;
  padding: 0 24px 24px 24px;
  background: rgba(245, 158, 11, 0.03);
  border-top: 1px dashed var(--border-color);
  padding-top: 20px;
}

.answer-label {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: var(--bg-tertiary);
  color: #f59e0b;
  font-size: 13px;
  font-weight: 700;
  border-radius: 10px;
  flex-shrink: 0;
}

.answer-content {
  flex: 1;
  font-size: 14px;
  line-height: 1.8;
  color: var(--text-secondary);
}

/* 상태 배지 */
.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  margin-left: 12px;
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

/* 액션 버튼 */
.action-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-primary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn .mdi {
  font-size: 16px;
}

.action-btn.edit {
  color: #f59e0b;
}

.action-btn.edit:hover {
  background: rgba(245, 158, 11, 0.1);
  border-color: #f59e0b;
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
  background: rgba(245, 158, 11, 0.1);
  border-radius: 20px;
  margin-bottom: 24px;
}

.empty-icon .mdi {
  font-size: 40px;
  color: #f59e0b;
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
  background: #f59e0b;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-create-empty:hover {
  background: #d97706;
}

/* 페이지네이션 */
.pagination-wrapper {
  display: flex;
  justify-content: center;
  padding: 20px;
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
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
}

.field-label .mdi {
  font-size: 16px;
  color: #f59e0b;
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
  border-color: #f59e0b;
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
}

.field-textarea {
  resize: vertical;
  min-height: 160px;
}

/* 토글 옵션 */
.toggle-option {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.toggle-option.inline {
  padding: 10px 0;
}

.toggle-checkbox {
  display: none;
}

.toggle-switch {
  width: 44px;
  height: 24px;
  background: var(--bg-tertiary);
  border-radius: 12px;
  position: relative;
  transition: all 0.2s ease;
}

.toggle-switch::after {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  width: 18px;
  height: 18px;
  background: white;
  border-radius: 50%;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.toggle-checkbox:checked + .toggle-switch {
  background: #f59e0b;
}

.toggle-checkbox:checked + .toggle-switch::after {
  left: 23px;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--text-primary);
}

.toggle-label .mdi {
  font-size: 18px;
  color: var(--text-secondary);
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
  background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);
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
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}

.btn-save .mdi {
  font-size: 18px;
}

/* 반응형 */
@media (max-width: 1024px) {
  .stats-row {
    grid-template-columns: repeat(3, 1fr);
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

  .stats-row {
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

  .expand-controls {
    width: 100%;
    margin-left: 0;
  }

  .expand-btn {
    flex: 1;
    justify-content: center;
  }

  .faq-question {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .question-right {
    width: 100%;
    justify-content: space-between;
  }

  .faq-actions {
    opacity: 1;
  }

  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
