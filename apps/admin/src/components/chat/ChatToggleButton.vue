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

<style scoped>
.chat-fab {
  position: fixed;
  bottom: 28px;
  right: 28px;
  z-index: 1000;
}

.fab-button {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: white;
  box-shadow:
    0 4px 15px rgba(99, 102, 241, 0.4),
    0 2px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.fab-button:hover {
  transform: scale(1.08);
  box-shadow:
    0 6px 20px rgba(99, 102, 241, 0.5),
    0 4px 10px rgba(0, 0, 0, 0.15);
}

.fab-button:active {
  transform: scale(0.95);
}

.unread-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  background: linear-gradient(135deg, #ef4444 0%, #f97316 100%);
  border-radius: 11px;
  font-size: 11px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid white;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

.status-dot {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid white;
}

.status-dot.online {
  background: #22c55e;
  box-shadow: 0 0 8px rgba(34, 197, 94, 0.6);
}

.status-dot.offline {
  background: #ef4444;
}

/* Transition */
.fab-enter-active,
.fab-leave-active {
  transition: all 0.3s ease;
}

.fab-enter-from,
.fab-leave-to {
  opacity: 0;
  transform: scale(0.5);
}
</style>
