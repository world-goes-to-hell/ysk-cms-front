<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { getDashboard } from '@/api/dashboard'
import type { DashboardResponse, RecentArticle, RecentActivity, StatItem, ArticleStats } from '@/types/dashboard'
import { ElMessage } from 'element-plus'

// 색상 프리셋 정의
const colorPresets = [
  { name: '인디고', gradient: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)', color: '#6366f1' },
  { name: '퍼플', gradient: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)', color: '#8b5cf6' },
  { name: '핑크', gradient: 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)', color: '#ec4899' },
  { name: '로즈', gradient: 'linear-gradient(135deg, #f43f5e 0%, #fb7185 100%)', color: '#f43f5e' },
  { name: '오렌지', gradient: 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)', color: '#f97316' },
  { name: '앰버', gradient: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)', color: '#f59e0b' },
  { name: '그린', gradient: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)', color: '#10b981' },
  { name: '틸', gradient: 'linear-gradient(135deg, #14b8a6 0%, #2dd4bf 100%)', color: '#14b8a6' },
  { name: '시안', gradient: 'linear-gradient(135deg, #06b6d4 0%, #22d3ee 100%)', color: '#06b6d4' },
  { name: '블루', gradient: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)', color: '#3b82f6' },
  { name: '슬레이트', gradient: 'linear-gradient(135deg, #475569 0%, #64748b 100%)', color: '#475569' },
  { name: '다크', gradient: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', color: '#1e293b' },
]

// 기본 색상 인덱스
const defaultColors = [0, 4, 9, 2] // 인디고, 오렌지, 블루, 핑크

// 로딩 상태
const loading = ref(false)

// 통계 데이터
const stats = ref([
  { id: 'users', title: '총 사용자', value: 0, icon: 'User', trend: '0%', trendUp: true, colorIndex: 0 },
  { id: 'contents', title: '총 콘텐츠', value: 0, icon: 'Document', trend: '0%', trendUp: true, colorIndex: 1 },
  { id: 'visits', title: '오늘 방문', value: 0, icon: 'View', trend: '0%', trendUp: true, colorIndex: 2 },
  { id: 'signups', title: '신규 가입', value: 0, icon: 'Plus', trend: '0%', trendUp: false, colorIndex: 3 },
])

// 게시글 통계
const articleStats = ref<ArticleStats>({
  today: 0,
  thisWeek: 0,
  thisMonth: 0,
})

// 최근 게시글
const recentArticles = ref<RecentArticle[]>([])

// 최근 활동
const recentActivities = ref<RecentActivity[]>([])

// 색상 선택 팝업 상태
const activeColorPicker = ref<string | null>(null)

// API 데이터를 stats 배열에 매핑
const updateStats = (data: DashboardResponse) => {
  const statMapping: Record<string, StatItem> = {
    users: data.users,
    contents: data.contents,
    visits: data.visits,
    signups: data.signups,
  }

  stats.value.forEach((stat) => {
    const apiData = statMapping[stat.id]
    if (apiData) {
      stat.title = apiData.title
      stat.value = apiData.value
      stat.icon = apiData.icon
      stat.trend = apiData.trend
      stat.trendUp = apiData.trendUp
    }
  })
}

// 대시보드 데이터 로드
const fetchDashboardData = async () => {
  loading.value = true
  try {
    const response = await getDashboard()
    if (response.data.success && response.data.data) {
      const data = response.data.data
      updateStats(data)
      articleStats.value = data.articleStats || { today: 0, thisWeek: 0, thisMonth: 0 }
      recentArticles.value = data.recentArticles || []
      recentActivities.value = data.recentActivities || []
    }
  } catch (error) {
    console.error('대시보드 데이터 로드 실패:', error)
    ElMessage.error('대시보드 데이터를 불러오는데 실패했습니다.')
  } finally {
    loading.value = false
  }
}

// 새로고침
const handleRefresh = () => {
  fetchDashboardData()
}

// localStorage에서 색상 설정 불러오기
onMounted(() => {
  const savedColors = localStorage.getItem('dashboard_stat_colors')
  if (savedColors) {
    try {
      const colors = JSON.parse(savedColors)
      stats.value.forEach((stat, index) => {
        if (colors[stat.id] !== undefined) {
          stat.colorIndex = colors[stat.id]
        } else {
          stat.colorIndex = defaultColors[index]
        }
      })
    } catch (e) {
      // 기본값 사용
      stats.value.forEach((stat, index) => {
        stat.colorIndex = defaultColors[index]
      })
    }
  } else {
    stats.value.forEach((stat, index) => {
      stat.colorIndex = defaultColors[index]
    })
  }

  // 대시보드 데이터 로드
  fetchDashboardData()
})

// 색상 저장
const saveColors = () => {
  const colors: Record<string, number> = {}
  stats.value.forEach(stat => {
    colors[stat.id] = stat.colorIndex
  })
  localStorage.setItem('dashboard_stat_colors', JSON.stringify(colors))
}

// 색상 변경
const changeColor = (statId: string, colorIndex: number) => {
  const stat = stats.value.find(s => s.id === statId)
  if (stat) {
    stat.colorIndex = colorIndex
    saveColors()
  }
  activeColorPicker.value = null
}

// 색상 선택기 토글
const toggleColorPicker = (statId: string) => {
  if (activeColorPicker.value === statId) {
    activeColorPicker.value = null
  } else {
    activeColorPicker.value = statId
  }
}

// 색상 초기화
const resetColors = () => {
  stats.value.forEach((stat, index) => {
    stat.colorIndex = defaultColors[index]
  })
  saveColors()
  activeColorPicker.value = null
}

// 외부 클릭 시 팝업 닫기
const closeColorPicker = () => {
  activeColorPicker.value = null
}
</script>

<template>
  <div class="dashboard" @click="closeColorPicker" v-loading="loading">
    <!-- 페이지 헤더 -->
    <div class="page-header">
      <div class="header-content">
        <h1>대시보드</h1>
        <p>YSK CMS 관리 현황을 한눈에 확인하세요</p>
      </div>
      <div class="header-actions">
        <el-button :icon="Refresh" round @click="handleRefresh" :loading="loading">새로고침</el-button>
        <el-button type="primary" :icon="Download" round>리포트 다운로드</el-button>
      </div>
    </div>

    <!-- 통계 카드 -->
    <div class="stats-grid">
      <div v-for="stat in stats" :key="stat.id" class="stat-card">
        <div class="stat-header">
          <div
            class="stat-icon-wrap"
            :style="{ background: colorPresets[stat.colorIndex].gradient }"
            @click.stop="toggleColorPicker(stat.id)"
          >
            <el-icon :size="24"><component :is="stat.icon" /></el-icon>
            <div class="color-edit-hint">
              <el-icon :size="12"><Edit /></el-icon>
            </div>
          </div>
          <span class="stat-trend" :class="{ 'trend-up': stat.trendUp, 'trend-down': !stat.trendUp }">
            {{ stat.trend }}
          </span>

          <!-- 색상 선택 팝업 -->
          <Transition name="popup">
            <div v-if="activeColorPicker === stat.id" class="color-picker-popup" @click.stop>
              <div class="color-picker-header">
                <span>아이콘 색상 선택</span>
                <button class="reset-btn" @click="resetColors">초기화</button>
              </div>
              <div class="color-grid">
                <div
                  v-for="(preset, index) in colorPresets"
                  :key="preset.name"
                  class="color-option"
                  :class="{ active: stat.colorIndex === index }"
                  :style="{ background: preset.gradient }"
                  :title="preset.name"
                  @click="changeColor(stat.id, index)"
                >
                  <el-icon v-if="stat.colorIndex === index" :size="16"><Check /></el-icon>
                </div>
              </div>
            </div>
          </Transition>
        </div>
        <div class="stat-body">
          <span class="stat-value">{{ stat.value.toLocaleString() }}</span>
          <span class="stat-title">{{ stat.title }}</span>
        </div>
      </div>
    </div>

    <!-- 메인 콘텐츠 그리드 -->
    <div class="content-grid">
      <!-- 최신 게시글 카드 -->
      <div class="posts-card">
        <div class="posts-bg">
          <div class="grid-lines"></div>
          <div class="gradient-orb orb-1"></div>
          <div class="gradient-orb orb-2"></div>
        </div>

        <div class="posts-header">
          <div class="posts-title-area">
            <div class="posts-icon">
              <el-icon :size="24"><Document /></el-icon>
            </div>
            <div>
              <h2>최신 게시글</h2>
              <p>최근 등록된 게시글을 확인하세요</p>
            </div>
          </div>
          <button class="view-all-btn">
            전체보기
            <el-icon><ArrowRight /></el-icon>
          </button>
        </div>

        <div class="posts-list">
          <template v-if="recentArticles.length > 0">
            <div v-for="post in recentArticles" :key="post.id" class="post-item">
              <div class="post-main">
                <div class="post-title-row">
                  <span class="post-badge">{{ post.board }}</span>
                  <span v-if="post.isNew" class="new-badge">NEW</span>
                </div>
                <h4 class="post-title">{{ post.title }}</h4>
                <div class="post-meta">
                  <span class="post-author">
                    <el-icon :size="12"><User /></el-icon>
                    {{ post.author }}
                  </span>
                  <span class="post-date">{{ post.date }}</span>
                </div>
              </div>
              <div class="post-stats">
                <el-icon :size="14"><View /></el-icon>
                <span>{{ post.views.toLocaleString() }}</span>
              </div>
            </div>
          </template>
          <div v-else class="empty-state">
            <el-icon :size="48"><Document /></el-icon>
            <p>등록된 게시글이 없습니다.</p>
          </div>
        </div>

        <div class="posts-footer">
          <div class="footer-stats">
            <div class="fs-item">
              <span class="fs-number">{{ articleStats.today }}</span>
              <span class="fs-label">오늘 등록</span>
            </div>
            <div class="fs-item">
              <span class="fs-number">{{ articleStats.thisWeek }}</span>
              <span class="fs-label">이번 주</span>
            </div>
            <div class="fs-item">
              <span class="fs-number">{{ articleStats.thisMonth }}</span>
              <span class="fs-label">이번 달</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 우측 패널 -->
      <div class="side-panel">
        <!-- 빠른 액션 -->
        <div class="panel-card">
          <h3>빠른 액션</h3>
          <div class="action-list">
            <div class="action-item">
              <div class="action-icon">
                <el-icon :size="18"><Plus /></el-icon>
              </div>
              <span>새 사용자 추가</span>
              <el-icon class="action-arrow"><ArrowRight /></el-icon>
            </div>
            <div class="action-item">
              <div class="action-icon">
                <el-icon :size="18"><Document /></el-icon>
              </div>
              <span>콘텐츠 작성</span>
              <el-icon class="action-arrow"><ArrowRight /></el-icon>
            </div>
            <div class="action-item">
              <div class="action-icon">
                <el-icon :size="18"><Setting /></el-icon>
              </div>
              <span>시스템 설정</span>
              <el-icon class="action-arrow"><ArrowRight /></el-icon>
            </div>
          </div>
        </div>

        <!-- 최근 활동 -->
        <div class="panel-card">
          <h3>최근 활동</h3>
          <div class="activity-list">
            <template v-if="recentActivities.length > 0">
              <div v-for="activity in recentActivities" :key="activity.id" class="activity-item">
                <div class="activity-icon">
                  <el-icon :size="14"><component :is="activity.icon" /></el-icon>
                </div>
                <div class="activity-info">
                  <span class="activity-user">{{ activity.user }}</span>
                  <span class="activity-action">{{ activity.action }}</span>
                </div>
                <span class="activity-time">{{ activity.time }}</span>
              </div>
            </template>
            <div v-else class="empty-state-small">
              <p>최근 활동이 없습니다.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Plus, Document, Setting, User, ArrowRight, Refresh, Download, Delete, View, Edit, Check } from '@element-plus/icons-vue'

export default {
  components: {
    Plus,
    Document,
    Setting,
    User,
    ArrowRight,
    Refresh,
    Download,
    Delete,
    View,
    Edit,
    Check,
  },
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Pretendard:wght@300;400;500;600;700&display=swap');

* {
  font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif;
}

.dashboard {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ==================== 페이지 헤더 ==================== */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  flex-shrink: 0;
}

.header-content h1 {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 8px 0;
  transition: color 0.3s ease;
}

.header-content p {
  font-size: 15px;
  color: var(--text-secondary);
  margin: 0;
  transition: color 0.3s ease;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.header-actions .el-button {
  border-radius: 20px;
  font-weight: 500;
}

/* ==================== 통계 그리드 ==================== */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
  margin-bottom: 24px;
  flex-shrink: 0;
}

.stat-card {
  background: var(--bg-secondary);
  border-radius: 16px;
  padding: 24px;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-light);
  transition: all 0.3s ease;
}

.stat-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.stat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  position: relative;
}

.stat-icon-wrap {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, #6366f1 0%, #818cf8 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  cursor: pointer;
  position: relative;
  transition: all 0.2s ease;
}

.stat-icon-wrap:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.color-edit-hint {
  position: absolute;
  bottom: -4px;
  right: -4px;
  width: 20px;
  height: 20px;
  background: var(--bg-secondary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  opacity: 0;
  transform: scale(0.8);
  transition: all 0.2s ease;
}

.stat-icon-wrap:hover .color-edit-hint {
  opacity: 1;
  transform: scale(1);
}

/* ==================== 색상 선택 팝업 ==================== */
.color-picker-popup {
  position: absolute;
  top: 60px;
  left: 0;
  background: var(--bg-secondary);
  border-radius: 16px;
  padding: 16px;
  box-shadow: var(--shadow-lg);
  z-index: 100;
  min-width: 240px;
  border: 1px solid var(--border-color);
  transition: background-color 0.3s ease, border-color 0.3s ease;
}

.color-picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-light);
}

.color-picker-header span {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.reset-btn {
  font-size: 12px;
  color: var(--text-secondary);
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.reset-btn:hover {
  background: var(--bg-tertiary);
  color: var(--accent-primary);
}

.color-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 8px;
}

.color-option {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  transition: all 0.2s ease;
  border: 2px solid transparent;
}

.color-option:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.color-option.active {
  border-color: #fff;
  box-shadow: 0 0 0 2px var(--text-primary);
}

/* 팝업 애니메이션 */
.popup-enter-active,
.popup-leave-active {
  transition: all 0.2s ease;
}

.popup-enter-from,
.popup-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.stat-trend {
  font-size: 13px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 20px;
  transition: background-color 0.3s ease, color 0.3s ease;
}

.stat-trend.trend-up {
  color: var(--success-text);
  background: var(--success-bg);
}

.stat-trend.trend-down {
  color: var(--danger-text);
  background: var(--danger-bg);
}

.stat-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1;
  transition: color 0.3s ease;
}

.stat-title {
  font-size: 14px;
  color: var(--text-secondary);
  transition: color 0.3s ease;
}

/* ==================== 콘텐츠 그리드 ==================== */
.content-grid {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 24px;
  flex: 1;
  min-height: 0;
}

/* ==================== 최신 게시글 카드 ==================== */
.posts-card {
  position: relative;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  border-radius: 20px;
  padding: 24px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.posts-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.grid-lines {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 40px 40px;
}

.gradient-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
}

.orb-1 {
  width: 300px;
  height: 300px;
  background: rgba(99, 102, 241, 0.4);
  top: -100px;
  right: -50px;
}

.orb-2 {
  width: 200px;
  height: 200px;
  background: rgba(6, 182, 212, 0.3);
  bottom: -50px;
  left: -50px;
}

.posts-header {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-shrink: 0;
}

.posts-title-area {
  display: flex;
  align-items: center;
  gap: 16px;
}

.posts-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, #6366f1 0%, #818cf8 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.posts-title-area h2 {
  font-size: 20px;
  font-weight: 700;
  color: #fff;
  margin: 0 0 4px 0;
}

.posts-title-area p {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
}

.view-all-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.view-all-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
}

/* 게시글 목록 */
.posts-list {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-right: 8px;
  margin-right: -8px;
}

/* 스크롤바 스타일 */
.posts-list::-webkit-scrollbar {
  width: 6px;
}

.posts-list::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 3px;
}

.posts-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

.posts-list::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

.post-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.post-item:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.15);
  transform: translateX(4px);
}

.post-main {
  flex: 1;
  min-width: 0;
}

.post-title-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.post-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  background: rgba(99, 102, 241, 0.3);
  color: #a5b4fc;
  border-radius: 4px;
}

.new-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  background: #ef4444;
  color: #fff;
  border-radius: 4px;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.post-title {
  font-size: 13px;
  font-weight: 500;
  color: #fff;
  margin: 0 0 4px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.post-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.post-author {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.post-date {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
}

.post-stats {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
  padding-left: 16px;
  border-left: 1px solid rgba(255, 255, 255, 0.1);
}

/* 빈 상태 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 0;
  color: rgba(255, 255, 255, 0.5);
}

.empty-state p {
  margin-top: 16px;
  font-size: 14px;
}

.empty-state-small {
  text-align: center;
  padding: 24px 0;
  color: var(--text-tertiary);
}

.empty-state-small p {
  font-size: 14px;
  margin: 0;
}

/* 게시글 푸터 */
.posts-footer {
  position: relative;
  z-index: 1;
  padding-top: 16px;
  margin-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
}

.footer-stats {
  display: flex;
  gap: 40px;
}

.fs-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.fs-number {
  font-size: 22px;
  font-weight: 700;
  color: #818cf8;
}

.fs-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

/* ==================== 사이드 패널 ==================== */
.side-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 0;
  overflow-y: auto;
}

.side-panel::-webkit-scrollbar {
  width: 6px;
}

.side-panel::-webkit-scrollbar-track {
  background: transparent;
}

.side-panel::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 3px;
}

.side-panel::-webkit-scrollbar-thumb:hover {
  background: var(--text-tertiary);
}

.panel-card {
  background: var(--bg-secondary);
  border-radius: 16px;
  padding: 24px;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-light);
  transition: background-color 0.3s ease, border-color 0.3s ease;
}

.panel-card h3 {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 20px 0;
  transition: color 0.3s ease;
}

/* 빠른 액션 */
.action-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.action-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  background: var(--bg-tertiary);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.action-item:hover {
  background: var(--bg-hover);
}

.action-item:hover .action-icon {
  background: var(--accent-primary);
  color: #fff;
}

.action-item:hover .action-arrow {
  color: var(--accent-primary);
  transform: translateX(4px);
}

.action-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: var(--border-color);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  transition: all 0.3s ease;
}

.action-item span {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  transition: color 0.3s ease;
}

.action-arrow {
  color: var(--text-tertiary);
  font-size: 14px;
  transition: all 0.3s ease;
}

/* 최근 활동 */
.activity-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.activity-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}

.activity-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.activity-user {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  transition: color 0.3s ease;
}

.activity-action {
  font-size: 13px;
  color: var(--text-secondary);
  transition: color 0.3s ease;
}

.activity-time {
  font-size: 12px;
  color: var(--text-tertiary);
  flex-shrink: 0;
  transition: color 0.3s ease;
}

/* ==================== 반응형 ==================== */
@media (max-width: 1400px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .content-grid {
    grid-template-columns: 1fr 360px;
  }
}

@media (max-width: 1024px) {
  .content-grid {
    grid-template-columns: 1fr;
  }

  .page-header {
    flex-direction: column;
    gap: 16px;
  }
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .posts-card {
    padding: 24px;
  }

  .footer-stats {
    gap: 24px;
  }

  .fs-number {
    font-size: 18px;
  }

  .post-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .post-stats {
    border-left: none;
    padding-left: 0;
  }

  .color-picker-popup {
    left: auto;
    right: 0;
  }
}
</style>
