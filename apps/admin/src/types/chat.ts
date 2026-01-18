// 채팅방 타입
export type ChatRoomType = 'PRIVATE' | 'GROUP'

// 메시지 타입
export type MessageType = 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM'

// 채팅방 사용자
export interface ChatRoomUser {
  id?: number
  userId: number
  username: string
  nickname: string
  joinedAt?: string
  lastReadAt?: string
  isActive?: boolean
}

// 채팅방
export interface ChatRoom {
  id: number
  name?: string
  type: ChatRoomType
  lastMessage?: string
  lastMessageAt?: string
  participants: ChatRoomUser[]
  unreadCount: number
  createdAt: string
}

// 채팅 메시지
export interface ChatMessage {
  id?: number
  roomId: number
  senderId?: number
  senderUsername?: string
  senderNickname?: string
  type: MessageType
  content: string
  fileName?: string
  fileUrl?: string
  fileSize?: number
  createdAt: string
}

// 채팅방 생성 요청
export interface ChatRoomCreateRequest {
  name?: string
  participantIds: number[]
}

// 채팅방 초대 요청
export interface ChatInviteRequest {
  userIds: number[]
  groupName?: string  // 1:1 → 그룹 전환 시 그룹 이름 (선택)
}

// 메시지 전송 요청
export interface ChatMessageRequest {
  type: MessageType
  content: string
  fileName?: string
  fileUrl?: string
  fileSize?: number
}

// 타이핑 알림
export interface TypingNotification {
  roomId: number
  userId: number
  username: string
  nickname: string
  typing: boolean
}

// 읽지 않은 메시지 수 알림
export interface UnreadCountNotification {
  roomId: number
  unreadCount: number
}

// 새 메시지 알림
export interface NewMessageNotification {
  roomId: number
  roomName: string
  roomType: 'PRIVATE' | 'GROUP'
  senderNickname: string
  content: string
  messageType: MessageType
  createdAt: string
}
