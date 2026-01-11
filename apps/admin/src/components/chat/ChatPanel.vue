<script setup lang="ts">
import { computed, watch, ref } from 'vue'
import { Close, ArrowLeft, MoreFilled } from '@element-plus/icons-vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import { useChatStore } from '@/stores/chat'
import { useAuthStore } from '@/stores/auth'
import ChatRoomList from './ChatRoomList.vue'
import ChatConversation from './ChatConversation.vue'

const chatStore = useChatStore()
const authStore = useAuthStore()

const isPanelOpen = computed(() => chatStore.isPanelOpen)
const currentRoom = computed(() => chatStore.currentRoom)
const isLeaving = ref(false)

watch(isPanelOpen, async (open) => {
  if (open) {
    await chatStore.fetchRooms()
  }
})

async function handleLeaveRoom() {
  if (!currentRoom.value || isLeaving.value) return

  try {
    await ElMessageBox.confirm(
      '채팅방을 나가시겠습니까? 대화 내용은 삭제되지 않습니다.',
      '채팅방 나가기',
      {
        confirmButtonText: '나가기',
        cancelButtonText: '취소',
        type: 'warning',
      }
    )

    isLeaving.value = true
    await chatStore.leaveCurrentRoom()
    ElMessage.success('채팅방을 나갔습니다')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('채팅방 나가기에 실패했습니다')
    }
  } finally {
    isLeaving.value = false
  }
}

function handleCommand(command: string) {
  if (command === 'leave') {
    handleLeaveRoom()
  }
}
</script>

<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition name="fade">
      <div v-if="isPanelOpen" class="chat-backdrop" @click="chatStore.closePanel"></div>
    </Transition>

    <!-- Panel -->
    <Transition name="slide">
      <div v-if="isPanelOpen" class="chat-panel">
        <!-- Header -->
        <div class="panel-header">
          <div class="header-left">
            <button v-if="currentRoom" class="back-btn" @click="chatStore.closeRoom">
              <el-icon :size="20"><ArrowLeft /></el-icon>
            </button>
            <div class="header-title">
              <h3>{{ currentRoom ? chatStore.getRoomDisplayName(currentRoom, authStore.user?.id || 0) : '채팅' }}</h3>
              <span v-if="currentRoom" class="participant-info">
                {{ currentRoom.participants.length }}명 참여
              </span>
            </div>
          </div>
          <div class="header-right">
            <el-dropdown v-if="currentRoom" trigger="click" @command="handleCommand">
              <button class="menu-btn">
                <el-icon :size="20"><MoreFilled /></el-icon>
              </button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="leave" :disabled="isLeaving">
                    <span class="leave-text">채팅방 나가기</span>
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <button class="close-btn" @click="chatStore.closePanel">
              <el-icon :size="20"><Close /></el-icon>
            </button>
          </div>
        </div>

        <!-- Body -->
        <div class="panel-body">
          <ChatConversation v-if="currentRoom" />
          <ChatRoomList v-else />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.chat-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(4px);
  z-index: 2000;
}

.chat-panel {
  position: fixed;
  top: 0;
  right: 0;
  width: 400px;
  height: 100vh;
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
  display: flex;
  flex-direction: column;
  z-index: 2001;
  box-shadow: -8px 0 30px rgba(0, 0, 0, 0.3);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  background: rgba(0, 0, 0, 0.2);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.back-btn {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  color: white;
}

.header-title h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: white;
}

.participant-info {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.close-btn {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.menu-btn {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.menu-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  color: white;
}

.leave-text {
  color: #ef4444;
}

.panel-body {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}

@media (max-width: 480px) {
  .chat-panel {
    width: 100%;
  }
}
</style>
