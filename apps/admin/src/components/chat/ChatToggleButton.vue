<script setup lang="ts">
import { computed } from 'vue'
import { ChatDotRound } from '@element-plus/icons-vue'
import { useChatStore } from '@/stores/chat'

const chatStore = useChatStore()

const unreadCount = computed(() => chatStore.totalUnreadCount)
const isConnected = computed(() => chatStore.isConnected)
const isPanelOpen = computed(() => chatStore.isPanelOpen)
</script>

<template>
  <Transition name="fab">
    <div
      v-show="!isPanelOpen"
      class="chat-fab"
      @click="chatStore.togglePanel"
    >
      <div class="fab-button" :class="{ connected: isConnected }">
        <el-icon :size="26">
          <ChatDotRound />
        </el-icon>
        <span v-if="unreadCount > 0" class="unread-badge">
          {{ unreadCount > 99 ? '99+' : unreadCount }}
        </span>
        <span v-if="!isConnected" class="status-dot offline"></span>
        <span v-else class="status-dot online"></span>
      </div>
    </div>
  </Transition>
</template>

<!-- CSS: public/css/components/chat.css -->
