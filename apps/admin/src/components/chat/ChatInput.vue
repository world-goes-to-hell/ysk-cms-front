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

<style scoped>
.chat-input {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  padding: 16px 20px;
  background: rgba(0, 0, 0, 0.2);
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.input-wrapper {
  flex: 1;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.2s;
}

.input-wrapper:focus-within {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(99, 102, 241, 0.5);
}

.input-wrapper textarea {
  width: 100%;
  padding: 12px 18px;
  border: none;
  background: transparent;
  outline: none;
  font-size: 14px;
  color: white;
  resize: none;
  max-height: 100px;
  line-height: 1.5;
  font-family: inherit;
}

.input-wrapper textarea::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.send-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.send-btn:disabled {
  cursor: not-allowed;
}

.send-btn.active {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
}

.send-btn.active:hover {
  transform: scale(1.05);
}
</style>
