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

<!-- CSS: public/css/components/chat.css -->
