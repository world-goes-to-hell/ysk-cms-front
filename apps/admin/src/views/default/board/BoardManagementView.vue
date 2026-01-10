<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getBoards, createBoard, updateBoard, deleteBoard } from '@/api/board'
import type { BoardDto, BoardCreateRequest, BoardUpdateRequest, BoardType, BoardStatus } from '@/types/board'

const route = useRoute()

// 현재 사이트 코드
const currentSiteCode = computed(() => {
  const siteId = route.params.siteId as string
  return siteId || 'main'
})

// 상태
const boards = ref<BoardDto[]>([])
const isLoading = ref(false)
const searchQuery = ref('')
const filterType = ref<BoardType | ''>('')
const filterStatus = ref<BoardStatus | ''>('')

// 다이얼로그
const showFormDialog = ref(false)
const isEditing = ref(false)
const editingBoard = ref<BoardDto | null>(null)

// 폼 데이터
const formData = ref<BoardCreateRequest & { status?: BoardStatus }>({
  code: '',
  name: '',
  description: '',
  type: 'NORMAL',
  useComment: true,
  useAttachment: true,
  attachmentLimit: 5,
  sortOrder: 0,
})

// 게시판 타입 옵션
const boardTypeOptions = [
  { value: 'NORMAL', label: '일반', icon: 'mdi-file-document-outline', color: '#6366f1', bgColor: 'rgba(99, 102, 241, 0.1)' },
  { value: 'GALLERY', label: '갤러리', icon: 'mdi-image-multiple-outline', color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.1)' },
  { value: 'FAQ', label: 'FAQ', icon: 'mdi-frequently-asked-questions', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.1)' },
  { value: 'QNA', label: 'Q&A', icon: 'mdi-chat-question-outline', color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.1)' },
  { value: 'NOTICE', label: '공지', icon: 'mdi-bullhorn-outline', color: '#8b5cf6', bgColor: 'rgba(139, 92, 246, 0.1)' },
]

// 필터링된 게시판 목록
const filteredBoards = computed(() => {
  let result = boards.value

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(
      (board) =>
        board.name.toLowerCase().includes(query) ||
        board.code.toLowerCase().includes(query) ||
        board.description?.toLowerCase().includes(query),
    )
  }

  if (filterType.value) {
    result = result.filter((board) => board.type === filterType.value)
  }

  if (filterStatus.value) {
    result = result.filter((board) => board.status === filterStatus.value)
  }

  return result
})

// 게시판 목록 조회
const fetchBoards = async () => {
  isLoading.value = true
  try {
    const response = await getBoards(currentSiteCode.value)
    boards.value = response.data.data
  } catch (error) {
    ElMessage.error('게시판 목록을 불러오는데 실패했습니다.')
  } finally {
    isLoading.value = false
  }
}

// 새 게시판 폼 열기
const openCreateDialog = () => {
  isEditing.value = false
  editingBoard.value = null
  formData.value = {
    code: '',
    name: '',
    description: '',
    type: 'NORMAL',
    useComment: true,
    useAttachment: true,
    attachmentLimit: 5,
    sortOrder: boards.value.length,
  }
  showFormDialog.value = true
}

// 게시판 수정 폼 열기
const openEditDialog = (board: BoardDto) => {
  isEditing.value = true
  editingBoard.value = board
  formData.value = {
    code: board.code,
    name: board.name,
    description: board.description || '',
    type: board.type || 'NORMAL',
    useComment: board.useComment ?? true,
    useAttachment: board.useAttachment ?? true,
    attachmentLimit: board.attachmentLimit ?? 5,
    sortOrder: board.sortOrder ?? 0,
    status: board.status || 'ACTIVE',
  }
  showFormDialog.value = true
}

// 게시판 저장
const saveBoard = async () => {
  if (!formData.value.code || !formData.value.name) {
    ElMessage.warning('코드와 이름은 필수입니다.')
    return
  }

  try {
    if (isEditing.value && editingBoard.value) {
      const updateData: BoardUpdateRequest = {
        name: formData.value.name,
        description: formData.value.description,
        type: formData.value.type,
        useComment: formData.value.useComment,
        useAttachment: formData.value.useAttachment,
        attachmentLimit: formData.value.attachmentLimit,
        sortOrder: formData.value.sortOrder,
        status: formData.value.status,
      }
      await updateBoard(currentSiteCode.value, editingBoard.value.code, updateData)
      ElMessage.success('게시판이 수정되었습니다.')
    } else {
      await createBoard(currentSiteCode.value, formData.value)
      ElMessage.success('게시판이 생성되었습니다.')
    }
    showFormDialog.value = false
    fetchBoards()
  } catch (error: unknown) {
    const axiosError = error as { response?: { data?: { message?: string } } }
    ElMessage.error(axiosError.response?.data?.message || '저장에 실패했습니다.')
  }
}

// 게시판 삭제
const handleDelete = async (board: BoardDto) => {
  try {
    await ElMessageBox.confirm(
      `'${board.name}' 게시판을 삭제하시겠습니까?\n게시판 내의 모든 게시글도 함께 삭제됩니다.`,
      '게시판 삭제',
      {
        confirmButtonText: '삭제',
        cancelButtonText: '취소',
        type: 'warning',
      },
    )

    await deleteBoard(currentSiteCode.value, board.code)
    ElMessage.success('게시판이 삭제되었습니다.')
    fetchBoards()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('삭제에 실패했습니다.')
    }
  }
}

// 상태 토글
const toggleStatus = async (board: BoardDto) => {
  try {
    const newStatus: BoardStatus = board.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    await updateBoard(currentSiteCode.value, board.code, {
      name: board.name,
      status: newStatus,
    })
    board.status = newStatus
    ElMessage.success(`게시판이 ${newStatus === 'ACTIVE' ? '활성화' : '비활성화'}되었습니다.`)
  } catch {
    ElMessage.error('상태 변경에 실패했습니다.')
  }
}

// 게시판 타입 정보 가져오기
const getTypeInfo = (type: BoardType | undefined) => {
  if (!type) return boardTypeOptions[0]
  return boardTypeOptions.find((opt) => opt.value === type) || boardTypeOptions[0]
}

// 사이트 코드 변경 감지
watch(currentSiteCode, () => {
  fetchBoards()
})

onMounted(() => {
  fetchBoards()
})
</script>

<template>
  <div class="board-management">
    <!-- 페이지 헤더 -->
    <div class="page-header">
      <div class="header-left">
        <h1>
          <i class="mdi mdi-view-dashboard-outline"></i>
          게시판 관리
        </h1>
        <p>게시판을 생성하고 관리하세요</p>
      </div>
      <button class="btn-create" @click="openCreateDialog">
        <i class="mdi mdi-plus"></i>
        새 게시판
      </button>
    </div>

    <!-- 통계 카드 -->
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-icon total">
          <i class="mdi mdi-view-grid-outline"></i>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ boards.length }}</span>
          <span class="stat-label">전체 게시판</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon active">
          <i class="mdi mdi-check-circle-outline"></i>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ boards.filter(b => b.status === 'ACTIVE').length }}</span>
          <span class="stat-label">활성 게시판</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon inactive">
          <i class="mdi mdi-pause-circle-outline"></i>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ boards.filter(b => b.status !== 'ACTIVE').length }}</span>
          <span class="stat-label">비활성 게시판</span>
        </div>
      </div>
    </div>

    <!-- 검색 및 필터 -->
    <div class="filter-section">
      <div class="search-box">
        <i class="mdi mdi-magnify"></i>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="게시판 이름, 코드로 검색..."
        />
      </div>
      <div class="filter-group">
        <select v-model="filterType" class="filter-select">
          <option value="">타입 전체</option>
          <option v-for="opt in boardTypeOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
        <select v-model="filterStatus" class="filter-select">
          <option value="">상태 전체</option>
          <option value="ACTIVE">활성</option>
          <option value="INACTIVE">비활성</option>
        </select>
      </div>
    </div>

    <!-- 게시판 목록 -->
    <div v-loading="isLoading" class="boards-container">
      <!-- 게시판 테이블 -->
      <div v-if="filteredBoards.length > 0" class="boards-table">
        <div class="table-header">
          <div class="col-info">게시판 정보</div>
          <div class="col-type">타입</div>
          <div class="col-features">기능</div>
          <div class="col-status">상태</div>
          <div class="col-actions">관리</div>
        </div>

        <div
          v-for="board in filteredBoards"
          :key="board.id"
          class="table-row"
          :class="{ inactive: board.status !== 'ACTIVE' }"
        >
          <!-- 게시판 정보 -->
          <div class="col-info">
            <div
              class="board-icon"
              :style="{
                backgroundColor: getTypeInfo(board.type).bgColor,
                color: getTypeInfo(board.type).color
              }"
            >
              <i :class="['mdi', getTypeInfo(board.type).icon]"></i>
            </div>
            <div class="board-details">
              <h3 class="board-name">{{ board.name }}</h3>
              <span class="board-code">{{ board.code }}</span>
              <p v-if="board.description" class="board-desc">{{ board.description }}</p>
            </div>
          </div>

          <!-- 타입 -->
          <div class="col-type">
            <span
              class="type-badge"
              :style="{
                backgroundColor: getTypeInfo(board.type).bgColor,
                color: getTypeInfo(board.type).color
              }"
            >
              {{ getTypeInfo(board.type).label }}
            </span>
          </div>

          <!-- 기능 -->
          <div class="col-features">
            <div class="feature-tags">
              <span v-if="board.useComment" class="feature-tag">
                <i class="mdi mdi-comment-outline"></i> 댓글
              </span>
              <span v-if="board.useAttachment" class="feature-tag">
                <i class="mdi mdi-paperclip"></i> 첨부 {{ board.attachmentLimit }}개
              </span>
              <span v-if="!board.useComment && !board.useAttachment" class="feature-tag none">
                -
              </span>
            </div>
          </div>

          <!-- 상태 -->
          <div class="col-status">
            <button
              class="status-toggle"
              :class="board.status === 'ACTIVE' ? 'active' : 'inactive'"
              @click="toggleStatus(board)"
            >
              <span class="status-dot"></span>
              <span class="status-text">{{ board.status === 'ACTIVE' ? '활성' : '비활성' }}</span>
            </button>
          </div>

          <!-- 관리 버튼 -->
          <div class="col-actions">
            <button class="action-btn edit" title="수정" @click="openEditDialog(board)">
              <i class="mdi mdi-pencil-outline"></i>
            </button>
            <button class="action-btn delete" title="삭제" @click="handleDelete(board)">
              <i class="mdi mdi-trash-can-outline"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- 빈 상태 -->
      <div v-else-if="!isLoading" class="empty-state">
        <div class="empty-icon">
          <i class="mdi mdi-folder-open-outline"></i>
        </div>
        <h3>등록된 게시판이 없습니다</h3>
        <p>새 게시판을 생성하여 콘텐츠를 관리하세요</p>
        <button class="btn-create-empty" @click="openCreateDialog">
          <i class="mdi mdi-plus"></i>
          첫 게시판 만들기
        </button>
      </div>
    </div>

    <!-- 게시판 생성/수정 다이얼로그 -->
    <el-dialog
      v-model="showFormDialog"
      :title="isEditing ? '게시판 수정' : '새 게시판 생성'"
      width="600px"
      class="board-dialog"
      destroy-on-close
    >
      <div class="dialog-form">
        <!-- 기본 정보 -->
        <div class="form-section">
          <h4 class="section-title">
            <i class="mdi mdi-information-outline"></i>
            기본 정보
          </h4>
          <div class="form-row">
            <div class="form-field">
              <label class="field-label required">게시판 코드</label>
              <input
                v-model="formData.code"
                type="text"
                class="field-input"
                placeholder="예: notice"
                :disabled="isEditing"
              />
              <span class="field-hint">영문, 숫자, 하이픈만 사용 (수정 불가)</span>
            </div>
            <div class="form-field">
              <label class="field-label required">게시판 이름</label>
              <input
                v-model="formData.name"
                type="text"
                class="field-input"
                placeholder="예: 공지사항"
              />
            </div>
          </div>
          <div class="form-field full">
            <label class="field-label">설명</label>
            <textarea
              v-model="formData.description"
              class="field-textarea"
              placeholder="게시판에 대한 간단한 설명"
              rows="2"
            ></textarea>
          </div>
        </div>

        <!-- 게시판 타입 -->
        <div class="form-section">
          <h4 class="section-title">
            <i class="mdi mdi-shape-outline"></i>
            게시판 타입
          </h4>
          <div class="type-selector">
            <label
              v-for="opt in boardTypeOptions"
              :key="opt.value"
              class="type-option"
              :class="{ selected: formData.type === opt.value }"
            >
              <input
                v-model="formData.type"
                type="radio"
                :value="opt.value"
                class="type-radio"
              />
              <div class="type-content">
                <i :class="['mdi', opt.icon]" :style="{ color: opt.color }"></i>
                <span>{{ opt.label }}</span>
              </div>
            </label>
          </div>
        </div>

        <!-- 기능 설정 -->
        <div class="form-section">
          <h4 class="section-title">
            <i class="mdi mdi-cog-outline"></i>
            기능 설정
          </h4>
          <div class="feature-options">
            <label class="toggle-option">
              <input v-model="formData.useComment" type="checkbox" class="toggle-checkbox" />
              <span class="toggle-switch"></span>
              <span class="toggle-label">
                <i class="mdi mdi-comment-outline"></i>
                댓글 기능
              </span>
            </label>
            <label class="toggle-option">
              <input v-model="formData.useAttachment" type="checkbox" class="toggle-checkbox" />
              <span class="toggle-switch"></span>
              <span class="toggle-label">
                <i class="mdi mdi-paperclip"></i>
                첨부파일
              </span>
            </label>
            <div v-if="formData.useAttachment" class="attachment-limit">
              <label>최대 첨부 개수</label>
              <input
                v-model.number="formData.attachmentLimit"
                type="number"
                min="1"
                max="20"
                class="limit-input"
              />
              <span>개</span>
            </div>
          </div>
        </div>

        <!-- 추가 설정 (수정 시) -->
        <div v-if="isEditing" class="form-section">
          <h4 class="section-title">
            <i class="mdi mdi-tune"></i>
            추가 설정
          </h4>
          <div class="form-row">
            <div class="form-field">
              <label class="field-label">정렬 순서</label>
              <input
                v-model.number="formData.sortOrder"
                type="number"
                min="0"
                class="field-input"
              />
            </div>
            <div class="form-field">
              <label class="field-label">상태</label>
              <select v-model="formData.status" class="field-select">
                <option value="ACTIVE">활성</option>
                <option value="INACTIVE">비활성</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <button class="btn-cancel" @click="showFormDialog = false">취소</button>
          <button class="btn-save" @click="saveBoard">
            <i class="mdi" :class="isEditing ? 'mdi-content-save' : 'mdi-plus'"></i>
            {{ isEditing ? '저장' : '생성' }}
          </button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.board-management {
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
  color: var(--accent-primary);
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
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.btn-create:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
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
  background: rgba(99, 102, 241, 0.1);
  color: #6366f1;
}

.stat-icon.active {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.stat-icon.inactive {
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
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
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
  border-color: var(--accent-primary);
}

/* 게시판 테이블 */
.boards-container {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  overflow: hidden;
}

.boards-table {
  width: 100%;
}

.table-header {
  display: grid;
  grid-template-columns: 1fr 100px 160px 100px 100px;
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
  grid-template-columns: 1fr 100px 160px 100px 100px;
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

.table-row.inactive {
  opacity: 0.6;
}

/* 게시판 정보 */
.col-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.board-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  flex-shrink: 0;
}

.board-icon .mdi {
  font-size: 24px;
}

.board-details {
  min-width: 0;
}

.board-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.board-code {
  font-size: 12px;
  font-family: 'Monaco', 'Menlo', monospace;
  color: var(--accent-primary);
  background: rgba(99, 102, 241, 0.1);
  padding: 2px 8px;
  border-radius: 4px;
  display: inline-block;
  margin-top: 4px;
}

.board-desc {
  font-size: 13px;
  color: var(--text-tertiary);
  margin: 6px 0 0 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 타입 배지 */
.type-badge {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
}

/* 기능 태그 */
.feature-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.feature-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: var(--bg-tertiary);
  border-radius: 6px;
  font-size: 11px;
  color: var(--text-secondary);
}

.feature-tag .mdi {
  font-size: 14px;
}

.feature-tag.none {
  color: var(--text-tertiary);
}

/* 상태 토글 */
.status-toggle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border: none;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.status-toggle.active {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.status-toggle.inactive {
  background: rgba(107, 114, 128, 0.1);
  color: #6b7280;
}

.status-toggle:hover {
  transform: scale(1.05);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
}

/* 액션 버튼 */
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
  color: var(--accent-primary);
}

.action-btn.edit:hover {
  background: rgba(99, 102, 241, 0.1);
  border-color: var(--accent-primary);
}

.action-btn.delete {
  color: #ef4444;
}

.action-btn.delete:hover {
  background: rgba(239, 68, 68, 0.1);
  border-color: #ef4444;
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
  background: var(--bg-tertiary);
  border-radius: 20px;
  margin-bottom: 24px;
}

.empty-icon .mdi {
  font-size: 40px;
  color: var(--text-tertiary);
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
  background: var(--accent-primary);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-create-empty:hover {
  background: #4f46e5;
}

/* 다이얼로그 폼 */
.dialog-form {
  padding: 8px 0;
}

.form-section {
  margin-bottom: 28px;
}

.form-section:last-child {
  margin-bottom: 0;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 16px 0;
}

.section-title .mdi {
  font-size: 18px;
  color: var(--accent-primary);
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
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.field-input:disabled {
  background: var(--bg-tertiary);
  color: var(--text-tertiary);
  cursor: not-allowed;
}

.field-textarea {
  resize: vertical;
  min-height: 60px;
}

.field-hint {
  font-size: 11px;
  color: var(--text-tertiary);
}

/* 타입 선택 */
.type-selector {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.type-option {
  flex: 1;
  min-width: 90px;
}

.type-radio {
  display: none;
}

.type-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 12px;
  background: var(--bg-secondary);
  border: 2px solid var(--border-color);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.type-content .mdi {
  font-size: 24px;
}

.type-content span {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
}

.type-option.selected .type-content {
  border-color: var(--accent-primary);
  background: rgba(99, 102, 241, 0.05);
}

.type-option.selected .type-content span {
  color: var(--accent-primary);
}

/* 기능 옵션 */
.feature-options {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.toggle-option {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
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
  background: var(--accent-primary);
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

.attachment-limit {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-left: 56px;
  font-size: 13px;
  color: var(--text-secondary);
}

.limit-input {
  width: 60px;
  padding: 6px 10px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 13px;
  color: var(--text-primary);
  text-align: center;
}

.limit-input:focus {
  outline: none;
  border-color: var(--accent-primary);
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
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
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
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.btn-save .mdi {
  font-size: 18px;
}

/* 반응형 */
@media (max-width: 1024px) {
  .stats-row {
    grid-template-columns: repeat(3, 1fr);
  }

  .table-header,
  .table-row {
    grid-template-columns: 1fr 80px 140px 90px 90px;
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

  .col-type,
  .col-features,
  .col-status {
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

  .type-selector {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
  }

  .type-option {
    min-width: auto;
  }
}
</style>
