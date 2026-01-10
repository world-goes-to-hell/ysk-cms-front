<script setup lang="ts">
import { ref } from 'vue'

const stats = ref([
  { title: '총 사용자', value: 1284, icon: 'User', trend: '+12%', trendUp: true },
  { title: '총 콘텐츠', value: 456, icon: 'Document', trend: '+8%', trendUp: true },
  { title: '오늘 방문', value: 892, icon: 'View', trend: '+23%', trendUp: true },
  { title: '신규 가입', value: 48, icon: 'Plus', trend: '-5%', trendUp: false },
])

const recentPosts = ref([
  { id: 1, title: '2024년 시스템 업데이트 안내', board: '공지사항', author: '관리자', date: '2024-01-10', views: 342, isNew: true },
  { id: 2, title: '신규 기능 사용 가이드', board: '공지사항', author: '관리자', date: '2024-01-09', views: 256, isNew: true },
  { id: 3, title: '서버 점검 일정 안내 (1/15)', board: '공지사항', author: '운영팀', date: '2024-01-08', views: 189, isNew: false },
  { id: 4, title: '자주 묻는 질문 모음', board: 'FAQ', author: '관리자', date: '2024-01-07', views: 521, isNew: false },
  { id: 5, title: '이벤트 당첨자 발표', board: '이벤트', author: '마케팅팀', date: '2024-01-06', views: 892, isNew: false },
])

const recentActivities = ref([
  { user: '김관리자', action: '새 콘텐츠 등록', time: '5분 전', icon: 'Document' },
  { user: '이운영자', action: '사용자 권한 수정', time: '12분 전', icon: 'User' },
  { user: '박매니저', action: '시스템 설정 변경', time: '1시간 전', icon: 'Setting' },
  { user: '최관리자', action: '콘텐츠 삭제', time: '2시간 전', icon: 'Delete' },
])
</script>

<template>
  <div class="dashboard">
    <!-- 페이지 헤더 -->
    <div class="page-header">
      <div class="header-content">
        <h1>대시보드</h1>
        <p>YSK CMS 관리 현황을 한눈에 확인하세요</p>
      </div>
      <div class="header-actions">
        <el-button :icon="Refresh" round>새로고침</el-button>
        <el-button type="primary" :icon="Download" round>리포트 다운로드</el-button>
      </div>
    </div>

    <!-- 통계 카드 -->
    <div class="stats-grid">
      <div v-for="stat in stats" :key="stat.title" class="stat-card">
        <div class="stat-header">
          <div class="stat-icon-wrap">
            <el-icon :size="24"><component :is="stat.icon" /></el-icon>
          </div>
          <span class="stat-trend" :class="{ 'trend-up': stat.trendUp, 'trend-down': !stat.trendUp }">
            {{ stat.trend }}
          </span>
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
          <div v-for="post in recentPosts" :key="post.id" class="post-item">
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
        </div>

        <div class="posts-footer">
          <div class="footer-stats">
            <div class="fs-item">
              <span class="fs-number">{{ recentPosts.length }}</span>
              <span class="fs-label">오늘 등록</span>
            </div>
            <div class="fs-item">
              <span class="fs-number">23</span>
              <span class="fs-label">이번 주</span>
            </div>
            <div class="fs-item">
              <span class="fs-number">156</span>
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
            <div v-for="(activity, index) in recentActivities" :key="index" class="activity-item">
              <div class="activity-icon">
                <el-icon :size="14"><component :is="activity.icon" /></el-icon>
              </div>
              <div class="activity-info">
                <span class="activity-user">{{ activity.user }}</span>
                <span class="activity-action">{{ activity.action }}</span>
              </div>
              <span class="activity-time">{{ activity.time }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Plus, Document, Setting, User, ArrowRight, Refresh, Download, Delete, View } from '@element-plus/icons-vue'

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
}

/* ==================== 페이지 헤더 ==================== */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;
}

.header-content h1 {
  font-size: 28px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0 0 8px 0;
}

.header-content p {
  font-size: 15px;
  color: #64748b;
  margin: 0;
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
  margin-bottom: 32px;
}

.stat-card {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  border: 1px solid #f1f5f9;
  transition: all 0.2s ease;
}

.stat-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
  transform: translateY(-2px);
}

.stat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
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
}

.stat-trend {
  font-size: 13px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 20px;
}

.stat-trend.trend-up {
  color: #10b981;
  background: #ecfdf5;
}

.stat-trend.trend-down {
  color: #ef4444;
  background: #fef2f2;
}

.stat-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: #1a1a2e;
  line-height: 1;
}

.stat-title {
  font-size: 14px;
  color: #64748b;
}

/* ==================== 콘텐츠 그리드 ==================== */
.content-grid {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 24px;
}

/* ==================== 최신 게시글 카드 ==================== */
.posts-card {
  position: relative;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  border-radius: 20px;
  padding: 32px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
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
  margin-bottom: 24px;
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
  gap: 12px;
  flex: 1;
}

.post-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
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
  gap: 8px;
  margin-bottom: 6px;
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
  font-size: 14px;
  font-weight: 500;
  color: #fff;
  margin: 0 0 8px 0;
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

/* 게시글 푸터 */
.posts-footer {
  position: relative;
  z-index: 1;
  padding-top: 20px;
  margin-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
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
  gap: 24px;
}

.panel-card {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  border: 1px solid #f1f5f9;
}

.panel-card h3 {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0 0 20px 0;
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
  background: #f8fafc;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-item:hover {
  background: #f1f5f9;
}

.action-item:hover .action-icon {
  background: #6366f1;
  color: #fff;
}

.action-item:hover .action-arrow {
  color: #6366f1;
  transform: translateX(4px);
}

.action-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  transition: all 0.2s ease;
}

.action-item span {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  color: #334155;
}

.action-arrow {
  color: #94a3b8;
  font-size: 14px;
  transition: all 0.2s ease;
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
  background: linear-gradient(135deg, #6366f1 0%, #818cf8 100%);
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
  color: #1a1a2e;
}

.activity-action {
  font-size: 13px;
  color: #64748b;
}

.activity-time {
  font-size: 12px;
  color: #94a3b8;
  flex-shrink: 0;
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
}
</style>
