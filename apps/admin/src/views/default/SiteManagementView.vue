<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useThemeStore } from '@/stores/theme'

const router = useRouter()
const themeStore = useThemeStore()

// 사이트 목록 (추후 API 연동)
const sites = ref([
  { id: 'site1', name: '블로그', domain: 'blog.example.com', status: 'active', createdAt: '2024-01-05' },
  { id: 'site2', name: '쇼핑몰', domain: 'shop.example.com', status: 'active', createdAt: '2024-01-08' },
  { id: 'site3', name: '커뮤니티', domain: 'community.example.com', status: 'inactive', createdAt: '2024-01-10' },
])

const searchQuery = ref('')
const showCreateDialog = ref(false)
const newSite = ref({
  name: '',
  domain: '',
})

// 검색 필터링
const filteredSites = computed(() => {
  if (!searchQuery.value) return sites.value
  const query = searchQuery.value.toLowerCase()
  return sites.value.filter(site =>
    site.name.toLowerCase().includes(query) ||
    site.domain.toLowerCase().includes(query)
  )
})

// 사이트 생성
const createSite = () => {
  if (!newSite.value.name || !newSite.value.domain) return

  const siteId = `site${sites.value.length + 1}`
  sites.value.push({
    id: siteId,
    name: newSite.value.name,
    domain: newSite.value.domain,
    status: 'active',
    createdAt: new Date().toISOString().split('T')[0],
  })

  newSite.value = { name: '', domain: '' }
  showCreateDialog.value = false
}

// 사이트 삭제
const deleteSite = (siteId: string) => {
  sites.value = sites.value.filter(s => s.id !== siteId)
}

// 사이트 상태 토글
const toggleStatus = (siteId: string) => {
  const site = sites.value.find(s => s.id === siteId)
  if (site) {
    site.status = site.status === 'active' ? 'inactive' : 'active'
  }
}

// 사이트 관리 페이지로 이동
const goToSite = (siteId: string) => {
  router.push(`/sites/${siteId}/dashboard`)
}
</script>

<template>
  <div class="site-management">
    <!-- 페이지 헤더 -->
    <div class="page-header">
      <div class="header-content">
        <h1>사이트 관리</h1>
        <p>서브사이트를 생성하고 관리하세요</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" :icon="Plus" round @click="showCreateDialog = true">
          새 사이트 생성
        </el-button>
      </div>
    </div>

    <!-- 검색 및 필터 -->
    <div class="search-bar">
      <el-input
        v-model="searchQuery"
        placeholder="사이트 이름 또는 도메인 검색..."
        :prefix-icon="Search"
        clearable
        class="search-input"
      />
      <div class="site-count">
        총 <strong>{{ filteredSites.length }}</strong>개 사이트
      </div>
    </div>

    <!-- 사이트 목록 -->
    <div class="sites-grid">
      <div v-for="site in filteredSites" :key="site.id" class="site-card" @click="goToSite(site.id)">
        <div class="site-card-header">
          <div class="site-icon">
            <el-icon :size="24"><Monitor /></el-icon>
          </div>
          <div class="site-status" :class="site.status">
            {{ site.status === 'active' ? '활성' : '비활성' }}
          </div>
        </div>

        <div class="site-card-body">
          <h3>{{ site.name }}</h3>
          <p class="site-domain">{{ site.domain }}</p>
          <p class="site-date">생성일: {{ site.createdAt }}</p>
        </div>

        <div class="site-card-footer" @click.stop>
          <el-button size="small" text @click="toggleStatus(site.id)">
            <el-icon><Switch /></el-icon>
            상태 변경
          </el-button>
          <el-button size="small" text type="danger" @click="deleteSite(site.id)">
            <el-icon><Delete /></el-icon>
            삭제
          </el-button>
        </div>
      </div>

      <!-- 빈 상태 -->
      <div v-if="filteredSites.length === 0" class="empty-state">
        <el-icon :size="48"><FolderOpened /></el-icon>
        <p>등록된 사이트가 없습니다</p>
        <el-button type="primary" @click="showCreateDialog = true">첫 사이트 만들기</el-button>
      </div>
    </div>

    <!-- 사이트 생성 다이얼로그 -->
    <el-dialog v-model="showCreateDialog" title="새 사이트 생성" width="480px">
      <el-form :model="newSite" label-position="top">
        <el-form-item label="사이트 이름">
          <el-input v-model="newSite.name" placeholder="예: 블로그" />
        </el-form-item>
        <el-form-item label="도메인">
          <el-input v-model="newSite.domain" placeholder="예: blog.example.com" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">취소</el-button>
        <el-button type="primary" @click="createSite">생성</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { Plus, Search, Monitor, Switch, Delete, FolderOpened } from '@element-plus/icons-vue'

export default {
  components: {
    Plus,
    Search,
    Monitor,
    Switch,
    Delete,
    FolderOpened,
  },
}
</script>

<style scoped>
.site-management {
  width: 100%;
}

/* 페이지 헤더 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;
}

.header-content h1 {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 8px 0;
}

.header-content p {
  font-size: 15px;
  color: var(--text-secondary);
  margin: 0;
}

/* 검색 바 */
.search-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.search-input {
  width: 320px;
}

.site-count {
  font-size: 14px;
  color: var(--text-secondary);
}

.site-count strong {
  color: var(--accent-primary);
}

/* 사이트 그리드 */
.sites-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
}

.site-card {
  background: var(--bg-secondary);
  border-radius: 16px;
  padding: 24px;
  border: 1px solid var(--border-light);
  cursor: pointer;
  transition: all 0.3s ease;
}

.site-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
  border-color: var(--accent-primary);
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
  border-radius: 12px;
  background: linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.site-status {
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 20px;
}

.site-status.active {
  background: var(--success-bg);
  color: var(--success-text);
}

.site-status.inactive {
  background: var(--danger-bg);
  color: var(--danger-text);
}

.site-card-body h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 8px 0;
}

.site-domain {
  font-size: 14px;
  color: var(--accent-primary);
  margin: 0 0 4px 0;
}

.site-date {
  font-size: 13px;
  color: var(--text-tertiary);
  margin: 0;
}

.site-card-footer {
  display: flex;
  gap: 8px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--border-light);
}

/* 빈 상태 */
.empty-state {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: var(--text-tertiary);
  text-align: center;
}

.empty-state p {
  margin: 16px 0;
  font-size: 15px;
}

/* 반응형 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 16px;
  }

  .search-bar {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .search-input {
    width: 100%;
  }

  .sites-grid {
    grid-template-columns: 1fr;
  }
}
</style>
