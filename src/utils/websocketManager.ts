import { io, Socket } from 'socket.io-client'
import { connectionStatus } from './connectionStatus'

// WebSocket 连接配置接口
export interface WebSocketConfig {
  url: string
  path?: string
  transports?: string[]
  reconnectionAttempts?: number
  reconnectionDelay?: number
  reconnectionDelayMax?: number
  connectionName: string
  onConnect?: (socket: Socket) => void
  onDisconnect?: () => void
  onConnectError?: (error: any) => void
  onReconnect?: (attemptNumber: number) => void
  onReconnectAttempt?: (attemptNumber: number) => void
  onReconnectError?: (error: any) => void
  onReconnectFailed?: () => void
}

// WebSocket 管理器类
export class WebSocketManager {
  private socket: Socket | null = null
  private config: WebSocketConfig
  private reconnectAttempts = 0
  private maxReconnectAttempts: number
  private reconnectDelay: number
  private reconnectDelayMax: number
  private reconnectTimer: NodeJS.Timeout | null = null
  private isManualDisconnect = false

  constructor(config: WebSocketConfig) {
    this.config = {
      path: '/socket.io/',
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      ...config
    }
    this.maxReconnectAttempts = this.config.reconnectionAttempts!
    this.reconnectDelay = this.config.reconnectionDelay!
    this.reconnectDelayMax = this.config.reconnectionDelayMax!
  }

  // 连接状态
  get isConnected(): boolean {
    return this.socket?.connected || false
  }

  // 获取 socket 实例
  getSocket(): Socket | null {
    return this.socket
  }

  // 建立连接
  connect(): Socket {
    if (this.socket?.connected) {
      return this.socket
    }

    console.log(`[WebSocketManager] 连接 ${this.config.connectionName}: ${this.config.url}`)

    // 创建 socket 连接
    this.socket = io(this.config.url, {
      path: this.config.path,
      transports: this.config.transports,
      reconnection: false, // 我们手动处理重连
      autoConnect: false
    })

    // 设置事件监听器
    this.setupEventListeners()

    // 连接
    this.socket.connect()

    return this.socket
  }

  // 设置事件监听器
  private setupEventListeners() {
    if (!this.socket) return

    this.socket.on('connect', () => {
      console.log(`[WebSocketManager] ${this.config.connectionName} 连接成功`)
      this.reconnectAttempts = 0
      this.isManualDisconnect = false
      
      // 更新连接状态
      connectionStatus[this.config.connectionName] = true
      
      // 调用用户回调
      this.config.onConnect?.(this.socket!)
    })

    this.socket.on('disconnect', (reason) => {
      console.log(`[WebSocketManager] ${this.config.connectionName} 连接断开: ${reason}`)
      
      // 更新连接状态
      connectionStatus[this.config.connectionName] = false
      
      // 调用用户回调
      this.config.onDisconnect?.()

      // 如果不是手动断开，尝试重连
      if (!this.isManualDisconnect && reason !== 'io client disconnect') {
        this.scheduleReconnect()
      }
    })

    this.socket.on('connect_error', (error) => {
      console.error(`[WebSocketManager] ${this.config.connectionName} 连接错误:`, error)
      
      // 更新连接状态
      connectionStatus[this.config.connectionName] = false
      
      // 调用用户回调
      this.config.onConnectError?.(error)

      // 尝试重连
      if (!this.isManualDisconnect) {
        this.scheduleReconnect()
      }
    })
  }

  // 安排重连
  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(`[WebSocketManager] ${this.config.connectionName} 重连失败，已达到最大尝试次数`)
      this.config.onReconnectFailed?.()
      return
    }

    this.reconnectAttempts++
    
    // 计算重连延迟（指数退避）
    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      this.reconnectDelayMax
    )

    console.log(`[WebSocketManager] ${this.config.connectionName} 计划重连，尝试 ${this.reconnectAttempts}/${this.maxReconnectAttempts}，延迟 ${delay}ms`)

    // 调用重连尝试回调
    this.config.onReconnectAttempt?.(this.reconnectAttempts)

    this.reconnectTimer = setTimeout(() => {
      if (!this.isManualDisconnect) {
        console.log(`[WebSocketManager] ${this.config.connectionName} 开始重连`)
        this.socket?.connect()
      }
    }, delay)
  }

  // 手动断开连接
  disconnect() {
    console.log(`[WebSocketManager] ${this.config.connectionName} 手动断开连接`)
    
    this.isManualDisconnect = true
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }

    // 更新连接状态
    connectionStatus[this.config.connectionName] = false
  }

  // 强制重连
  forceReconnect() {
    console.log(`[WebSocketManager] ${this.config.connectionName} 强制重连`)
    
    this.reconnectAttempts = 0
    this.isManualDisconnect = false
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    if (this.socket) {
      this.socket.disconnect()
    }

    // 立即重连
    setTimeout(() => {
      if (!this.isManualDisconnect) {
        this.connect()
      }
    }, 100)
  }

  // 添加事件监听器
  on(event: string, callback: (...args: any[]) => void) {
    this.socket?.on(event, callback)
  }

  // 移除事件监听器
  off(event: string, callback?: (...args: any[]) => void) {
    this.socket?.off(event, callback)
  }

  // 发送事件
  emit(event: string, ...args: any[]) {
    this.socket?.emit(event, ...args)
  }
}

// 创建 WebSocket 管理器的工厂函数
export function createWebSocketManager(config: WebSocketConfig): WebSocketManager {
  return new WebSocketManager(config)
} 