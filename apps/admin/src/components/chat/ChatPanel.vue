<script setup lang="ts">
import { computed, watch, ref } from 'vue'
import { Close, ArrowLeft, MoreFilled } from '@element-plus/icons-vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import { useChatStore } from '@/stores/chat'
import { useAuthStore } from '@/stores/auth'
import ChatRoomList from './ChatRoomList.vue'
import ChatConversation from './ChatConversation.vue'
import ChatInviteDialog from './ChatInviteDialog.vue'

const chatStore = useChatStore()
const authStore = useAuthStore()

const isPanelOpen = computed(() => chatStore.isPanelOpen)
const currentRoom = computed(() => chatStore.currentRoom)
const isLeaving = ref(false)
const showInviteDialog = ref(false)

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
  if (command === 'invite') {
    showInviteDialog.value = true
  } else if (command === 'leave') {
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
                  <el-dropdown-item command="invite">
                    대화상대 초대
                  </el-dropdown-item>
                  <el-dropdown-item command="leave" :disabled="isLeaving" divided>
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

    <!-- 초대 다이얼로그 -->
    <ChatInviteDialog v-model="showInviteDialog" />
  </Teleport>
</template>

<!-- CSS: public/css/components/chat.css -->
