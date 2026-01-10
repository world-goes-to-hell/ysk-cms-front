<script setup lang="ts">
import { ref } from 'vue'

const stats = ref([
  { title: '총 사용자', value: 0, icon: 'User', color: '#409eff' },
  { title: '총 콘텐츠', value: 0, icon: 'Document', color: '#67c23a' },
  { title: '오늘 방문', value: 0, icon: 'View', color: '#e6a23c' },
  { title: '신규 가입', value: 0, icon: 'Plus', color: '#f56c6c' },
])
</script>

<template>
  <div class="dashboard">
    <h2>대시보드</h2>

    <!-- 통계 카드 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :xs="24" :sm="12" :md="6" v-for="stat in stats" :key="stat.title">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-info">
              <div class="stat-value">{{ stat.value }}</div>
              <div class="stat-title">{{ stat.title }}</div>
            </div>
            <el-icon :size="48" :style="{ color: stat.color }">
              <component :is="stat.icon" />
            </el-icon>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 환영 메시지 -->
    <el-card class="welcome-card">
      <template #header>
        <span>환영합니다!</span>
      </template>
      <p>YSK CMS 관리자 페이지에 오신 것을 환영합니다.</p>
      <p>왼쪽 메뉴를 통해 각 기능에 접근할 수 있습니다.</p>
    </el-card>
  </div>
</template>

<style scoped>
.dashboard {
  padding: 20px;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  margin-bottom: 20px;
}

.stat-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  color: #303133;
}

.stat-title {
  font-size: 14px;
  color: #909399;
  margin-top: 8px;
}

.welcome-card {
  margin-top: 20px;
}
</style>
