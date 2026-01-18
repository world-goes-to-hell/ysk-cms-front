<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { Position } from '@element-plus/icons-vue'
import { useChatStore } from '@/stores/chat'

const chatStore = useChatStore()

const message = ref('')
const typingTimeout = ref<number | null>(null)
const isTyping = ref(false)
const inputRef = ref<HTMLTextAreaElement | null>(null)

function handleInput() {
  if (!isTyping.value) {
    isTyping.value = true
    chatStore.sendTyping(true)
  }

  if (typingTimeout.value) {
    clearTimeout(typingTimeout.value)
  }

  typingTimeout.value = window.setTimeout(() => {
    isTyping.value = false
    chatStore.sendTyping(false)
  }, 1000)
}

function handleSend() {
  const content = message.value.trim()
  if (!content) return

  chatStore.sendMessage(content)
  message.value = ''

  if (isTyping.value) {
    isTyping.value = false
    chatStore.sendTyping(false)
  }
  if (typingTimeout.value) {
    clearTimeout(typingTimeout.value)
  }

  inputRef.value?.focus()
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}

onUnmounted(() => {
  if (typingTimeout.value) {
    clearTimeout(typingTimeout.value)
  }
})
</script>

<template>
  <div class="chat-input">
    <div class="input-wrapper">
      <textarea
        ref="inputRef"
        v-model="message"
        placeholder="메시지를 입력하세요..."
        rows="1"
        @input="handleInput"
        @keydown="handleKeydown"
      ></textarea>
    </div>
    <button
      class="send-btn"
      :class="{ active: message.trim() }"
      :disabled="!message.trim()"
      @click="handleSend"
    >
      <el-icon :size="20"><Position /></el-icon>
    </button>
  </div>
</template>

<!-- CSS: public/css/components/chat.css -->
