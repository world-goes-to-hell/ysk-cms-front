<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getBoards, getPost, deletePost, publishPost } from '@/api/board'
import { getFileUrl } from '@/api/index'
import type { BoardDto, PostDto, PostStatus } from '@/types/board'
import DOMPurify from 'dompurify'
import CommentSection from '@/components/comment/CommentSection.vue'

const route = useRoute()
const router = useRouter()

// 라우트 메타에서 게시판 타입 코드 가져오기 (자동 설정)
const boardType = computed(() => {
  return (route.meta.boardType as string) || 'normal'
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
const isAttachmentsExpanded = ref(true)

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

// 파일 크기 포맷
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 파일 아이콘 가져오기
const getFileIcon = (mimeType: string): string => {
  if (mimeType.startsWith('image/')) return 'mdi-file-image-outline'
  if (mimeType.startsWith('video/')) return 'mdi-file-video-outline'
  if (mimeType.startsWith('audio/')) return 'mdi-file-music-outline'
  if (mimeType.includes('pdf')) return 'mdi-file-pdf-box'
  if (mimeType.includes('word') || mimeType.includes('document')) return 'mdi-file-word-outline'
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'mdi-file-excel-outline'
  if (mimeType.includes('zip') || mimeType.includes('compressed')) return 'mdi-folder-zip-outline'
  return 'mdi-file-outline'
}

// 첨부파일 섹션 토글
const toggleAttachments = () => {
  isAttachmentsExpanded.value = !isAttachmentsExpanded.value
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
    const response = await getPost(currentSiteCode.value, selectedBoardCode.value, postId.value, true)
    post.value = response.data.data
  } catch (error) {
    ElMessage.error('게시글 정보를 불러오는데 실패했습니다.')
    goBack()
  } finally {
    isLoading.value = false
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

// 게시글 발행
const handlePublish = async () => {
  if (!post.value) return

  try {
    await ElMessageBox.confirm('게시글을 발행하시겠습니까?', '게시글 발행', {
      confirmButtonText: '발행',
      cancelButtonText: '취소',
      type: 'info',
    })

    await publishPost(currentSiteCode.value, selectedBoardCode.value, post.value.id)
    ElMessage.success('게시글이 발행되었습니다.')
    await fetchPost()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('발행에 실패했습니다.')
    }
  }
}

// 게시글 삭제
const handleDelete = async () => {
  if (!post.value) return

  try {
    await ElMessageBox.confirm(
      `'${post.value.title}' 게시글을 삭제하시겠습니까?`,
      '게시글 삭제',
      {
        confirmButtonText: '삭제',
        cancelButtonText: '취소',
        type: 'warning',
      },
    )

    await deletePost(currentSiteCode.value, selectedBoardCode.value, post.value.id)
    ElMessage.success('게시글이 삭제되었습니다.')
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
  <div class="post-detail-page board-normal">
    <!-- 페이지 헤더 -->
    <div class="page-header">
      <div class="header-left">
        <button class="btn-back" @click="goBack">
          <i class="mdi mdi-arrow-left"></i>
        </button>
        <div class="header-info">
          <h1>
            <i class="mdi mdi-text-box-outline"></i>
            게시글 상세
          </h1>
          <p v-if="selectedBoard">{{ selectedBoard.name }}</p>
        </div>
      </div>
      <div class="header-actions">
        <button
          v-if="post?.status === 'DRAFT'"
          class="btn-publish"
          @click="handlePublish"
        >
          <i class="mdi mdi-send-outline"></i>
          발행
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

    <!-- 게시글 상세 -->
    <div v-loading="isLoading" class="detail-container">
      <template v-if="post">
        <!-- 게시글 정보 헤더 -->
        <div class="post-header">
          <div class="post-badges">
            <span v-if="post.isPinned" class="badge pinned">
              <i class="mdi mdi-pin"></i> 상단 고정
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

        <!-- 게시글 내용 -->
        <div class="post-content">
          <div class="content-body" v-html="sanitizeHtml(post.content)" />
        </div>

        <!-- 첨부파일 섹션 -->
        <div v-if="post.attachments && post.attachments.length > 0" class="attachments-section">
          <button type="button" class="attachments-header" @click.stop="toggleAttachments">
            <div class="header-left">
              <i class="mdi mdi-attachment"></i>
              <span>첨부파일 ({{ post.attachments.length }})</span>
            </div>
            <i :class="['mdi', 'toggle-icon', isAttachmentsExpanded ? 'mdi-chevron-up' : 'mdi-chevron-down']"></i>
          </button>
          <div v-show="isAttachmentsExpanded" class="attachments-list">
            <a
              v-for="file in post.attachments"
              :key="file.id"
              :href="getFileUrl(file.url)"
              target="_blank"
              class="attachment-item"
              :download="file.originalName"
            >
              <i :class="['mdi', 'file-icon', getFileIcon(file.mimeType)]"></i>
              <span class="attachment-name">{{ file.originalName }}</span>
              <span class="attachment-size">{{ formatFileSize(file.fileSize) }}</span>
              <i class="mdi mdi-download download-icon"></i>
            </a>
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

<!-- CSS: public/css/views/board-views.css -->
