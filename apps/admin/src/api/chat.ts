import api from './index'
import type { ChatRoom, ChatMessage, ChatRoomUser, ChatRoomCreateRequest, ChatInviteRequest } from '@/types/chat'
import type { PageResponse } from '@/types/common'

// 내 채팅방 목록 조회
export const getChatRooms = () => api.get<ChatRoom[]>('/chat/rooms')

// 채팅방 상세 조회
export const getChatRoom = (roomId: number) => api.get<ChatRoom>(`/chat/rooms/${roomId}`)

// 1:1 채팅방 생성/조회
export const getOrCreatePrivateRoom = (targetUserId: number) =>
  api.post<ChatRoom>(`/chat/rooms/private/${targetUserId}`)

// 그룹 채팅방 생성
export const createGroupRoom = (request: ChatRoomCreateRequest) =>
  api.post<ChatRoom>('/chat/rooms', request)

// 채팅방 이름 변경
export const updateRoomName = (roomId: number, newName: string) =>
  api.patch<ChatRoom>(`/chat/rooms/${roomId}/name`, newName, {
    headers: { 'Content-Type': 'text/plain' }
  })

// 메시지 목록 조회
export const getMessages = (roomId: number, page = 0, size = 50) =>
  api.get<PageResponse<ChatMessage>>(`/chat/rooms/${roomId}/messages`, {
    params: { page, size }
  })

// 읽음 처리
export const markAsRead = (roomId: number) => api.post(`/chat/rooms/${roomId}/read`)

// 채팅방 나가기
export const leaveRoom = (roomId: number) => api.post(`/chat/rooms/${roomId}/leave`)

// 채팅 가능한 사용자 목록
export const getAvailableUsers = () => api.get<ChatRoomUser[]>('/chat/users')

// 채팅방에 사용자 초대
export const inviteUsers = (roomId: number, request: ChatInviteRequest) =>
  api.post<ChatRoom>(`/chat/rooms/${roomId}/invite`, request)
