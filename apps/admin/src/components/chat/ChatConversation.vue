<script setup lang="ts">
import { computed, ref, nextTick, watch } from 'vue'
import { useChatStore } from '@/stores/chat'
import ChatMessageList from './ChatMessageList.vue'
import ChatInput from './ChatInput.vue'

const chatStore = useChatStore()

const messageListRef = ref<InstanceType<typeof ChatMessageList> | null>(null)
const messages = computed(() => chatStore.sortedMessages)
const isLoading = computed(() => chatStore.isLoading)
const typingUsers = computed(() => chatStore.currentTypingUsers)
const hasMore = computed(() => chatStore.hasMoreMessages)

watch(
  () => messages.value.length,
  async () => {
    await nextTick()
    messageListRef.value?.scrollToBottom()
  }
)

function loadMoreMessages() {
  if (chatStore.currentRoom && hasMore.value && !isLoading.value) {
    chatStore.fetchMessages(chatStore.currentRoom.id, true)
  }
}
</script>

<template>
  <div class="conversation">
    <ChatMessageList
      ref="messageListRef"
      :messages="messages"
      :loading="isLoading"
      :has-more="hasMore"
      @load-more="loadMoreMessages"
    />

    <!-- Typing Indicator -->
    <div v-if="typingUsers.length > 0" class="typing-indicator">
      <div class="typing-animation">
        <span></span><span></span><span></span>
      </div>
      <span class="typing-text">
        {{ typingUsers.map((u) => u.nickname).join(', ') }}님이 입력 중...
      </span>
    </div>

    <ChatInput />
  </div>
</template>

<style scoped>
.conversation {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: rgba(0, 0, 0, 0.1);
}

.typing-indicator {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 20px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}

.typing-animation {
  display: flex;
  gap: 4px;
}

.typing-animation span {
  width: 6px;
  height: 6px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out;
}

.typing-animation span:nth-child(1) {
  animation-delay: 0s;
}

.typing-animation span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-animation span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes bounce {
  0%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-6px);
  }
}
</style>
