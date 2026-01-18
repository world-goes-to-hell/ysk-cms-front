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

<!-- CSS: public/css/components/chat.css -->
