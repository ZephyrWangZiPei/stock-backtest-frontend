import { io, Socket } from 'socket.io-client'
import { websocketEventBus } from './websocketEventBus'

export interface WebSocketMessage {
  type: string
  data: any
  timestamp: number
}

export interface WebSocketConfig {
  url: string
  namespace: string
  options?: {
    autoConnect?: boolean
    reconnection?: boolean
    reconnectionAttempts?: number
    reconnectionDelay?: number
    reconnectionDelayMax?: number
    timeout?: number
    transports?: string[]
  }
}

export class UnifiedWebSocketManager {
  private sockets: Map<string, Socket> = new Map()
  private eventHandlers: Map<string, Map<string, Function[]>> = new Map()
  private connectionStatus: Map<string, boolean> = new Map()
  private reconnectTimers: Map<string, NodeJS.Timeout> = new Map()
  private configs: Map<string, WebSocketConfig> = new Map()

  async connect(namespace: string, url?: string, options?: WebSocketConfig['options']): Promise<void> {
    const socketUrl = url || `http://localhost:5000${namespace}`
    
    if (this.sockets.has(namespace)) {
      return Promise.resolve()
    }

    const config: WebSocketConfig = {
      url: socketUrl,
      namespace,
      options: {
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        transports: ['websocket', 'polling'],
        ...options
      }
    }

    this.configs.set(namespace, config)

    const socket = io(socketUrl, config.options)

    this.sockets.set(namespace, socket)
    this.eventHandlers.set(namespace, new Map())
    this.connectionStatus.set(namespace, false)

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Connection timeout for ${namespace}`))
      }, config.options?.timeout || 20000)

      socket.on('connect', () => {
        console.log(`✅ Connected to ${namespace}`)
        this.connectionStatus.set(namespace, true)
        clearTimeout(timeout)
        resolve()
        
        // 通过事件总线发布连接事件
        websocketEventBus.emit(namespace, 'connect', { namespace }, 'success')
      })
      
      socket.on('disconnect', (reason) => {
        console.log(`❌ Disconnected from ${namespace}:`, reason)
        this.connectionStatus.set(namespace, false)
        
        // 通过事件总线发布断开连接事件
        websocketEventBus.emit(namespace, 'disconnect', { namespace, reason }, 'warning')
        
        // 如果不是主动断开，尝试重连
        if (reason !== 'io client disconnect') {
          this.scheduleReconnect(namespace)
        }
      })
      
      socket.on('connect_error', (error) => {
        console.error(`❌ Connection error for ${namespace}:`, error)
        this.connectionStatus.set(namespace, false)
        clearTimeout(timeout)
        reject(error)
        
        // 通过事件总线发布连接错误事件
        websocketEventBus.emit(namespace, 'connect_error', { namespace, error }, 'error')
      })

      socket.on('reconnect', (attemptNumber) => {
        console.log(`🔄 Reconnected to ${namespace}, attempt ${attemptNumber}`)
        this.connectionStatus.set(namespace, true)
        
        // 通过事件总线发布重连事件
        websocketEventBus.emit(namespace, 'reconnect', { namespace, attemptNumber }, 'success')
      })

      socket.on('reconnect_error', (error) => {
        console.error(`❌ Reconnection error for ${namespace}:`, error)
        
        // 通过事件总线发布重连错误事件
        websocketEventBus.emit(namespace, 'reconnect_error', { namespace, error }, 'error')
      })

      socket.on('reconnect_failed', () => {
        console.error(`❌ Reconnection failed for ${namespace}`)
        this.connectionStatus.set(namespace, false)
        
        // 通过事件总线发布重连失败事件
        websocketEventBus.emit(namespace, 'reconnect_failed', { namespace }, 'error')
      })

      // 设置通用事件监听器，将所有业务事件转发到事件总线
      this.setupBusinessEventForwarding(socket, namespace)
    })
  }

  // 设置业务事件转发
  private setupBusinessEventForwarding(socket: Socket, namespace: string): void {
    // 定义需要转发的业务事件
    const businessEvents = [
      // 数据采集事件
      'collection_started', 'collection_progress', 'collection_completed', 'collection_error',
      'collection_status', 'database_stats',
      
      // 任务相关事件
      'task_started', 'task_progress', 'task_completed', 'task_failed', 'task_paused',
      
      // 回测事件
      'backtest_started', 'backtest_progress', 'backtest_completed', 'backtest_error',
      'backtest_paused', 'backtest_resumed',
      
      // AI分析事件
      'analysis_started', 'analysis_progress', 'analysis_completed', 'analysis_error',
      
      // 新闻分析事件
      'news_analysis_started', 'news_analysis_completed', 'news_update',
      
      // 调度器事件
      'scheduler_status', 'job_started', 'job_completed', 'job_failed',
      'update_progress', 'update_complete', 'update_error', 'update_logs_response',
      
      // 筛选事件
      'screening_started', 'screening_completed', 'screening_results',
      
      // 候选池事件
      'candidate_added', 'candidate_updated', 'candidate_removed',
      
      // 系统事件
      'system_status', 'health_check', 'error_report'
    ]

    businessEvents.forEach(eventName => {
      socket.on(eventName, (data: any) => {
        // 确定事件类型
        let eventType: 'info' | 'success' | 'warning' | 'error' = 'info'
        
        if (eventName.includes('completed') || eventName.includes('success')) {
          eventType = 'success'
        } else if (eventName.includes('error') || eventName.includes('failed')) {
          eventType = 'error'
        } else if (eventName.includes('started') || eventName.includes('progress')) {
          eventType = 'info'
        }

        // 转发到事件总线
        websocketEventBus.emit(namespace, eventName, data, eventType)
      })
    })

    // onAny 兜底：转发所有未列出的事件，例如 task_technical_updated、task_phase_start 等
    socket.onAny((eventName: string, data: any) => {
      let eventType: 'info' | 'success' | 'warning' | 'error' = 'info'
      if (eventName.includes('completed') || eventName.includes('success') || eventName.includes('updated')) {
        eventType = 'success'
      } else if (eventName.includes('error') || eventName.includes('failed')) {
        eventType = 'error'
      } else if (eventName.includes('started') || eventName.includes('progress') || eventName.includes('fetching') || eventName.includes('phase')) {
        eventType = 'info'
      }

      websocketEventBus.emit(namespace, eventName, data, eventType)
    })
  }

  private scheduleReconnect(namespace: string): void {
    if (this.reconnectTimers.has(namespace)) {
      clearTimeout(this.reconnectTimers.get(namespace)!)
    }

    const config = this.configs.get(namespace)
    if (!config) return

    const delay = config.options?.reconnectionDelay || 1000
    const timer = setTimeout(() => {
      console.log(`🔄 Attempting to reconnect to ${namespace}...`)
      this.reconnect(namespace)
    }, delay)

    this.reconnectTimers.set(namespace, timer)
  }

  private async reconnect(namespace: string): Promise<void> {
    try {
      const socket = this.sockets.get(namespace)
      if (socket) {
        socket.connect()
      }
    } catch (error) {
      console.error(`❌ Reconnection failed for ${namespace}:`, error)
    }
  }

  on(namespace: string, event: string, handler: Function): void {
    const socket = this.sockets.get(namespace)
    if (!socket) {
      console.warn(`⚠️ Socket for namespace ${namespace} not found`)
      return
    }
    
    const handlers = this.eventHandlers.get(namespace)
    if (!handlers) return

    if (!handlers.has(event)) {
      handlers.set(event, [])
    }

    handlers.get(event)?.push(handler)
    socket.on(event, handler as any)
    
    console.log(`📡 Registered event listener: ${namespace}/${event}`)
  }

  off(namespace: string, event: string, handler?: Function): void {
    const socket = this.sockets.get(namespace)
    if (!socket) return

    if (handler) {
      socket.off(event, handler as any)
    } else {
      socket.off(event)
    }

    const handlers = this.eventHandlers.get(namespace)
    if (handlers && handlers.has(event)) {
      if (handler) {
        const eventHandlers = handlers.get(event) || []
        const index = eventHandlers.indexOf(handler)
        if (index > -1) {
          eventHandlers.splice(index, 1)
        }
      } else {
        handlers.delete(event)
      }
    }
    
    console.log(`📡 Removed event listener: ${namespace}/${event}`)
  }

  clearEventListeners(namespace: string): void {
    const socket = this.sockets.get(namespace)
    if (!socket) return

    const handlers = this.eventHandlers.get(namespace)
    if (handlers) {
      handlers.clear()
    }

    socket.removeAllListeners()
    console.log(`🧹 Cleared all event listeners for ${namespace}`)
  }

  getConnectionStatus(namespace: string): 'connected' | 'disconnected' {
    const socket = this.sockets.get(namespace)
    return socket?.connected ? 'connected' : 'disconnected'
  }

  getAllConnectionStatus(): Record<string, boolean> {
    const status: Record<string, boolean> = {}
    this.connectionStatus.forEach((isConnected, namespace) => {
      status[namespace] = isConnected
    })
    return status
  }

  disconnect(namespace: string): void {
    const socket = this.sockets.get(namespace)
    if (socket) {
      socket.disconnect()
      this.sockets.delete(namespace)
      this.eventHandlers.delete(namespace)
      this.connectionStatus.delete(namespace)
      this.configs.delete(namespace)
      
      // 清除重连定时器
      if (this.reconnectTimers.has(namespace)) {
        clearTimeout(this.reconnectTimers.get(namespace)!)
        this.reconnectTimers.delete(namespace)
      }
      
      console.log(`🔌 Disconnected from ${namespace}`)
      
      // 通知事件总线清除连接信息
      // Connection info will be cleaned up by the event bus automatically
    }
  }

  emit(namespace: string, event: string, data?: any): void {
    const socket = this.sockets.get(namespace)
    if (socket && socket.connected) {
      socket.emit(event, data)
      console.log(`📤 Emitted event: ${namespace}/${event}`, data)
    } else {
      console.warn(`⚠️ Cannot emit event ${namespace}/${event}: socket not connected`)
    }
  }

  disconnectAll(): void {
    this.sockets.forEach((socket, namespace) => {
      this.disconnect(namespace)
    })
    console.log('🔌 Disconnected from all namespaces')
    
    // 重置事件总线
    websocketEventBus.reset()
  }

  // 获取所有活跃的命名空间
  getActiveNamespaces(): string[] {
    return Array.from(this.sockets.keys())
  }

  // 检查是否已连接
  isConnected(namespace: string): boolean {
    return this.connectionStatus.get(namespace) || false
  }

  // 获取事件总线实例（供外部访问）
  getEventBus() {
    return websocketEventBus
  }

  // 批量连接多个命名空间
  async connectMultiple(namespaces: string[]): Promise<void> {
    const promises = namespaces.map(namespace => this.connect(namespace))
    await Promise.allSettled(promises)
  }

  // 健康检查
  async healthCheck(): Promise<Record<string, boolean>> {
    const status: Record<string, boolean> = {}
    
    for (const [namespace, socket] of this.sockets) {
      status[namespace] = socket.connected
    }
    
    return status
  }
}

// 创建并导出单例实例
export const unifiedWebSocketManager = new UnifiedWebSocketManager()

// 默认导出
export default unifiedWebSocketManager 