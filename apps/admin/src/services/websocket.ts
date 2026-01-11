import { Client } from '@stomp/stompjs'
import type { IMessage, StompSubscription } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import type { ChatMessage, ChatMessageRequest, TypingNotification, UnreadCountNotification, NewMessageNotification, ChatRoom } from '@/types/chat'

type MessageHandler = (message: ChatMessage) => void
type TypingHandler = (notification: TypingNotification) => void
type UnreadHandler = (notification: UnreadCountNotification) => void
type NewMessageHandler = (notification: NewMessageNotification) => void
type NewRoomHandler = (room: ChatRoom) => void

export class WebSocketService {
  private client: Client | null = null
  private subscriptions: Map<string, StompSubscription> = new Map()
  private messageHandlers: Map<number, MessageHandler[]> = new Map()
  private typingHandlers: Map<number, TypingHandler[]> = new Map()
  private unreadHandler: UnreadHandler | null = null
  private newMessageHandler: NewMessageHandler | null = null
  private newRoomHandler: NewRoomHandler | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private baseUrl: string

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:8080'
  }

  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.client?.connected) {
        resolve()
        return
      }

      this.client = new Client({
        webSocketFactory: () => new SockJS(`${this.baseUrl}/ws/chat`),
        connectHeaders: {
          Authorization: `Bearer ${token}`
        },
        debug: (str) => {
          if (import.meta.env.DEV) {
            console.log('[WebSocket]', str)
          }
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        onConnect: () => {
          console.log('[WebSocket] Connected')
          this.reconnectAttempts = 0
          resolve()
        },
        onStompError: (frame) => {
          console.error('[WebSocket] STOMP error:', frame.headers['message'])
          reject(new Error(frame.headers['message']))
        },
        onWebSocketClose: () => {
          console.log('[WebSocket] Disconnected')
          this.reconnectAttempts++
          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('[WebSocket] Max reconnect attempts reached')
          }
        }
      })

      this.client.activate()
    })
  }

  disconnect(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe())
    this.subscriptions.clear()
    this.messageHandlers.clear()
    this.typingHandlers.clear()
    this.client?.deactivate()
    this.client = null
  }

  isConnected(): boolean {
    return this.client?.connected ?? false
  }

  // 사용자별 안읽음 알림 구독
  subscribeToUnread(userId: number): void {
    if (!this.client?.connected) return

    const key = 'user-unread'
    // 이미 구독 중이면 스킵
    if (this.subscriptions.has(key)) return

    const subscription = this.client.subscribe(`/topic/chat/user/${userId}/unread`, (message: IMessage) => {
      const notification: UnreadCountNotification = JSON.parse(message.body)
      console.log('[WebSocket] Unread notification:', notification)
      this.unreadHandler?.(notification)
    })

    this.subscriptions.set(key, subscription)
  }

  // 사용자별 새 메시지 알림 구독
  subscribeToNewMessage(userId: number): void {
    if (!this.client?.connected) return

    const key = 'user-new-message'
    if (this.subscriptions.has(key)) return

    const subscription = this.client.subscribe(`/topic/chat/user/${userId}/message`, (message: IMessage) => {
      const notification: NewMessageNotification = JSON.parse(message.body)
      console.log('[WebSocket] New message notification:', notification)
      this.newMessageHandler?.(notification)
    })

    this.subscriptions.set(key, subscription)
  }

  // 사용자별 새 채팅방 알림 구독
  subscribeToNewRoom(userId: number): void {
    if (!this.client?.connected) return

    const key = 'user-new-room'
    if (this.subscriptions.has(key)) return

    const subscription = this.client.subscribe(`/topic/chat/user/${userId}/room`, (message: IMessage) => {
      const room: ChatRoom = JSON.parse(message.body)
      console.log('[WebSocket] New room notification:', room)
      this.newRoomHandler?.(room)
    })

    this.subscriptions.set(key, subscription)
  }

  // 채팅방 구독
  subscribeToRoom(roomId: number): void {
    if (!this.client?.connected) return

    const roomKey = `room-${roomId}`
    const typingKey = `typing-${roomId}`

    // 이미 구독 중이면 스킵
    if (this.subscriptions.has(roomKey)) return

    // 메시지 구독
    const msgSubscription = this.client.subscribe(`/topic/chat/room/${roomId}`, (message: IMessage) => {
      const chatMessage: ChatMessage = JSON.parse(message.body)
      console.log('[WebSocket] Message received for room', roomId, chatMessage)
      const handlers = this.messageHandlers.get(roomId) || []
      console.log('[WebSocket] Handlers count:', handlers.length)
      handlers.forEach((handler) => handler(chatMessage))
    })
    this.subscriptions.set(roomKey, msgSubscription)

    // 타이핑 구독
    const typingSubscription = this.client.subscribe(
      `/topic/chat/room/${roomId}/typing`,
      (message: IMessage) => {
        const notification: TypingNotification = JSON.parse(message.body)
        const handlers = this.typingHandlers.get(roomId) || []
        handlers.forEach((handler) => handler(notification))
      }
    )
    this.subscriptions.set(typingKey, typingSubscription)
  }

  // 채팅방 구독 해제
  unsubscribeFromRoom(roomId: number): void {
    const roomKey = `room-${roomId}`
    const typingKey = `typing-${roomId}`

    this.subscriptions.get(roomKey)?.unsubscribe()
    this.subscriptions.get(typingKey)?.unsubscribe()
    this.subscriptions.delete(roomKey)
    this.subscriptions.delete(typingKey)
    this.messageHandlers.delete(roomId)
    this.typingHandlers.delete(roomId)
  }

  // 메시지 핸들러 등록
  onMessage(roomId: number, handler: MessageHandler): void {
    const handlers = this.messageHandlers.get(roomId) || []
    handlers.push(handler)
    this.messageHandlers.set(roomId, handlers)
  }

  // 타이핑 핸들러 등록
  onTyping(roomId: number, handler: TypingHandler): void {
    const handlers = this.typingHandlers.get(roomId) || []
    handlers.push(handler)
    this.typingHandlers.set(roomId, handlers)
  }

  // 읽지 않은 메시지 핸들러 등록
  onUnread(handler: UnreadHandler): void {
    this.unreadHandler = handler
  }

  // 새 메시지 알림 핸들러 등록
  onNewMessage(handler: NewMessageHandler): void {
    this.newMessageHandler = handler
  }

  // 새 채팅방 알림 핸들러 등록
  onNewRoom(handler: NewRoomHandler): void {
    this.newRoomHandler = handler
  }

  // 메시지 전송
  sendMessage(roomId: number, request: ChatMessageRequest): void {
    if (!this.client?.connected) {
      console.error('[WebSocket] Not connected - cannot send message')
      return
    }

    console.log('[WebSocket] Sending message to room', roomId, request)
    this.client.publish({
      destination: `/app/chat.send/${roomId}`,
      body: JSON.stringify(request)
    })
  }

  // 타이핑 상태 전송
  sendTyping(roomId: number, notification: TypingNotification): void {
    if (!this.client?.connected) return

    this.client.publish({
      destination: `/app/chat.typing/${roomId}`,
      body: JSON.stringify(notification)
    })
  }

  // 채팅방 입장
  joinRoom(roomId: number): void {
    if (!this.client?.connected) return

    this.client.publish({
      destination: `/app/chat.join/${roomId}`,
      body: ''
    })
  }
}

// 싱글톤 인스턴스
export const wsService = new WebSocketService()
