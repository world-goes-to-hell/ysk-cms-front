<script setup lang="ts">
import { computed } from 'vue'
import { useChatStore } from '@/stores/chat'
import { useAuthStore } from '@/stores/auth'
import type { ChatRoom } from '@/types/chat'

const props = defineProps<{
  room: ChatRoom
}>()

const chatStore = useChatStore()
const authStore = useAuthStore()

const displayName = computed(() =>
  chatStore.getRoomDisplayName(props.room, authStore.user?.id || 0)
)

const initial = computed(() => displayName.value.charAt(0).toUpperCase())

const lastMessageTime = computed(() => {
  if (!props.room.lastMessageAt) return ''
  const date = new Date(props.room.lastMessageAt)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
  } else if (diffDays === 1) {
    return '어제'
  } else if (diffDays < 7) {
    return date.toLocaleDateString('ko-KR', { weekday: 'short' })
  } else {
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
  }
})

const isGroup = computed(() => props.room.type === 'GROUP')
const hasUnread = computed(() => props.room.unreadCount > 0)

// 아바타 색상 (이름 기반)
const avatarColor = computed(() => {
  const colors = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
  ]
  const index = displayName.value.charCodeAt(0) % colors.length
  return colors[index]
})
</script>

<template>
  <div class="room-item" :class="{ unread: hasUnread }">
    <div class="avatar" :style="{ background: avatarColor }">
      <span v-if="isGroup" class="group-icon">👥</span>
      <span v-else class="initial">{{ initial }}</span>
    </div>

    <div class="room-content">
      <div class="room-header">
        <span class="room-name">{{ displayName }}</span>
        <span class="room-time">{{ lastMessageTime }}</span>
      </div>
      <div class="room-preview">
        <span class="preview-text">{{ room.lastMessage || '새로운 채팅방' }}</span>
        <span v-if="hasUnread" class="unread-count">
          {{ room.unreadCount > 99 ? '99+' : room.unreadCount }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.room-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 20px;
  cursor: pointer;
  transition: all 0.2s;
  border-left: 3px solid transparent;
}

.room-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.room-item.unread {
  background: rgba(99, 102, 241, 0.08);
  border-left-color: #6366f1;
}

.avatar {
  width: 50px;
  height: 50px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 20px;
  font-weight: 600;
  color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.group-icon {
  font-size: 22px;
}

.initial {
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.room-content {
  flex: 1;
  min-width: 0;
}

.room-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.room-name {
  font-size: 15px;
  font-weight: 600;
  color: white;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.room-item.unread .room-name {
  color: #a5b4fc;
}

.room-time {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
  flex-shrink: 0;
  margin-left: 8px;
}

.room-preview {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.preview-text {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.room-item.unread .preview-text {
  color: rgba(255, 255, 255, 0.7);
}

.unread-count {
  flex-shrink: 0;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
