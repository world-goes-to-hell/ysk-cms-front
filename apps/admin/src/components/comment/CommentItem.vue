<script setup lang="ts">
import { ref, computed } from 'vue'
import type { CommentDto } from '@/types/comment'

const props = defineProps<{
  comment: CommentDto
  maxDepth?: number
}>()

const emit = defineEmits<{
  reply: [parentId: number, content: string]
  update: [commentId: number, content: string]
  delete: [commentId: number]
}>()

// 상태
const isReplying = ref(false)
const isEditing = ref(false)
const replyContent = ref('')
const editContent = ref('')

// 최대 깊이 (기본값 10)
const maxDepthValue = props.maxDepth ?? 10

// 현재 depth (서버에서 받은 값 그대로 사용)
const depth = computed(() => props.comment.depth ?? 0)

// HSL to RGB 변환
const hslToRgb = (h: number, s: number, l: number): { r: number; g: number; b: number } => {
  s /= 100
  l /= 100
  const k = (n: number) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  return {
    r: Math.round(255 * f(0)),
    g: Math.round(255 * f(8)),
    b: Math.round(255 * f(4))
  }
}

// depth별 그라데이션 색상 생성
// 빨강(0) → 주황(30) → 노랑(50) → 연두(80) → 초록(120) → 청록(180) → 파랑(220) → 보라(270) → 핑크(320)
const getColorInfo = (d: number) => {
  // depth 1부터 시작, hue는 0(빨강)에서 시작해서 점진적으로 변화
  // 20개 정도의 색상 스펙트럼을 순환
  const hueStart = 10 // 연한 빨강 시작
  const hueStep = 18  // 각 depth마다 18도씩 이동
  const hue = (hueStart + (d - 1) * hueStep) % 360

  const saturation = 70 // 채도 70%
  const lightness = 50  // 밝기 50%

  const rgb = hslToRgb(hue, saturation, lightness)

  return {
    color: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
    rgb: `${rgb.r}, ${rgb.g}, ${rgb.b}`
  }
}

// depth별 스타일 계산
const depthStyle = computed(() => {
  const d = depth.value
  if (d === 0) return {}

  const colorInfo = getColorInfo(d)

  return {
    marginLeft: `${d * 24}px`,
    borderLeft: `3px solid ${colorInfo.color}`,
    background: `rgba(${colorInfo.rgb}, 0.03)`
  }
})

// 답글 배지 스타일
const replyBadgeStyle = computed(() => {
  const d = depth.value
  if (d === 0) return {}

  const colorInfo = getColorInfo(d)

  return {
    background: `rgba(${colorInfo.rgb}, 0.15)`,
    color: colorInfo.color
  }
})

// 날짜 포맷 (상대 시간)
const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (minutes < 1) return '방금 전'
  if (minutes < 60) return `${minutes}분 전`
  if (hours < 24) return `${hours}시간 전`
  if (days < 7) return `${days}일 전`

  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// 아바타 색상 (작성자 이름 기반)
const getAvatarColor = (name: string) => {
  const colors = [
    '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6',
    '#ec4899', '#06b6d4', '#84cc16', '#f97316'
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

// 작성자 이니셜
const getInitial = (name: string) => {
  return (name || '익명').charAt(0).toUpperCase()
}

// 답글 폼 토글
const toggleReplyForm = () => {
  isReplying.value = !isReplying.value
  if (isReplying.value) {
    replyContent.value = ''
    isEditing.value = false
  }
}

// 수정 폼 토글
const toggleEditForm = () => {
  isEditing.value = !isEditing.value
  if (isEditing.value) {
    editContent.value = props.comment.content
    isReplying.value = false
  }
}

// 답글 제출
const submitReply = () => {
  if (!replyContent.value.trim()) return
  emit('reply', props.comment.id, replyContent.value.trim())
  isReplying.value = false
  replyContent.value = ''
}

// 수정 제출
const submitEdit = () => {
  if (!editContent.value.trim()) return
  emit('update', props.comment.id, editContent.value.trim())
  isEditing.value = false
  editContent.value = ''
}

// 삭제
const handleDelete = () => {
  emit('delete', props.comment.id)
}

// 취소
const cancelReply = () => {
  isReplying.value = false
  replyContent.value = ''
}

const cancelEdit = () => {
  isEditing.value = false
  editContent.value = ''
}

const authorName = computed(() => props.comment.author || props.comment.createdBy || '익명')
</script>

<template>
  <div
    class="comment-item"
    :class="{ 'is-deleted': comment.deleted }"
    :style="depthStyle"
  >
    <!-- 대댓글 연결선 -->
    <div v-if="depth > 0" class="reply-thread">
      <div class="thread-line"></div>
      <div class="thread-arrow">
        <i class="mdi mdi-arrow-right-bottom"></i>
      </div>
    </div>

    <div class="comment-card">
      <!-- 아바타 -->
      <div
        class="avatar"
        :style="{ background: comment.deleted ? '#9ca3af' : getAvatarColor(authorName) }"
      >
        <template v-if="comment.deleted">
          <i class="mdi mdi-close"></i>
        </template>
        <template v-else>
          {{ getInitial(authorName) }}
        </template>
      </div>

      <div class="comment-content">
        <!-- 삭제된 댓글 -->
        <template v-if="comment.deleted">
          <div class="deleted-message">
            <i class="mdi mdi-alert-circle-outline"></i>
            삭제된 댓글입니다.
          </div>
        </template>

        <!-- 일반 댓글 -->
        <template v-else>
          <div class="comment-header">
            <div class="author-info">
              <span class="author-name">{{ authorName }}</span>
              <span v-if="depth > 0" class="reply-badge" :style="replyBadgeStyle">답글</span>
            </div>
            <span class="timestamp">{{ formatDate(comment.createdAt) }}</span>
          </div>

          <!-- 수정 모드 -->
          <template v-if="isEditing">
            <div class="edit-form">
              <textarea
                v-model="editContent"
                rows="3"
                class="edit-textarea"
                placeholder="댓글을 수정하세요..."
              ></textarea>
              <div class="form-buttons">
                <button class="btn-text" @click="cancelEdit">취소</button>
                <button class="btn-primary" @click="submitEdit">저장</button>
              </div>
            </div>
          </template>

          <!-- 일반 모드 -->
          <template v-else>
            <p class="comment-text">{{ comment.content }}</p>

            <div class="action-bar">
              <button
                v-if="depth < maxDepthValue"
                class="action-btn"
                @click="toggleReplyForm"
              >
                <i class="mdi mdi-message-reply-outline"></i>
                답글
              </button>
              <button class="action-btn" @click="toggleEditForm">
                <i class="mdi mdi-pencil-outline"></i>
                수정
              </button>
              <button class="action-btn danger" @click="handleDelete">
                <i class="mdi mdi-trash-can-outline"></i>
                삭제
              </button>
            </div>
          </template>

          <!-- 답글 작성 폼 -->
          <div v-if="isReplying" class="reply-form">
            <div class="reply-input-wrapper">
              <div class="mini-avatar" :style="{ background: '#f59e0b' }">
                <i class="mdi mdi-account"></i>
              </div>
              <textarea
                v-model="replyContent"
                placeholder="답글을 작성하세요..."
                rows="2"
                class="reply-textarea"
              ></textarea>
            </div>
            <div class="form-buttons">
              <button class="btn-text" @click="cancelReply">취소</button>
              <button class="btn-primary" @click="submitReply">
                <i class="mdi mdi-send"></i>
                답글 등록
              </button>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.comment-item {
  position: relative;
  padding: 0;
}

/* 삭제된 댓글 스타일 */
.comment-item.is-deleted {
  opacity: 0.6;
}

.comment-item.is-deleted .comment-card {
  background: var(--bg-tertiary);
}

/* 대댓글 연결선 */
.reply-thread {
  position: absolute;
  left: -20px;
  top: 0;
  bottom: 0;
  width: 20px;
  display: flex;
  align-items: flex-start;
  padding-top: 18px;
}

.thread-arrow {
  color: var(--text-tertiary);
}

.thread-arrow .mdi {
  font-size: 16px;
}

/* 댓글 카드 */
.comment-card {
  display: flex;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border-color);
  transition: background 0.15s;
}

.comment-card:hover {
  background: rgba(0, 0, 0, 0.02);
}

:root[data-theme="dark"] .comment-card:hover {
  background: rgba(255, 255, 255, 0.02);
}

/* 아바타 */
.avatar {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  color: white;
  text-transform: uppercase;
}


.avatar .mdi {
  font-size: 16px;
}

.mini-avatar {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.mini-avatar .mdi {
  font-size: 14px;
}

/* 콘텐츠 영역 */
.comment-content {
  flex: 1;
  min-width: 0;
}

/* 헤더 */
.comment-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.author-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.reply-badge {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
}

.timestamp {
  font-size: 11px;
  color: var(--text-tertiary);
}

/* 댓글 본문 */
.comment-text {
  margin: 0 0 10px 0;
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-primary);
  white-space: pre-wrap;
  word-break: break-word;
}

/* 삭제된 메시지 */
.deleted-message {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 0;
  font-size: 13px;
  color: var(--text-tertiary);
  font-style: italic;
}

.deleted-message .mdi {
  font-size: 16px;
}

/* 액션 바 */
.action-bar {
  display: flex;
  gap: 4px;
  margin-left: -8px;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  background: none;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  color: var(--text-tertiary);
  cursor: pointer;
  transition: all 0.15s;
}

.action-btn:hover {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
}

.action-btn.danger:hover {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.action-btn .mdi {
  font-size: 15px;
}

/* 답글 폼 */
.reply-form {
  margin-top: 12px;
  padding: 12px;
  background: var(--bg-tertiary);
  border-radius: 10px;
}

.reply-input-wrapper {
  display: flex;
  gap: 10px;
}

.reply-textarea,
.edit-textarea {
  flex: 1;
  width: 100%;
  padding: 10px 12px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 13px;
  font-family: inherit;
  color: var(--text-primary);
  resize: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.reply-textarea:focus,
.edit-textarea:focus {
  outline: none;
  border-color: #f59e0b;
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
}

.reply-textarea::placeholder,
.edit-textarea::placeholder {
  color: var(--text-tertiary);
}

/* 수정 폼 */
.edit-form {
  margin-top: 8px;
}

/* 폼 버튼 */
.form-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 10px;
}

.btn-text {
  padding: 6px 14px;
  background: none;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s;
}

.btn-text:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 14px;
  background: #f59e0b;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  color: white;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-primary:hover {
  background: #d97706;
}

.btn-primary .mdi {
  font-size: 14px;
}

/* 반응형 */
@media (max-width: 768px) {
  .comment-card {
    padding: 12px;
  }

  .avatar {
    width: 32px;
    height: 32px;
    font-size: 12px;
  }
}
</style>
