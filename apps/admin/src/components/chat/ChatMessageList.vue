<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { Loading } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import ChatMessageItem from './ChatMessageItem.vue'
import type { ChatMessage } from '@/types/chat'

defineProps<{
  messages: ChatMessage[]
  loading: boolean
  hasMore: boolean
}>()

const emit = defineEmits<{
  loadMore: []
}>()

const authStore = useAuthStore()
const containerRef = ref<HTMLElement | null>(null)
const isAtBottom = ref(true)

function handleScroll() {
  if (!containerRef.value) return

  const { scrollTop, scrollHeight, clientHeight } = containerRef.value

  if (scrollTop < 50) {
    emit('loadMore')
  }

  isAtBottom.value = scrollHeight - scrollTop - clientHeight < 50
}

function scrollToBottom() {
  nextTick(() => {
    if (containerRef.value && isAtBottom.value) {
      containerRef.value.scrollTop = containerRef.value.scrollHeight
    }
  })
}

onMounted(() => {
  scrollToBottom()
})

defineExpose({
  scrollToBottom
})
</script>

<template>
  <div class="message-list" ref="containerRef" @scroll="handleScroll">
    <!-- Load More -->
    <div v-if="loading && hasMore" class="load-more">
      <el-icon class="is-loading"><Loading /></el-icon>
      <span>이전 메시지 불러오는 중...</span>
    </div>

    <!-- Messages -->
    <template v-if="messages.length > 0">
      <ChatMessageItem
        v-for="message in messages"
        :key="message.id || message.createdAt"
        :message="message"
        :is-mine="message.senderId === authStore.user?.id"
      />
    </template>

    <!-- Empty State -->
    <div v-else class="empty-messages">
      <div class="empty-icon">👋</div>
      <p>첫 메시지를 보내보세요!</p>
    </div>
  </div>
</template>

<style scoped>
.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.message-list::-webkit-scrollbar {
  width: 6px;
}

.message-list::-webkit-scrollbar-track {
  background: transparent;
}

.message-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.load-more {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.empty-messages {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.empty-messages p {
  margin: 0;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
}
</style>
