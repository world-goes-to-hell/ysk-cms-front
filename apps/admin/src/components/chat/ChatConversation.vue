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

<!-- CSS: public/css/components/chat.css -->
