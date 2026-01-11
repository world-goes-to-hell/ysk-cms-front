<script setup lang="ts">
import { computed, ref } from 'vue'
import { Plus, Search } from '@element-plus/icons-vue'
import { useChatStore } from '@/stores/chat'
import { useAuthStore } from '@/stores/auth'
import ChatRoomItem from './ChatRoomItem.vue'
import ChatUserSelect from './ChatUserSelect.vue'

const chatStore = useChatStore()
const authStore = useAuthStore()

const rooms = computed(() => chatStore.rooms)
const isLoading = computed(() => chatStore.isLoading)
const searchQuery = ref('')
const showUserSelect = ref(false)

const filteredRooms = computed(() => {
  if (!searchQuery.value) return rooms.value

  const query = searchQuery.value.toLowerCase()
  return rooms.value.filter((room) => {
    const displayName = chatStore.getRoomDisplayName(room, authStore.user?.id || 0)
    return displayName.toLowerCase().includes(query)
  })
})

function openRoom(roomId: number) {
  chatStore.openRoom(roomId)
}

function startNewChat() {
  showUserSelect.value = true
  chatStore.fetchAvailableUsers()
}
</script>

<template>
  <div class="room-list">
    <!-- Search & New Chat -->
    <div class="list-header">
      <div class="search-box">
        <el-icon class="search-icon"><Search /></el-icon>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="채팅방 검색..."
          class="search-input"
        />
      </div>
      <button class="new-chat-btn" @click="startNewChat">
        <el-icon :size="18"><Plus /></el-icon>
      </button>
    </div>

    <!-- Room List -->
    <div class="list-content" v-loading="isLoading" element-loading-background="transparent">
      <template v-if="filteredRooms.length > 0">
        <ChatRoomItem
          v-for="room in filteredRooms"
          :key="room.id"
          :room="room"
          @click="openRoom(room.id)"
        />
      </template>
      <div v-else class="empty-state">
        <div class="empty-icon">💬</div>
        <p>채팅방이 없습니다</p>
        <span>새 채팅을 시작해보세요</span>
      </div>
    </div>

    <ChatUserSelect v-model="showUserSelect" />
  </div>
</template>

<style scoped>
.room-list {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.list-header {
  display: flex;
  gap: 10px;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.search-box {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 14px;
  height: 42px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  transition: all 0.2s;
}

.search-box:focus-within {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(99, 102, 241, 0.5);
}

.search-icon {
  color: rgba(255, 255, 255, 0.4);
  font-size: 16px;
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-size: 14px;
  color: white;
}

.search-input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.new-chat-btn {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.new-chat-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4);
}

.list-content {
  flex: 1;
  overflow-y: auto;
}

.list-content::-webkit-scrollbar {
  width: 6px;
}

.list-content::-webkit-scrollbar-track {
  background: transparent;
}

.list-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.list-content::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.6;
}

.empty-state p {
  margin: 0 0 4px;
  font-size: 15px;
  color: rgba(255, 255, 255, 0.7);
}

.empty-state span {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.4);
}
</style>
