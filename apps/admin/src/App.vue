<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <RouterView />
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family:
    'Helvetica Neue',
    Helvetica,
    'PingFang SC',
    'Hiragino Sans GB',
    'Microsoft YaHei',
    '微软雅黑',
    Arial,
    sans-serif;
}

/* 채팅 알림 스타일 */
.el-notification.right {
  cursor: pointer;
}

.chat-notification {
  display: flex;
  flex-wrap: wrap;
}

.chat-notification .sender {
  font-weight: 600;
  color: #6366f1;
  margin-right: 4px;
}

.chat-notification .content {
  color: #64748b;
  word-break: break-word;
}
</style>
