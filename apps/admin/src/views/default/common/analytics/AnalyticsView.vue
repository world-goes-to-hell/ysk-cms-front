<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElDatePicker, ElButton, ElTable, ElTableColumn, ElProgress, ElSkeleton } from 'element-plus'
import { Refresh, TrendCharts, User, View, Timer, Warning, Monitor, Iphone, Cellphone } from '@element-plus/icons-vue'
import { useSiteStore } from '@/stores/site'
import * as analyticsApi from '@/api/analytics'
import type { AnalyticsSummary, TrendData, PageStats, DeviceStats, ReferrerStats, RealtimeStats } from '@/api/analytics'

// 사이트 스토어에서 현재 사이트 코드 가져오기
const siteStore = useSiteStore()
const siteCode = computed(() => siteStore.siteCode || 'main')

// 상태
const loading = ref(false)
const dateRange = ref<[Date, Date]>([
  new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
  new Date()
])

const summary = ref<AnalyticsSummary | null>(null)
const trendData = ref<TrendData | null>(null)
const topPages = ref<PageStats[]>([])
const deviceStats = ref<DeviceStats | null>(null)
const referrerStats = ref<ReferrerStats | null>(null)
const realtimeStats = ref<RealtimeStats | null>(null)

let realtimeInterval: ReturnType<typeof setInterval> | null = null

const formatDate = (date: Date) => date.toISOString().split('T')[0]

const loadData = async () => {
  if (!dateRange.value?.[0] || !dateRange.value?.[1]) return

  loading.value = true
  const startDate = formatDate(dateRange.value[0])
  const endDate = formatDate(dateRange.value[1])

  try {
    const [summaryRes, trendRes, pagesRes, devicesRes, referrersRes] = await Promise.all([
      analyticsApi.getSummary(siteCode.value, startDate, endDate),
      analyticsApi.getTrend(siteCode.value, startDate, endDate),
      analyticsApi.getTopPages(siteCode.value, startDate, endDate, 10),
      analyticsApi.getDeviceStats(siteCode.value, startDate, endDate),
      analyticsApi.getReferrerStats(siteCode.value, startDate, endDate)
    ])

    summary.value = summaryRes.data.data
    trendData.value = trendRes.data.data
    topPages.value = pagesRes.data.data || []
    deviceStats.value = devicesRes.data.data
    referrerStats.value = referrersRes.data.data
  } catch (error) {
    console.error('Failed to load analytics:', error)
  } finally {
    loading.value = false
  }
}

const loadRealtimeData = async () => {
  try {
    const res = await analyticsApi.getRealtimeStats(siteCode.value)
    realtimeStats.value = res.data.data
  } catch (error) {
    console.error('Failed to load realtime stats:', error)
  }
}

const getChangeClass = (value: number | undefined) => {
  if (!value) return 'neutral'
  return value > 0 ? 'positive' : value < 0 ? 'negative' : 'neutral'
}

const formatChange = (value: number | undefined) => {
  if (!value) return '0%'
  const sign = value > 0 ? '+' : ''
  return `${sign}${value}%`
}

const maxPageViews = computed(() => {
  if (!trendData.value?.pageViews?.length) return 1
  return Math.max(...trendData.value.pageViews, 1)
})

const getDeviceIcon = (type: string) => {
  switch (type) {
    case 'desktop': return Monitor
    case 'mobile': return Iphone
    default: return Cellphone
  }
}

const getDeviceLabel = (type: string) => {
  switch (type) {
    case 'desktop': return '데스크톱'
    case 'mobile': return '모바일'
    case 'tablet': return '태블릿'
    default: return type
  }
}

onMounted(() => {
  loadData()
  loadRealtimeData()
  realtimeInterval = setInterval(loadRealtimeData, 30000)
})

onUnmounted(() => {
  if (realtimeInterval) clearInterval(realtimeInterval)
})
</script>

<template>
  <div class="analytics-view">
    <!-- 헤더 -->
    <header class="analytics-header">
      <div class="header-title-area">
        <div class="title-icon">
          <el-icon :size="28"><TrendCharts /></el-icon>
        </div>
        <div>
          <h1 class="page-title">방문자 통계</h1>
          <p class="page-subtitle">사이트 트래픽 분석 및 사용자 행동 인사이트</p>
        </div>
      </div>
      <div class="header-controls">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="~"
          start-placeholder="시작일"
          end-placeholder="종료일"
          :shortcuts="[
            { text: '오늘', value: () => [new Date(), new Date()] },
            { text: '최근 7일', value: () => [new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), new Date()] },
            { text: '최근 30일', value: () => [new Date(Date.now() - 29 * 24 * 60 * 60 * 1000), new Date()] },
          ]"
          @change="loadData"
          class="date-picker"
        />
        <el-button :icon="Refresh" @click="loadData" :loading="loading" round>
          새로고침
        </el-button>
      </div>
    </header>

    <!-- 실시간 배너 -->
    <div class="realtime-banner" v-if="realtimeStats">
      <div class="realtime-pulse">
        <span class="pulse-ring"></span>
        <span class="pulse-dot"></span>
      </div>
      <div class="realtime-content">
        <span class="realtime-number">{{ realtimeStats.activeUsers }}</span>
        <span class="realtime-text">명이 현재 사이트를 이용 중</span>
      </div>
      <div class="realtime-wave">
        <svg viewBox="0 0 100 20" preserveAspectRatio="none">
          <path d="M0,10 Q25,5 50,10 T100,10" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.5"/>
          <path d="M0,10 Q25,15 50,10 T100,10" fill="none" stroke="currentColor" stroke-width="1" opacity="0.3"/>
        </svg>
      </div>
    </div>

    <!-- 통계 카드 그리드 -->
    <div class="stats-grid">
      <article class="stat-card visitors">
        <div class="stat-card-glow"></div>
        <div class="stat-card-content">
          <div class="stat-icon">
            <el-icon :size="24"><User /></el-icon>
          </div>
          <div class="stat-info">
            <span class="stat-label">방문자 수</span>
            <span class="stat-value" v-if="!loading">
              {{ summary?.uniqueVisitors?.toLocaleString() || '0' }}
            </span>
            <el-skeleton v-else :rows="1" animated style="width: 80px" />
            <span class="stat-change" :class="getChangeClass(summary?.visitorsChange)">
              {{ formatChange(summary?.visitorsChange) }}
            </span>
          </div>
        </div>
      </article>

      <article class="stat-card pageviews">
        <div class="stat-card-glow"></div>
        <div class="stat-card-content">
          <div class="stat-icon">
            <el-icon :size="24"><View /></el-icon>
          </div>
          <div class="stat-info">
            <span class="stat-label">페이지뷰</span>
            <span class="stat-value" v-if="!loading">
              {{ summary?.totalPageViews?.toLocaleString() || '0' }}
            </span>
            <el-skeleton v-else :rows="1" animated style="width: 80px" />
            <span class="stat-change" :class="getChangeClass(summary?.pageViewsChange)">
              {{ formatChange(summary?.pageViewsChange) }}
            </span>
          </div>
        </div>
      </article>

      <article class="stat-card duration">
        <div class="stat-card-glow"></div>
        <div class="stat-card-content">
          <div class="stat-icon">
            <el-icon :size="24"><Timer /></el-icon>
          </div>
          <div class="stat-info">
            <span class="stat-label">평균 체류 시간</span>
            <span class="stat-value" v-if="!loading">
              {{ summary?.avgSessionDurationStr || '0:00' }}
            </span>
            <el-skeleton v-else :rows="1" animated style="width: 80px" />
            <span class="stat-change neutral">분:초</span>
          </div>
        </div>
      </article>

      <article class="stat-card bounce">
        <div class="stat-card-glow"></div>
        <div class="stat-card-content">
          <div class="stat-icon">
            <el-icon :size="24"><Warning /></el-icon>
          </div>
          <div class="stat-info">
            <span class="stat-label">이탈률</span>
            <span class="stat-value" v-if="!loading">
              {{ summary?.bounceRate || 0 }}%
            </span>
            <el-skeleton v-else :rows="1" animated style="width: 80px" />
            <span class="stat-change" :class="getChangeClass(summary?.bounceRateChange ? -summary.bounceRateChange : 0)">
              {{ formatChange(summary?.bounceRateChange) }}
            </span>
          </div>
        </div>
      </article>
    </div>

    <!-- 메인 콘텐츠 -->
    <div class="main-content">
      <!-- 좌측 영역 -->
      <div class="content-primary">
        <!-- 추이 차트 -->
        <section class="panel chart-panel">
          <header class="panel-header">
            <h2 class="panel-title">방문자 추이</h2>
            <span class="panel-badge">최근 {{ trendData?.labels?.length || 0 }}일</span>
          </header>
          <div class="chart-container" v-if="trendData && !loading">
            <div class="chart-y-axis">
              <span>{{ maxPageViews.toLocaleString() }}</span>
              <span>{{ Math.floor(maxPageViews / 2).toLocaleString() }}</span>
              <span>0</span>
            </div>
            <div class="chart-area">
              <!-- 배경 그리드 라인 -->
              <div class="chart-grid">
                <div class="grid-line"></div>
                <div class="grid-line"></div>
                <div class="grid-line"></div>
              </div>
              <div class="chart-bars">
                <div
                  v-for="(value, index) in trendData.pageViews"
                  :key="index"
                  class="bar-column"
                  :style="{ '--delay': `${index * 50}ms` }"
                >
                  <div
                    class="bar-fill-wrapper"
                    :style="{ '--height': `${(value / maxPageViews) * 100}%` }"
                  >
                    <div class="bar-tooltip">{{ value.toLocaleString() }}</div>
                    <div class="bar-fill"></div>
                  </div>
                  <span class="bar-label">{{ trendData.labels[index] }}</span>
                </div>
              </div>
            </div>
          </div>
          <div class="chart-skeleton" v-else>
            <el-skeleton :rows="6" animated />
          </div>
        </section>

        <!-- 인기 페이지 테이블 -->
        <section class="panel table-panel">
          <header class="panel-header">
            <h2 class="panel-title">인기 페이지</h2>
            <span class="panel-badge">TOP 10</span>
          </header>
          <div class="table-container">
            <el-table
              :data="topPages"
              v-loading="loading"
              :header-cell-style="{ background: 'transparent', color: 'var(--text-secondary)', fontWeight: 600 }"
              :row-style="{ background: 'transparent' }"
            >
              <el-table-column label="#" width="50" align="center">
                <template #default="{ $index }">
                  <span class="rank-number" :class="{ 'is-top': $index < 3 }">
                    {{ $index + 1 }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column label="페이지" min-width="200">
                <template #default="{ row }">
                  <div class="page-cell">
                    <code class="page-url">{{ row.pagePath }}</code>
                    <span class="page-name" v-if="row.pageTitle">{{ row.pageTitle }}</span>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="조회수" width="100" align="right">
                <template #default="{ row }">
                  <span class="number-cell">{{ row.pageViews?.toLocaleString() }}</span>
                </template>
              </el-table-column>
              <el-table-column label="방문자" width="100" align="right">
                <template #default="{ row }">
                  <span class="number-cell secondary">{{ row.uniquePageViews?.toLocaleString() }}</span>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </section>
      </div>

      <!-- 우측 영역 -->
      <aside class="content-secondary">
        <!-- 디바이스 분포 -->
        <section class="panel compact-panel">
          <header class="panel-header">
            <h2 class="panel-title">디바이스</h2>
          </header>
          <div class="device-list" v-if="deviceStats && !loading">
            <div
              v-for="device in deviceStats.devices"
              :key="device.deviceType"
              class="device-item"
            >
              <div class="device-icon">
                <el-icon :size="18"><component :is="getDeviceIcon(device.deviceType)" /></el-icon>
              </div>
              <div class="device-info">
                <div class="device-header">
                  <span class="device-name">{{ getDeviceLabel(device.deviceType) }}</span>
                  <span class="device-percent">{{ device.percentage }}%</span>
                </div>
                <div class="device-bar">
                  <div
                    class="device-bar-fill"
                    :style="{ width: `${device.percentage}%` }"
                    :class="device.deviceType"
                  ></div>
                </div>
              </div>
            </div>
          </div>
          <el-skeleton v-else :rows="3" animated />
        </section>

        <!-- 브라우저 분포 -->
        <section class="panel compact-panel">
          <header class="panel-header">
            <h2 class="panel-title">브라우저</h2>
          </header>
          <div class="browser-list" v-if="deviceStats?.browsers && !loading">
            <div
              v-for="(browser, idx) in deviceStats.browsers"
              :key="browser.browser"
              class="browser-item"
              :style="{ '--idx': idx }"
            >
              <span class="browser-name">{{ browser.browser }}</span>
              <div class="browser-stat">
                <span class="browser-percent">{{ browser.percentage }}%</span>
                <div class="browser-bar">
                  <div
                    class="browser-bar-fill"
                    :style="{ width: `${browser.percentage}%` }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
          <el-skeleton v-else :rows="3" animated />
        </section>

        <!-- 트래픽 소스 -->
        <section class="panel compact-panel">
          <header class="panel-header">
            <h2 class="panel-title">트래픽 소스</h2>
          </header>
          <div class="referrer-list" v-if="referrerStats?.referrers && !loading">
            <div
              v-for="referrer in referrerStats.referrers"
              :key="referrer.type"
              class="referrer-item"
              :class="referrer.type"
            >
              <div class="referrer-indicator"></div>
              <span class="referrer-name">{{ referrer.typeName }}</span>
              <span class="referrer-percent">{{ referrer.percentage }}%</span>
            </div>
          </div>
          <el-skeleton v-else :rows="3" animated />
        </section>

        <!-- 실시간 인기 페이지 -->
        <section class="panel compact-panel realtime-panel" v-if="realtimeStats?.activePages?.length">
          <header class="panel-header">
            <div class="realtime-indicator">
              <span class="mini-pulse"></span>
            </div>
            <h2 class="panel-title">실시간 인기</h2>
          </header>
          <div class="realtime-pages">
            <div
              v-for="(page, index) in realtimeStats.activePages.slice(0, 5)"
              :key="page.pagePath"
              class="realtime-page-item"
            >
              <span class="realtime-rank">{{ index + 1 }}</span>
              <code class="realtime-path">{{ page.pagePath }}</code>
              <span class="realtime-users">{{ page.activeUsers }}</span>
            </div>
          </div>
        </section>
      </aside>
    </div>
  </div>
</template>

<style scoped>
/* ==================== 기본 설정 ==================== */
.analytics-view {
  position: relative;
  min-height: 100%;
  padding: 24px;
  font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
  overflow-x: hidden;
}

/* ==================== 헤더 ==================== */
.analytics-header {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28px;
  flex-wrap: wrap;
  gap: 16px;
}

.header-title-area {
  display: flex;
  align-items: center;
  gap: 16px;
}

.title-icon {
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 8px 24px rgba(99, 102, 241, 0.25);
}

.page-title {
  font-size: 26px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  letter-spacing: -0.02em;
}

.page-subtitle {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 4px 0 0;
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-controls .el-button {
  font-weight: 500;
}

/* ==================== 실시간 배너 ==================== */
.realtime-banner {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px 24px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border-radius: 16px;
  margin-bottom: 28px;
  color: white;
  overflow: hidden;
}

.realtime-pulse {
  position: relative;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pulse-ring {
  position: absolute;
  width: 100%;
  height: 100%;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-radius: 50%;
  animation: pulse-ring 2s ease-out infinite;
}

.pulse-dot {
  width: 14px;
  height: 14px;
  background: white;
  border-radius: 50%;
  box-shadow: 0 0 20px rgba(255, 255, 255, 0.6);
}

@keyframes pulse-ring {
  0% { transform: scale(0.5); opacity: 1; }
  100% { transform: scale(1.5); opacity: 0; }
}

.realtime-content {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.realtime-number {
  font-size: 32px;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.realtime-text {
  font-size: 15px;
  opacity: 0.9;
}

.realtime-wave {
  position: absolute;
  right: 24px;
  width: 120px;
  height: 30px;
  opacity: 0.6;
}

.realtime-wave svg {
  width: 100%;
  height: 100%;
}

.realtime-wave path {
  animation: wave 3s ease-in-out infinite;
}

@keyframes wave {
  0%, 100% { d: path('M0,10 Q25,5 50,10 T100,10'); }
  50% { d: path('M0,10 Q25,15 50,10 T100,10'); }
}

/* ==================== 통계 카드 그리드 ==================== */
.stats-grid {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 28px;
}

.stat-card {
  position: relative;
  background: var(--bg-secondary);
  border-radius: 16px;
  border: 1px solid var(--border-color);
  overflow: hidden;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

:root.dark .stat-card {
  border-color: var(--border-light);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

:root.dark .stat-card:hover {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.stat-card:hover .stat-card-glow {
  opacity: 1;
}

.stat-card-glow {
  position: absolute;
  inset: 0;
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.stat-card.visitors .stat-card-glow {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, transparent 60%);
}

.stat-card.pageviews .stat-card-glow {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, transparent 60%);
}

.stat-card.duration .stat-card-glow {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, transparent 60%);
}

.stat-card.bounce .stat-card-glow {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, transparent 60%);
}

.stat-card-content {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
}

.stat-icon {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-card.visitors .stat-icon {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  color: #2563eb;
}

.stat-card.pageviews .stat-icon {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  color: #059669;
}

.stat-card.duration .stat-icon {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  color: #d97706;
}

.stat-card.bounce .stat-icon {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  color: #dc2626;
}

:root.dark .stat-card.visitors .stat-icon {
  background: rgba(59, 130, 246, 0.2);
  color: #60a5fa;
}

:root.dark .stat-card.pageviews .stat-icon {
  background: rgba(16, 185, 129, 0.2);
  color: #34d399;
}

:root.dark .stat-card.duration .stat-icon {
  background: rgba(245, 158, 11, 0.2);
  color: #fbbf24;
}

:root.dark .stat-card.bounce .stat-icon {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
}

.stat-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-label {
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 500;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.stat-change {
  font-size: 12px;
  font-weight: 600;
}

.stat-change.positive { color: var(--success-text); }
.stat-change.negative { color: var(--danger-text); }
.stat-change.neutral { color: var(--text-tertiary); }

/* ==================== 메인 콘텐츠 레이아웃 ==================== */
.main-content {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 24px;
}

.content-primary {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.content-secondary {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ==================== 패널 공통 ==================== */
.panel {
  background: var(--bg-secondary);
  border-radius: 16px;
  border: 1px solid var(--border-color);
  overflow: hidden;
  transition: background-color 0.3s ease, border-color 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

:root.dark .panel {
  border-color: var(--border-light);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 18px 20px;
  border-bottom: 1px solid var(--border-color);
}

:root.dark .panel-header {
  border-bottom-color: var(--border-light);
}

.panel-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.panel-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  border-radius: 20px;
}

/* ==================== 차트 패널 ==================== */
.chart-panel {
  background: var(--bg-secondary);
  position: relative;
  overflow: hidden;
}

.chart-panel::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background:
    radial-gradient(ellipse at 20% 80%, rgba(99, 102, 241, 0.06) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 20%, rgba(16, 185, 129, 0.04) 0%, transparent 50%);
  pointer-events: none;
}

:root.dark .chart-panel::before {
  background:
    radial-gradient(ellipse at 20% 80%, rgba(99, 102, 241, 0.1) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 20%, rgba(16, 185, 129, 0.08) 0%, transparent 50%);
}

.chart-container {
  display: flex;
  padding: 24px;
  gap: 16px;
  position: relative;
  z-index: 1;
}

.chart-y-axis {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 46px 0 42px;  /* 그리드와 동일한 위치 */
  font-size: 11px;
  font-weight: 500;
  color: var(--text-tertiary);
  text-align: right;
  min-width: 50px;
}

.chart-area {
  flex: 1;
  min-height: 240px;
  position: relative;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px 12px;
}

:root.dark .chart-area {
  background: rgba(15, 23, 42, 0.5);
  border-color: rgba(51, 65, 85, 0.5);
}

/* 배경 그리드 */
.chart-grid {
  position: absolute;
  top: 46px;      /* padding(16px) + chart-bars padding-top(30px) */
  left: 12px;
  right: 12px;
  bottom: 42px;   /* padding(16px) + bar-label 영역(~26px) */
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  pointer-events: none;
}

.grid-line {
  height: 1px;
  background: linear-gradient(90deg,
    transparent 0%,
    #cbd5e1 10%,
    #cbd5e1 90%,
    transparent 100%
  );
}

:root.dark .grid-line {
  background: linear-gradient(90deg,
    transparent 0%,
    rgba(100, 116, 139, 0.5) 10%,
    rgba(100, 116, 139, 0.5) 90%,
    transparent 100%
  );
}

.chart-bars {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  height: 100%;
  gap: 8px;
  padding-top: 30px;
  position: relative;
  z-index: 1;
}

.bar-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  animation: bar-appear 0.6s ease-out forwards;
  animation-delay: var(--delay);
  opacity: 0;
}

@keyframes bar-appear {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.bar-fill-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  width: 100%;
  position: relative;
}

.bar-tooltip {
  position: absolute;
  bottom: calc(var(--height, 0%) + 12px);
  font-size: 12px;
  font-weight: 700;
  color: white;
  background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
  padding: 6px 10px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  opacity: 0;
  transform: translateY(5px) scale(0.9);
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  white-space: nowrap;
  z-index: 10;
  pointer-events: none;
}

.bar-tooltip::after {
  content: '';
  position: absolute;
  bottom: -5px;
  left: 50%;
  transform: translateX(-50%);
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 6px solid #334155;
}

:root.dark .bar-tooltip {
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  color: #1e293b;
}

:root.dark .bar-tooltip::after {
  border-top-color: #e2e8f0;
}

.bar-column:hover .bar-tooltip {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.bar-fill {
  width: 100%;
  max-width: 40px;
  height: var(--height);
  background: linear-gradient(180deg,
    #818cf8 0%,
    #6366f1 40%,
    #4f46e5 100%
  );
  border-radius: 8px 8px 4px 4px;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  min-height: 6px;
  position: relative;
  overflow: hidden;
  box-shadow:
    0 2px 8px rgba(99, 102, 241, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

/* 바 내부 하이라이트 효과 */
.bar-fill::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 50%;
  background: linear-gradient(180deg,
    rgba(255, 255, 255, 0.25) 0%,
    rgba(255, 255, 255, 0.05) 100%
  );
  border-radius: 8px 8px 0 0;
}

/* 바 반짝임 효과 */
.bar-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 50%;
  height: 100%;
  background: linear-gradient(90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.3) 50%,
    transparent 100%
  );
  animation: bar-shimmer 3s ease-in-out infinite;
  animation-delay: var(--delay, 0ms);
}

@keyframes bar-shimmer {
  0%, 100% { left: -100%; }
  50% { left: 100%; }
}

.bar-column:hover .bar-fill {
  transform: scaleY(1.02);
  box-shadow:
    0 4px 20px rgba(99, 102, 241, 0.5),
    0 0 30px rgba(99, 102, 241, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

:root.dark .bar-fill {
  background: linear-gradient(180deg,
    #a5b4fc 0%,
    #818cf8 40%,
    #6366f1 100%
  );
  box-shadow:
    0 2px 12px rgba(129, 140, 248, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
}

:root.dark .bar-column:hover .bar-fill {
  box-shadow:
    0 4px 24px rgba(129, 140, 248, 0.6),
    0 0 40px rgba(129, 140, 248, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.bar-label {
  font-size: 11px;
  font-weight: 500;
  color: var(--text-tertiary);
  margin-top: 10px;
  text-align: center;
  transition: color 0.2s ease;
}

.bar-column:hover .bar-label {
  color: var(--text-primary);
}

.chart-skeleton {
  padding: 20px;
}

/* ==================== 테이블 패널 ==================== */
.table-container {
  padding: 0 4px 4px;
}

.table-container :deep(.el-table) {
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-header-bg-color: transparent;
  --el-table-row-hover-bg-color: var(--bg-tertiary);
  --el-table-border-color: var(--border-light);
  --el-table-text-color: var(--text-primary);
}

.table-container :deep(.el-table__inner-wrapper::before) {
  display: none;
}

.table-container :deep(.el-table td.el-table__cell),
.table-container :deep(.el-table th.el-table__cell) {
  border-bottom: 1px solid var(--border-color);
}

:root.dark .table-container :deep(.el-table td.el-table__cell),
:root.dark .table-container :deep(.el-table th.el-table__cell) {
  border-bottom-color: var(--border-light);
}

.rank-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-tertiary);
  background: var(--bg-tertiary);
  border-radius: 6px;
}

.rank-number.is-top {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  color: white;
}

.page-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.page-url {
  font-size: 13px;
  color: var(--text-primary);
  background: transparent;
  font-family: 'SF Mono', 'Fira Code', monospace;
}

.page-name {
  font-size: 11px;
  color: var(--text-tertiary);
}

.number-cell {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
}

.number-cell.secondary {
  color: var(--text-secondary);
  font-weight: 500;
}

/* ==================== 컴팩트 패널 (사이드바) ==================== */
.compact-panel .panel-header {
  padding: 14px 16px;
}

.compact-panel .panel-title {
  font-size: 14px;
}

/* 디바이스 리스트 */
.device-list {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.device-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.device-icon {
  width: 36px;
  height: 36px;
  background: var(--bg-tertiary);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
}

.device-info {
  flex: 1;
}

.device-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
}

.device-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
}

.device-percent {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.device-bar {
  height: 6px;
  background: var(--bg-tertiary);
  border-radius: 3px;
  overflow: hidden;
}

.device-bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.6s ease;
}

.device-bar-fill.desktop { background: linear-gradient(90deg, #6366f1, #818cf8); }
.device-bar-fill.mobile { background: linear-gradient(90deg, #10b981, #34d399); }
.device-bar-fill.tablet { background: linear-gradient(90deg, #f59e0b, #fbbf24); }

/* 브라우저 리스트 */
.browser-list {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.browser-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.browser-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  min-width: 70px;
}

.browser-stat {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
}

.browser-percent {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  min-width: 36px;
  text-align: right;
}

.browser-bar {
  flex: 1;
  height: 6px;
  background: var(--bg-tertiary);
  border-radius: 3px;
  overflow: hidden;
}

.browser-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #8b5cf6, #a78bfa);
  border-radius: 3px;
  transition: width 0.6s ease;
}

/* 유입 경로 리스트 */
.referrer-list {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.referrer-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: var(--bg-tertiary);
  border-radius: 10px;
  transition: background-color 0.2s ease;
}

.referrer-item:hover {
  background: var(--bg-hover);
}

.referrer-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.referrer-item.direct .referrer-indicator { background: #3b82f6; }
.referrer-item.search .referrer-indicator { background: #10b981; }
.referrer-item.social .referrer-indicator { background: #ec4899; }
.referrer-item.referral .referrer-indicator { background: #f59e0b; }

.referrer-name {
  flex: 1;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
}

.referrer-percent {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
}

/* 실시간 패널 */
.realtime-panel .panel-header {
  gap: 8px;
}

.realtime-indicator {
  position: relative;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mini-pulse {
  width: 8px;
  height: 8px;
  background: #10b981;
  border-radius: 50%;
  animation: mini-pulse 2s ease-out infinite;
}

@keyframes mini-pulse {
  0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.5); }
  70% { box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
  100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
}

.realtime-pages {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.realtime-page-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  background: var(--bg-tertiary);
  border-radius: 8px;
  transition: background-color 0.2s ease;
}

.realtime-page-item:hover {
  background: var(--bg-hover);
}

.realtime-rank {
  width: 20px;
  height: 20px;
  background: var(--border-color);
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-tertiary);
}

.realtime-path {
  flex: 1;
  font-size: 11px;
  color: var(--text-primary);
  font-family: 'SF Mono', 'Fira Code', monospace;
  background: transparent;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.realtime-users {
  font-size: 12px;
  font-weight: 600;
  color: #10b981;
}

/* ==================== 반응형 ==================== */
@media (max-width: 1280px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .main-content {
    grid-template-columns: 1fr 320px;
  }
}

@media (max-width: 1024px) {
  .main-content {
    grid-template-columns: 1fr;
  }

  .content-secondary {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }
}

@media (max-width: 768px) {
  .analytics-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-controls {
    width: 100%;
    flex-wrap: wrap;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .content-secondary {
    grid-template-columns: 1fr;
  }

  .chart-y-axis {
    display: none;
  }
}
</style>
