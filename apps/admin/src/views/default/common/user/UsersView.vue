<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import Pagination from '@/components/common/Pagination.vue'
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  resetPassword,
  changePassword,
  updateUserStatus,
  type User,
  type CreateUserRequest,
  type UpdateUserRequest,
  type ChangePasswordRequest,
} from '@/api/user'
import { getRoles } from '@/api/auth'
import type { RoleDto } from '@/types/auth'

// 사용자 목록
const users = ref<User[]>([])
const loading = ref(false)

// 필터
const filters = ref({
  role: '',
  status: '',
  keyword: '',
})

// 페이지네이션
const pagination = ref({
  page: 0,
  size: 20,
  totalElements: 0,
  totalPages: 0,
})

// 모달 상태
const showModal = ref(false)
const modalMode = ref<'create' | 'edit'>('create')
const formLoading = ref(false)
const selectedUser = ref<User | null>(null)

// 비밀번호 변경 모달 상태
const showPasswordModal = ref(false)
const passwordFormLoading = ref(false)
const passwordFormData = ref({
  newPassword: '',
  confirmPassword: '',
})

// 폼 데이터
const formData = ref<CreateUserRequest & { id?: number }>({
  username: '',
  password: '',
  name: '',
  email: '',
  role: 'USER',
  phone: '',
  department: '',
  position: '',
})

// 역할 목록 (API에서 가져옴)
const roles = ref<RoleDto[]>([])

// 역할 옵션 (필터용)
const roleOptions = computed(() => {
  const options = [{ value: '', label: '전체 역할' }]
  roles.value.forEach((role) => {
    options.push({
      value: role.name,
      label: role.description || role.name,
    })
  })
  return options
})

// 역할 목록 조회
const fetchRoles = async () => {
  try {
    const response = await getRoles()
    if (response.data.success) {
      roles.value = response.data.data
    }
  } catch (error) {
    console.error('역할 목록 조회 실패:', error)
  }
}

// 상태 옵션
const statusOptions = [
  { value: '', label: '전체 상태' },
  { value: 'ACTIVE', label: '활성' },
  { value: 'INACTIVE', label: '비활성' },
  { value: 'PENDING', label: '대기중' },
  { value: 'SUSPENDED', label: '정지' },
]

// 역할 라벨
const getRoleLabel = (roleName: string) => {
  const role = roles.value.find((r) => r.name === roleName)
  return role?.description || roleName
}

// 상태 라벨
const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    ACTIVE: '활성',
    INACTIVE: '비활성',
    PENDING: '대기중',
    SUSPENDED: '정지',
  }
  return labels[status] || status
}

// 데이터 조회
const fetchUsers = async () => {
  loading.value = true
  try {
    const params: Record<string, any> = {
      page: pagination.value.page,
      size: pagination.value.size,
    }

    if (filters.value.role) {
      params.role = filters.value.role
    }
    if (filters.value.status) {
      params.status = filters.value.status
    }
    if (filters.value.keyword) {
      params.keyword = filters.value.keyword
    }

    const response = await getUsers(params)
    if (response.data.success) {
      users.value = response.data.data.content
      pagination.value.totalElements = response.data.data.totalElements
      pagination.value.totalPages = response.data.data.totalPages
    }
  } catch (error) {
    console.error('사용자 목록 조회 실패:', error)
    ElMessage.error('사용자 목록을 불러오는데 실패했습니다.')
  } finally {
    loading.value = false
  }
}

// 검색
const handleSearch = () => {
  pagination.value.page = 0
  fetchUsers()
}

// 필터 초기화
const handleReset = () => {
  filters.value = {
    role: '',
    status: '',
    keyword: '',
  }
  pagination.value.page = 0
  fetchUsers()
}

// 폼 초기화
const resetForm = () => {
  formData.value = {
    username: '',
    password: '',
    name: '',
    email: '',
    role: 'USER',
    phone: '',
    department: '',
    position: '',
  }
  selectedUser.value = null
}

// 사용자 추가 모달 열기
const handleAdd = () => {
  modalMode.value = 'create'
  resetForm()
  showModal.value = true
}

// 사용자 수정 모달 열기
const handleEdit = (user: User) => {
  modalMode.value = 'edit'
  selectedUser.value = user
  formData.value = {
    id: user.id,
    username: user.username,
    password: '',
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone || '',
    department: user.department || '',
    position: user.position || '',
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
    ElMessage.warning('이름을 입력해주세요.')
    return
  }
  if (!formData.value.email.trim()) {
    ElMessage.warning('이메일을 입력해주세요.')
    return
  }
  if (modalMode.value === 'create') {
    if (!formData.value.username.trim()) {
      ElMessage.warning('아이디를 입력해주세요.')
      return
    }
    if (!formData.value.password.trim()) {
      ElMessage.warning('비밀번호를 입력해주세요.')
      return
    }
  }

  formLoading.value = true
  try {
    if (modalMode.value === 'create') {
      const createData: CreateUserRequest = {
        username: formData.value.username,
        password: formData.value.password,
        name: formData.value.name,
        email: formData.value.email,
        role: formData.value.role,
        phone: formData.value.phone,
        department: formData.value.department,
        position: formData.value.position,
      }
      const response = await createUser(createData)
      if (response.data.success) {
        ElMessage.success('사용자가 생성되었습니다.')
        handleCloseModal()
        fetchUsers()
      }
    } else {
      const updateData: UpdateUserRequest = {
        name: formData.value.name,
        email: formData.value.email,
        role: formData.value.role,
        phone: formData.value.phone,
        department: formData.value.department,
        position: formData.value.position,
      }
      const response = await updateUser(formData.value.id!, updateData)
      if (response.data.success) {
        ElMessage.success('사용자 정보가 수정되었습니다.')
        handleCloseModal()
        fetchUsers()
      }
    }
  } catch (error: any) {
    console.error('사용자 저장 실패:', error)
    const message = error.response?.data?.message || '사용자 저장에 실패했습니다.'
    ElMessage.error(message)
  } finally {
    formLoading.value = false
  }
}

// 사용자 삭제
const handleDelete = async (user: User) => {
  try {
    await ElMessageBox.confirm(
      `"${user.name}" 사용자를 삭제하시겠습니까?`,
      '사용자 삭제',
      {
        confirmButtonText: '삭제',
        cancelButtonText: '취소',
        type: 'warning',
      }
    )

    const response = await deleteUser(user.id)
    if (response.data.success) {
      ElMessage.success('사용자가 삭제되었습니다.')
      fetchUsers()
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('사용자 삭제 실패:', error)
      const message = error.response?.data?.message || '사용자 삭제에 실패했습니다.'
      ElMessage.error(message)
    }
  }
}

// 비밀번호 초기화
const handleResetPassword = async (user: User) => {
  try {
    await ElMessageBox.confirm(
      `"${user.name}" 사용자의 비밀번호를 초기화하시겠습니까?`,
      '비밀번호 초기화',
      {
        confirmButtonText: '초기화',
        cancelButtonText: '취소',
        type: 'warning',
      }
    )

    const response = await resetPassword(user.id)
    if (response.data.success) {
      const newPassword = response.data.data?.temporaryPassword || '임시비밀번호'
      ElMessageBox.alert(
        `새 임시 비밀번호: ${newPassword}`,
        '비밀번호 초기화 완료',
        { confirmButtonText: '확인' }
      )
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('비밀번호 초기화 실패:', error)
      const message = error.response?.data?.message || '비밀번호 초기화에 실패했습니다.'
      ElMessage.error(message)
    }
  }
}

// 비밀번호 변경 모달 열기
const handleChangePassword = (user: User) => {
  selectedUser.value = user
  passwordFormData.value = {
    newPassword: '',
    confirmPassword: '',
  }
  showPasswordModal.value = true
}

// 비밀번호 변경 모달 닫기
const handleClosePasswordModal = () => {
  showPasswordModal.value = false
  selectedUser.value = null
  passwordFormData.value = {
    newPassword: '',
    confirmPassword: '',
  }
}

// 비밀번호 변경 제출
const handlePasswordSubmit = async () => {
  // 유효성 검사
  if (!passwordFormData.value.newPassword.trim()) {
    ElMessage.warning('새 비밀번호를 입력해주세요.')
    return
  }
  if (passwordFormData.value.newPassword.length < 8) {
    ElMessage.warning('비밀번호는 8자 이상이어야 합니다.')
    return
  }
  if (passwordFormData.value.newPassword !== passwordFormData.value.confirmPassword) {
    ElMessage.warning('비밀번호가 일치하지 않습니다.')
    return
  }
  if (!selectedUser.value) return

  passwordFormLoading.value = true
  try {
    const data: ChangePasswordRequest = {
      newPassword: passwordFormData.value.newPassword,
    }
    const response = await changePassword(selectedUser.value.id, data)
    if (response.data.success) {
      ElMessage.success('비밀번호가 변경되었습니다.')
      handleClosePasswordModal()
    }
  } catch (error: any) {
    console.error('비밀번호 변경 실패:', error)
    const message = error.response?.data?.message || '비밀번호 변경에 실패했습니다.'
    ElMessage.error(message)
  } finally {
    passwordFormLoading.value = false
  }
}

// 사용자 승인
const handleApprove = async (user: User) => {
  try {
    await ElMessageBox.confirm(
      `"${user.name}" 사용자를 승인하시겠습니까?`,
      '사용자 승인',
      {
        confirmButtonText: '승인',
        cancelButtonText: '취소',
        type: 'info',
      }
    )

    const response = await updateUserStatus(user.id, 'ACTIVE')
    if (response.data.success) {
      ElMessage.success('사용자가 승인되었습니다.')
      fetchUsers()
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('사용자 승인 실패:', error)
      const message = error.response?.data?.message || '사용자 승인에 실패했습니다.'
      ElMessage.error(message)
    }
  }
}

// 사용자 거부/정지
const handleReject = async (user: User) => {
  try {
    await ElMessageBox.confirm(
      `"${user.name}" 사용자를 거부(정지)하시겠습니까?`,
      '사용자 거부',
      {
        confirmButtonText: '거부',
        cancelButtonText: '취소',
        type: 'warning',
      }
    )

    const response = await updateUserStatus(user.id, 'SUSPENDED')
    if (response.data.success) {
      ElMessage.success('사용자가 거부(정지)되었습니다.')
      fetchUsers()
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('사용자 거부 실패:', error)
      const message = error.response?.data?.message || '사용자 거부에 실패했습니다.'
      ElMessage.error(message)
    }
  }
}

// 현재 페이지 (1-based)
const currentPage = computed(() => pagination.value.page + 1)

// 페이지 변경
const handlePageChange = (page: number) => {
  pagination.value.page = page - 1
  fetchUsers()
}

// 페이지 사이즈 변경
const handleSizeChange = (size: number) => {
  pagination.value.size = size
  pagination.value.page = 0
  fetchUsers()
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
  fetchUsers()
})
</script>

<template>
  <div class="users-page" v-loading="loading">
    <!-- 페이지 헤더 -->
    <div class="page-header">
      <div class="header-left">
        <h1>
          <i class="mdi mdi-account-group"></i>
          사용자 관리
        </h1>
        <p>시스템 사용자를 관리하고 권한을 설정할 수 있습니다</p>
      </div>
      <div class="header-right">
        <button class="btn-add" @click="handleAdd">
          <i class="mdi mdi-plus"></i>
          사용자 추가
        </button>
      </div>
    </div>

    <!-- 필터 영역 -->
    <div class="filter-section">
      <div class="filter-group">
        <select v-model="filters.role" class="filter-select">
          <option v-for="opt in roleOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
        <select v-model="filters.status" class="filter-select">
          <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
      </div>
      <div class="search-box">
        <i class="mdi mdi-magnify"></i>
        <input
          v-model="filters.keyword"
          type="text"
          placeholder="이름 또는 이메일 검색..."
          @keyup.enter="handleSearch"
        />
      </div>
      <div class="button-group">
        <button class="btn-search" @click="handleSearch">
          <i class="mdi mdi-magnify"></i>
          검색
        </button>
        <button class="btn-reset" @click="handleReset">
          <i class="mdi mdi-refresh"></i>
          초기화
        </button>
      </div>
    </div>

    <!-- 사용자 테이블 -->
    <div class="users-container">
      <div v-if="users.length > 0" class="users-table">
        <div class="table-header">
          <div class="col-id">ID</div>
          <div class="col-user">사용자</div>
          <div class="col-role">역할</div>
          <div class="col-status">상태</div>
          <div class="col-date">가입일</div>
          <div class="col-actions">관리</div>
        </div>

        <div v-for="user in users" :key="user.id" class="table-row">
          <!-- ID -->
          <div class="col-id">
            <span class="id-text">#{{ user.id }}</span>
          </div>

          <!-- 사용자 정보 -->
          <div class="col-user">
            <div class="user-avatar">
              <i class="mdi mdi-account"></i>
            </div>
            <div class="user-info">
              <span class="user-name">{{ user.name }}</span>
              <span class="user-email">{{ user.email }}</span>
            </div>
          </div>

          <!-- 역할 -->
          <div class="col-role">
            <span class="role-badge" :class="user.role.toLowerCase()">
              {{ getRoleLabel(user.role) }}
            </span>
          </div>

          <!-- 상태 -->
          <div class="col-status">
            <span class="status-badge" :class="user.status.toLowerCase()">
              <span class="status-dot"></span>
              {{ getStatusLabel(user.status) }}
            </span>
          </div>

          <!-- 가입일 -->
          <div class="col-date">
            <div class="date-cell">
              <i class="mdi mdi-calendar-outline"></i>
              <span>{{ formatDate(user.createdAt) }}</span>
            </div>
          </div>

          <!-- 관리 버튼 -->
          <div class="col-actions">
            <!-- PENDING 상태일 때 승인/거부 버튼 -->
            <template v-if="user.status === 'PENDING'">
              <button class="btn-action approve" @click="handleApprove(user)" title="승인">
                <i class="mdi mdi-check-circle-outline"></i>
              </button>
              <button class="btn-action reject" @click="handleReject(user)" title="거부">
                <i class="mdi mdi-close-circle-outline"></i>
              </button>
            </template>
            <button class="btn-action edit" @click="handleEdit(user)" title="수정">
              <i class="mdi mdi-pencil-outline"></i>
            </button>
            <button class="btn-action password" @click="handleChangePassword(user)" title="비밀번호 변경">
              <i class="mdi mdi-lock-outline"></i>
            </button>
            <button class="btn-action delete" @click="handleDelete(user)" title="삭제">
              <i class="mdi mdi-trash-can-outline"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- 빈 상태 -->
      <div v-else-if="!loading" class="empty-state">
        <div class="empty-icon">
          <i class="mdi mdi-account-group"></i>
        </div>
        <h3>사용자가 없습니다</h3>
        <p>새 사용자를 추가해주세요</p>
        <button class="btn-add-empty" @click="handleAdd">
          <i class="mdi mdi-plus"></i>
          사용자 추가
        </button>
      </div>

      <!-- 페이지네이션 -->
      <div v-if="users.length > 0" class="pagination-wrapper">
        <Pagination
          :current-page="currentPage"
          :total-pages="pagination.totalPages"
          :total-elements="pagination.totalElements"
          :page-size="pagination.size"
          :show-total="true"
          :show-size-changer="true"
          @page-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </div>

    <!-- 사용자 추가/수정 모달 -->
    <Teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click.self="handleCloseModal">
        <div class="modal-container" v-loading="formLoading">
          <div class="modal-header">
            <h2>
              <i class="mdi" :class="modalMode === 'create' ? 'mdi-account-plus' : 'mdi-account-edit'"></i>
              {{ modalMode === 'create' ? '사용자 추가' : '사용자 수정' }}
            </h2>
            <button class="modal-close" @click="handleCloseModal">
              <i class="mdi mdi-close"></i>
            </button>
          </div>

          <div class="modal-body">
            <div class="form-grid">
              <!-- 아이디 (생성시에만) -->
              <div v-if="modalMode === 'create'" class="form-group">
                <label class="form-label required">아이디</label>
                <input
                  v-model="formData.username"
                  type="text"
                  class="form-input"
                  placeholder="아이디를 입력하세요"
                />
              </div>

              <!-- 비밀번호 (생성시에만) -->
              <div v-if="modalMode === 'create'" class="form-group">
                <label class="form-label required">비밀번호</label>
                <input
                  v-model="formData.password"
                  type="password"
                  class="form-input"
                  placeholder="비밀번호를 입력하세요"
                />
              </div>

              <!-- 이름 -->
              <div class="form-group">
                <label class="form-label required">이름</label>
                <input
                  v-model="formData.name"
                  type="text"
                  class="form-input"
                  placeholder="이름을 입력하세요"
                />
              </div>

              <!-- 이메일 -->
              <div class="form-group">
                <label class="form-label required">이메일</label>
                <input
                  v-model="formData.email"
                  type="email"
                  class="form-input"
                  placeholder="이메일을 입력하세요"
                />
              </div>

              <!-- 역할 -->
              <div class="form-group">
                <label class="form-label">역할</label>
                <select v-model="formData.role" class="form-select">
                  <option v-for="role in roles" :key="role.id" :value="role.name">
                    {{ role.description || role.name }}
                  </option>
                </select>
              </div>

              <!-- 전화번호 -->
              <div class="form-group">
                <label class="form-label">전화번호</label>
                <input
                  v-model="formData.phone"
                  type="tel"
                  class="form-input"
                  placeholder="전화번호를 입력하세요"
                />
              </div>

              <!-- 부서 -->
              <div class="form-group">
                <label class="form-label">부서</label>
                <input
                  v-model="formData.department"
                  type="text"
                  class="form-input"
                  placeholder="부서를 입력하세요"
                />
              </div>

              <!-- 직책 -->
              <div class="form-group">
                <label class="form-label">직책</label>
                <input
                  v-model="formData.position"
                  type="text"
                  class="form-input"
                  placeholder="직책을 입력하세요"
                />
              </div>
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

    <!-- 비밀번호 변경 모달 -->
    <Teleport to="body">
      <div v-if="showPasswordModal" class="modal-overlay" @click.self="handleClosePasswordModal">
        <div class="modal-container password-modal" v-loading="passwordFormLoading">
          <div class="modal-header">
            <h2>
              <i class="mdi mdi-lock-outline"></i>
              비밀번호 변경
            </h2>
            <button class="modal-close" @click="handleClosePasswordModal">
              <i class="mdi mdi-close"></i>
            </button>
          </div>

          <div class="modal-body">
            <div class="user-info-banner" v-if="selectedUser">
              <div class="user-avatar-small">
                <i class="mdi mdi-account"></i>
              </div>
              <div class="user-details">
                <span class="user-name">{{ selectedUser.name }}</span>
                <span class="user-email">{{ selectedUser.email }}</span>
              </div>
            </div>

            <div class="password-form">
              <div class="form-group">
                <label class="form-label required">새 비밀번호</label>
                <input
                  v-model="passwordFormData.newPassword"
                  type="password"
                  class="form-input"
                  placeholder="새 비밀번호를 입력하세요 (8자 이상)"
                />
              </div>

              <div class="form-group">
                <label class="form-label required">비밀번호 확인</label>
                <input
                  v-model="passwordFormData.confirmPassword"
                  type="password"
                  class="form-input"
                  placeholder="비밀번호를 다시 입력하세요"
                  @keyup.enter="handlePasswordSubmit"
                />
              </div>

              <div class="password-hint">
                <i class="mdi mdi-information-outline"></i>
                <span>비밀번호는 8자 이상이어야 합니다.</span>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn-cancel" @click="handleClosePasswordModal">취소</button>
            <button class="btn-submit" @click="handlePasswordSubmit">
              <i class="mdi mdi-check"></i>
              변경
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.users-page {
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

/* 필터 영역 */
.filter-section {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
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
  min-width: 130px;
}

.filter-select:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.search-box {
  flex: 1;
  max-width: 300px;
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
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.search-box input::placeholder {
  color: var(--text-tertiary);
}

.button-group {
  display: flex;
  gap: 8px;
}

.btn-search {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 20px;
  background: #6366f1;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-search:hover {
  background: #4f46e5;
}

.btn-reset {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 20px;
  background: var(--bg-secondary);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-reset:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

/* 사용자 테이블 컨테이너 */
.users-container {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  overflow: hidden;
}

.users-table {
  width: 100%;
}

.table-header {
  display: grid;
  grid-template-columns: 70px 1fr 120px 100px 180px 130px;
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
  grid-template-columns: 70px 1fr 120px 100px 180px 130px;
  gap: 16px;
  padding: 16px 24px;
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

/* ID 컬럼 */
.id-text {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-tertiary);
}

/* 사용자 컬럼 */
.col-user {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #6366f1, #818cf8);
  border-radius: 12px;
  flex-shrink: 0;
}

.user-avatar .mdi {
  font-size: 20px;
  color: white;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.user-name {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 14px;
}

.user-email {
  font-size: 13px;
  color: var(--text-tertiary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 역할 배지 */
.role-badge {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
}

.role-badge.super_admin {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.role-badge.admin {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}

.role-badge.manager {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.role-badge.user {
  background: rgba(107, 114, 128, 0.1);
  color: #6b7280;
}

/* 상태 배지 */
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-badge.active {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.status-badge.active .status-dot {
  background: #10b981;
}

.status-badge.inactive {
  background: rgba(107, 114, 128, 0.1);
  color: #6b7280;
}

.status-badge.inactive .status-dot {
  background: #6b7280;
}

.status-badge.pending {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}

.status-badge.pending .status-dot {
  background: #f59e0b;
}

.status-badge.suspended {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.status-badge.suspended .status-dot {
  background: #ef4444;
}

/* 날짜 컬럼 */
.date-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-secondary);
  font-size: 14px;
}

.date-cell .mdi {
  font-size: 18px;
  color: var(--text-tertiary);
}

/* 액션 버튼 */
.col-actions {
  display: flex;
  gap: 8px;
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

.btn-action.edit {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.btn-action.edit:hover {
  background: rgba(59, 130, 246, 0.2);
}

.btn-action.password {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.btn-action.password:hover {
  background: rgba(16, 185, 129, 0.2);
}

.btn-action.delete {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.btn-action.delete:hover {
  background: rgba(239, 68, 68, 0.2);
}

.btn-action.approve {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.btn-action.approve:hover {
  background: rgba(16, 185, 129, 0.2);
}

.btn-action.reject {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}

.btn-action.reject:hover {
  background: rgba(245, 158, 11, 0.2);
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

/* 페이지네이션 */
.pagination-wrapper {
  display: flex;
  justify-content: center;
  padding: 24px;
  border-top: 1px solid var(--border-color);
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
  max-width: 560px;
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
  overflow-y: auto;
  max-height: calc(90vh - 160px);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
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
.form-select {
  padding: 12px 16px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  font-size: 14px;
  color: var(--text-primary);
  transition: all 0.2s ease;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.form-input::placeholder {
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

/* 비밀번호 모달 */
.password-modal {
  max-width: 420px;
}

.user-info-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: var(--bg-tertiary);
  border-radius: 12px;
  margin-bottom: 24px;
}

.user-avatar-small {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #6366f1, #818cf8);
  border-radius: 12px;
  flex-shrink: 0;
}

.user-avatar-small .mdi {
  font-size: 24px;
  color: white;
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-details .user-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.user-details .user-email {
  font-size: 13px;
  color: var(--text-tertiary);
}

.password-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.password-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: rgba(99, 102, 241, 0.1);
  border-radius: 10px;
  font-size: 13px;
  color: #6366f1;
}

.password-hint .mdi {
  font-size: 18px;
}

/* 반응형 */
@media (max-width: 1024px) {
  .table-header,
  .table-row {
    grid-template-columns: 60px 1fr 100px 90px 150px 120px;
  }
}

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

  .filter-section {
    flex-direction: column;
  }

  .filter-group {
    width: 100%;
  }

  .filter-select {
    flex: 1;
    min-width: auto;
  }

  .search-box {
    max-width: none;
    width: 100%;
  }

  .button-group {
    width: 100%;
  }

  .btn-search,
  .btn-reset {
    flex: 1;
    justify-content: center;
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

  .col-id {
    order: 0;
    align-self: flex-start;
  }

  .col-user {
    order: 1;
    width: 100%;
  }

  .col-role,
  .col-status {
    order: 2;
  }

  .col-date {
    order: 3;
    width: 100%;
    padding-top: 12px;
    border-top: 1px solid var(--border-color);
  }

  .col-actions {
    order: 4;
    width: 100%;
    justify-content: flex-end;
    padding-top: 12px;
    border-top: 1px solid var(--border-color);
  }

  .modal-container {
    margin: 16px;
    max-width: calc(100% - 32px);
  }

  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
