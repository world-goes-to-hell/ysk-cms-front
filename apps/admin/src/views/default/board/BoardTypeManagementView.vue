<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getBoardTypes, createBoardType, updateBoardType, deleteBoardType } from '@/api/board'
import type { BoardTypeDto, BoardTypeCreateRequest, BoardTypeUpdateRequest, BoardTypeStatus } from '@/types/board'

const route = useRoute()

// 현재 사이트 코드
const currentSiteCode = computed(() => {
  const siteId = route.params.siteId as string
  return siteId || 'main'
})

// 상태
const boardTypes = ref<BoardTypeDto[]>([])
const isLoading = ref(false)
const searchQuery = ref('')

// 다이얼로그
const showFormDialog = ref(false)
const isEditing = ref(false)
const editingType = ref<BoardTypeDto | null>(null)

// 폼 데이터
const formData = ref<BoardTypeCreateRequest & { status?: BoardTypeStatus }>({
  code: '',
  name: '',
  description: '',
  icon: 'mdi-file-document-outline',
  color: '#6366f1',
  bgColor: 'rgba(99, 102, 241, 0.1)',
  sortOrder: 0,
})

// 아이콘 목록
const iconOptions = [
  'mdi-file-document-outline',
  'mdi-image-multiple-outline',
  'mdi-frequently-asked-questions',
  'mdi-chat-question-outline',
  'mdi-bullhorn-outline',
  'mdi-newspaper',
  'mdi-bulletin-board',
  'mdi-post',
  'mdi-format-list-bulleted',
  'mdi-view-dashboard',
  'mdi-folder-outline',
  'mdi-star-outline',
  'mdi-heart-outline',
  'mdi-bookmark-outline',
  'mdi-tag-outline',
  'mdi-calendar-outline',
  'mdi-clock-outline',
  'mdi-map-marker-outline',
  'mdi-account-group-outline',
  'mdi-cog-outline',
]

// 색상 프리셋
const colorPresets = [
  { color: '#6366f1', bgColor: 'rgba(99, 102, 241, 0.1)', name: '인디고' },
  { color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.1)', name: '그린' },
  { color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.1)', name: '오렌지' },
  { color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.1)', name: '레드' },
  { color: '#8b5cf6', bgColor: 'rgba(139, 92, 246, 0.1)', name: '퍼플' },
  { color: '#06b6d4', bgColor: 'rgba(6, 182, 212, 0.1)', name: '시안' },
  { color: '#ec4899', bgColor: 'rgba(236, 72, 153, 0.1)', name: '핑크' },
  { color: '#64748b', bgColor: 'rgba(100, 116, 139, 0.1)', name: '그레이' },
]

// 필터링된 목록
const filteredTypes = computed(() => {
  if (!searchQuery.value) return boardTypes.value

  const query = searchQuery.value.toLowerCase()
  return boardTypes.value.filter(
    (type) =>
      type.name.toLowerCase().includes(query) ||
      type.code.toLowerCase().includes(query) ||
      type.description?.toLowerCase().includes(query)
  )
})

// 타입 목록 조회
const fetchBoardTypes = async () => {
  isLoading.value = true
  try {
    const response = await getBoardTypes(currentSiteCode.value)
    boardTypes.value = response.data.data
  } catch (error) {
    ElMessage.error('게시판 타입을 불러오는데 실패했습니다.')
  } finally {
    isLoading.value = false
  }
}

// 새 타입 폼 열기
const openCreateDialog = () => {
  isEditing.value = false
  editingType.value = null
  formData.value = {
    code: '',
    name: '',
    description: '',
    icon: 'mdi-file-document-outline',
    color: '#6366f1',
    bgColor: 'rgba(99, 102, 241, 0.1)',
    sortOrder: boardTypes.value.length,
  }
  showFormDialog.value = true
}

// 타입 수정 폼 열기
const openEditDialog = (type: BoardTypeDto) => {
  isEditing.value = true
  editingType.value = type
  formData.value = {
    code: type.code,
    name: type.name,
    description: type.description || '',
    icon: type.icon || 'mdi-file-document-outline',
    color: type.color || '#6366f1',
    bgColor: type.bgColor || 'rgba(99, 102, 241, 0.1)',
    sortOrder: type.sortOrder ?? 0,
    status: type.status || 'ACTIVE',
  }
  showFormDialog.value = true
}

// 색상 프리셋 선택
const selectColorPreset = (preset: typeof colorPresets[0]) => {
  formData.value.color = preset.color
  formData.value.bgColor = preset.bgColor
}

// 타입 저장
const saveBoardType = async () => {
  if (!formData.value.code || !formData.value.name) {
    ElMessage.warning('코드와 이름은 필수입니다.')
    return
  }

  try {
    if (isEditing.value && editingType.value) {
      const updateData: BoardTypeUpdateRequest = {
        name: formData.value.name,
        description: formData.value.description,
        icon: formData.value.icon,
        color: formData.value.color,
        bgColor: formData.value.bgColor,
        sortOrder: formData.value.sortOrder,
        status: formData.value.status,
      }
      await updateBoardType(currentSiteCode.value, editingType.value.code, updateData)
      ElMessage.success('게시판 타입이 수정되었습니다.')
    } else {
      await createBoardType(currentSiteCode.value, formData.value)
      ElMessage.success('게시판 타입이 생성되었습니다.')
    }
    showFormDialog.value = false
    fetchBoardTypes()
  } catch (error: unknown) {
    const axiosError = error as { response?: { data?: { message?: string } } }
    ElMessage.error(axiosError.response?.data?.message || '저장에 실패했습니다.')
  }
}

// 타입 삭제
const handleDelete = async (type: BoardTypeDto) => {
  try {
    await ElMessageBox.confirm(
      `'${type.name}' 타입을 삭제하시겠습니까?\n이 타입을 사용하는 게시판이 있으면 삭제할 수 없습니다.`,
      '게시판 타입 삭제',
      {
        confirmButtonText: '삭제',
        cancelButtonText: '취소',
        type: 'warning',
      }
    )

    await deleteBoardType(currentSiteCode.value, type.code)
    ElMessage.success('게시판 타입이 삭제되었습니다.')
    fetchBoardTypes()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('삭제에 실패했습니다.')
    }
  }
}

// 상태 토글
const toggleStatus = async (type: BoardTypeDto) => {
  try {
    const newStatus: BoardTypeStatus = type.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    await updateBoardType(currentSiteCode.value, type.code, {
      status: newStatus,
    })
    type.status = newStatus
    ElMessage.success(`타입이 ${newStatus === 'ACTIVE' ? '활성화' : '비활성화'}되었습니다.`)
  } catch {
    ElMessage.error('상태 변경에 실패했습니다.')
  }
}

// 사이트 코드 변경 감지
watch(currentSiteCode, () => {
  fetchBoardTypes()
})

onMounted(() => {
  fetchBoardTypes()
})
</script>

<template>
  <div class="board-type-management">
    <!-- 페이지 헤더 -->
    <div class="page-header">
      <div class="header-left">
        <h1>
          <i class="mdi mdi-shape-outline"></i>
          게시판 타입 관리
        </h1>
        <p>게시판 타입을 생성하고 관리하세요</p>
      </div>
      <button class="btn-create" @click="openCreateDialog">
        <i class="mdi mdi-plus"></i>
        새 타입
      </button>
    </div>

    <!-- 검색 -->
    <div class="filter-section">
      <div class="search-box">
        <i class="mdi mdi-magnify"></i>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="타입 이름, 코드로 검색..."
        />
      </div>
    </div>

    <!-- 타입 목록 -->
    <div v-loading="isLoading" class="types-container">
      <div v-if="filteredTypes.length > 0" class="types-grid">
        <div
          v-for="type in filteredTypes"
          :key="type.id"
          class="type-card"
          :class="{ inactive: type.status !== 'ACTIVE' }"
        >
          <div class="type-header">
            <div
              class="type-icon"
              :style="{ backgroundColor: type.bgColor, color: type.color }"
            >
              <i :class="['mdi', type.icon]"></i>
            </div>
            <div class="type-actions">
              <button
                class="status-btn"
                :class="type.status === 'ACTIVE' ? 'active' : 'inactive'"
                @click="toggleStatus(type)"
                :title="type.status === 'ACTIVE' ? '비활성화' : '활성화'"
              >
                <i :class="['mdi', type.status === 'ACTIVE' ? 'mdi-check-circle' : 'mdi-close-circle']"></i>
              </button>
              <button class="action-btn edit" title="수정" @click="openEditDialog(type)">
                <i class="mdi mdi-pencil-outline"></i>
              </button>
              <button class="action-btn delete" title="삭제" @click="handleDelete(type)">
                <i class="mdi mdi-trash-can-outline"></i>
              </button>
            </div>
          </div>

          <div class="type-info">
            <h3 class="type-name">{{ type.name }}</h3>
            <span class="type-code">{{ type.code }}</span>
            <p v-if="type.description" class="type-desc">{{ type.description }}</p>
          </div>
        </div>
      </div>

      <!-- 빈 상태 -->
      <div v-else-if="!isLoading" class="empty-state">
        <div class="empty-icon">
          <i class="mdi mdi-shape-plus-outline"></i>
        </div>
        <h3>등록된 게시판 타입이 없습니다</h3>
        <p>새 타입을 생성하여 게시판을 분류하세요</p>
        <button class="btn-create-empty" @click="openCreateDialog">
          <i class="mdi mdi-plus"></i>
          첫 타입 만들기
        </button>
      </div>
    </div>

    <!-- 타입 생성/수정 다이얼로그 -->
    <el-dialog
      v-model="showFormDialog"
      :title="isEditing ? '게시판 타입 수정' : '새 게시판 타입'"
      width="600px"
      class="type-dialog"
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
              <label class="field-label required">타입 코드</label>
              <input
                v-model="formData.code"
                type="text"
                class="field-input"
                placeholder="예: notice"
                :disabled="isEditing"
              />
              <span class="field-hint">영문 소문자, 하이픈만 사용 (수정 불가)</span>
            </div>
            <div class="form-field">
              <label class="field-label required">타입 이름</label>
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
              placeholder="타입에 대한 간단한 설명"
              rows="2"
            ></textarea>
          </div>
        </div>

        <!-- 아이콘 선택 -->
        <div class="form-section">
          <h4 class="section-title">
            <i class="mdi mdi-emoticon-outline"></i>
            아이콘
          </h4>
          <div class="icon-selector">
            <button
              v-for="icon in iconOptions"
              :key="icon"
              type="button"
              class="icon-option"
              :class="{ selected: formData.icon === icon }"
              @click="formData.icon = icon"
            >
              <i :class="['mdi', icon]"></i>
            </button>
          </div>
        </div>

        <!-- 색상 선택 -->
        <div class="form-section">
          <h4 class="section-title">
            <i class="mdi mdi-palette-outline"></i>
            색상
          </h4>
          <div class="color-selector">
            <button
              v-for="preset in colorPresets"
              :key="preset.name"
              type="button"
              class="color-option"
              :class="{ selected: formData.color === preset.color }"
              :style="{ backgroundColor: preset.bgColor, borderColor: preset.color }"
              @click="selectColorPreset(preset)"
            >
              <span class="color-dot" :style="{ backgroundColor: preset.color }"></span>
              <span class="color-name">{{ preset.name }}</span>
            </button>
          </div>
          <div class="color-preview">
            <span class="preview-label">미리보기:</span>
            <div
              class="preview-badge"
              :style="{ backgroundColor: formData.bgColor, color: formData.color }"
            >
              <i :class="['mdi', formData.icon]"></i>
              {{ formData.name || '타입명' }}
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
          <button class="btn-save" @click="saveBoardType">
            <i class="mdi" :class="isEditing ? 'mdi-content-save' : 'mdi-plus'"></i>
            {{ isEditing ? '저장' : '생성' }}
          </button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.board-type-management {
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

/* 검색 */
.filter-section {
  margin-bottom: 24px;
}

.search-box {
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

/* 타입 그리드 */
.types-container {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 24px;
}

.types-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.type-card {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 14px;
  padding: 20px;
  transition: all 0.2s ease;
}

.type-card:hover {
  border-color: var(--accent-primary);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.1);
}

.type-card.inactive {
  opacity: 0.6;
}

.type-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.type-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
}

.type-icon .mdi {
  font-size: 24px;
}

.type-actions {
  display: flex;
  gap: 6px;
}

.status-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.status-btn.active {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.status-btn.inactive {
  background: rgba(107, 114, 128, 0.1);
  color: #6b7280;
}

.status-btn .mdi {
  font-size: 18px;
}

.action-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn .mdi {
  font-size: 16px;
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

.type-info {
  margin-bottom: 16px;
}

.type-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 4px 0;
}

.type-code {
  font-size: 12px;
  font-family: 'Monaco', 'Menlo', monospace;
  color: var(--accent-primary);
  background: rgba(99, 102, 241, 0.1);
  padding: 2px 8px;
  border-radius: 4px;
}

.type-desc {
  font-size: 13px;
  color: var(--text-tertiary);
  margin: 8px 0 0 0;
}

/* 빈 상태 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
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

.section-desc {
  font-size: 12px;
  color: var(--text-tertiary);
  margin: -8px 0 16px 0;
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

/* 아이콘 선택 */
.icon-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.icon-option {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  border: 2px solid var(--border-color);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.icon-option .mdi {
  font-size: 22px;
  color: var(--text-secondary);
}

.icon-option:hover {
  border-color: var(--accent-primary);
}

.icon-option:hover .mdi {
  color: var(--accent-primary);
}

.icon-option.selected {
  border-color: var(--accent-primary);
  background: rgba(99, 102, 241, 0.1);
}

.icon-option.selected .mdi {
  color: var(--accent-primary);
}

/* 색상 선택 */
.color-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 16px;
}

.color-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border: 2px solid transparent;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.color-option:hover {
  transform: scale(1.02);
}

.color-option.selected {
  border-width: 2px;
}

.color-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.color-name {
  font-size: 12px;
  font-weight: 500;
  color: inherit;
}

.color-preview {
  display: flex;
  align-items: center;
  gap: 12px;
}

.preview-label {
  font-size: 12px;
  color: var(--text-tertiary);
}

.preview-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
}

.preview-badge .mdi {
  font-size: 18px;
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
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 16px;
  }

  .btn-create {
    width: 100%;
    justify-content: center;
  }

  .search-box {
    max-width: none;
  }

  .types-grid {
    grid-template-columns: 1fr;
  }

  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
