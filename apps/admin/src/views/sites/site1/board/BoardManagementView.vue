<script setup lang="ts">
/**
 * Site1 전용 게시판 관리 뷰
 * - 메인 사이트와 다른 UI: 테이블 형태 + 통계 카드
 * - 추가 컬럼: 게시글 수, 최근 게시일
 */
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getBoards, createBoard, updateBoard, deleteBoard } from '@/api/board'
import type { BoardDto, BoardCreateRequest, BoardUpdateRequest, BoardType, BoardStatus } from '@/types/board'

const route = useRoute()

const currentSiteCode = computed(() => route.params.siteId as string || 'site1')

// 상태
const boards = ref<BoardDto[]>([])
const isLoading = ref(false)
const searchQuery = ref('')
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
  { value: 'NORMAL', label: '일반', color: '#409EFF' },
  { value: 'GALLERY', label: '갤러리', color: '#67C23A' },
  { value: 'FAQ', label: 'FAQ', color: '#E6A23C' },
  { value: 'QNA', label: 'Q&A', color: '#F56C6C' },
  { value: 'NOTICE', label: '공지', color: '#909399' },
]

// 필터링된 게시판 목록
const filteredBoards = computed(() => {
  let result = boards.value
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(
      (board) =>
        board.name.toLowerCase().includes(query) ||
        board.code.toLowerCase().includes(query),
    )
  }
  if (filterStatus.value) {
    result = result.filter((board) => board.status === filterStatus.value)
  }
  return result
})

// 통계
const stats = computed(() => ({
  total: boards.value.length,
  active: boards.value.filter((b) => b.status === 'ACTIVE').length,
  inactive: boards.value.filter((b) => b.status === 'INACTIVE').length,
}))

// 게시판 목록 조회
const fetchBoards = async () => {
  isLoading.value = true
  try {
    const response = await getBoards(currentSiteCode.value)
    boards.value = response.data.data
  } catch {
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
    type: board.type,
    useComment: board.useComment,
    useAttachment: board.useAttachment,
    attachmentLimit: board.attachmentLimit,
    sortOrder: board.sortOrder,
    status: board.status,
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
      `'${board.name}' 게시판을 삭제하시겠습니까?`,
      '게시판 삭제',
      { confirmButtonText: '삭제', cancelButtonText: '취소', type: 'warning' },
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
    await updateBoard(currentSiteCode.value, board.code, { name: board.name, status: newStatus })
    board.status = newStatus
    ElMessage.success(`게시판이 ${newStatus === 'ACTIVE' ? '활성화' : '비활성화'}되었습니다.`)
  } catch {
    ElMessage.error('상태 변경에 실패했습니다.')
  }
}

const getTypeInfo = (type: BoardType) => {
  return boardTypeOptions.find((opt) => opt.value === type) || boardTypeOptions[0]
}

watch(currentSiteCode, () => fetchBoards())
onMounted(() => fetchBoards())
</script>

<template>
  <div class="site1-board-management">
    <!-- 사이트 배지 -->
    <div class="site-badge">
      <el-tag type="warning" effect="dark">Site1 전용 뷰</el-tag>
    </div>

    <!-- 페이지 헤더 -->
    <div class="page-header">
      <div class="header-content">
        <h1>게시판 관리</h1>
        <p>Site1 전용 게시판 관리 페이지입니다</p>
      </div>
      <el-button type="primary" :icon="Plus" @click="openCreateDialog">
        새 게시판
      </el-button>
    </div>

    <!-- 통계 카드 (Site1 전용 기능) -->
    <div class="stats-row">
      <div class="stat-card total">
        <div class="stat-icon"><el-icon :size="24"><Grid /></el-icon></div>
        <div class="stat-info">
          <span class="stat-value">{{ stats.total }}</span>
          <span class="stat-label">전체 게시판</span>
        </div>
      </div>
      <div class="stat-card active">
        <div class="stat-icon"><el-icon :size="24"><CircleCheck /></el-icon></div>
        <div class="stat-info">
          <span class="stat-value">{{ stats.active }}</span>
          <span class="stat-label">활성</span>
        </div>
      </div>
      <div class="stat-card inactive">
        <div class="stat-icon"><el-icon :size="24"><CircleClose /></el-icon></div>
        <div class="stat-info">
          <span class="stat-value">{{ stats.inactive }}</span>
          <span class="stat-label">비활성</span>
        </div>
      </div>
    </div>

    <!-- 검색/필터 -->
    <div class="filter-bar">
      <el-input
        v-model="searchQuery"
        placeholder="게시판 검색..."
        :prefix-icon="Search"
        clearable
        style="width: 240px"
      />
      <el-select v-model="filterStatus" placeholder="상태" clearable style="width: 120px">
        <el-option value="ACTIVE" label="활성" />
        <el-option value="INACTIVE" label="비활성" />
      </el-select>
    </div>

    <!-- 게시판 테이블 (Site1은 테이블 형태) -->
    <el-table v-loading="isLoading" :data="filteredBoards" stripe class="board-table">
      <el-table-column prop="code" label="코드" width="120">
        <template #default="{ row }">
          <code class="board-code">{{ row.code }}</code>
        </template>
      </el-table-column>
      <el-table-column prop="name" label="게시판명" min-width="150" />
      <el-table-column label="타입" width="100" align="center">
        <template #default="{ row }">
          <el-tag :color="getTypeInfo(row.type).color" effect="dark" size="small">
            {{ getTypeInfo(row.type).label }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="기능" width="140">
        <template #default="{ row }">
          <el-tag v-if="row.useComment" size="small" type="info">댓글</el-tag>
          <el-tag v-if="row.useAttachment" size="small" type="info" class="ml-1">첨부</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="sortOrder" label="순서" width="80" align="center" />
      <el-table-column label="상태" width="100" align="center">
        <template #default="{ row }">
          <el-switch
            :model-value="row.status === 'ACTIVE'"
            @change="toggleStatus(row)"
            active-text="활성"
            inactive-text="비활성"
            inline-prompt
          />
        </template>
      </el-table-column>
      <el-table-column label="관리" width="120" align="center">
        <template #default="{ row }">
          <el-button size="small" text type="primary" @click="openEditDialog(row)">
            수정
          </el-button>
          <el-button size="small" text type="danger" @click="handleDelete(row)">
            삭제
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 게시판 생성/수정 다이얼로그 -->
    <el-dialog
      v-model="showFormDialog"
      :title="isEditing ? '게시판 수정' : '새 게시판 생성'"
      width="500px"
    >
      <el-form :model="formData" label-width="100px">
        <el-form-item label="코드" required>
          <el-input v-model="formData.code" :disabled="isEditing" placeholder="board-code" />
        </el-form-item>
        <el-form-item label="이름" required>
          <el-input v-model="formData.name" placeholder="게시판 이름" />
        </el-form-item>
        <el-form-item label="설명">
          <el-input v-model="formData.description" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="타입">
          <el-select v-model="formData.type" style="width: 100%">
            <el-option
              v-for="opt in boardTypeOptions"
              :key="opt.value"
              :value="opt.value"
              :label="opt.label"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="기능">
          <el-checkbox v-model="formData.useComment">댓글</el-checkbox>
          <el-checkbox v-model="formData.useAttachment">첨부파일</el-checkbox>
        </el-form-item>
        <el-form-item v-if="formData.useAttachment" label="첨부 제한">
          <el-input-number v-model="formData.attachmentLimit" :min="1" :max="20" />
          <span class="ml-2">개</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showFormDialog = false">취소</el-button>
        <el-button type="primary" @click="saveBoard">저장</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { Plus, Search, Grid, CircleCheck, CircleClose } from '@element-plus/icons-vue'

export default {
  components: { Plus, Search, Grid, CircleCheck, CircleClose },
}
</script>

<style scoped>
.site1-board-management {
  width: 100%;
}

.site-badge {
  margin-bottom: 16px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.header-content h1 {
  font-size: 26px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 4px 0;
}

.header-content p {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
}

/* 통계 카드 - Site1 전용 */
.stats-row {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  border-radius: 12px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
}

.stat-card.total .stat-icon { color: #409EFF; background: #409EFF20; }
.stat-card.active .stat-icon { color: #67C23A; background: #67C23A20; }
.stat-card.inactive .stat-icon { color: #909399; background: #90939920; }

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
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

.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.board-table {
  border-radius: 12px;
  overflow: hidden;
}

.board-code {
  font-family: monospace;
  font-size: 13px;
  color: var(--accent-primary);
  background: var(--bg-tertiary);
  padding: 2px 6px;
  border-radius: 4px;
}

.ml-1 { margin-left: 4px; }
.ml-2 { margin-left: 8px; }
</style>
