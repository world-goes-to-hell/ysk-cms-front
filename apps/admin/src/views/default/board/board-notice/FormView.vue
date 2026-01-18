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
  return (route.meta.boardType as string) || 'notice'
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
  return isEditMode.value ? '공지사항 수정' : '새 공지사항 작성'
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
    ElMessage.error('게시글 정보를 불러오는데 실패했습니다.')
    goBack()
  } finally {
    isLoading.value = false
  }
}

// 게시글 저장
const savePost = async () => {
  if (!formData.value.title?.trim()) {
    ElMessage.warning('제목은 필수입니다.')
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
      ElMessage.success('공지사항이 수정되었습니다.')
    } else {
      const createData: PostCreateRequest = {
        ...formData.value,
        content: sanitizedContent,
      }
      await createPost(currentSiteCode.value, selectedBoardCode.value, createData)
      ElMessage.success('공지사항이 생성되었습니다.')
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
  <div class="post-form-page board-notice">
    <!-- 페이지 헤더 -->
    <div class="page-header">
      <div class="header-left">
        <button class="btn-back" @click="goBack">
          <i class="mdi mdi-arrow-left"></i>
        </button>
        <div class="header-info">
          <h1>
            <i class="mdi mdi-bullhorn-outline"></i>
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
          <label class="field-label required">제목</label>
          <input
            v-model="formData.title"
            type="text"
            class="field-input"
            placeholder="공지사항 제목을 입력하세요"
          />
        </div>

        <div class="form-field">
          <label class="field-label">내용</label>
          <textarea
            v-model="formData.content"
            class="field-textarea"
            placeholder="공지사항 내용을 입력하세요"
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
            <span class="toggle-desc">이 공지사항을 목록 상단에 고정합니다.</span>
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

<!-- CSS: public/css/views/board-views.css -->
