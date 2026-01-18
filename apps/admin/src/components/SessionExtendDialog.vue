<script setup lang="ts">
import { ElDialog, ElButton } from 'element-plus'
import { Warning } from '@element-plus/icons-vue'
import { useTokenExpiry } from '@/composables/useTokenExpiry'

// 만료 5분 전에 다이얼로그 표시
const {
  showDialog,
  isExtending,
  extendSession,
  handleLogout,
  formatRemainingTime
} = useTokenExpiry(5)
</script>

<template>
  <ElDialog
    v-model="showDialog"
    title="세션 만료 경고"
    width="400px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :show-close="false"
    align-center
    custom-class="session-extend-dialog"
  >
    <div class="session-dialog-content">
      <div class="warning-icon">
        <Warning />
      </div>
      <p class="message">
        세션이 곧 만료됩니다.<br />
        계속 사용하시려면 세션을 연장해주세요.
      </p>
      <div class="timer">
        <span class="time">{{ formatRemainingTime() }}</span>
        <span class="label">후 자동 로그아웃</span>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <ElButton @click="handleLogout">로그아웃</ElButton>
        <ElButton type="primary" :loading="isExtending" @click="extendSession">
          세션 연장
        </ElButton>
      </div>
    </template>
  </ElDialog>
</template>

<!-- CSS: public/css/components/session-extend-dialog.css -->
