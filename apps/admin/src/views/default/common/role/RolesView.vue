<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  type Role,
  type CreateRoleRequest,
  type UpdateRoleRequest,
} from '@/api/role'

// 역할 목록
const roles = ref<Role[]>([])
const loading = ref(false)

// 모달 상태
const showModal = ref(false)
const modalMode = ref<'create' | 'edit'>('create')
const formLoading = ref(false)
const selectedRole = ref<Role | null>(null)

// 폼 데이터
const formData = ref<CreateRoleRequest & { id?: number }>({
  name: '',
  description: '',
})

// 시스템 기본 역할 목록
const systemRoles = ['SUPER_ADMIN', 'ADMIN', 'SITE_ADMIN', 'EDITOR', 'VIEWER']

// 시스템 역할 여부
const isSystemRole = (name: string) => systemRoles.includes(name)

// 역할 설명 (기본 역할용)
const getRoleDescription = (role: Role) => {
  if (role.description) return role.description
  const descriptions: Record<string, string> = {
    SUPER_ADMIN: '최고 관리자 - 모든 권한',
    ADMIN: '관리자 - 대부분의 관리 권한',
    SITE_ADMIN: '사이트 관리자 - 사이트별 관리 권한',
    EDITOR: '편집자 - 콘텐츠 편집 권한',
    VIEWER: '뷰어 - 조회 권한',
  }
  return descriptions[role.name] || ''
}

// 데이터 조회
const fetchRoles = async () => {
  loading.value = true
  try {
    const response = await getRoles()
    if (response.data.success) {
      roles.value = response.data.data
    }
  } catch (error) {
    console.error('역할 목록 조회 실패:', error)
    ElMessage.error('역할 목록을 불러오는데 실패했습니다.')
  } finally {
    loading.value = false
  }
}

// 폼 초기화
const resetForm = () => {
  formData.value = {
    name: '',
    description: '',
  }
  selectedRole.value = null
}

// 역할 추가 모달 열기
const handleAdd = () => {
  modalMode.value = 'create'
  resetForm()
  showModal.value = true
}

// 역할 수정 모달 열기
const handleEdit = (role: Role) => {
  if (isSystemRole(role.name)) {
    ElMessage.warning('시스템 기본 역할은 수정할 수 없습니다.')
    return
  }
  modalMode.value = 'edit'
  selectedRole.value = role
  formData.value = {
    id: role.id,
    name: role.name,
    description: role.description || '',
  }
  showModal.value = true
}

// 모달 닫기
const handleCloseModal = () => {
  showModal.value = false
  resetForm()
}

// 폼 제출
const handleSubmit = async () => {
  // 유효성 검사
  if (!formData.value.name.trim()) {
    ElMessage.warning('역할명을 입력해주세요.')
    return
  }

  formLoading.value = true
  try {
    if (modalMode.value === 'create') {
      const createData: CreateRoleRequest = {
        name: formData.value.name.toUpperCase().replace(/\s+/g, '_'),
        description: formData.value.description,
      }
      const response = await createRole(createData)
      if (response.data.success) {
        ElMessage.success('역할이 생성되었습니다.')
        handleCloseModal()
        fetchRoles()
      }
    } else {
      const updateData: UpdateRoleRequest = {
        name: formData.value.name.toUpperCase().replace(/\s+/g, '_'),
        description: formData.value.description,
      }
      const response = await updateRole(formData.value.id!, updateData)
      if (response.data.success) {
        ElMessage.success('역할 정보가 수정되었습니다.')
        handleCloseModal()
        fetchRoles()
      }
    }
  } catch (error: any) {
    console.error('역할 저장 실패:', error)
    const message = error.response?.data?.message || '역할 저장에 실패했습니다.'
    ElMessage.error(message)
  } finally {
    formLoading.value = false
  }
}

// 역할 삭제
const handleDelete = async (role: Role) => {
  if (isSystemRole(role.name)) {
    ElMessage.warning('시스템 기본 역할은 삭제할 수 없습니다.')
    return
  }

  try {
    await ElMessageBox.confirm(
      `"${role.name}" 역할을 삭제하시겠습니까?`,
      '역할 삭제',
      {
        confirmButtonText: '삭제',
        cancelButtonText: '취소',
        type: 'warning',
      }
    )

    const response = await deleteRole(role.id)
    if (response.data.success) {
      ElMessage.success('역할이 삭제되었습니다.')
      fetchRoles()
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('역할 삭제 실패:', error)
      const message = error.response?.data?.message || '역할 삭제에 실패했습니다.'
      ElMessage.error(message)
    }
  }
}

// 날짜 포맷
const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

onMounted(() => {
  fetchRoles()
})
</script>

<template>
  <div class="roles-page" v-loading="loading">
    <!-- 페이지 헤더 -->
    <div class="page-header">
      <div class="header-left">
        <h1>
          <i class="mdi mdi-shield-account"></i>
          권한 관리
        </h1>
        <p>시스템 역할(Role)을 관리합니다. 메뉴별 접근 권한을 제어할 수 있습니다.</p>
      </div>
      <div class="header-right">
        <button class="btn-add" @click="handleAdd">
          <i class="mdi mdi-plus"></i>
          역할 추가
        </button>
      </div>
    </div>

    <!-- 역할 목록 -->
    <div class="roles-container">
      <div v-if="roles.length > 0" class="roles-grid">
        <div
          v-for="role in roles"
          :key="role.id"
          class="role-card"
          :class="{ 'system-role': isSystemRole(role.name) }"
        >
          <div class="role-header">
            <div class="role-icon" :class="role.name.toLowerCase()">
              <i class="mdi mdi-shield-account"></i>
            </div>
            <div class="role-info">
              <h3 class="role-name">{{ role.name }}</h3>
              <p class="role-description">{{ getRoleDescription(role) }}</p>
            </div>
          </div>

          <div class="role-meta">
            <div class="meta-item">
              <i class="mdi mdi-calendar-outline"></i>
              <span>{{ formatDate(role.createdAt) }}</span>
            </div>
            <span v-if="isSystemRole(role.name)" class="system-badge">
              <i class="mdi mdi-lock-outline"></i>
              시스템
            </span>
          </div>

          <div class="role-actions">
            <button
              class="btn-action edit"
              @click="handleEdit(role)"
              title="수정"
              :disabled="isSystemRole(role.name)"
            >
              <i class="mdi mdi-pencil-outline"></i>
            </button>
            <button
              class="btn-action delete"
              @click="handleDelete(role)"
              title="삭제"
              :disabled="isSystemRole(role.name)"
            >
              <i class="mdi mdi-trash-can-outline"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- 빈 상태 -->
      <div v-else-if="!loading" class="empty-state">
        <div class="empty-icon">
          <i class="mdi mdi-shield-account"></i>
        </div>
        <h3>역할이 없습니다</h3>
        <p>새 역할을 추가해주세요</p>
        <button class="btn-add-empty" @click="handleAdd">
          <i class="mdi mdi-plus"></i>
          역할 추가
        </button>
      </div>
    </div>

    <!-- 역할 추가/수정 모달 -->
    <Teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click.self="handleCloseModal">
        <div class="modal-container" v-loading="formLoading">
          <div class="modal-header">
            <h2>
              <i class="mdi" :class="modalMode === 'create' ? 'mdi-shield-plus' : 'mdi-shield-edit'"></i>
              {{ modalMode === 'create' ? '역할 추가' : '역할 수정' }}
            </h2>
            <button class="modal-close" @click="handleCloseModal">
              <i class="mdi mdi-close"></i>
            </button>
          </div>

          <div class="modal-body">
            <div class="form-group">
              <label class="form-label required">역할명</label>
              <input
                v-model="formData.name"
                type="text"
                class="form-input"
                placeholder="역할명을 입력하세요 (예: CONTENT_MANAGER)"
              />
              <span class="form-hint">영문 대문자와 언더스코어(_)로 자동 변환됩니다.</span>
            </div>

            <div class="form-group">
              <label class="form-label">설명</label>
              <textarea
                v-model="formData.description"
                class="form-textarea"
                placeholder="역할에 대한 설명을 입력하세요"
                rows="3"
              ></textarea>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn-cancel" @click="handleCloseModal">취소</button>
            <button class="btn-submit" @click="handleSubmit">
              <i class="mdi" :class="modalMode === 'create' ? 'mdi-plus' : 'mdi-check'"></i>
              {{ modalMode === 'create' ? '추가' : '저장' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.roles-page {
  width: 100%;
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
  color: #6366f1;
}

.header-left p {
  font-size: 15px;
  color: var(--text-secondary);
  margin: 0;
}

.btn-add {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: linear-gradient(135deg, #6366f1, #818cf8);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.btn-add:hover {
  background: linear-gradient(135deg, #4f46e5, #6366f1);
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(99, 102, 241, 0.4);
}

.btn-add .mdi {
  font-size: 20px;
}

/* 역할 컨테이너 */
.roles-container {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 24px;
}

.roles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

/* 역할 카드 */
.role-card {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 20px;
  transition: all 0.2s ease;
}

.role-card:hover {
  border-color: #6366f1;
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.1);
}

.role-card.system-role {
  border-color: rgba(99, 102, 241, 0.3);
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.02), rgba(129, 140, 248, 0.02));
}

.role-header {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.role-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(99, 102, 241, 0.1);
  border-radius: 12px;
  flex-shrink: 0;
}

.role-icon .mdi {
  font-size: 24px;
  color: #6366f1;
}

.role-icon.super_admin {
  background: rgba(239, 68, 68, 0.1);
}

.role-icon.super_admin .mdi {
  color: #ef4444;
}

.role-icon.admin {
  background: rgba(245, 158, 11, 0.1);
}

.role-icon.admin .mdi {
  color: #f59e0b;
}

.role-icon.site_admin {
  background: rgba(59, 130, 246, 0.1);
}

.role-icon.site_admin .mdi {
  color: #3b82f6;
}

.role-icon.editor {
  background: rgba(16, 185, 129, 0.1);
}

.role-icon.editor .mdi {
  color: #10b981;
}

.role-icon.viewer {
  background: rgba(107, 114, 128, 0.1);
}

.role-icon.viewer .mdi {
  color: #6b7280;
}

.role-info {
  flex: 1;
  min-width: 0;
}

.role-name {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 4px 0;
}

.role-description {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.5;
}

.role-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-top: 1px solid var(--border-color);
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 16px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--text-tertiary);
}

.meta-item .mdi {
  font-size: 16px;
}

.system-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: rgba(99, 102, 241, 0.1);
  color: #6366f1;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
}

.system-badge .mdi {
  font-size: 14px;
}

.role-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.btn-action {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-action .mdi {
  font-size: 18px;
}

.btn-action:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-action.edit {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.btn-action.edit:hover:not(:disabled) {
  background: rgba(59, 130, 246, 0.2);
}

.btn-action.delete {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.btn-action.delete:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.2);
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
  background: rgba(99, 102, 241, 0.1);
  border-radius: 20px;
  margin-bottom: 24px;
}

.empty-icon .mdi {
  font-size: 40px;
  color: #6366f1;
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

.btn-add-empty {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: linear-gradient(135deg, #6366f1, #818cf8);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-add-empty:hover {
  background: linear-gradient(135deg, #4f46e5, #6366f1);
}

/* 모달 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-container {
  background: var(--bg-primary);
  border-radius: 20px;
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h2 {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.modal-header h2 .mdi {
  font-size: 24px;
  color: #6366f1;
}

.modal-close {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.modal-close .mdi {
  font-size: 20px;
  color: var(--text-secondary);
}

.modal-close:hover {
  background: var(--bg-tertiary);
}

.modal-body {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.form-label.required::after {
  content: ' *';
  color: #ef4444;
}

.form-input,
.form-textarea {
  padding: 12px 16px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  font-size: 14px;
  color: var(--text-primary);
  transition: all 0.2s ease;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.form-input::placeholder,
.form-textarea::placeholder {
  color: var(--text-tertiary);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
  font-family: inherit;
}

.form-hint {
  font-size: 12px;
  color: var(--text-tertiary);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid var(--border-color);
  background: var(--bg-secondary);
}

.btn-cancel {
  padding: 12px 24px;
  background: var(--bg-primary);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-cancel:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.btn-submit {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: linear-gradient(135deg, #6366f1, #818cf8);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-submit:hover {
  background: linear-gradient(135deg, #4f46e5, #6366f1);
}

/* 반응형 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 16px;
  }

  .header-right {
    width: 100%;
  }

  .btn-add {
    width: 100%;
    justify-content: center;
  }

  .roles-grid {
    grid-template-columns: 1fr;
  }

  .modal-container {
    margin: 16px;
    max-width: calc(100% - 32px);
  }
}
</style>
