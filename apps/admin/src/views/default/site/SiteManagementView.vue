<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getSites,
  updateSite,
  deleteSite,
  type Site,
  type SiteStatus,
} from '@/api/site'

const router = useRouter()

// 사이트 목록
const sites = ref<Site[]>([])
const loading = ref(false)

// 검색 및 필터
const searchQuery = ref('')
const statusFilter = ref<SiteStatus | ''>('')

// 페이지네이션
const pagination = ref({
  page: 0,
  size: 12,
  totalElements: 0,
  totalPages: 0,
})

// 상태 옵션
const statusOptions = [
  { value: '', label: '전체 상태' },
  { value: 'ACTIVE', label: '활성' },
  { value: 'INACTIVE', label: '비활성' },
  { value: 'MAINTENANCE', label: '점검중' },
]

// 검색 필터링
const filteredSites = computed(() => {
  let result = sites.value

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(
      (site) =>
        site.name.toLowerCase().includes(query) ||
        site.code.toLowerCase().includes(query) ||
        site.domain?.toLowerCase().includes(query)
    )
  }

  if (statusFilter.value) {
    result = result.filter((site) => site.status === statusFilter.value)
  }

  return result
})

// 데이터 조회
const fetchSites = async () => {
  loading.value = true
  try {
    const response = await getSites({
      page: pagination.value.page,
      size: pagination.value.size,
    })
    if (response.data.success) {
      sites.value = response.data.data.content
      pagination.value.totalElements = response.data.data.totalElements
      pagination.value.totalPages = response.data.data.totalPages
    }
  } catch (error) {
    console.error('사이트 목록 조회 실패:', error)
    ElMessage.error('사이트 목록을 불러오는데 실패했습니다.')
  } finally {
    loading.value = false
  }
}

// 사이트 추가 페이지로 이동
const handleAdd = () => {
  router.push('/sites/form')
}

// 사이트 수정 페이지로 이동
const handleEdit = (site: Site) => {
  router.push(`/sites/form?code=${site.code}`)
}

// 사이트 삭제
const handleDelete = async (site: Site) => {
  try {
    await ElMessageBox.confirm(
      `"${site.name}" 사이트를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`,
      '사이트 삭제',
      {
        confirmButtonText: '삭제',
        cancelButtonText: '취소',
        type: 'warning',
      }
    )

    const response = await deleteSite(site.code)
    if (response.data.success) {
      ElMessage.success('사이트가 삭제되었습니다.')
      fetchSites()
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('사이트 삭제 실패:', error)
      const message = error.response?.data?.message || '사이트 삭제에 실패했습니다.'
      ElMessage.error(message)
    }
  }
}

// 사이트 상태 변경
const handleToggleStatus = async (site: Site) => {
  const newStatus: SiteStatus = site.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
  try {
    const response = await updateSite(site.code, {
      name: site.name,
      description: site.description,
      domain: site.domain,
      status: newStatus,
    })
    if (response.data.success) {
      ElMessage.success(`사이트가 ${newStatus === 'ACTIVE' ? '활성화' : '비활성화'}되었습니다.`)
      fetchSites()
    }
  } catch (error: any) {
    console.error('사이트 상태 변경 실패:', error)
    const message = error.response?.data?.message || '상태 변경에 실패했습니다.'
    ElMessage.error(message)
  }
}

// 사이트 관리 페이지로 이동
const goToSite = (site: Site) => {
  router.push(`/sites/${site.code}/dashboard`)
}

// 상태 라벨
const getStatusLabel = (status: SiteStatus) => {
  const labels: Record<SiteStatus, string> = {
    ACTIVE: '활성',
    INACTIVE: '비활성',
    MAINTENANCE: '점검중',
  }
  return labels[status] || status
}

// 상태 아이콘
const getStatusIcon = (status: SiteStatus) => {
  const icons: Record<SiteStatus, string> = {
    ACTIVE: 'mdi-check-circle',
    INACTIVE: 'mdi-pause-circle',
    MAINTENANCE: 'mdi-wrench',
  }
  return icons[status] || 'mdi-help-circle'
}

// 날짜 포맷
const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

// 검색 초기화
const handleReset = () => {
  searchQuery.value = ''
  statusFilter.value = ''
}

onMounted(() => {
  fetchSites()
})
</script>

<template>
  <div class="sites-page" v-loading="loading">
    <!-- 페이지 헤더 -->
    <div class="page-header">
      <div class="header-left">
        <h1>
          <i class="mdi mdi-web"></i>
          사이트 관리
        </h1>
        <p>멀티 사이트를 생성하고 관리할 수 있습니다</p>
      </div>
      <div class="header-right">
        <button class="btn-add" @click="handleAdd">
          <i class="mdi mdi-plus"></i>
          사이트 추가
        </button>
      </div>
    </div>

    <!-- 필터 영역 -->
    <div class="filter-section">
      <div class="filter-group">
        <select v-model="statusFilter" class="filter-select">
          <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
      </div>
      <div class="search-box">
        <i class="mdi mdi-magnify"></i>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="사이트명, 코드, 도메인 검색..."
        />
      </div>
      <div class="button-group">
        <button class="btn-reset" @click="handleReset">
          <i class="mdi mdi-refresh"></i>
          초기화
        </button>
      </div>
      <div class="site-count">
        총 <strong>{{ filteredSites.length }}</strong>개 사이트
      </div>
    </div>

    <!-- 사이트 목록 -->
    <div class="sites-container">
      <div v-if="filteredSites.length > 0" class="sites-grid">
        <div
          v-for="site in filteredSites"
          :key="site.id"
          class="site-card"
          :class="{ inactive: site.status !== 'ACTIVE' }"
        >
          <div class="site-card-header">
            <div class="site-icon" :class="site.status.toLowerCase()">
              <i class="mdi mdi-web"></i>
            </div>
            <div class="site-status" :class="site.status.toLowerCase()">
              <i class="mdi" :class="getStatusIcon(site.status)"></i>
              {{ getStatusLabel(site.status) }}
            </div>
          </div>

          <div class="site-card-body" @click="goToSite(site)">
            <h3 class="site-name">{{ site.name }}</h3>
            <div class="site-code">
              <i class="mdi mdi-code-tags"></i>
              {{ site.code }}
            </div>
            <div v-if="site.domain" class="site-domain">
              <i class="mdi mdi-link-variant"></i>
              {{ site.domain }}
            </div>
            <p v-if="site.description" class="site-description">{{ site.description }}</p>
          </div>

          <div class="site-card-meta">
            <div class="meta-item">
              <i class="mdi mdi-calendar-outline"></i>
              <span>{{ formatDate(site.createdAt) }}</span>
            </div>
            <div v-if="site.createdBy" class="meta-item">
              <i class="mdi mdi-account-outline"></i>
              <span>{{ site.createdBy }}</span>
            </div>
          </div>

          <div class="site-card-actions">
            <button class="btn-action enter" @click="goToSite(site)" title="사이트 관리">
              <i class="mdi mdi-arrow-right-circle-outline"></i>
            </button>
            <button
              class="btn-action toggle"
              :class="site.status === 'ACTIVE' ? 'deactivate' : 'activate'"
              @click.stop="handleToggleStatus(site)"
              :title="site.status === 'ACTIVE' ? '비활성화' : '활성화'"
            >
              <i class="mdi" :class="site.status === 'ACTIVE' ? 'mdi-pause-circle-outline' : 'mdi-play-circle-outline'"></i>
            </button>
            <button class="btn-action edit" @click.stop="handleEdit(site)" title="수정">
              <i class="mdi mdi-pencil-outline"></i>
            </button>
            <button class="btn-action delete" @click.stop="handleDelete(site)" title="삭제">
              <i class="mdi mdi-trash-can-outline"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- 빈 상태 -->
      <div v-else-if="!loading" class="empty-state">
        <div class="empty-icon">
          <i class="mdi mdi-web"></i>
        </div>
        <h3>사이트가 없습니다</h3>
        <p>새 사이트를 추가해주세요</p>
        <button class="btn-add-empty" @click="handleAdd">
          <i class="mdi mdi-plus"></i>
          사이트 추가
        </button>
      </div>
    </div>

  </div>
</template>

<style scoped>
.sites-page {
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

/* 필터 영역 */
.filter-section {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
  align-items: center;
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

.site-count {
  margin-left: auto;
  font-size: 14px;
  color: var(--text-secondary);
}

.site-count strong {
  color: #6366f1;
  font-weight: 600;
}

/* 사이트 컨테이너 */
.sites-container {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 24px;
}

.sites-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 20px;
}

/* 사이트 카드 */
.site-card {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 20px;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
}

.site-card:hover {
  border-color: #6366f1;
  box-shadow: 0 4px 20px rgba(99, 102, 241, 0.12);
}

.site-card.inactive {
  opacity: 0.7;
}

.site-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.site-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  flex-shrink: 0;
}

.site-icon .mdi {
  font-size: 24px;
}

.site-icon.active {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(52, 211, 153, 0.15));
}

.site-icon.active .mdi {
  color: #10b981;
}

.site-icon.inactive {
  background: linear-gradient(135deg, rgba(107, 114, 128, 0.15), rgba(156, 163, 175, 0.15));
}

.site-icon.inactive .mdi {
  color: #6b7280;
}

.site-icon.maintenance {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(251, 191, 36, 0.15));
}

.site-icon.maintenance .mdi {
  color: #f59e0b;
}

.site-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.site-status .mdi {
  font-size: 14px;
}

.site-status.active {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.site-status.inactive {
  background: rgba(107, 114, 128, 0.1);
  color: #6b7280;
}

.site-status.maintenance {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}

.site-card-body {
  flex: 1;
  cursor: pointer;
  margin-bottom: 16px;
}

.site-name {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 12px 0;
}

.site-code {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: var(--bg-tertiary);
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  color: #6366f1;
  margin-bottom: 8px;
}

.site-code .mdi {
  font-size: 14px;
}

.site-domain {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.site-domain .mdi {
  font-size: 16px;
  color: var(--text-tertiary);
}

.site-description {
  font-size: 13px;
  color: var(--text-tertiary);
  margin: 0;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.site-card-meta {
  display: flex;
  gap: 16px;
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

.site-card-actions {
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

.btn-action.enter {
  background: rgba(99, 102, 241, 0.1);
  color: #6366f1;
}

.btn-action.enter:hover {
  background: rgba(99, 102, 241, 0.2);
}

.btn-action.toggle.activate {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.btn-action.toggle.activate:hover {
  background: rgba(16, 185, 129, 0.2);
}

.btn-action.toggle.deactivate {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}

.btn-action.toggle.deactivate:hover {
  background: rgba(245, 158, 11, 0.2);
}

.btn-action.edit {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.btn-action.edit:hover {
  background: rgba(59, 130, 246, 0.2);
}

.btn-action.delete {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.btn-action.delete:hover {
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

/* 다크모드 */
:root.dark .site-code {
  background: var(--bg-tertiary);
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

  .btn-reset {
    flex: 1;
    justify-content: center;
  }

  .site-count {
    width: 100%;
    text-align: center;
    margin-left: 0;
  }

  .sites-grid {
    grid-template-columns: 1fr;
  }
}
</style>
