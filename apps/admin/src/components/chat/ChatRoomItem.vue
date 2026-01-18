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

<!-- CSS: public/css/components/chat.css -->
