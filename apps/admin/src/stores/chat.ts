import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ElNotification } from 'element-plus'
import { h } from 'vue'
import * as chatApi from '@/api/chat'
import { wsService } from '@/services/websocket'
import type { ChatRoom, ChatMessage, ChatRoomUser, ChatMessageRequest, TypingNotification, NewMessageNotification, ChatInviteRequest } from '@/types/chat'
import { useAuthStore } from './auth'

export const useChatStore = defineStore('chat', () => {
  // State
  const rooms = ref<ChatRoom[]>([])
  const currentRoom = ref<ChatRoom | null>(null)
  const messages = ref<ChatMessage[]>([])
  const availableUsers = ref<ChatRoomUser[]>([])
  const isLoading = ref(false)
  const isPanelOpen = ref(false)
  const isConnected = ref(false)
  const typingUsers = ref<Map<number, TypingNotification>>(new Map())
  const hasMoreMessages = ref(true)
  const currentPage = ref(0)

  // Getters
  const totalUnreadCount = computed(() => rooms.value.reduce((sum, room) => sum + room.unreadCount, 0))

  const sortedMessages = computed(() =>
    [...messages.value].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  )

  const currentTypingUsers = computed(() => {
    if (!currentRoom.value) return []
    const typing = typingUsers.value.get(currentRoom.value.id)
    return typing && typing.typing ? [typing] : []
  })

  // Actions
  async function connectWebSocket() {
    const authStore = useAuthStore()
    if (!authStore.token) return

    try {
      await wsService.connect(authStore.token)
      isConnected.value = true

      // 읽지 않은 메시지 수 알림 핸들러
      wsService.onUnread((notification) => {
        const room = rooms.value.find((r) => r.id === notification.roomId)
        if (room) {
          room.unreadCount = notification.unreadCount
        }
      })

      // 사용자별 알림 구독
      if (authStore.user?.id) {
        wsService.subscribeToUnread(authStore.user.id)
        wsService.subscribeToNewMessage(authStore.user.id)
        wsService.subscribeToNewRoom(authStore.user.id)
      }

      // 새 메시지 알림 핸들러
      wsService.onNewMessage((notification: NewMessageNotification) => {
        // 채팅방 목록의 lastMessage 업데이트
        const room = rooms.value.find((r) => r.id === notification.roomId)
        if (room) {
          room.lastMessage = notification.messageType === 'TEXT'
            ? notification.content
            : notification.messageType === 'IMAGE' ? '📷 사진' : '📎 파일'
          room.lastMessageAt = notification.createdAt

          // 최신 메시지 순으로 정렬
          rooms.value.sort((a, b) => {
            const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0
            const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0
            return bTime - aTime
          })
        }

        // 현재 열려있는 채팅방이면 토스트 알림 안 표시
        if (currentRoom.value?.id === notification.roomId) return

        showMessageNotification(notification)
      })

      // 새 채팅방 알림 핸들러
      wsService.onNewRoom((room) => {
        console.log('[Chat] New room received:', room)
        // 이미 있는 채팅방이면 스킵
        if (!rooms.value.find((r) => r.id === room.id)) {
          rooms.value.unshift(room)
        }
      })
    } catch (error) {
      console.error('WebSocket connection failed:', error)
      isConnected.value = false
    }
  }

  // 새 메시지 토스트 알림 표시
  function showMessageNotification(notification: NewMessageNotification) {
    const contentPreview = notification.messageType === 'TEXT'
      ? notification.content.length > 50
        ? notification.content.substring(0, 50) + '...'
        : notification.content
      : notification.messageType === 'IMAGE'
        ? '📷 사진'
        : '📎 파일'

    ElNotification({
      title: notification.roomName,
      message: h('div', { class: 'chat-notification' }, [
        h('span', { class: 'sender' }, notification.senderNickname + ': '),
        h('span', { class: 'content' }, contentPreview)
      ]),
      type: 'info',
      duration: 5000,
      position: 'bottom-right',
      onClick: () => {
        openPanel()
        openRoom(notification.roomId)
      }
    })
  }

  function disconnectWebSocket() {
    wsService.disconnect()
    isConnected.value = false
  }

  async function fetchRooms() {
    try {
      isLoading.value = true
      const response = await chatApi.getChatRooms()
      rooms.value = response.data.data || []
    } catch (error) {
      console.error('Failed to fetch rooms:', error)
    } finally {
      isLoading.value = false
    }
  }

  async function fetchMessages(roomId: number, loadMore = false) {
    try {
      isLoading.value = true
      const page = loadMore ? currentPage.value + 1 : 0
      const response = await chatApi.getMessages(roomId, page)
      const pageData = response.data.data

      if (loadMore) {
        messages.value = [...pageData.content.reverse(), ...messages.value]
      } else {
        messages.value = pageData.content.reverse()
      }

      hasMoreMessages.value = !pageData.last
      currentPage.value = page
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    } finally {
      isLoading.value = false
    }
  }

  async function fetchAvailableUsers() {
    try {
      const response = await chatApi.getAvailableUsers()
      availableUsers.value = response.data.data || []
    } catch (error) {
      console.error('Failed to fetch users:', error)
    }
  }

  async function openRoom(roomId: number) {
    console.log('[Chat] Opening room:', roomId)

    // 이전 방 구독 해제
    if (currentRoom.value) {
      console.log('[Chat] Unsubscribing from previous room:', currentRoom.value.id)
      wsService.unsubscribeFromRoom(currentRoom.value.id)
    }

    try {
      const response = await chatApi.getChatRoom(roomId)
      currentRoom.value = response.data.data
      console.log('[Chat] Room loaded:', currentRoom.value)

      // 메시지 로드
      await fetchMessages(roomId)

      // 읽음 처리
      await chatApi.markAsRead(roomId)
      const room = rooms.value.find((r) => r.id === roomId)
      if (room) room.unreadCount = 0

      // WebSocket 구독
      wsService.subscribeToRoom(roomId)
      wsService.joinRoom(roomId)

      // 메시지 핸들러 등록
      wsService.onMessage(roomId, (message) => {
        messages.value.push(message)

        // 채팅방 목록 업데이트
        const room = rooms.value.find((r) => r.id === roomId)
        if (room) {
          room.lastMessage = message.content
          room.lastMessageAt = message.createdAt
        }
      })

      // 타이핑 핸들러 등록
      wsService.onTyping(roomId, (notification) => {
        if (notification.typing) {
          typingUsers.value.set(roomId, notification)
        } else {
          typingUsers.value.delete(roomId)
        }
      })

      // 참여자 변경 핸들러 등록
      wsService.onParticipants(roomId, (participants) => {
        console.log('[Chat] Participants updated for room', roomId, participants)
        // 현재 방의 참여자 업데이트
        if (currentRoom.value?.id === roomId) {
          currentRoom.value.participants = participants
        }
        // 채팅방 목록의 참여자도 업데이트
        const room = rooms.value.find((r) => r.id === roomId)
        if (room) {
          room.participants = participants
        }
      })
    } catch (error) {
      console.error('Failed to open room:', error)
    }
  }

  function closeRoom() {
    if (currentRoom.value) {
      wsService.unsubscribeFromRoom(currentRoom.value.id)
    }
    currentRoom.value = null
    messages.value = []
    currentPage.value = 0
    hasMoreMessages.value = true
  }

  async function startPrivateChat(targetUserId: number) {
    try {
      const response = await chatApi.getOrCreatePrivateRoom(targetUserId)
      const room = response.data.data
      await fetchRooms()
      await openRoom(room.id)
      return room
    } catch (error) {
      console.error('Failed to start private chat:', error)
      throw error
    }
  }

  async function createGroupChat(name: string, participantIds: number[]) {
    try {
      const response = await chatApi.createGroupRoom({ name, participantIds })
      const room = response.data.data
      await fetchRooms()
      await openRoom(room.id)
      return room
    } catch (error) {
      console.error('Failed to create group chat:', error)
      throw error
    }
  }

  function sendMessage(content: string, type: 'TEXT' | 'IMAGE' | 'FILE' = 'TEXT') {
    if (!currentRoom.value) {
      console.error('[Chat] No current room - cannot send message')
      return
    }

    console.log('[Chat] Sending message to room', currentRoom.value.id, 'content:', content)

    const request: ChatMessageRequest = {
      type,
      content
    }

    wsService.sendMessage(currentRoom.value.id, request)
  }

  function sendTyping(isTyping: boolean) {
    const authStore = useAuthStore()
    if (!currentRoom.value || !authStore.user) return

    const notification: TypingNotification = {
      roomId: currentRoom.value.id,
      userId: authStore.user.id,
      username: authStore.user.username,
      nickname: authStore.user.nickname || authStore.user.username,
      typing: isTyping
    }

    wsService.sendTyping(currentRoom.value.id, notification)
  }

  async function leaveCurrentRoom() {
    if (!currentRoom.value) return

    try {
      await chatApi.leaveRoom(currentRoom.value.id)
      closeRoom()
      await fetchRooms()
    } catch (error) {
      console.error('Failed to leave room:', error)
      throw error
    }
  }

  async function inviteUsers(userIds: number[], groupName?: string): Promise<ChatRoom | null> {
    if (!currentRoom.value) return null

    try {
      const request: ChatInviteRequest = {
        userIds,
        groupName
      }
      const response = await chatApi.inviteUsers(currentRoom.value.id, request)
      const room = response.data.data

      // 1:1 채팅방에서 초대한 경우 새 그룹 채팅방이 생성됨
      if (currentRoom.value.type === 'PRIVATE') {
        await fetchRooms()
        await openRoom(room.id)
      } else {
        // 그룹 채팅방은 현재 방에 사용자가 추가됨
        currentRoom.value.participants = room.participants
        await fetchRooms()
      }

      return room
    } catch (error) {
      console.error('Failed to invite users:', error)
      throw error
    }
  }

  function togglePanel() {
    isPanelOpen.value = !isPanelOpen.value
  }

  function openPanel() {
    isPanelOpen.value = true
  }

  function closePanel() {
    isPanelOpen.value = false
    closeRoom()
  }

  // 채팅방 표시 이름 계산
  function getRoomDisplayName(room: ChatRoom, currentUserId: number): string {
    if (room.type === 'GROUP') {
      return room.name || '그룹 채팅'
    }
    // 1:1 채팅: 상대방 이름 표시
    const otherUser = room.participants.find((p) => p.userId !== currentUserId)
    return otherUser?.nickname || otherUser?.username || '알 수 없음'
  }

  return {
    // State
    rooms,
    currentRoom,
    messages,
    availableUsers,
    isLoading,
    isPanelOpen,
    isConnected,
    typingUsers,
    hasMoreMessages,
    currentPage,

    // Getters
    totalUnreadCount,
    sortedMessages,
    currentTypingUsers,

    // Actions
    connectWebSocket,
    disconnectWebSocket,
    fetchRooms,
    fetchMessages,
    fetchAvailableUsers,
    openRoom,
    closeRoom,
    startPrivateChat,
    createGroupChat,
    sendMessage,
    sendTyping,
    leaveCurrentRoom,
    inviteUsers,
    togglePanel,
    openPanel,
    closePanel,
    getRoomDisplayName
  }
})
