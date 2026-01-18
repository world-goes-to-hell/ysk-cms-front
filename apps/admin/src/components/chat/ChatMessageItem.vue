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

<!-- CSS: public/css/components/chat.css -->
