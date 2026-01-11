<script setup lang="ts">
import { computed } from 'vue'
import { Document } from '@element-plus/icons-vue'
import type { ChatMessage } from '@/types/chat'

const props = defineProps<{
  message: ChatMessage
  isMine: boolean
}>()

const formattedTime = computed(() => {
  const date = new Date(props.message.createdAt)
  return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
})

const isSystemMessage = computed(() => props.message.type === 'SYSTEM')

const initial = computed(() =>
  (props.message.senderNickname || props.message.senderUsername || '?').charAt(0).toUpperCase()
)

const avatarColor = computed(() => {
  const colors = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  ]
  const name = props.message.senderNickname || ''
  const index = name.charCodeAt(0) % colors.length
  return colors[index]
})
</script>

<template>
  <div
    class="message-item"
    :class="{
      mine: isMine,
      system: isSystemMessage
    }"
  >
    <!-- System Message -->
    <template v-if="isSystemMessage">
      <div class="system-message">
        {{ message.content }}
      </div>
    </template>

    <!-- Regular Message -->
    <template v-else>
      <!-- Avatar (for other's messages) -->
      <div v-if="!isMine" class="avatar" :style="{ background: avatarColor }">
        {{ initial }}
      </div>

      <div class="message-wrapper">
        <!-- Sender Name -->
        <span v-if="!isMine" class="sender-name">
          {{ message.senderNickname || message.senderUsername }}
        </span>

        <div class="message-row">
          <!-- Time (left side for mine) -->
          <span v-if="isMine" class="message-time">{{ formattedTime }}</span>

          <!-- Bubble -->
          <div class="bubble">
            <!-- Text -->
            <template v-if="message.type === 'TEXT'">
              {{ message.content }}
            </template>

            <!-- Image -->
            <template v-else-if="message.type === 'IMAGE'">
              <img :src="message.fileUrl" :alt="message.fileName" class="message-image" />
            </template>

            <!-- File -->
            <template v-else-if="message.type === 'FILE'">
              <a :href="message.fileUrl" target="_blank" class="file-attachment">
                <el-icon :size="18"><Document /></el-icon>
                <span>{{ message.fileName }}</span>
              </a>
            </template>
          </div>

          <!-- Time (right side for others) -->
          <span v-if="!isMine" class="message-time">{{ formattedTime }}</span>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.message-item {
  display: flex;
  gap: 10px;
}

.message-item.mine {
  flex-direction: row-reverse;
}

.message-item.system {
  justify-content: center;
}

.system-message {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  background: rgba(255, 255, 255, 0.08);
  padding: 6px 14px;
  border-radius: 12px;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  color: white;
  flex-shrink: 0;
}

.message-wrapper {
  display: flex;
  flex-direction: column;
  max-width: 70%;
}

.mine .message-wrapper {
  align-items: flex-end;
}

.sender-name {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 4px;
  margin-left: 4px;
}

.message-row {
  display: flex;
  align-items: flex-end;
  gap: 8px;
}

.bubble {
  padding: 12px 16px;
  border-radius: 18px;
  font-size: 14px;
  line-height: 1.5;
  word-break: break-word;
}

.message-item:not(.mine) .bubble {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border-bottom-left-radius: 6px;
}

.message-item.mine .bubble {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  border-bottom-right-radius: 6px;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.message-time {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
  flex-shrink: 0;
}

.message-image {
  max-width: 200px;
  max-height: 200px;
  border-radius: 12px;
  display: block;
}

.file-attachment {
  display: flex;
  align-items: center;
  gap: 8px;
  color: inherit;
  text-decoration: none;
}

.file-attachment:hover {
  text-decoration: underline;
}
</style>
