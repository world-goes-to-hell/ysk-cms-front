<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getBoards } from '@/api/board'
import { getPosts, deletePost } from '@/api/board'
import type { BoardDto, PostListDto, PostStatus } from '@/types/board'
import Pagination from '@/components/common/Pagination.vue'

const route = useRoute()
const router = useRouter()

// 라우트 메타에서 게시판 타입 코드 가져오기 (자동 설정)
const boardType = computed(() => {
  return (route.meta.boardType as string) || 'gallery'
})

// 라우트 메타에서 게시판 코드 가져오기 (BOARD 타입 메뉴일 경우)
const fixedBoardCode = computed(() => {
  return route.meta.boardCode as string | undefined
})

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
  totalPages: 0,
})

// 검색/필터
const searchQuery = ref('')
const filterStatus = ref<PostStatus | ''>('')

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

// 게시판 목록 조회 (해당 타입만)
const fetchBoards = async () => {
  isBoardsLoading.value = true
  try {
    const response = await getBoards(currentSiteCode.value)
    boards.value = response.data.data.filter((b) => b.status === 'ACTIVE' && b.typeCode === boardType.value)

    // 게시판 자동 선택: fixedBoardCode가 있으면 해당 게시판, 없으면 첫 번째 게시판
    if (boards.value.length > 0 && !selectedBoardCode.value) {
      if (fixedBoardCode.value && boards.value.some(b => b.code === fixedBoardCode.value)) {
        selectedBoardCode.value = fixedBoardCode.value
      } else {
        selectedBoardCode.value = boards.value[0].code
      }
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
    pagination.value.totalPages = data.totalPages
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

// 페이지 사이즈 변경
const onSizeChange = (size: number) => {
  pagination.value.size = size
  pagination.value.page = 1
  fetchPosts()
}

// 현재 라우트 경로 기준으로 관련 페이지 경로 생성
const getBasePath = () => {
  // 현재 경로에서 마지막 세그먼트 제거
  const currentPath = route.path
  return currentPath
}

// 새 게시글 작성 페이지로 이동
const goToCreate = () => {
  router.push({
    path: `${getBasePath()}/form`,
    query: { boardCode: selectedBoardCode.value }
  })
}

// 게시글 수정 페이지로 이동
const goToEdit = (postId: number) => {
  router.push({
    path: `${getBasePath()}/form/${postId}`,
    query: { boardCode: selectedBoardCode.value }
  })
}

// 게시글 상세 페이지로 이동
const goToDetail = (postId: number) => {
  router.push({
    path: `${getBasePath()}/${postId}`,
    query: { boardCode: selectedBoardCode.value }
  })
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
    hour: '2-digit',
    minute: '2-digit',
  })
}

// 사이트 코드 변경 감지
watch(currentSiteCode, () => {
  selectedBoardCode.value = ''
  fetchBoards()
})

// 게시판 코드(fixedBoardCode) 변경 감지 - 같은 컴포넌트 내 메뉴 이동 시
watch(fixedBoardCode, (newVal) => {
  if (newVal && boards.value.some(b => b.code === newVal)) {
    selectedBoardCode.value = newVal
  }
}, { immediate: false })

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
  <div class="article-management board-gallery">
    <!-- 페이지 헤더 -->
    <div class="page-header">
      <div class="header-left">
        <h1>
          <i class="mdi mdi-image-multiple-outline"></i>
          갤러리 관리
        </h1>
        <p>갤러리 게시글을 관리하세요</p>
      </div>
      <button class="btn-create" :disabled="!selectedBoardCode" @click="goToCreate">
        <i class="mdi mdi-plus"></i>
        새 갤러리 작성
      </button>
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
        <div class="stat-icon pinned">
          <i class="mdi mdi-pin"></i>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ posts.filter(p => p.isPinned).length }}</span>
          <span class="stat-label">상단 고정</span>
        </div>
      </div>
    </div>

    <!-- 게시판 선택 (여러 갤러리 게시판이 있을 경우) -->
    <div v-if="boards.length > 1 && !fixedBoardCode" class="board-selector">
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

    <!-- 게시글 목록 테이블 -->
    <div v-if="selectedBoardCode" v-loading="isLoading" class="posts-container">
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
          :class="{ pinned: post.isPinned }"
        >
          <!-- 게시글 정보 -->
          <div class="col-info">
            <div class="post-icon" :class="{ 'is-pinned': post.isPinned }">
              <i v-if="post.isPinned" class="mdi mdi-pin"></i>
              <i v-else class="mdi mdi-image-outline"></i>
            </div>
            <div class="post-details">
              <h3 class="post-title" @click="goToDetail(post.id)">
                {{ post.title }}
              </h3>
              <div class="post-badges">
                <span v-if="post.isPinned" class="badge pinned">
                  <i class="mdi mdi-pin"></i> 고정
                </span>
              </div>
            </div>
          </div>

          <!-- 작성자 -->
          <div class="col-author">
            <span class="author-name">{{ post.author || '관리자' }}</span>
          </div>

          <!-- 조회수 -->
          <div class="col-views">
            <span class="view-count">
              <i class="mdi mdi-eye-outline"></i>
              {{ post.viewCount }}
            </span>
          </div>

          <!-- 상태 -->
          <div class="col-status">
            <span
              class="status-badge"
              :class="post.status.toLowerCase()"
            >
              {{ getStatusInfo(post.status).label }}
            </span>
          </div>

          <!-- 작성일 -->
          <div class="col-date">
            <span class="date-text">{{ formatDate(post.createdAt) }}</span>
          </div>

          <!-- 관리 버튼 -->
          <div class="col-actions">
            <button class="action-btn edit" title="수정" @click="goToEdit(post.id)">
              <i class="mdi mdi-pencil-outline"></i>
            </button>
            <button class="action-btn delete" title="삭제" @click="handleDelete(post)">
              <i class="mdi mdi-trash-can-outline"></i>
            </button>
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
        <button class="btn-create-empty" @click="goToCreate">
          <i class="mdi mdi-plus"></i>
          첫 갤러리 작성하기
        </button>
      </div>

      <!-- 페이지네이션 -->
      <div v-if="posts.length > 0" class="pagination-wrapper">
        <Pagination
          :current-page="pagination.page"
          :total-pages="pagination.totalPages"
          :total-elements="pagination.total"
          :page-size="pagination.size"
          :show-total="true"
          :show-size-changer="true"
          @page-change="onPageChange"
          @size-change="onSizeChange"
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
  </div>
</template>

<!-- CSS: public/css/views/board-views.css -->
