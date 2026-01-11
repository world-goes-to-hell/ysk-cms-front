<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Search, Close } from '@element-plus/icons-vue'
import { useChatStore } from '@/stores/chat'
import { ElMessage } from 'element-plus'

const visible = defineModel<boolean>({ default: false })

const chatStore = useChatStore()

const searchQuery = ref('')
const selectedUsers = ref<number[]>([])
const groupName = ref('')
const isGroup = ref(false)
const isCreating = ref(false)

const users = computed(() => chatStore.availableUsers)

const filteredUsers = computed(() => {
  if (!searchQuery.value) return users.value

  const query = searchQuery.value.toLowerCase()
  return users.value.filter(
    (user) =>
      user.nickname?.toLowerCase().includes(query) ||
      user.username.toLowerCase().includes(query)
  )
})

const canCreate = computed(() => {
  if (isGroup.value) {
    return selectedUsers.value.length >= 2
  }
  return selectedUsers.value.length === 1
})

watch(visible, (val) => {
  if (!val) {
    searchQuery.value = ''
    selectedUsers.value = []
    groupName.value = ''
    isGroup.value = false
    isCreating.value = false
  }
})

function toggleUser(userId: number) {
  const index = selectedUsers.value.indexOf(userId)
  if (index === -1) {
    selectedUsers.value.push(userId)
  } else {
    selectedUsers.value.splice(index, 1)
  }
}

function getInitial(name: string) {
  return name.charAt(0).toUpperCase()
}

function getAvatarColor(name: string) {
  const colors = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  ]
  return colors[name.charCodeAt(0) % colors.length]
}

async function createChat() {
  if (isCreating.value) return
  isCreating.value = true

  try {
    if (isGroup.value) {
      await chatStore.createGroupChat(groupName.value || undefined, selectedUsers.value)
      ElMessage.success('그룹 채팅방이 생성되었습니다')
    } else {
      await chatStore.startPrivateChat(selectedUsers.value[0])
    }
    visible.value = false
  } catch {
    ElMessage.error('채팅방 생성에 실패했습니다')
  } finally {
    isCreating.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="modal-overlay" @click.self="visible = false">
        <div class="modal-content">
          <!-- Header -->
          <div class="modal-header">
            <h3>새 채팅</h3>
            <button class="close-btn" @click="visible = false">
              <el-icon :size="18"><Close /></el-icon>
            </button>
          </div>

          <!-- Body -->
          <div class="modal-body">
            <!-- Chat Type Toggle -->
            <div class="type-toggle">
              <button
                :class="{ active: !isGroup }"
                @click="isGroup = false; selectedUsers = []"
              >
                1:1 채팅
              </button>
              <button
                :class="{ active: isGroup }"
                @click="isGroup = true; selectedUsers = []"
              >
                그룹 채팅
              </button>
            </div>

            <!-- Group Name -->
            <div v-if="isGroup" class="group-name-input">
              <input
                v-model="groupName"
                type="text"
                placeholder="그룹 이름 (선택)"
              />
            </div>

            <!-- Selected Users -->
            <div v-if="selectedUsers.length > 0" class="selected-users">
              <div
                v-for="userId in selectedUsers"
                :key="userId"
                class="selected-tag"
              >
                <span>{{ users.find((u) => u.userId === userId)?.nickname }}</span>
                <button @click="toggleUser(userId)">
                  <el-icon :size="12"><Close /></el-icon>
                </button>
              </div>
            </div>

            <!-- Search -->
            <div class="search-box">
              <el-icon class="search-icon"><Search /></el-icon>
              <input
                v-model="searchQuery"
                type="text"
                placeholder="사용자 검색..."
              />
            </div>

            <!-- User List -->
            <div class="user-list">
              <div
                v-for="user in filteredUsers"
                :key="user.userId"
                class="user-item"
                :class="{ selected: selectedUsers.includes(user.userId) }"
                @click="toggleUser(user.userId)"
              >
                <div class="user-avatar" :style="{ background: getAvatarColor(user.nickname || user.username) }">
                  {{ getInitial(user.nickname || user.username) }}
                </div>
                <div class="user-info">
                  <span class="user-name">{{ user.nickname || user.username }}</span>
                  <span class="user-username">@{{ user.username }}</span>
                </div>
                <div class="checkbox" :class="{ checked: selectedUsers.includes(user.userId) }">
                  <span v-if="selectedUsers.includes(user.userId)">✓</span>
                </div>
              </div>

              <div v-if="filteredUsers.length === 0" class="empty-users">
                사용자가 없습니다
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="modal-footer">
            <button class="cancel-btn" @click="visible = false">취소</button>
            <button
              class="create-btn"
              :class="{ disabled: !canCreate || isCreating }"
              :disabled="!canCreate || isCreating"
              @click="createChat"
            >
              {{ isCreating ? '생성 중...' : (isGroup ? '그룹 채팅 시작' : '채팅 시작') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
}

.modal-content {
  width: 420px;
  max-height: 80vh;
  background: linear-gradient(180deg, #1e1e32 0%, #1a1a2e 100%);
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: white;
}

.close-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
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

.modal-body {
  flex: 1;
  padding: 20px 24px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.type-toggle {
  display: flex;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  padding: 4px;
}

.type-toggle button {
  flex: 1;
  padding: 10px;
  border: none;
  background: transparent;
  border-radius: 8px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  transition: all 0.2s;
}

.type-toggle button.active {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
}

.group-name-input input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.06);
  font-size: 14px;
  color: white;
  outline: none;
  transition: all 0.2s;
}

.group-name-input input:focus {
  border-color: rgba(99, 102, 241, 0.5);
  background: rgba(255, 255, 255, 0.1);
}

.group-name-input input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.selected-users {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.selected-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: rgba(99, 102, 241, 0.2);
  border-radius: 16px;
  font-size: 13px;
  color: #a5b4fc;
}

.selected-tag button {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 14px;
  height: 42px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.search-icon {
  color: rgba(255, 255, 255, 0.4);
}

.search-box input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-size: 14px;
  color: white;
}

.search-box input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.user-list {
  flex: 1;
  overflow-y: auto;
  margin: 0 -24px;
  padding: 0 24px;
}

.user-list::-webkit-scrollbar {
  width: 6px;
}

.user-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.user-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.user-item:hover {
  background: rgba(255, 255, 255, 0.06);
}

.user-item.selected {
  background: rgba(99, 102, 241, 0.15);
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
  color: white;
}

.user-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: white;
}

.user-username {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.checkbox {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: white;
  transition: all 0.2s;
}

.checkbox.checked {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border-color: transparent;
}

.empty-users {
  text-align: center;
  padding: 40px 0;
  color: rgba(255, 255, 255, 0.4);
  font-size: 14px;
}

.modal-footer {
  display: flex;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.cancel-btn,
.create-btn {
  flex: 1;
  padding: 14px;
  border-radius: 12px;
  border: none;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8);
}

.cancel-btn:hover {
  background: rgba(255, 255, 255, 0.15);
}

.create-btn {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
}

.create-btn:hover:not(.disabled) {
  box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4);
}

.create-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Transition */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-content,
.modal-leave-to .modal-content {
  transform: scale(0.9) translateY(20px);
}
</style>
