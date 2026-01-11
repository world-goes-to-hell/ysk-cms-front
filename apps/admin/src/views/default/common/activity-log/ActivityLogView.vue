<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getActivityLogs, type ActivityLog } from '@/api/activity'
import { ElMessage } from 'element-plus'
import Pagination from '@/components/common/Pagination.vue'

// 활동 로그 목록
const activityLogs = ref<ActivityLog[]>([])
const loading = ref(false)

// 필터
const filters = ref({
  activityType: '',
  targetType: '',
  keyword: '',
})

// 페이지네이션
const pagination = ref({
  page: 0,
  size: 20,
  totalElements: 0,
  totalPages: 0,
})

// 활동 타입 옵션
const activityTypeOptions = [
  { value: '', label: '전체' },
  { value: 'CREATE', label: '생성' },
  { value: 'UPDATE', label: '수정' },
  { value: 'DELETE', label: '삭제' },
  { value: 'LOGIN', label: '로그인' },
  { value: 'LOGOUT', label: '로그아웃' },
  { value: 'VIEW', label: '조회' },
  { value: 'PUBLISH', label: '발행' },
  { value: 'UPLOAD', label: '업로드' },
]

// 대상 타입 옵션
const targetTypeOptions = [
  { value: '', label: '전체' },
  { value: 'POST', label: '게시글' },
  { value: 'PAGE', label: '페이지' },
  { value: 'BOARD', label: '게시판' },
  { value: 'USER', label: '사용자' },
  { value: 'SITE', label: '사이트' },
  { value: 'MEDIA', label: '미디어' },
  { value: 'MENU', label: '메뉴' },
]

// 활동 타입별 아이콘
const getActivityIcon = (type: string) => {
  const icons: Record<string, string> = {
    CREATE: 'mdi-plus-circle-outline',
    UPDATE: 'mdi-pencil-outline',
    DELETE: 'mdi-trash-can-outline',
    LOGIN: 'mdi-login',
    LOGOUT: 'mdi-logout',
    VIEW: 'mdi-eye-outline',
    PUBLISH: 'mdi-publish',
    UPLOAD: 'mdi-upload-outline',
  }
  return icons[type] || 'mdi-information-outline'
}

// 활동 타입 라벨
const getActivityTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    CREATE: '생성',
    UPDATE: '수정',
    DELETE: '삭제',
    LOGIN: '로그인',
    LOGOUT: '로그아웃',
    VIEW: '조회',
    PUBLISH: '발행',
    UPLOAD: '업로드',
  }
  return labels[type] || type
}

// 데이터 조회
const fetchActivityLogs = async () => {
  loading.value = true
  try {
    const params: Record<string, any> = {
      page: pagination.value.page,
      size: pagination.value.size,
    }

    if (filters.value.activityType) {
      params.activityType = filters.value.activityType
    }
    if (filters.value.targetType) {
      params.targetType = filters.value.targetType
    }
    if (filters.value.keyword) {
      params.keyword = filters.value.keyword
    }

    const response = await getActivityLogs(params)
    if (response.data.success) {
      activityLogs.value = response.data.data.content
      pagination.value.totalElements = response.data.data.totalElements
      pagination.value.totalPages = response.data.data.totalPages
    }
  } catch (error) {
    console.error('활동 로그 조회 실패:', error)
    ElMessage.error('활동 로그를 불러오는데 실패했습니다.')
  } finally {
    loading.value = false
  }
}

// 검색
const handleSearch = () => {
  pagination.value.page = 0
  fetchActivityLogs()
}

// 필터 초기화
const handleReset = () => {
  filters.value = {
    activityType: '',
    targetType: '',
    keyword: '',
  }
  pagination.value.page = 0
  fetchActivityLogs()
}

// 현재 페이지 (1-based)
const currentPage = computed(() => pagination.value.page + 1)

// 페이지 변경
const handlePageChange = (page: number) => {
  pagination.value.page = page - 1
  fetchActivityLogs()
}

// 페이지 사이즈 변경
const handleSizeChange = (size: number) => {
  pagination.value.size = size
  pagination.value.page = 0
  fetchActivityLogs()
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
  fetchActivityLogs()
})
</script>

<template>
  <div class="activity-log-page" v-loading="loading">
    <!-- 페이지 헤더 -->
    <div class="page-header">
      <div class="header-left">
        <h1>
          <i class="mdi mdi-history"></i>
          활동 로그
        </h1>
        <p>시스템 내 모든 사용자 활동을 확인할 수 있습니다</p>
      </div>
    </div>

    <!-- 필터 영역 -->
    <div class="filter-section">
      <div class="filter-group">
        <select v-model="filters.activityType" class="filter-select">
          <option v-for="opt in activityTypeOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
        <select v-model="filters.targetType" class="filter-select">
          <option v-for="opt in targetTypeOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
      </div>
      <div class="search-box">
        <i class="mdi mdi-magnify"></i>
        <input
          v-model="filters.keyword"
          type="text"
          placeholder="대상명, 설명 검색..."
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

    <!-- 활동 로그 테이블 -->
    <div class="logs-container">
      <div v-if="activityLogs.length > 0" class="logs-table">
        <div class="table-header">
          <div class="col-activity">활동</div>
          <div class="col-content">내용</div>
          <div class="col-user">사용자</div>
          <div class="col-site">사이트</div>
          <div class="col-ip">IP 주소</div>
          <div class="col-time">시간</div>
        </div>

        <div v-for="log in activityLogs" :key="log.id" class="table-row">
          <!-- 활동 유형 -->
          <div class="col-activity">
            <span class="activity-badge" :class="log.activityType.toLowerCase()">
              {{ getActivityTypeLabel(log.activityType) }}
            </span>
          </div>

          <!-- 내용 -->
          <div class="col-content">
            <div class="activity-icon" :class="'icon-' + log.activityType.toLowerCase()">
              <i class="mdi" :class="getActivityIcon(log.activityType)"></i>
            </div>
            <div class="activity-info">
              <span class="activity-action">{{ log.action }}</span>
              <span v-if="log.targetName" class="activity-target">: {{ log.targetName }}</span>
            </div>
          </div>

          <!-- 사용자 -->
          <div class="col-user">
            <div class="user-cell">
              <i class="mdi mdi-account-outline"></i>
              <span>{{ log.userName }}</span>
            </div>
          </div>

          <!-- 사이트 -->
          <div class="col-site">
            <span class="site-name">{{ log.siteName || '전체' }}</span>
          </div>

          <!-- IP 주소 -->
          <div class="col-ip">
            <span class="ip-text">{{ log.ipAddress || '-' }}</span>
          </div>

          <!-- 시간 -->
          <div class="col-time">
            <div class="time-cell">
              <span class="time-ago">{{ log.timeAgo }}</span>
              <span class="time-full">{{ formatDate(log.createdAt) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 빈 상태 -->
      <div v-else-if="!loading" class="empty-state">
        <div class="empty-icon">
          <i class="mdi mdi-history"></i>
        </div>
        <h3>활동 로그가 없습니다</h3>
        <p>아직 기록된 활동이 없습니다</p>
      </div>

      <!-- 페이지네이션 -->
      <div v-if="activityLogs.length > 0" class="pagination-wrapper">
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
  </div>
</template>

<style scoped>
.activity-log-page {
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
  min-width: 120px;
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

/* 로그 테이블 컨테이너 */
.logs-container {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  overflow: hidden;
}

.logs-table {
  width: 100%;
}

.table-header {
  display: grid;
  grid-template-columns: 100px 1fr 120px 100px 130px 150px;
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
  grid-template-columns: 100px 1fr 120px 100px 130px 150px;
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

/* 활동 배지 */
.activity-badge {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
}

.activity-badge.create {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.activity-badge.update {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}

.activity-badge.delete {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.activity-badge.login {
  background: rgba(99, 102, 241, 0.1);
  color: #6366f1;
}

.activity-badge.logout {
  background: rgba(107, 114, 128, 0.1);
  color: #6b7280;
}

.activity-badge.view {
  background: rgba(107, 114, 128, 0.1);
  color: #6b7280;
}

.activity-badge.publish {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.activity-badge.upload {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

/* 내용 컬럼 */
.col-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.activity-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  flex-shrink: 0;
}

.activity-icon .mdi {
  font-size: 18px;
  color: white;
}

.activity-icon.icon-create {
  background: linear-gradient(135deg, #10b981, #34d399);
}

.activity-icon.icon-update {
  background: linear-gradient(135deg, #f59e0b, #fbbf24);
}

.activity-icon.icon-delete {
  background: linear-gradient(135deg, #ef4444, #f87171);
}

.activity-icon.icon-login {
  background: linear-gradient(135deg, #6366f1, #818cf8);
}

.activity-icon.icon-logout {
  background: linear-gradient(135deg, #64748b, #94a3b8);
}

.activity-icon.icon-view {
  background: linear-gradient(135deg, #64748b, #94a3b8);
}

.activity-icon.icon-publish {
  background: linear-gradient(135deg, #10b981, #34d399);
}

.activity-icon.icon-upload {
  background: linear-gradient(135deg, #3b82f6, #60a5fa);
}

.activity-info {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  min-width: 0;
}

.activity-action {
  font-weight: 500;
  color: var(--text-primary);
}

.activity-target {
  color: var(--text-secondary);
}

/* 사용자 컬럼 */
.user-cell {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-secondary);
}

.user-cell .mdi {
  font-size: 18px;
  color: var(--text-tertiary);
}

/* 사이트 컬럼 */
.site-name {
  font-size: 14px;
  color: var(--text-secondary);
}

/* IP 컬럼 */
.ip-text {
  font-size: 13px;
  color: var(--text-tertiary);
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
}

/* 시간 컬럼 */
.time-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.time-ago {
  font-weight: 500;
  color: var(--text-primary);
  font-size: 14px;
}

.time-full {
  font-size: 12px;
  color: var(--text-tertiary);
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
  margin: 0;
}

/* 페이지네이션 */
.pagination-wrapper {
  display: flex;
  justify-content: center;
  padding: 24px;
  border-top: 1px solid var(--border-color);
}

/* 반응형 */
@media (max-width: 1024px) {
  .table-header,
  .table-row {
    grid-template-columns: 90px 1fr 100px 90px 110px 130px;
  }
}

@media (max-width: 768px) {
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

  .col-activity {
    order: 1;
  }

  .col-content {
    order: 2;
    width: 100%;
  }

  .col-user,
  .col-site,
  .col-ip {
    order: 3;
  }

  .col-time {
    order: 4;
    width: 100%;
    padding-top: 12px;
    border-top: 1px solid var(--border-color);
  }

  .time-cell {
    flex-direction: row;
    justify-content: space-between;
  }
}
</style>
