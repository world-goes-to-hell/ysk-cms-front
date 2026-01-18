<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElDialog, ElCheckbox, ElInput, ElButton, ElMessage } from 'element-plus'
import { Search, Plus } from '@element-plus/icons-vue'
import { useChatStore } from '@/stores/chat'
import { useAuthStore } from '@/stores/auth'
import type { ChatRoomUser } from '@/types/chat'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'invited'): void
}>()

const chatStore = useChatStore()
const authStore = useAuthStore()

const searchQuery = ref('')
const selectedUserIds = ref<number[]>([])
const groupName = ref('')
const isInviting = ref(false)

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// 현재 방 타입
const isPrivateRoom = computed(() => chatStore.currentRoom?.type === 'PRIVATE')

// 현재 방 참여자 ID 목록
const currentParticipantIds = computed(() => {
  if (!chatStore.currentRoom) return []
  return chatStore.currentRoom.participants
    .filter(p => p.isActive !== false)
    .map(p => p.userId)
})

// 초대 가능한 사용자 목록 (현재 참여자 제외)
const availableForInvite = computed((): ChatRoomUser[] => {
  const currentUserId = authStore.user?.id || 0
  return chatStore.availableUsers.filter(user => {
    // 본인 제외
    if (user.userId === currentUserId) return false
    // 이미 참여 중인 사용자 제외
    if (currentParticipantIds.value.includes(user.userId)) return false
    return true
  })
})

// 검색 필터링된 사용자
const filteredUsers = computed(() => {
  if (!searchQuery.value) return availableForInvite.value
  const query = searchQuery.value.toLowerCase()
  return availableForInvite.value.filter(user =>
    user.nickname.toLowerCase().includes(query) ||
    user.username.toLowerCase().includes(query)
  )
})

// 선택된 사용자 정보
const selectedUsers = computed(() => {
  return chatStore.availableUsers.filter(user => selectedUserIds.value.includes(user.userId))
})

// 다이얼로그 열릴 때 사용자 목록 로드
watch(dialogVisible, async (open) => {
  if (open) {
    await chatStore.fetchAvailableUsers()
    selectedUserIds.value = []
    groupName.value = ''
    searchQuery.value = ''
  }
})

function toggleUser(userId: number) {
  const index = selectedUserIds.value.indexOf(userId)
  if (index === -1) {
    selectedUserIds.value.push(userId)
  } else {
    selectedUserIds.value.splice(index, 1)
  }
}

function removeSelectedUser(userId: number) {
  const index = selectedUserIds.value.indexOf(userId)
  if (index !== -1) {
    selectedUserIds.value.splice(index, 1)
  }
}

function isSelected(userId: number): boolean {
  return selectedUserIds.value.includes(userId)
}

async function handleInvite() {
  if (selectedUserIds.value.length === 0) {
    ElMessage.warning('초대할 사용자를 선택해주세요')
    return
  }

  try {
    isInviting.value = true
    console.log('[ChatInvite] Inviting users:', selectedUserIds.value, 'groupName:', groupName.value)
    await chatStore.inviteUsers(selectedUserIds.value, groupName.value || undefined)
    ElMessage.success('초대가 완료되었습니다')
    dialogVisible.value = false
    emit('invited')
  } catch (error: any) {
    console.error('[ChatInvite] Error:', error)
    const message = error?.response?.data?.message || error?.message || '초대에 실패했습니다'
    ElMessage.error(message)
  } finally {
    isInviting.value = false
  }
}

function handleClose() {
  dialogVisible.value = false
}
</script>

<template>
  <ElDialog
    v-model="dialogVisible"
    :title="isPrivateRoom ? '대화상대 초대' : '대화상대 초대'"
    width="420px"
    :close-on-click-modal="false"
    class="invite-dialog"
    align-center
  >
    <div class="invite-content">
      <!-- 안내 메시지 -->
      <div v-if="isPrivateRoom" class="info-banner">
        <div class="info-icon">💬</div>
        <div class="info-text">
          1:1 채팅방에서 초대하면<br />
          <strong>새 그룹 채팅방</strong>이 생성됩니다.
        </div>
      </div>

      <!-- 1:1 채팅방인 경우 그룹명 입력 -->
      <div v-if="isPrivateRoom" class="group-name-section">
        <label class="section-label">그룹 채팅방 이름</label>
        <ElInput
          v-model="groupName"
          placeholder="입력하지 않으면 참여자 이름으로 자동 생성"
          clearable
        />
      </div>

      <!-- 선택된 사용자 태그 -->
      <div v-if="selectedUsers.length > 0" class="selected-users">
        <label class="section-label">선택된 사용자 ({{ selectedUsers.length }}명)</label>
        <div class="selected-tags">
          <div
            v-for="user in selectedUsers"
            :key="user.userId"
            class="selected-tag"
          >
            <span class="tag-avatar">{{ user.nickname.charAt(0) }}</span>
            <span class="tag-name">{{ user.nickname }}</span>
            <button class="tag-remove" @click="removeSelectedUser(user.userId)">×</button>
          </div>
        </div>
      </div>

      <!-- 검색 -->
      <div class="search-section">
        <label class="section-label">사용자 검색</label>
        <ElInput
          v-model="searchQuery"
          placeholder="이름 또는 아이디로 검색..."
          :prefix-icon="Search"
          clearable
        />
      </div>

      <!-- 사용자 목록 -->
      <div class="user-list">
        <div v-if="filteredUsers.length === 0" class="empty-state">
          <div class="empty-icon">👥</div>
          <p v-if="availableForInvite.length === 0">초대할 수 있는 사용자가 없습니다</p>
          <p v-else>검색 결과가 없습니다</p>
        </div>
        <div
          v-for="user in filteredUsers"
          :key="user.userId"
          class="user-item"
          :class="{ selected: isSelected(user.userId) }"
          @click="toggleUser(user.userId)"
        >
          <div class="user-avatar">
            {{ user.nickname.charAt(0) }}
          </div>
          <div class="user-info">
            <span class="nickname">{{ user.nickname }}</span>
            <span class="username">@{{ user.username }}</span>
          </div>
          <div class="user-action">
            <div v-if="isSelected(user.userId)" class="check-icon">✓</div>
            <el-icon v-else class="add-icon"><Plus /></el-icon>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <ElButton @click="handleClose" size="large">취소</ElButton>
        <ElButton
          type="primary"
          size="large"
          :loading="isInviting"
          :disabled="selectedUserIds.length === 0"
          @click="handleInvite"
        >
          <template #default>
            {{ selectedUserIds.length > 0 ? `${selectedUserIds.length}명 초대하기` : '초대하기' }}
          </template>
        </ElButton>
      </div>
    </template>
  </ElDialog>
</template>

<!-- CSS: public/css/components/chat.css -->
